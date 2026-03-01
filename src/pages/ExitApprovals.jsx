import React, { useState, useEffect } from 'react';
import { apiClient, apiRoutes, userService } from '@/api';
import { showToast } from '@/utils/toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, CheckCircle, XCircle, AlertCircle, Eye } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';

export default function ExitApprovals() {
  const [currentUser, setCurrentUser] = useState(null);
  const [pendingExits, setPendingExits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [canViewApprovals, setCanViewApprovals] = useState(false);
  const [approvalContext, setApprovalContext] = useState({
    isHrManager: false,
    isHrOperations: false,
    isAdminLike: false
  });
  const [detailsDialog, setDetailsDialog] = useState({
    open: false,
    exit: null
  });
  const [rejectionReason, setRejectionReason] = useState('');
  const [clearanceChecks, setClearanceChecks] = useState({
    itAdmin: false,
    supervisor: false,
    finance: false,
    hr: false
  });

  useEffect(() => {
    loadData();
  }, []);

  const normalizeStatus = (value) => (value || '').toString().trim().toLowerCase();

  const isFinalized = (value) => ['approved', 'rejected', 'completed'].includes(normalizeStatus(value));

  const isPendingForHrOperations = (exit) => {
    const exitStatus = normalizeStatus(exit?.status);
    const hrApprovalStatus = normalizeStatus(exit?.hrApprovalStatus);
    const finalApprovalStatus = normalizeStatus(exit?.finalApprovalStatus);

    if (isFinalized(finalApprovalStatus)) return false;
    return exitStatus === 'submitted' || hrApprovalStatus === 'pending' || hrApprovalStatus === '';
  };

  const isPendingForHrManager = (exit) => {
    const hrApprovalStatus = normalizeStatus(exit?.hrApprovalStatus);
    const finalApprovalStatus = normalizeStatus(exit?.finalApprovalStatus);

    return hrApprovalStatus === 'approved' && !isFinalized(finalApprovalStatus);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const userResponse = await userService.getCurrentUser();
      const user = userResponse?.data || userResponse;
      setCurrentUser(user);

      const permissions = Array.isArray(user?.permissions)
        ? user.permissions.map((permission) => permission?.toString().toLowerCase())
        : [];
      const jobTitle = (
        user?.JobRole?.title
        || user?.['JobRole.title']
        || user?.jobRole?.title
        || user?.jobRoleTitle
        || ''
      )
        .toString()
        .toLowerCase();
      const userRole = (user?.role || '').toString().toLowerCase();

      const hasExitPermission = permissions.includes('approve_exits')
        || permissions.includes('approve_exit')
        || permissions.includes('approve_exit_requests')
        || permissions.includes('manage_exits')
        || permissions.includes('manage_exit')
        || permissions.includes('manage_employee_exit')
        || permissions.includes('approve_all_requests');

      const departmentName = (
        user?.departmentName
        || user?.department?.name
        || user?.department
        || user?.Employee?.departmentName
        || ''
      )
        .toString()
        .toLowerCase();

      const isHrDepartment = departmentName.includes('hr')
        || departmentName.includes('human resource')
        || departmentName.includes('human resources');
      const isHrLike = jobTitle.includes('hr')
        || jobTitle.includes('human resource')
        || jobTitle.includes('human resources')
        || jobTitle.includes('compensation')
        || jobTitle.includes('benefit')
        || jobTitle.includes('people operations')
        || jobTitle.includes('people ops')
        || isHrDepartment;
      const isOperationsRole = jobTitle.includes('operation') || userRole.includes('operation');
      const isHrOperations = jobTitle.includes('hr operation')
        || jobTitle.includes('hr operations')
        || userRole.includes('hr_operation')
        || userRole.includes('hr_operations')
        || (isHrDepartment && isOperationsRole);
      const isHrManager = (jobTitle.includes('hr') || jobTitle.includes('human resource') || isHrDepartment)
        && (
          jobTitle.includes('manager')
          || jobTitle.includes('head')
          || jobTitle.includes('chief')
          || userRole.includes('hr_manager')
        );
      const isAdminLike = ['admin', 'admin_officer', 'super_admin'].includes(userRole);
      const hasAccess = hasExitPermission || isHrLike || isHrOperations || isHrManager || isAdminLike;

      setCanViewApprovals(hasAccess);
      setApprovalContext({ isHrManager, isHrOperations, isAdminLike });
      if (!hasAccess) {
        showToast.error('You do not have permission to approve exit requests', 'Access Denied');
        setLoading(false);
        return;
      }

      const response = await apiClient.get(apiRoutes.GetExits);
      const allExits = response?.data || response || [];
      const pending = Array.isArray(allExits)
        ? allExits.filter((exit) => {
          if (isAdminLike) {
            return isPendingForHrOperations(exit) || isPendingForHrManager(exit);
          }
          if (isHrManager && !isHrOperations) {
            return isPendingForHrManager(exit);
          }
          return isPendingForHrOperations(exit);
        })
        : [];
      
      console.log('Pending exits:', pending);
      setPendingExits(pending);
    } catch (error) {
      console.error('Error loading exit approvals:', error);
      showToast.error('Failed to load exit requests', 'Error');
    } finally {
      setLoading(false);
    }
  };

  const toBooleanStatus = (value) => ['approved', 'cleared', 'completed', 'yes', true].includes(value);

  const initializeClearanceChecks = (exit) => {
    setClearanceChecks({
      itAdmin: toBooleanStatus(exit?.itClearanceStatus) || toBooleanStatus(exit?.itAdminClearance),
      supervisor: toBooleanStatus(exit?.supervisorApprovalStatus) || toBooleanStatus(exit?.supervisorClearance),
      finance: toBooleanStatus(exit?.financeClearance),
      hr: toBooleanStatus(exit?.hrClearance)
    });
  };

  const handleOpenDetails = (exit) => {
    initializeClearanceChecks(exit);
    setRejectionReason(exit?.hrComments || '');
    setDetailsDialog({ open: true, exit });
  };

  const handleUpdateClearance = async () => {
    if (!detailsDialog.exit?.id) return;

    const payload = {
      itAdminClearance: clearanceChecks.itAdmin,
      supervisorClearance: clearanceChecks.supervisor,
      financeClearance: clearanceChecks.finance,
      hrClearance: clearanceChecks.hr,
      itClearanceStatus: clearanceChecks.itAdmin ? 'cleared' : 'pending',
      supervisorApprovalStatus: clearanceChecks.supervisor ? 'approved' : 'pending'
    };

    try {
      await apiClient.put(apiRoutes.UpdateExit(detailsDialog.exit.id), payload);
      showToast.success('Clearance updated successfully', 'Success');
      setDetailsDialog({
        open: true,
        exit: { ...detailsDialog.exit, ...payload }
      });
      await loadData();
    } catch (error) {
      console.error('Error updating clearance:', error);
      showToast.error(error?.response?.data?.message || 'Failed to update clearance', 'Error');
    }
  };

  const handleApproveFromDetails = async () => {
    if (!detailsDialog.exit?.id) return;
    try {
      const isManagerOnly = approvalContext.isHrManager && !approvalContext.isHrOperations && !approvalContext.isAdminLike;

      if (isManagerOnly) {
        await apiClient.patch(apiRoutes.ApproveExit(detailsDialog.exit.id), {
          action: 'approved',
          reviewerComments: rejectionReason?.trim() || undefined
        });
        showToast.success('Exit request approved successfully', 'Success');
        setDetailsDialog({ open: false, exit: null });
        await loadData();
        return;
      }

      const allClear = clearanceChecks.itAdmin && clearanceChecks.supervisor && clearanceChecks.finance && clearanceChecks.hr;
      if (!allClear) {
        showToast.error('All four clearance departments must be checked before submit', 'Validation Error');
        return;
      }

      await apiClient.put(apiRoutes.UpdateExit(detailsDialog.exit.id), {
        itAdminClearance: clearanceChecks.itAdmin,
        supervisorClearance: clearanceChecks.supervisor,
        financeClearance: clearanceChecks.finance,
        hrClearance: clearanceChecks.hr,
        reviewerComments: rejectionReason?.trim() || undefined,
      });

      await apiClient.patch(apiRoutes.ReviewExit(detailsDialog.exit.id), {
        action: 'approved',
      });

      showToast.success('Exit request approved successfully', 'Success');
      setDetailsDialog({ open: false, exit: null });
      await loadData();
    } catch (error) {
      console.error('Error approving exit request:', error);
      showToast.error(error?.response?.data?.message || 'Failed to process approval', 'Error');
    }
  };

  const handleRejectFromDetails = async () => {
    if (!detailsDialog.exit?.id) return;
    if (!rejectionReason.trim()) {
      showToast.error('Rejection reason is required', 'Validation Error');
      return;
    }

    try {
      const isManagerOnly = approvalContext.isHrManager && !approvalContext.isHrOperations && !approvalContext.isAdminLike;

      if (isManagerOnly) {
        await apiClient.patch(apiRoutes.ApproveExit(detailsDialog.exit.id), {
          action: 'rejected',
          reviewerComments: rejectionReason.trim()
        });
        showToast.success('Exit request rejected successfully', 'Success');
        setDetailsDialog({ open: false, exit: null });
        await loadData();
        return;
      }

      await apiClient.put(apiRoutes.UpdateExit(detailsDialog.exit.id), {
        status: 'rejected',
        hrApprovalStatus: 'rejected',
        reviewerDate: new Date().toISOString(),
        hrComments: rejectionReason.trim(),
      });
      showToast.success('Exit request rejected successfully', 'Success');
      setDetailsDialog({ open: false, exit: null });
      await loadData();
    } catch (error) {
      console.error('Error rejecting exit request:', error);
      showToast.error(error?.response?.data?.message || 'Failed to reject exit request', 'Error');
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-700" />
      </div>
    );
  }

  if (!canViewApprovals) {
    return (
      <div className="p-4 lg:p-8 min-h-screen" style={{ backgroundColor: '#F5F5F5' }}>
        <div className="max-w-7xl mx-auto">
          <Alert variant="destructive">
            <AlertDescription>Access Denied: You do not have permission to view exit approvals.</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 min-h-screen" style={{ backgroundColor: '#F5F5F5' }}>
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Exit Request Approvals</h1>
          <p className="text-gray-600">
            {approvalContext.isHrManager && !approvalContext.isHrOperations
              ? 'Review HR Operations submissions and complete final approval'
              : 'Review and approve employee exit requests'}
          </p>
        </div>

        {pendingExits.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <CheckCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-600">No Pending Approvals</h3>
              <p className="text-gray-500">There are no exit requests awaiting your approval.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {pendingExits.map((exit) => (
              <Card key={exit.id} className="bg-white shadow-md">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-gray-900">
                        {exit.employeeName || `Employee #${exit.employeeId}`}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        <span className="font-medium">Department:</span> {exit.employeeDepartment || 'N/A'} | <span className="font-medium">Position:</span> {exit.position || 'N/A'}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Last Working Date:</span> {exit.lastWorkingDate ? new Date(exit.lastWorkingDate).toLocaleDateString() : 'Invalid Date'}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Submitted:</span> {new Date(exit.createdAt).toLocaleDateString()}
                      </p>
                      
                      {/* Approval Status Timeline */}
                      <div className="mt-3 space-y-2">
                        <p className="text-xs font-semibold text-gray-700 uppercase">Approval Status</p>
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center gap-2">
                            {exit.supervisorApprovalStatus === 'approved' ? <CheckCircle className="w-4 h-4 text-green-600" /> : <AlertCircle className="w-4 h-4 text-gray-400" />}
                            <span>Supervisor: <span className="font-medium capitalize">{exit.supervisorApprovalStatus || 'pending'}</span></span>
                          </div>
                          <div className="flex items-center gap-2">
                            {exit.hrApprovalStatus === 'approved' ? <CheckCircle className="w-4 h-4 text-green-600" /> : <AlertCircle className="w-4 h-4 text-gray-400" />}
                            <span>HR Officer: <span className="font-medium capitalize">{exit.hrApprovalStatus || 'pending'}</span></span>
                          </div>
                          <div className="flex items-center gap-2">
                            {exit.finalApprovalStatus === 'approved' ? <CheckCircle className="w-4 h-4 text-green-600" /> : <AlertCircle className="w-4 h-4 text-gray-400" />}
                            <span>HR Manager: <span className="font-medium capitalize">{exit.finalApprovalStatus || 'pending'}</span></span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      className="w-full lg:w-auto"
                      onClick={() => handleOpenDetails(exit)}
                    >
                      <Eye className="w-4 h-4 mr-2" /> View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Exit Details Dialog */}
        <Dialog open={detailsDialog.open} onOpenChange={(open) => {
          if (!open) setDetailsDialog({ open: false, exit: null });
        }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Exit Request Details - {detailsDialog.exit?.employeeName}</DialogTitle>
            </DialogHeader>
            {detailsDialog.exit && (
              <Tabs defaultValue="personal" className="w-full">
                 <TabsList className="grid w-full grid-cols-3">
                   <TabsTrigger value="personal">Personal Info</TabsTrigger>
                   <TabsTrigger value="clearance">Clearance</TabsTrigger>
                   <TabsTrigger value="feedback">Feedback</TabsTrigger>
                 </TabsList>
                
                <TabsContent value="personal" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-semibold text-gray-500">Employee Name</p>
                      <p className="text-sm font-medium">{detailsDialog.exit.employeeName}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500">Email</p>
                      <p className="text-sm font-medium">{detailsDialog.exit.employeeEmail}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500">Department</p>
                      <p className="text-sm font-medium">{detailsDialog.exit.employeeDepartment}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500">Position</p>
                      <p className="text-sm font-medium">{detailsDialog.exit.position}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500">Resignation Date</p>
                      <p className="text-sm font-medium">{new Date(detailsDialog.exit.resignationDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500">Last Working Date</p>
                      <p className="text-sm font-medium">{new Date(detailsDialog.exit.lastWorkingDate).toLocaleDateString()}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs font-semibold text-gray-500">Notice Period</p>
                      <p className="text-sm font-medium">{detailsDialog.exit.noticePeriod} days</p>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="clearance" className="space-y-4">
                  {approvalContext.isHrManager && !approvalContext.isHrOperations && (
                    <div className="bg-blue-50 border border-blue-100 rounded p-3 space-y-2">
                      <p className="text-xs font-semibold text-blue-700 uppercase">HR Operations Submission</p>
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">HR Approval Status:</span>{' '}
                        <span className="capitalize">{detailsDialog.exit.hrApprovalStatus || 'pending'}</span>
                      </p>
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Submitted Date:</span>{' '}
                        {detailsDialog.exit.hrApprovalDate
                          ? new Date(detailsDialog.exit.hrApprovalDate).toLocaleString()
                          : 'Not available'}
                      </p>
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">HR Operations Notes:</span>{' '}
                        {detailsDialog.exit.hrComments || detailsDialog.exit.reviewerComments || 'No notes provided'}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-2">Assets to Return</p>
                    <p className="text-sm whitespace-pre-wrap bg-gray-50 p-3 rounded">{detailsDialog.exit.assetsToReturn || 'None listed'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-2">Clearance Checklist</p>
                    <div className="space-y-3 bg-gray-50 p-3 rounded">
                      <label className="flex items-start gap-3">
                        <Checkbox
                          checked={clearanceChecks.itAdmin}
                          disabled={approvalContext.isHrManager && !approvalContext.isHrOperations}
                          onCheckedChange={(checked) =>
                            setClearanceChecks((prev) => ({ ...prev, itAdmin: Boolean(checked) }))
                          }
                        />
                        <span className="text-sm text-gray-700">
                          <span className="font-medium">IT/Admin</span>: Returns hardware, software, and access cards.
                        </span>
                      </label>
                      <label className="flex items-start gap-3">
                        <Checkbox
                          checked={clearanceChecks.supervisor}
                          disabled={approvalContext.isHrManager && !approvalContext.isHrOperations}
                          onCheckedChange={(checked) =>
                            setClearanceChecks((prev) => ({ ...prev, supervisor: Boolean(checked) }))
                          }
                        />
                        <span className="text-sm text-gray-700">
                          <span className="font-medium">Supervisor</span>: Confirms project handover and work completion.
                        </span>
                      </label>
                      <label className="flex items-start gap-3">
                        <Checkbox
                          checked={clearanceChecks.finance}
                          disabled={approvalContext.isHrManager && !approvalContext.isHrOperations}
                          onCheckedChange={(checked) =>
                            setClearanceChecks((prev) => ({ ...prev, finance: Boolean(checked) }))
                          }
                        />
                        <span className="text-sm text-gray-700">
                          <span className="font-medium">Finance</span>: Clears final salary, reimbursements, and dues.
                        </span>
                      </label>
                      <label className="flex items-start gap-3">
                        <Checkbox
                          checked={clearanceChecks.hr}
                          disabled={approvalContext.isHrManager && !approvalContext.isHrOperations}
                          onCheckedChange={(checked) =>
                            setClearanceChecks((prev) => ({ ...prev, hr: Boolean(checked) }))
                          }
                        />
                        <span className="text-sm text-gray-700">
                          <span className="font-medium">HR</span>: Processes final documents, exit interviews, and relieving letters.
                        </span>
                      </label>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Progress: {[clearanceChecks.itAdmin, clearanceChecks.supervisor, clearanceChecks.finance, clearanceChecks.hr].filter(Boolean).length}/4 cleared
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-2">Handover Status</p>
                    <Badge variant="outline">{detailsDialog.exit.handoverStatus || 'Not specified'}</Badge>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-2">Handover Details</p>
                    <p className="text-sm whitespace-pre-wrap bg-gray-50 p-3 rounded">{detailsDialog.exit.handoverDetails || 'No handover details provided'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-2">Handover Recipient</p>
                    <p className="text-sm">{detailsDialog.exit.handoverRecipientName || 'Not specified'}</p>
                    <p className="text-xs text-gray-500">{detailsDialog.exit.handoverRecipientContact}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-2">Outstanding Tasks</p>
                    <p className="text-sm whitespace-pre-wrap bg-gray-50 p-3 rounded">{detailsDialog.exit.outstandingTasks || 'None'}</p>
                  </div>
                </TabsContent>
                
                <TabsContent value="feedback" className="space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-2">Experience Rating</p>
                    <p className="text-sm font-medium">{detailsDialog.exit.overallExperienceRating}/5</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-2">Positive Experience</p>
                    <p className="text-sm whitespace-pre-wrap bg-gray-50 p-3 rounded">{detailsDialog.exit.positiveExperience || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-2">Areas for Improvement</p>
                    <p className="text-sm whitespace-pre-wrap bg-gray-50 p-3 rounded">{detailsDialog.exit.areasForImprovementOrg || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-2">Would Recommend Organization</p>
                    <Badge variant={detailsDialog.exit.wouldRecommendOrg ? 'default' : 'outline'}>
                      {detailsDialog.exit.wouldRecommendOrg ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-2">Rejection Reason (Required for Reject)</p>
                    <Textarea
                      placeholder="Provide reason for rejection..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                    />
                  </div>
                </TabsContent>
              </Tabs>
            )}

            {/* Action Buttons in Modal */}
            {detailsDialog.exit && (
              <div className="flex gap-3 mt-6 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setDetailsDialog({ open: false, exit: null })}
                >
                  Close
                </Button>
                <div className="ml-auto flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleUpdateClearance}
                    disabled={approvalContext.isHrManager && !approvalContext.isHrOperations}
                  >
                    Update Clearance
                  </Button>
                  <Button
                    className="bg-red-600 hover:bg-red-700 text-white"
                    onClick={handleRejectFromDetails}
                  >
                    <XCircle className="w-4 h-4 mr-2" /> Reject
                  </Button>
                  <Button
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={handleApproveFromDetails}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {approvalContext.isHrManager && !approvalContext.isHrOperations ? 'Approve' : 'Submit'}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
}
