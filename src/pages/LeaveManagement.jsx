import { employeeService, leaveService, userService } from '@/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState, PageHeader, formatDateRange } from '@/components/system';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { showToast } from '@/utils/toast';
import { useEffect, useState } from 'react';
import LeaveManagementComponent from '../components/selfservice/LeaveManagement';

const LeaveApprovals = ({ requests, onAction, isProcessingAction }) => {
  if (requests.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Leave Approvals</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState title="All caught up" description="There are no leave requests pending your approval." />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Leave Requests Pending Your Approval</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Leave Type</TableHead>
              <TableHead>Dates</TableHead>
              <TableHead>Days</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((req) => (
              <TableRow key={req.id}>
                <TableCell>
                  {req.employee_name}
                  <br />
                  <span className="text-xs text-gray-500">{req.employee_department}</span>
                </TableCell>
                <TableCell className="capitalize">{req.leave_type}</TableCell>
                <TableCell>
                  {formatDateRange(req.start_date, req.end_date)}
                </TableCell>
                <TableCell>{req.days_requested}</TableCell>
                <TableCell className="max-w-xs truncate">{req.reason}</TableCell>
                <TableCell className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onAction(req, true)}
                    disabled={isProcessingAction}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onAction(req, false)}
                    disabled={isProcessingAction}
                  >
                    Reject
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default function LeaveManagementPage() {
  const [currentEmployeeData, setCurrentEmployeeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isApprover, setIsApprover] = useState(false);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const selectedEmployeeId = 'self';
  const [activeTab, setActiveTab] = useState('my_leave');

  useEffect(() => {
    loadBaseData();
  }, []);

  const loadDataForEmployee = async (employee) => {
    if (!employee) {
      setCurrentEmployeeData(null);
      return;
    }
    setCurrentEmployeeData(employee);
  };

  const loadBaseData = async () => {
    setLoading(true);
    try {
      const userResponse = await userService.getCurrentUser();
      const user = userResponse?.data || userResponse;

      // Fetch current user's employee data instead of all employees
      const myEmployeeResponse = await employeeService.getUserEmployeeData();
      const userEmployeeRecord = myEmployeeResponse?.data || myEmployeeResponse || null;

      let allEmpsData = [];
      // Only fetch all employees if user is HR admin
      if (user.role && ['admin', 'admin_officer'].includes(user.role)) {
        try {
          const employeesResponse = await employeeService.getEmployees({ page: 1, rows: 100 });
          allEmpsData = employeesResponse?.data || employeesResponse || [];
        } catch (err) {
          console.warn('Could not fetch all employees:', err);
        }
      }

      // Fetch all leave requests to find those pending approval for current user
      if (userEmployeeRecord) {
        const leavesResponse = await leaveService.getLeaves(1, 100);
        const allLeaves = leavesResponse?.data || leavesResponse || [];

        // Filter leaves pending approval for this user
        const approvals = allLeaves.filter(
          (leave) =>
            leave.status === 'pending' &&
            (leave.approverId === userEmployeeRecord.id || leave.current_approver_id === userEmployeeRecord.id),
        );

        if (approvals.length > 0) {
          setIsApprover(true);
          const enrichedApprovals = await Promise.all(
            approvals.map(async (req) => {
              const empData = allEmpsData.find((e) => e.id === req.employeeId);
              return {
                ...req,
                employee_name: empData ? `${empData.first_name} ${empData.last_name}` : 'Unknown',
                employee_department: empData ? empData.department : 'Unknown',
                employee_email: empData ? empData.email : '',
                start_date: req.startDate,
                end_date: req.endDate,
                leave_type: req.type,
                days_requested: Math.ceil((new Date(req.endDate) - new Date(req.startDate)) / (1000 * 60 * 60 * 24)) + 1,
              };
            }),
          );
          setPendingApprovals(enrichedApprovals);
        } else {
          setIsApprover(false);
          setPendingApprovals([]);
        }
      } else {
        setIsApprover(false);
        setPendingApprovals([]);
      }

      if (userEmployeeRecord) {
        if (selectedEmployeeId === 'self') {
          await loadDataForEmployee(userEmployeeRecord);
        } else {
          const targetEmployee = allEmpsData.find((e) => e.id === selectedEmployeeId);
          await loadDataForEmployee(targetEmployee);
        }
      } else {
        const basicEmployeeData = {
          id: user.id,
          first_name: user.full_name?.split(' ')[0] || 'User',
          last_name: user.full_name?.split(' ').slice(1).join(' ') || '',
          email: user.email,
          department: user.department || 'general',
          position: 'Employee',
          employment_status: 'active',
          annual_leave_entitlement: 21,
          hire_date: new Date().toISOString().split('T')[0],
        };
        if (selectedEmployeeId === 'self') {
          setCurrentEmployeeData(basicEmployeeData);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      showToast.error('Failed to load leave management data', 'Error');
    } finally {
      setLoading(false);
    }
  };

  const handleApprovalAction = async (request, isApproved) => {
    setIsProcessingAction(true);
    try {
      const nextStatus = isApproved ? 'approved' : 'rejected';

      await leaveService.updateLeaveStatus(request.id, nextStatus);

      showToast.success(`Request has been successfully ${isApproved ? 'approved' : 'rejected'}.`, 'Success');
    } catch (error) {
      console.error('Error processing leave action:', error);
      showToast.error(`Failed to process the request: ${error.message || 'Please try again.'}`, 'Error');
    } finally {
      setIsProcessingAction(false);
      loadBaseData();
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700 mx-auto"></div>
      </div>
    );
  }

  if (!currentEmployeeData) {
    return <div className="p-8 text-center text-red-500">Could not load employee data. Please contact support.</div>;
  }

  let tabs = [{ id: 'my_leave', label: 'My Leave' }];
  if (isApprover) {
    tabs.push({ id: 'approvals', label: 'Leave Approvals' });
  }

  return (
    <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
      <div className="space-y-6">
        <PageHeader title="Leave management" description="Manage your leave requests and view approvals." />

        {/* {isHrAdmin && (
                    <div className="flex flex-col md:flex-row items-center justify-between bg-blue-50 border border-blue-200 p-4 rounded-xl gap-4">
                        <p className="text-sm font-medium text-blue-800">Admin: You are viewing an employee portal.</p>
                        <div className="w-full md:w-72">
                            <Select value={selectedEmployeeId} onValueChange={handleEmployeeSwitch}>
                                <SelectTrigger className="bg-white"><SelectValue placeholder="View as..." /></SelectTrigger>
                                <SelectContent>
                                    {selfEmployeeRecord && <SelectItem value="self">View My Portal ({selfEmployeeRecord.first_name} {selfEmployeeRecord.last_name})</SelectItem>}
                                    {allEmployees.map(emp => (<SelectItem key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name} ({emp.employee_id})</SelectItem>))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                )} */}

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            {isApprover && <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-blue-700"
                >
                  <span>{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>}
            <div className={isApprover ? 'mt-6' : ''}>
              <TabsContent value="my_leave">
                <LeaveManagementComponent employee={currentEmployeeData} onUpdate={loadBaseData} />
              </TabsContent>
              {isApprover && (
                <TabsContent value="approvals">
                  <LeaveApprovals
                    requests={pendingApprovals}
                    onAction={handleApprovalAction}
                    isProcessingAction={isProcessingAction}
                  />
                </TabsContent>
              )}
            </div>
          </Tabs>
      </div>
    </div>
  );
}
