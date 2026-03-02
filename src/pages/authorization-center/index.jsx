import {
  appraisalService,
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useGlobalContext } from '@/state/context';
import { logger } from '@/utils';
import { ClipboardList, RefreshCw, XCircle } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { AuthorizationViewDialog } from './authorization-center-dialog';
import { TransactionsTable } from './transaction-table';

export default function AuthorizationCenterWIP() {
  const TRAINING_MODULE_KEY = 'training_requests';
  const normalizeModuleName = (moduleName = '') => moduleName.toString().toLowerCase().replace(/-/g, '_');
  const normalizeStatus = (status = '') => status.toString().toUpperCase();
  const [loading, setLoading] = useState(true);
  // const [jobPostings, setJobPostings] = useState([]);
  // const [resignations, setResignations] = useState([]);
  // const [redeployments, setRedeployments] = useState([]);
  // const [newStaffRequests, setNewStaffRequests] = useState([]);
  // const [staffComplaints, setStaffComplaints] = useState([]);
  // const [appraisals, setAppraisals] = useState([]);
  const [viewingItem, setViewingItem] = useState(null);
  const [activeModule, setActiveModule] = useState('loans');
  const [tabIsLoading, setTabIsLoading] = useState(true);
  const [authorizing, setAuthorizing] = useState(false);
  const [pendingStats, setPendingStats] = useState({ total: 0, breakdown: {} });
  const [pendingItems, setPendingItems] = useState({});
  const [pendingItemsPagination, setPendingItemsPagination] = useState({});
  const [trainingPendingAll, setTrainingPendingAll] = useState([]);
  const [rows, setRows] = useState(25);
  const [approverNote, setApprovalNote] = useState('');
  const [authorizeError, setAuthorizeError] = useState('');
  const { currentUser } = useGlobalContext();
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const getTrainingPendingForCurrentUser = useCallback(async () => {
    const jobTitle = currentUser?.employeeData?.jobRole?.title?.toString().toLowerCase() || '';
    const isHrLike = jobTitle.includes('hr') || jobTitle.includes('human');
    const isHrManager = isHrLike && ['manager', 'chief', 'head'].some((keyword) => jobTitle.includes(keyword));
    const isSupervisorLike = ['supervisor', 'lead', 'superintendent'].some((keyword) => jobTitle.includes(keyword));

    const response = await trainingService.getRequests();
    const allRequests = Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : [];
    const nonApprovedRequests = allRequests.filter((request) => !normalizeStatus(request.status).includes('APPROVED'));

    if (isSupervisorLike) {
      return nonApprovedRequests.filter((request) =>
        ['PENDING', 'SUPERVISOR_REJECTED'].includes(normalizeStatus(request.status)),
      );
    }

    if (isHrManager) {
      return nonApprovedRequests.filter((request) =>
        ['PENDING', 'SUPERVISOR_REJECTED', 'HR_REVIEWING', 'HR_REJECTED', 'FINAL_REJECTED'].includes(
          normalizeStatus(request.status),
        ),
      );
    }

    return nonApprovedRequests.filter((request) =>
      ['PENDING', 'SUPERVISOR_REJECTED', 'HR_REVIEWING', 'HR_REJECTED'].includes(normalizeStatus(request.status)),
    );
  }, [currentUser]);

  const getPendingCount = useCallback(async () => {
    setLoading(true);
    try {
      const result = await authorizationService.getPendingCount();
      const backendStats = result.data || { total: 0, breakdown: {} };
      let nextStats = { ...backendStats, breakdown: { ...(backendStats.breakdown || {}) } };

      try {
        const trainingItems = await getTrainingPendingForCurrentUser();
        setTrainingPendingAll(trainingItems);

        const hasTrainingModule =
          typeof nextStats.breakdown.training !== 'undefined' ||
          typeof nextStats.breakdown.trainings !== 'undefined' ||
          typeof nextStats.breakdown[TRAINING_MODULE_KEY] !== 'undefined';

        if (!hasTrainingModule && trainingItems.length > 0) {
          nextStats.breakdown[TRAINING_MODULE_KEY] = trainingItems.length;
          nextStats.total = Number(nextStats.total || 0) + trainingItems.length;
        }
      } catch (trainingError) {
        logger.error({ caller: 'Load training pending fallback', payload: trainingError });
      }

      setPendingStats(nextStats);
    } catch (error) {
      logger.error({ caller: 'List pending auth count', error });
      toast.error('Error', { description: error.message || 'Could not load pending authorization count' });
    } finally {
      setLoading(false);
    }
  }, [getTrainingPendingForCurrentUser]);

  useEffect(() => {
    getPendingCount();
  }, [getPendingCount, refreshKey]);

  useEffect(() => {
    return () => {
      setAuthorizeError(null);
    };
  }, []);

  const currentPagination = pendingItemsPagination[activeModule]?.page || 1;

  const loadPendingModuleItems = useCallback(async () => {
    try {
      if (!pendingStats.breakdown[activeModule]) {
        return;
      }
      setTabIsLoading(true);

      if (normalizeModuleName(activeModule) === TRAINING_MODULE_KEY) {
        const page = Number(currentPagination) || 1;
        const start = (page - 1) * rows;
        const items = trainingPendingAll.slice(start, start + rows);
        const pages = Math.max(1, Math.ceil(trainingPendingAll.length / rows));

        setPendingItems((prev) => ({ ...prev, [activeModule]: items }));
        setPendingItemsPagination((prev) => ({ ...prev, [activeModule]: { page, pages, total: trainingPendingAll.length } }));
        return;
      }

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
  }, [TRAINING_MODULE_KEY, activeModule, currentPagination, pendingStats.breakdown, rows, trainingPendingAll]);

  useEffect(() => {
    loadPendingModuleItems();
  }, [loadPendingModuleItems, refreshKey]);

  const handleAuthorize = async (item, action, moduleName) => {
    setAuthorizing(true);
    try {
      let responsePayload;

      if (['loans', 'payrolls', 'employees', 'leaves'].includes(moduleName) && action === 'reject' && !approverNote) {
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
        case 'exits': {
          responsePayload = await exitService.approveExit(item.id, action === 'approve' ? 'approved' : 'rejected');
          break;
        }

        default:
          throw new Error(`Authorization is not handled for module '${moduleName}'`);
      }

      switch (normalizeModuleName(moduleName)) {
        case 'training':
        case 'trainings':
        case 'training_requests': {
          const jobTitle = currentUser?.employeeData?.jobRole?.title?.toString().toLowerCase() || '';
          const isHrLike = jobTitle.includes('hr') || jobTitle.includes('human');
          const isHrManager = isHrLike && ['manager', 'chief', 'head'].some((keyword) => jobTitle.includes(keyword));
          const isSupervisorLike = ['supervisor', 'lead', 'superintendent'].some((keyword) => jobTitle.includes(keyword));

          if (isSupervisorLike) {
            responsePayload = await trainingService.supervisorApprove(item.id, action === 'approve', approverNote);
          } else if (isHrManager) {
            responsePayload = await trainingService.finalApprove(item.id, action === 'approve', approverNote);
          } else {
            responsePayload = await trainingService.hrApprove(item.id, action === 'approve', approverNote);
          }
          break;
        }
        case 'recruitment':
        case 'recruitments':
        case 'job_postings': {
          if (action === 'approve') {
            responsePayload = await recruitmentService.approveJobPosting(item.id, currentUser?.id || currentUser?.email);
          } else {
            responsePayload = await recruitmentService.rejectJobPosting(item.id);
          }
          break;
        }
        case 'appraisal':
        case 'appraisals': {
          responsePayload = await appraisalService.reviewAppraisal(item.id, {
            status: action === 'approve' ? 'approved' : 'rejected',
            reviewed_by: currentUser?.id || currentUser?.email,
            review_note: approverNote,
            reviewed_at: new Date().toISOString(),
          });
          break;
        }
        default:
          break;
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

  const jobTitle = (currentUser?.employeeData?.jobRole?.title || '').toString().toLowerCase();
  const userRole = (currentUser?.role || '').toString().toLowerCase();
  const permissions = Array.isArray(currentUser?.permissions)
    ? currentUser.permissions.map((permission) => permission?.toString().toLowerCase())
    : [];
  const isManagementRole = jobTitle.includes('head') || jobTitle.includes('manager') || jobTitle.includes('supervisor');
  const isHrLike = jobTitle.includes('hr') || jobTitle.includes('human');
  const hasApprovalPermission =
    permissions.includes('approve_exits') ||
    permissions.includes('approve_recruitment') ||
    permissions.includes('approve_all_requests') ||
    permissions.some((permission) => permission.includes('approve'));
  const canAuthorize = isManagementRole || isHrLike || hasApprovalPermission || userRole === 'admin';

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

        <div className="grid md:grid-flow-col gap-4 md:justify-between items-end">
          <Card className=" bg-white/90 backdrop-blur-sm border-gray-200 shadow-xl shadow-gray-200/50">
            <CardContent className="p-6">
              <div className="flex gap-x-8 items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Authorization</p>
                  <p className="text-2xl font-bold text-yellow-600">{loading ? 0 : pendingStats.total}</p>
                </div>
                <XCircle className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Button variant="outline" size="icon" onClick={refresh} title={'Refresh'}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        <Card className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-xl shadow-gray-200/50">
          <CardHeader>
            <CardTitle>All Transactions & Authorizations</CardTitle>
          </CardHeader>
          <CardContent>
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
            onOpenChange={() => setViewingItem(null)}
            canAuthorize={canAuthorize}
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
