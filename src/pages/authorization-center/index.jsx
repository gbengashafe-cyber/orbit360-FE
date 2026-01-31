import { authorizationService } from '@/api/authorization.service';
import { loanService } from '@/api/loan.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PENDING_STATES } from '@/constants/pendingState';
import { useGlobalContext } from '@/state/context';
import { logger } from '@/utils';
import { ClipboardList, Loader2, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { AuthorizationViewDialog } from './authorization-center-dialog';
import { TransactionsTable } from './transaction-table';

export default function AuthorizationCenter() {
  const [loading, setLoading] = useState(true);
  const [jobPostings, setJobPostings] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loans, setLoans] = useState([]);
  const [resignations, setResignations] = useState([]);
  const [redeployments, setRedeployments] = useState([]);
  const [newStaffRequests, setNewStaffRequests] = useState([]);
  const [trainingRequests, setTrainingRequests] = useState([]);
  const [staffComplaints, setStaffComplaints] = useState([]);
  const [disciplinaryCases, setDisciplinaryCases] = useState([]);
  const [appraisals, setAppraisals] = useState([]);
  const [viewingItem, setViewingItem] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');
  const [authorizing, setAuthorizing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const getPendingCount = async () => {
      try {
        const result = await authorizationService.getPendingCount();
        setPendingCount(result.data?.total);
      } catch (error) {
        logger.error({ caller: 'List pending auth count', error });
        toast.error('Error', { description: error.message || 'Could not load pending authorization count' });
      }
    };

    getPendingCount();
  }, []);

  const { currentUser } = useGlobalContext();

  const loadData = async () => {
    setLoading(true);
    try {
      const pendingResponse = await authorizationService.getPending({ rows: 25, page: 1 });

      setLoans(pendingResponse.data?.loans);
    } catch (error) {
      logger.error({ caller: 'List pending auth items', error });
      toast.error('Error', { description: error.message || 'Error loading data' });
    } finally {
      setLoading(false);
    }
  };

  const allTransactions = [
    ...jobPostings.map((j) => ({ ...j, type: 'Job Posting', title: j.title })),
    ...leaveRequests.map((l) => ({ ...l, type: 'Leave Request', title: `${l.leave_type} - ${l.employee_name}` })),
    ...loans.map((l) => ({
      ...l,
      type: 'Loan',
      title: `${l.employee.firstName} - #${l.principalAmount?.toLocaleString()}`,
    })),
    ...resignations.map((r) => ({ ...r, type: 'Resignation', title: `Resignation - ${r.employee_name}` })),
    ...redeployments.map((r) => ({ ...r, type: 'Redeployment', title: `Redeployment - ${r.employee_name}` })),
    ...newStaffRequests.map((n) => ({ ...n, type: 'New Staff Request', title: `New Staff - ${n.position}` })),
    ...trainingRequests.map((t) => ({ ...t, type: 'Training Request', title: `Training - ${t.employee_name}` })),
    ...staffComplaints.map((c) => ({
      ...c,
      type: 'Staff Complaint',
      title: `${c.complaint_type.replace('_', ' ')} - ${c.employee_name}`,
    })),
    ...disciplinaryCases.map((d) => ({
      ...d,
      type: 'Disciplinary Case',
      title: `${d.case_number} - ${d.offense_type.replace('_', ' ')} - ${d.employee_name}`,
    })),
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const pendingTransactions = allTransactions.filter((t) => PENDING_STATES.includes(t.status?.toLowerCase()));

  const authorizedTransactions = allTransactions.filter(
    (t) => t.status === 'approved' || t.status === 'authorized' || t.status === 'active',
  );

  const handleAuthorize = async (item, action) => {
    setAuthorizing(true);
    try {
      const newStatus = action === 'approve' ? (item.type === 'Job Posting' ? 'authorized' : 'approved') : 'rejected';
      const updateData = {
        status: newStatus,
        approved_by: currentUser.email,
        approved_date: new Date().toISOString().split('T')[0],
      };

      // Update based on transaction type
      switch (item.type) {
        case 'Job Posting':
          await base44.entities.JobPosting.update(item.id, updateData);
          break;
        case 'Leave Request':
          await base44.entities.LeaveRequest.update(item.id, updateData);
          break;
        case 'Loan':
          newStatus === 'approved' ? await loanService.approveLoan(item.id) : await loanService.rejectLoan(item.id);
          break;
        case 'Resignation':
          await base44.entities.ResignationRequest.update(item.id, updateData);
          break;
        case 'Redeployment':
          await base44.entities.RedeploymentRequest.update(item.id, updateData);
          break;
        case 'New Staff Request':
          await base44.entities.NewStaffRequest.update(item.id, updateData);
          break;
        case 'Training Request':
          await base44.entities.TrainingRequest.update(item.id, updateData);
          break;
        case 'Staff Complaint':
          await base44.entities.StaffComplaint.update(item.id, updateData);
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
      }

      toast.success('Success', { description: `${item.type} ${action === 'approve' ? 'authorized' : 'rejected'} successfully` });
      setViewingItem(null);
      await loadData();
    } catch (error) {
      logger.error({ caller: 'Handle item authorization', error });
      toast.error('Error', {
        description: error.message || 'Unable to process this request. Kindly contact the system administrator',
      });
    } finally {
      setAuthorizing(false);
    }
  };

  const canAuthorize =
    currentUser?.role === 'admin' ||
    currentUser?.jobRole?.toLowerCase().includes('head') ||
    currentUser?.jobRole?.toLowerCase().includes('manager');

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

        <div className="grid grid-cols-1 ">
          <Card className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-xl shadow-gray-200/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Authorization</p>
                  <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
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
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="pending">Pending ({pendingTransactions.length})</TabsTrigger>
                <TabsTrigger value="authorized">Authorized ({authorizedTransactions.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="pending" className="mt-6">
                <TransactionsTable transactions={pendingTransactions} setViewingItem={setViewingItem} />
              </TabsContent>

              <TabsContent value="authorized" className="mt-6">
                <TransactionsTable transactions={authorizedTransactions} setViewingItem={setViewingItem} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <AuthorizationViewDialog
          viewingItem={viewingItem}
          onOpenChange={() => setViewingItem(null)}
          canAuthorize={canAuthorize}
          handleAuthorize={handleAuthorize}
          authorizing={authorizing}
        />
      </div>
    </div>
  );
}
