import { employeeService, leaveService, userService } from '@/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { showToast } from '@/utils/toast';
import { Calendar, CheckCircle, ThumbsDown, ThumbsUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import LeaveManagementComponent from '../components/selfservice/LeaveManagement';

const LeaveApprovals = ({ requests, onAction, isProcessingAction }) => {
  if (requests.length === 0) {
    return (
      <Card className="shadow-xl shadow-gray-200/50">
        <CardHeader>
          <CardTitle>Leave Approvals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center p-8 text-gray-500">
            <CheckCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold">All Caught Up!</h3>
            <p>There are no leave requests pending your approval.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-xl shadow-gray-200/50">
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
                  {new Date(req.start_date).toLocaleDateString()} - {new Date(req.end_date).toLocaleDateString()}
                </TableCell>
                <TableCell>{req.days_requested}</TableCell>
                <TableCell className="max-w-xs truncate">{req.reason}</TableCell>
                <TableCell className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-green-600 border-green-600 hover:bg-green-50"
                    onClick={() => onAction(req, true)}
                    disabled={isProcessingAction}
                  >
                    <ThumbsUp className="w-4 h-4 mr-1" /> Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 border-red-600 hover:bg-red-50"
                    onClick={() => onAction(req, false)}
                    disabled={isProcessingAction}
                  >
                    <ThumbsDown className="w-4 h-4 mr-1" /> Reject
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
  const [currentUser, setCurrentUser] = useState(null);
  const [currentEmployeeData, setCurrentEmployeeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isApprover, setIsApprover] = useState(false);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [isHrAdmin, setIsHrAdmin] = useState(false);
  const [allEmployees, setAllEmployees] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('self');
  const [selfEmployeeRecord, setSelfEmployeeRecord] = useState(null);
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
      setCurrentUser(user);

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

      const userIsHrAdmin = user.role && ['admin', 'admin_officer'].includes(user.role);
      setIsHrAdmin(userIsHrAdmin);

      if (userIsHrAdmin) {
        setAllEmployees(allEmpsData);
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
        setSelfEmployeeRecord(userEmployeeRecord);
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
        setSelfEmployeeRecord(basicEmployeeData);
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

  const handleEmployeeSwitch = async (employeeId) => {
    setSelectedEmployeeId(employeeId);
    setLoading(true);
    if (employeeId === 'self') {
      await loadDataForEmployee(selfEmployeeRecord);
    } else {
      const targetEmployee = allEmployees.find((e) => e.id === employeeId);
      await loadDataForEmployee(targetEmployee);
    }
    setLoading(false);
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

  let tabs = [{ id: 'my_leave', label: 'My Leave', icon: Calendar }];
  if (isApprover) {
    tabs.push({ id: 'approvals', label: 'Leave Approvals', icon: CheckCircle });
  }

  return (
    <div className="p-4 lg:p-8 min-h-screen" style={{ backgroundColor: '#F5F5F5' }}>
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-700 to-blue-800 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-700/25">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Leave Management</h1>
              <p className="text-gray-600">Manage your leave and view approvals</p>
            </div>
          </div>
        </div>

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

        <Card className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-xl shadow-gray-200/50">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:grid-cols-none lg:flex lg:space-x-1 p-1 bg-gray-100 rounded-lg">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-blue-700"
                >
                  <tab.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
            <div className="mt-6 p-4">
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
        </Card>
      </div>
    </div>
  );
}
