import {
  complaintService,
  employeeService,
  exitService,
  leaveService,
  payrollService,
  recruitmentService,
  trainingService,
} from '@/api';
import { authorizationService } from '@/api/authorization.service';
import { loanService } from '@/api/loan.service';
import { PaginationIconsOnly } from '@/components/shared/pagination';
import { Button } from '@/components/ui/button';
import { PageHeader, StatCard } from '@/components/system';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useGlobalContext } from '@/state/context';
import { logger } from '@/utils';
import { RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { AuthorizationViewDialog } from './authorization-center-dialog';
import { TransactionsTable } from './transaction-table';

export default function AuthorizationCenterWIP() {
  const [loading, setLoading] = useState(true);
  const [viewingItem, setViewingItem] = useState(null);
  const [activeModule, setActiveModule] = useState('loans');
  const [tabIsLoading, setTabIsLoading] = useState(true);
  const [authorizing, setAuthorizing] = useState(false);
  const [pendingStats, setPendingStats] = useState({ total: 0, breakdown: {} });
  const [pendingItems, setPendingItems] = useState({});
  const [pendingItemsPagination, setPendingItemsPagination] = useState({});
  const [rows, setRows] = useState(25);
  const [approverNote, setApprovalNote] = useState('');
  const [authorizeError, setAuthorizeError] = useState('');
  const { currentUser } = useGlobalContext();
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const getPendingCount = useCallback(async () => {
    setLoading(true);
    try {
      const result = await authorizationService.getPendingCount();
      setPendingStats(result.data);
    } catch (error) {
      logger.error({ caller: 'List pending auth count', error });
      toast.error('Error', { description: error.message || 'Could not load pending authorization count' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    getPendingCount();
  }, [getPendingCount, refreshKey]);

  useEffect(() => {
    const modules = Object.keys(pendingStats.breakdown);
    if (modules.length && !modules.includes(activeModule)) setActiveModule(modules[0]);
  }, [pendingStats.breakdown, activeModule]);

  useEffect(() => {
    return () => {
      setAuthorizeError(null);
    };
  }, [refreshKey]);

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
  }, [loadPendingModuleItems, refreshKey]);

  const handleAuthorize = async (item, action, moduleName) => {
    setAuthorizing(true);
    setAuthorizeError(null);
    try {
      let responsePayload;

      if (action === 'reject' && !approverNote) {
        setAuthorizeError('Note is required if action is `Reject`');
        return;
      }

      switch (moduleName) {
        case 'loans': {
          action === 'approve'
            ? (responsePayload = await loanService.approveLoan(item.id, { approverNote }))
            : (responsePayload = await loanService.rejectLoan(item.id, { approverNote }));
          break;
        }
        case 'payrolls': {
          action === 'approve'
            ? (responsePayload = await payrollService.approvePayrollBatch(item.id, { approverNote }))
            : (responsePayload = await payrollService.rejectPayrollBatch(item.id, { approverNote }));
          break;
        }
        case 'employees':
          action === 'approve'
            ? (responsePayload = await employeeService.approveMaintenance(item.id))
            : (responsePayload = await employeeService.rejectMaintenance(item.id));
          break;
        case 'job postings':
          action === 'approve'
            ? (responsePayload = await recruitmentService.approveJobPosting(item.id))
            : (responsePayload = await recruitmentService.rejectJobPosting(item.id));
          break;
        case 'leaves':
          action === 'approve'
            ? (responsePayload = await leaveService.updateLeaveStatus(item.id, 'APPROVED'))
            : (responsePayload = await leaveService.updateLeaveStatus(item.id, 'REJECTED'));
          break;
        case 'training requests': {
          item.status === 'PENDING_HR_APPROVAL'
            ? (responsePayload = await trainingService.finalApprove(item.id, action === 'approve', approverNote))
            : (responsePayload = await trainingService.supervisorApprove(item.id, action === 'approve', approverNote));

          break;
        }
        case 'exits': {
          responsePayload = await exitService.approveExit(item.id, action === 'approve' ? 'approved' : 'rejected');
          break;
        }
        case 'complaints': {
          action === 'approve'
            ? (responsePayload = await complaintService.approveComplaint(item.id, { note: approverNote }))
            : (responsePayload = await complaintService.rejectComplaint(item.id, { note: approverNote }));
          break;
        }

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
    } catch (error) {
      logger.error({ caller: 'Handle item authorization', payload: error });
      setAuthorizeError(error.message || 'Unable to process this request. Kindly contact the system administrator');
      toast.error('Error', {
        description: error.message || 'Unable to process this request. Kindly contact the system administrator',
      });
    } finally {
      setAuthorizing(false);
    }
  };

  const userRole = (currentUser?.role || '').toString().toLowerCase();
  const permissions = Array.isArray(currentUser?.permissions)
    ? currentUser.permissions.map((permission) => permission?.toString().toLowerCase())
    : [];

  const hasApprovalPermission =
    permissions.includes('approve_exits') ||
    permissions.includes('approve_recruitment') ||
    permissions.includes('approve_all_requests') ||
    permissions.some((permission) => permission.includes('approve'));

  const canAuthorize = hasApprovalPermission || userRole === 'admin';

  return (
    <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
      <div className="space-y-6">
        <PageHeader title="Authorization center" description="Review authorizations and approvals." />

        <div className="grid md:grid-flow-col gap-4 md:justify-between items-end">
          <StatCard label="Pending authorization" value={loading ? 0 : pendingStats.total} tone="pending" />

          <Button variant="outline" size="icon" onClick={refresh} title={'Refresh'}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        <Card>
          <CardContent className="pt-6">
            <Tabs value={activeModule} onValueChange={setActiveModule}>
              <TabsList className="flex flex-wrap justify-start h-auto gap-x-4">
                {Object.keys(pendingStats.breakdown)?.length
                  ? Object.keys(pendingStats.breakdown).map((_module, index) => (
                      <TabsTrigger value={_module} key={index} className="capitalize py-3 px-8">
                        {_module} ({pendingStats?.breakdown?.[_module]})
                      </TabsTrigger>
                    ))
                  : null}
              </TabsList>

              <TabsContent value={activeModule} className=" mt-6">
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
            </Tabs>
          </CardContent>
        </Card>
        {viewingItem ? (
          <AuthorizationViewDialog
            authorizeError={authorizeError}
            viewingItem={viewingItem}
            onOpenChange={() => {
              setAuthorizeError(null);
              setViewingItem(null);
              setApprovalNote(null);
            }}
            canAuthorize={canAuthorize ||
              (activeModule === 'leaves' && viewingItem.status?.toLowerCase() === 'pending') ||
              (activeModule === 'training requests' && viewingItem.status === 'PENDING_SUPERVISOR_APPROVAL')}
            handleAuthorize={handleAuthorize}
            authorizing={authorizing}
            moduleName={activeModule}
            setApprovalNote={setApprovalNote}
            approverNote={approverNote}
          />
        ) : null}
      </div>
    </div>
  );
}
