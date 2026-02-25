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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ExitApprovals() {
  const [currentUser, setCurrentUser] = useState(null);
  const [pendingExits, setPendingExits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [approvalDialog, setApprovalDialog] = useState({
    open: false,
    exitId: null,
    action: null,
    comment: ''
  });
  const [detailsDialog, setDetailsDialog] = useState({
    open: false,
    exit: null
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const userResponse = await userService.getCurrentUser();
      const user = userResponse?.data || userResponse;
      setCurrentUser(user);

      const canApprove = user?.permissions?.includes('APPROVE_EXITS');
      if (!canApprove) {
        showToast.error('You do not have permission to approve exit requests', 'Access Denied');
        setLoading(false);
        return;
      }

      const response = await apiClient.get(apiRoutes.GetExits);
      const allExits = response?.data || response || [];
      const pending = Array.isArray(allExits) 
        ? allExits.filter(exit => exit.status === 'submitted')
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

  const handleApprovalAction = async (exitId, action) => {
    setApprovalDialog({
      open: true,
      exitId,
      action,
      comment: ''
    });
  };

  const handleConfirmApproval = async () => {
    const { exitId, action, comment } = approvalDialog;

    try {
      await apiClient.patch(apiRoutes.ApproveExit(exitId), {
        action: action === 'approve' ? 'approved' : 'rejected',
        comments: comment
      });

      const message = action === 'approve'
        ? 'Exit request approved successfully'
        : 'Exit request rejected successfully';

      showToast.success(message, 'Success');
      setApprovalDialog({ open: false, exitId: null, action: null, comment: '' });
      await loadData();
    } catch (error) {
      console.error('Error processing approval:', error);
      showToast.error(error?.response?.data?.message || 'Failed to process approval', 'Error');
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-700" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 min-h-screen" style={{ backgroundColor: '#F5F5F5' }}>
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Exit Request Approvals</h1>
          <p className="text-gray-600">Review and approve employee exit requests</p>
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
                      onClick={() => setDetailsDialog({ open: true, exit })}
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
                 <TabsList className="grid w-full grid-cols-4">
                   <TabsTrigger value="personal">Personal Info</TabsTrigger>
                   <TabsTrigger value="assets">Assets</TabsTrigger>
                   <TabsTrigger value="handover">Handover</TabsTrigger>
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
                
                <TabsContent value="assets" className="space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-2">Assets to Return</p>
                    <p className="text-sm whitespace-pre-wrap bg-gray-50 p-3 rounded">{detailsDialog.exit.assetsToReturn || 'None listed'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-2">Asset Return Status</p>
                    <Select 
                      value={detailsDialog.exit.assetReturnStatus || 'pending_return'} 
                      onValueChange={async (value) => {
                        try {
                          await apiClient.put(apiRoutes.UpdateExit(detailsDialog.exit.id), {
                            assetReturnStatus: value
                          });
                          showToast.success('Asset return status updated successfully');
                          setDetailsDialog({ 
                            open: true, 
                            exit: { ...detailsDialog.exit, assetReturnStatus: value } 
                          });
                          await loadData();
                        } catch (error) {
                          console.error('Error updating asset return status:', error);
                          showToast.error('Failed to update asset return status');
                        }
                      }}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="not_applicable">Not Applicable (No Assets Assigned)</SelectItem>
                        <SelectItem value="pending_return">Pending Return</SelectItem>
                        <SelectItem value="returned">Returned</SelectItem>
                        <SelectItem value="not_returned">Not Returned</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>
                
                <TabsContent value="handover" className="space-y-4">
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
                    className="bg-red-600 hover:bg-red-700 text-white"
                    onClick={() => {
                      handleApprovalAction(detailsDialog.exit.id, 'reject');
                      setDetailsDialog({ open: false, exit: null });
                    }}
                  >
                    <XCircle className="w-4 h-4 mr-2" /> Reject
                  </Button>
                  <Button
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => {
                      handleApprovalAction(detailsDialog.exit.id, 'approve');
                      setDetailsDialog({ open: false, exit: null });
                    }}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" /> Approve
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Approval Confirmation Dialogs */}
        <Dialog
          open={approvalDialog.open && approvalDialog.action === 'approve'}
          onOpenChange={(open) => {
            if (!open) setApprovalDialog({ open: false, exitId: null, action: null, comment: '' });
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Approve Exit Request</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-gray-700">
                Are you sure you want to approve this exit request?
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comments (Optional)
                </label>
                <Textarea
                  placeholder="Add approval comments..."
                  value={approvalDialog.comment}
                  onChange={(e) =>
                    setApprovalDialog({ ...approvalDialog, comment: e.target.value })
                  }
                />
              </div>
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() =>
                    setApprovalDialog({ open: false, exitId: null, action: null, comment: '' })
                  }
                >
                  Cancel
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={handleConfirmApproval}
                >
                  Confirm Approval
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog
          open={approvalDialog.open && approvalDialog.action === 'reject'}
          onOpenChange={(open) => {
            if (!open) setApprovalDialog({ open: false, exitId: null, action: null, comment: '' });
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Exit Request</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-gray-700">
                Are you sure you want to reject this exit request?
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rejection Reason (Required)
                </label>
                <Textarea
                  placeholder="Please provide a reason for rejection..."
                  value={approvalDialog.comment}
                  onChange={(e) =>
                    setApprovalDialog({ ...approvalDialog, comment: e.target.value })
                  }
                />
              </div>
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() =>
                    setApprovalDialog({ open: false, exitId: null, action: null, comment: '' })
                  }
                >
                  Cancel
                </Button>
                <Button
                  className="bg-red-600 hover:bg-red-700"
                  onClick={handleConfirmApproval}
                >
                  Confirm Rejection
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
