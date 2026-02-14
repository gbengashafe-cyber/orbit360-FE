import { employeeService, leaveService, payrollService } from '@/api';
import { authorizationService } from '@/api/authorization.service';
import { loanService } from '@/api/loan.service';
import { PaginationIconsOnly } from '@/components/shared/pagination';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useGlobalContext } from '@/state/context';
import { logger } from '@/utils';
import { ClipboardList, Loader2, XCircle } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { AuthorizationViewDialog } from '../authorization-center/authorization-center-dialog';
import { TransactionsTable } from '../authorization-center/transaction-table';

export default function AuthorizationCenterWIP() {
  const [loading, setLoading] = useState(true);
  const [jobPostings, setJobPostings] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loans, setLoans] = useState([]);
  const [resignations, setResignations] = useState([]);
  const [redeployments, setRedeployments] = useState([]);
  const [newStaffRequests, setNewStaffRequests] = useState([]);
  const [staffComplaints, setStaffComplaints] = useState([]);
  const [appraisals, setAppraisals] = useState([]);
  const [viewingItem, setViewingItem] = useState(null);
  const [activeModule, setActiveModule] = useState('loans');
  const [tabIsLoading, setTabIsLoading] = useState(true);
  const [authorizing, setAuthorizing] = useState(false);
  const [pendingStats, setPendingStats] = useState({ total: 0, breakdown: {} });
  const [pendingItems, setPendingItems] = useState({});
  const [pendingItemsPagination, setPendingItemsPagination] = useState({});
  const [rows, setRows] = useState(25);
  const [approverNote, setApprovalNote] = useState('');

  const getPendingCount = useCallback(async () => {
    try {
      const result = await authorizationService.getPendingCount();
      setPendingStats(result.data);
    } catch (error) {
      logger.error({ caller: 'List pending auth count', error });
      toast.error('Error', { description: error.message || 'Could not load pending authorization count' });
    }
  }, []);

  useEffect(() => {
    getPendingCount();
  }, [getPendingCount]);

  const currentPagination = pendingItemsPagination[activeModule]?.page || 1;

  const loadPendingModuleItems = useCallback(async () => {
    try {
      if (!pendingStats.breakdown[activeModule]) {
        return;
      }
      setTabIsLoading(true);
      const result = await authorizationService.getModulePending(activeModule, {
        rows,
        page: currentPagination,
      });
      setPendingItems((prev) => ({ ...prev, ...{ [activeModule]: result.data } }));
      setPendingItemsPagination((prev) => ({ ...prev, ...{ [activeModule]: result.pagination } }));
    } catch (error) {
      logger.error({ caller: `Load pending ${activeModule} items`, payload: error });
      toast.error('Error', { description: error.message || `Unable to load pending ${activeModule} items` });
    } finally {
      setTabIsLoading(false);
    }
  }, [activeModule, currentPagination, pendingStats.breakdown, rows]);

  useEffect(() => {
    loadPendingModuleItems();
  }, [loadPendingModuleItems]);

  useEffect(() => {
    loadData();
  }, []);

  const { currentUser } = useGlobalContext();

  const loadData = async () => {
    setLoading(true);
    try {
      const pendingResponse = await authorizationService.getPending({ rows: 25, page: 1 });

      setLoans(pendingResponse.data?.loans);
    } catch (error) {
      logger.error({ caller: 'List pending auth items', payload: error });
      toast.error('Error', { description: error.message || 'Error loading data' });
    } finally {
      setLoading(false);
    }
  };

  const handleAuthorize = async (item, action, moduleName) => {
    setAuthorizing(true);
    try {
      const newStatus = action === 'approve' ? (item.type === 'Job Posting' ? 'authorized' : 'approved') : 'rejected';
      const updateData = {
        status: newStatus,
        approved_by: currentUser.email,
        approved_date: new Date().toISOString().split('T')[0],
      };

      let responsePayload;

      // Update based on transaction type
      switch (moduleName) {
        case 'loans':
          action === 'approve'
            ? (responsePayload = await loanService.approveLoan(item.id, { approverNote }))
            : (responsePayload = await loanService.rejectLoan(item.id, { approverNote }));
          break;
        case 'payrolls':
          action === 'approve'
            ? (responsePayload = await payrollService.approvePayrollBatch(item.id))
            : (responsePayload = await payrollService.rejectPayrollBatch(item.id));
          break;
        case 'employees':
          action === 'approve'
            ? (responsePayload = await employeeService.approveMaintenance(item.id))
            : (responsePayload = await employeeService.rejectMaintenance(item.id));
          break;
        case 'leaves':
          action === 'approve'
            ? (responsePayload = await leaveService.updateLeaveStatus(item.id, 'APPROVED'))
            : (responsePayload = await leaveService.updateLeaveStatus(item.id, 'REJECTED'));
          break;
        case 'Training Request':
          await base44.entities.TrainingRequest.update(item.id, updateData);
          break;
        case 'Disciplinary Case':
          await base44.entities.DisciplinaryAction.update(item.id, {
            ...updateData,
            status: action === 'approve' ? 'penalty_applied' : 'closed',
            approved_by: currentUser.email,
          });
          break;
        case 'Appraisal':
          await base44.entities.Appraisal.update(item.id, {
            ...updateData,
            status: action === 'approve' ? 'approved' : 'rejected',
            hr_approval_date: new Date().toISOString(),
          });

          // Send email notification to employee
          if (item.employee_email) {
            try {
              await base44.integrations.Core.SendEmail({
                to: item.employee_email,
                subject: `Appraisal ${action === 'approve' ? 'Approved' : 'Rejected'} - ${item.cycle_name}`,
                body: `
                  <h3>Your Performance Appraisal Has Been ${action === 'approve' ? 'Approved' : 'Rejected'}</h3>
                  <p><strong>Cycle:</strong> ${item.cycle_name}</p>
                  <p><strong>Status:</strong> ${action === 'approve' ? 'Approved' : 'Rejected'}</p>
                  <p><strong>Approved By:</strong> ${currentUser.email}</p>
                  <p>Please log in to view your complete appraisal details.</p>
                `,
                from_name: 'Orbit360 HR System',
              });
            } catch (e) {
              console.warn('Failed to send email notification:', e);
            }
          }
          break;
        default:
          throw new Error(`Authorization is not handled for module '${moduleName}'`);
      }

      if (responsePayload?.message) {
        toast.success('Success', { description: responsePayload.message });
      } else {
        toast.success('Success', {
          description: `${moduleName} ${action === 'approve' ? 'authorized' : 'rejected'} successfully`,
        });
      }
      setViewingItem(null);
      await getPendingCount();
      await loadPendingModuleItems();
      await loadData();
    } catch (error) {
      logger.error({ caller: 'Handle item authorization', payload: error });
      toast.error('Error', {
        description: error.message || 'Unable to process this request. Kindly contact the system administrator',
      });
    } finally {
      setAuthorizing(false);
    }
  };

  const canAuthorize =
    currentUser?.jobRole?.toLowerCase().includes('head') || currentUser?.jobRole?.toLowerCase().includes('manager');

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-blue-700" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 min-h-screen" style={{ backgroundColor: '#F5F5F5' }}>
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-700 to-purple-800 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-700/25">
            <ClipboardList className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Authorization Center</h1>
            <p className="text-gray-600">Central hub for all authorizations and approvals</p>
          </div>
        </div>

        <div className="grid lg:justify-items-end">
          <Card className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-xl shadow-gray-200/50">
            <CardContent className="p-6">
              <div className="flex gap-x-8 items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Authorization</p>
                  <p className="text-2xl font-bold text-yellow-600">{pendingStats.total || 0}</p>
                </div>
                <XCircle className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-xl shadow-gray-200/50">
          <CardHeader>
            <CardTitle>All Transactions & Authorizations</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeModule} onValueChange={setActiveModule}>
              <TabsList className="grid grid-flow-col justify-center gap-x-4 w-full">
                {Object.keys(pendingStats.breakdown)?.length
                  ? Object.keys(pendingStats.breakdown).map((_module, index) => (
                      <TabsTrigger value={_module} key={index} className="capitalize px-8">
                        {_module} ({pendingStats?.breakdown?.[_module]})
                      </TabsTrigger>
                    ))
                  : null}
              </TabsList>

              {Object.keys(pendingStats.breakdown)?.length
                ? Object.keys(pendingStats.breakdown).map((_module, index) => (
                    <TabsContent value={_module} key={index} className=" mt-6">
                      <TransactionsTable
                        moduleName={activeModule}
                        transactions={pendingItems[activeModule]}
                        setViewingItem={setViewingItem}
                        pagination={pendingItemsPagination[activeModule]}
                        setRows={setRows}
                        isLoading={tabIsLoading}
                      />
                      <div className="my-6 mt-14">
                        <PaginationIconsOnly
                          currentPage={pendingItemsPagination[activeModule]?.page}
                          pages={pendingItemsPagination[activeModule]?.pages || 1}
                          setRows={setRows}
                          setCurrentPage={(val) =>
                            setPendingItemsPagination((prev) => ({
                              ...prev,
                              [activeModule]: { ...prev[activeModule], page: val },
                            }))
                          }
                          rows={rows}
                        />
                      </div>
                    </TabsContent>
                  ))
                : null}
            </Tabs>
          </CardContent>
        </Card>

        <AuthorizationViewDialog
          viewingItem={viewingItem}
          onOpenChange={() => setViewingItem(null)}
          canAuthorize={canAuthorize}
          handleAuthorize={handleAuthorize}
          authorizing={authorizing}
          moduleName={activeModule}
          setApprovalNote={setApprovalNote}
        />
      </div>
    </div>
  );
}
