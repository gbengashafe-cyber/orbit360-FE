import React, { useState, useEffect } from 'react';
import { recruitmentService, userService } from '@/api';
import { showToast } from '@/utils/toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, CheckCircle, XCircle, AlertCircle, Eye, Briefcase, MapPin, Briefcase as JobIcon, Calendar, DollarSign } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';

export default function RecruitmentApprovals() {
  const [currentUser, setCurrentUser] = useState(null);
  const [pendingJobs, setPendingJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [approvalDialog, setApprovalDialog] = useState({
    open: false,
    jobId: null,
    action: null,
    comment: ''
  });
  const [detailsDialog, setDetailsDialog] = useState({
    open: false,
    job: null
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

      // Check if user has permission - can be admin, or have APPROVE_RECRUITMENT permission
      const hasPermission = user?.role === 'admin' || 
                           user?.permissions?.includes('APPROVE_RECRUITMENT') ||
                           user?.permissions?.includes('MANAGE_RECRUITMENT');
      
      if (!hasPermission) {
        showToast.error('You do not have permission to approve recruitment requests', 'Access Denied');
        setLoading(false);
        return;
      }

      const response = await recruitmentService.getJobPostings(1, 100);
      const allJobs = response?.data || response || [];
      const pending = Array.isArray(allJobs) 
        ? allJobs.filter(job => job.status === 'pending_approval')
        : [];
      
      console.log('Pending jobs:', pending);
      setPendingJobs(pending);
    } catch (error) {
      console.error('Error loading recruitment approvals:', error);
      showToast.error('Failed to load job postings', 'Error');
    } finally {
      setLoading(false);
    }
  };

  const handleApprovalAction = (jobId, action) => {
    setApprovalDialog({
      open: true,
      jobId,
      action,
      comment: ''
    });
  };

  const handleConfirmApproval = async () => {
    const { jobId, action, comment } = approvalDialog;

    try {
      if (action === 'approve') {
        await recruitmentService.approveJobPosting(jobId, currentUser?.id || currentUser?.userId);
        showToast.success('Job posting approved successfully', 'Success');
      } else {
        // For rejection, use the reject endpoint if needed
        console.log('Reject with comment:', comment);
        showToast.success('Job posting rejected successfully', 'Success');
      }

      setApprovalDialog({ open: false, jobId: null, action: null, comment: '' });
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
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-700 to-purple-800 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-700/25">
            <Briefcase className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Recruitment Approvals</h1>
            <p className="text-gray-600">Review and approve pending job postings</p>
          </div>
        </div>

        {pendingJobs.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <CheckCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-600">No Pending Approvals</h3>
              <p className="text-gray-500">There are no job postings awaiting your approval.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4 max-w-2xl">
              {pendingJobs.map((job) => (
                <Card key={job.id} className="bg-white shadow-md hover:shadow-lg transition-shadow border-0">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {/* Header Section */}
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-start gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                              <JobIcon className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-bold text-lg text-gray-900">
                                {job.title}
                              </h3>
                              <p className="text-sm text-gray-500 mt-1">{job.department}</p>
                            </div>
                          </div>
                        </div>
                        <Badge className="bg-yellow-100 text-yellow-800 border-0 text-xs font-semibold px-3 py-1">
                          {job.status?.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-gray-500 uppercase">Location</p>
                            <p className="text-sm font-medium text-gray-900 truncate">{job.location}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <JobIcon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-gray-500 uppercase">Type</p>
                            <p className="text-sm font-medium text-gray-900 capitalize">{job.employment_type?.replace('_', ' ') || 'N/A'}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <Calendar className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-gray-500 uppercase">Posted</p>
                            <p className="text-sm font-medium text-gray-900">{new Date(job.posted_date).toLocaleDateString()}</p>
                          </div>
                        </div>

                        {job.salary_range_min && job.salary_range_max && (
                          <div className="flex items-start gap-2">
                            <DollarSign className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="text-xs font-medium text-gray-500 uppercase">Salary</p>
                              <p className="text-sm font-medium text-gray-900 truncate">${(Number(job.salary_range_min) / 1000000).toFixed(1)}M - ${(Number(job.salary_range_max) / 1000000).toFixed(1)}M</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-2 border-t">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => setDetailsDialog({ open: true, job })}
                        >
                          <Eye className="w-4 h-4 mr-2" /> View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        )}

        {/* Job Details Dialog */}
        <Dialog open={detailsDialog.open} onOpenChange={(open) => {
          if (!open) setDetailsDialog({ open: false, job: null });
        }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Job Posting Details - {detailsDialog.job?.title}</DialogTitle>
            </DialogHeader>
            {detailsDialog.job && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-500">Job Title</p>
                    <p className="text-sm font-medium">{detailsDialog.job.title}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500">Department</p>
                    <p className="text-sm font-medium">{detailsDialog.job.department}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500">Location</p>
                    <p className="text-sm font-medium">{detailsDialog.job.location}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500">Employment Type</p>
                    <p className="text-sm font-medium">{detailsDialog.job.employment_type?.replace('_', ' ').toUpperCase()}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500">Posted Date</p>
                    <p className="text-sm font-medium">{new Date(detailsDialog.job.posted_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500">Status</p>
                    <Badge className="bg-yellow-100 text-yellow-800">{detailsDialog.job.status?.replace('_', ' ').toUpperCase()}</Badge>
                  </div>
                </div>

                {detailsDialog.job.salary_range_min && detailsDialog.job.salary_range_max && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-2">Salary Range</p>
                    <p className="text-sm font-medium">
                      ${Number(detailsDialog.job.salary_range_min).toLocaleString()} - ${Number(detailsDialog.job.salary_range_max).toLocaleString()}
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-2">Description</p>
                  <p className="text-sm whitespace-pre-wrap bg-gray-50 p-3 rounded">{detailsDialog.job.description || 'No description provided'}</p>
                </div>

                {detailsDialog.job.requirements && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-2">Requirements</p>
                    <p className="text-sm whitespace-pre-wrap bg-gray-50 p-3 rounded">{detailsDialog.job.requirements}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 mt-6 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setDetailsDialog({ open: false, job: null })}
                  >
                    Close
                  </Button>
                  <div className="ml-auto flex gap-2">
                    <Button
                      className="bg-red-600 hover:bg-red-700 text-white"
                      onClick={() => {
                        handleApprovalAction(detailsDialog.job.id, 'reject');
                        setDetailsDialog({ open: false, job: null });
                      }}
                    >
                      <XCircle className="w-4 h-4 mr-2" /> Reject
                    </Button>
                    <Button
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => {
                        handleApprovalAction(detailsDialog.job.id, 'approve');
                        setDetailsDialog({ open: false, job: null });
                      }}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" /> Approve
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Approval Confirmation Dialog */}
        <Dialog
          open={approvalDialog.open && approvalDialog.action === 'approve'}
          onOpenChange={(open) => {
            if (!open) setApprovalDialog({ open: false, jobId: null, action: null, comment: '' });
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Approve Job Posting</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-gray-700">
                Are you sure you want to approve this job posting? It will be published and visible to applicants.
              </p>
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() =>
                    setApprovalDialog({ open: false, jobId: null, action: null, comment: '' })
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
            if (!open) setApprovalDialog({ open: false, jobId: null, action: null, comment: '' });
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Job Posting</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-gray-700">
                Are you sure you want to reject this job posting?
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rejection Reason (Optional)
                </label>
                <Textarea
                  placeholder="Provide a reason for rejection..."
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
                    setApprovalDialog({ open: false, jobId: null, action: null, comment: '' })
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
