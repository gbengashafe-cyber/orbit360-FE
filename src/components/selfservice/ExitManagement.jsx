import { apiClient, apiRoutes } from '@/api';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { getStatusColor } from '@/pages/authorization-center-new/authorization-center.util';
import { showToast } from '@/utils/toast';
import {
  AlertCircle,
  AlertTriangle,
  Briefcase,
  Building,
  Calendar,
  FileText,
  Hand,
  Landmark,
  Shield,
  Star,
  User as UserIcon,
  XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { FormSubmitErrorV1 } from '../shared/submit-error';

const FormSection = ({ title, icon, children }) => (
  <Card>
    <CardHeader className="bg-gray-50 p-4 rounded-t-lg">
      <CardTitle className="flex items-center gap-2 text-base">
        {icon}
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent className="p-4 space-y-4">{children}</CardContent>
  </Card>
);

const ApprovalStatusDisplay = ({ title, status, date, comments }) => {
  return (
    <div>
      <h4 className="font-semibold">{title}</h4>
      <div className="mt-2 p-3 bg-gray-50 rounded-lg border">
        <div className="flex justify-between items-center">
          <p>Status:</p>
          <Badge className={getStatusColor(status)}>{status?.replace('_', ' ').toUpperCase() || 'PENDING'}</Badge>
        </div>
        {date && <p className="text-sm text-gray-500 mt-1">Date: {new Date(date).toLocaleDateString()}</p>}
        {comments && <p className="text-sm text-gray-600 mt-2 border-t pt-2">Comments: {comments}</p>}
      </div>
    </div>
  );
};

export default function ExitManagement({ employee, isHrAdmin = false, onUpdate }) {
  const [resignationRequests, setResignationRequests] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingSubmitData, setPendingSubmitData] = useState(null);
  const [showHandoverWarning, setShowHandoverWarning] = useState(false);
  const [pendingHandoverStatus, setPendingHandoverStatus] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const [formData, setFormData] = useState({
    last_working_date: '',
    handover_status: 'in_progress',
    handover_details: '',
    handover_recipient_name: '',
    handover_recipient_contact: '',
    outstanding_tasks: '',
    outstanding_approvals: '',
    assets_to_return: '',
    asset_return_status: 'pending_return',
    salary_balance_notes: '',
    loan_deduction_notes: '',
    leave_encashment_request: false,
    pension_processing_notes: '',
    overall_experience_rating: 3,
    positive_experience: '',
    areas_for_improvement_org: '',
    would_recommend_org: false,
  });

  useEffect(() => {
    loadData();
  }, [employee]);

  const loadData = async () => {
    try {
      const res = await apiClient.get(apiRoutes.GetExitsByEmployee(employee.id));
      const data = res.data || res;
      setResignationRequests(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading resignation data:', error);
      setResignationRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (requestId) => {
    setPendingDeleteId(requestId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!pendingDeleteId) return;

    setIsDeleting(true);
    try {
      await apiClient.delete(apiRoutes.DeleteExit(pendingDeleteId));
      showToast.success('Exit request deleted successfully');
      setShowDeleteModal(false);
      setPendingDeleteId(null);
      loadData();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error deleting exit request:', error);
      showToast.error('Failed to delete exit request. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const calculateNoticePeriod = (resignationDate, lastWorkingDate) => {
    if (!resignationDate || !lastWorkingDate) return 0;
    const start = new Date(resignationDate);
    const end = new Date(lastWorkingDate);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSubmitError(null);

    if (!formData.last_working_date) {
      setSubmitError('Last Working Date is required');
      return;
    }
    if (!formData.assets_to_return || formData.assets_to_return.trim() === '') {
      setSubmitError('Please list your assets or write "None" if no assets assigned');
      return;
    }

    const resignationDate = new Date().toISOString().split('T')[0];
    const noticePeriod = formData.last_working_date ? calculateNoticePeriod(resignationDate, formData.last_working_date) : 0;

    const resignationData = {
      employeeId: employee.id,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      employeeDepartment: employee.departmentName,
      employeeEmail: employee.email,
      position: typeof employee.jobRole === 'object' ? employee.jobRole?.title : employee.jobRole,
      resignationDate: resignationDate,
      lastWorkingDate: formData.last_working_date,
      noticePeriod: noticePeriod,
      handoverStatus: formData.handover_status,
      handoverDetails: formData.handover_details,
      handoverRecipientName: formData.handover_recipient_name,
      handoverRecipientContact: formData.handover_recipient_contact,
      outstandingTasks: formData.outstanding_tasks,
      outstandingApprovals: formData.outstanding_approvals,
      assetsToReturn: formData.assets_to_return,
      assetReturnStatus: formData.asset_return_status,
      salaryBalanceNotes: formData.salary_balance_notes,
      loanDeductionNotes: formData.loan_deduction_notes,
      leaveEncashmentRequest: formData.leave_encashment_request,
      pensionProcessingNotes: formData.pension_processing_notes,
      overallExperienceRating: formData.overall_experience_rating,
      positiveExperience: formData.positive_experience,
      areasForImprovementOrg: formData.areas_for_improvement_org,
      wouldRecommendOrg: formData.would_recommend_org,
      status: 'submitted',
      employeeSignatureDate: new Date().toISOString().split('T')[0],
    };

    setPendingSubmitData(resignationData);
    setShowConfirmModal(true);
  };

  const confirmSubmit = async () => {
    if (!pendingSubmitData) return;

    setIsSubmitting(true);
    try {
      await apiClient.post(apiRoutes.CreateExit, pendingSubmitData);
      setShowConfirmModal(false);
      setShowForm(false);
      resetForm();
      loadData();
      toast.success('Resignation submitted successfully. HR will be notified.');
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error submitting resignation:', error);
      const errorMsg = error?.response?.data?.message || error.message || 'Failed to submit resignation';
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
      setPendingSubmitData(null);
    }
  };

  const resetForm = () => {
    setFormData({
      last_working_date: '',
      handover_status: 'in_progress',
      handover_details: '',
      handover_recipient_name: '',
      handover_recipient_contact: '',
      outstanding_tasks: '',
      outstanding_approvals: '',
      assets_to_return: '',
      asset_return_status: 'pending_return',
      salary_balance_notes: '',
      loan_deduction_notes: '',
      leave_encashment_request: false,
      pension_processing_notes: '',
      overall_experience_rating: 3,
      positive_experience: '',
      areas_for_improvement_org: '',
      would_recommend_org: false,
    });
  };

  const handleHandoverStatusChange = (value) => {
    // Show warning modal for incomplete statuses
    if (value === 'in_progress' || value === 'no') {
      setPendingHandoverStatus(value);
      setShowHandoverWarning(true);
    } else if (value === 'yes') {
      // Allow "Completed" status directly
      setFormData({ ...formData, handover_status: value });
      showToast.success('Handover status set to Completed');
    }
  };

  const confirmHandoverStatus = () => {
    if (pendingHandoverStatus) {
      setFormData({ ...formData, handover_status: pendingHandoverStatus });
      const statusLabel = pendingHandoverStatus === 'in_progress' ? 'In Progress' : 'Not Started';
      showToast.success(`Handover status updated to ${statusLabel}`);
    }
    setShowHandoverWarning(false);
    setPendingHandoverStatus(null);
  };

  const handleHandoverStatusChangeInProgress = async (value) => {
    // Show warning modal for incomplete statuses
    if (value === 'in_progress' || value === 'no') {
      setPendingHandoverStatus(value);
      setShowHandoverWarning(true);
    } else if (value === 'yes') {
      // Allow "Completed" status directly and update
      try {
        await apiClient.put(apiRoutes.UpdateExit(activeRequest.id), {
          handoverStatus: value,
        });
        showToast.success('Handover status updated successfully');
        loadData();
      } catch (error) {
        console.error('Error updating handover status:', error);
        showToast.error('Failed to update handover status');
      }
    }
  };

  const confirmHandoverStatusInProgress = async () => {
    if (!pendingHandoverStatus || !activeRequest) return;

    try {
      await apiClient.put(apiRoutes.UpdateExit(activeRequest.id), {
        handoverStatus: pendingHandoverStatus,
      });
      showToast.success('Handover status updated. Please see your supervisor for completion.');
      loadData();
    } catch (error) {
      console.error('Error updating handover status:', error);
      showToast.error('Failed to update handover status');
    } finally {
      setShowHandoverWarning(false);
      setPendingHandoverStatus(null);
    }
  };

  const activeRequest = resignationRequests.find((r) => !['completed', 'withdrawn', 'rejected'].includes(r.status));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Exit Management</h2>
          <p className="text-gray-600">Submit and track your offboarding process</p>
        </div>
        {!activeRequest && (
          <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800">
                <FileText className="w-4 h-4 mr-2" />
                Initiate Exit Process
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Exit Process & Offboarding Form</DialogTitle>
              </DialogHeader>
              <Alert className="border-orange-200 bg-orange-50">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-700">
                  Please complete all sections to the best of your ability. While not mandatory, complete information ensures a
                  smooth exit process.
                </AlertDescription>
              </Alert>
              <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                <FormSection title="Personal / Identification Details" icon={<UserIcon className="text-blue-600" />}>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label>Full Name:</Label>
                      <p>
                        {employee.firstName} {employee.lastName}
                      </p>
                    </div>
                    <div>
                      <Label>Employee ID:</Label>
                      <p>{employee.staffId || 'N/A'}</p>
                    </div>
                    <div>
                      <Label>Department:</Label>
                      <p>{employee.departmentName}</p>
                    </div>
                    <div>
                      <Label>Job Title:</Label>
                      <p>{typeof employee.jobRole === 'object' ? employee.jobRole?.title : employee.jobRole}</p>
                    </div>
                  </div>
                </FormSection>

                <FormSection title="Resignation Details" icon={<Calendar className="text-blue-600" />}>
                  <div>
                    <Label htmlFor="last_working_date">Proposed Last Working Day</Label>
                    <Input
                      id="last_working_date"
                      type="date"
                      value={formData.last_working_date}
                      onChange={(e) => setFormData({ ...formData, last_working_date: e.target.value })}
                    />
                  </div>
                </FormSection>

                <FormSection title="Handover & Work Transition" icon={<Hand className="text-blue-600" />}>
                  <div>
                    <Label>Handover Status</Label>
                    <Select value={formData.handover_status} onValueChange={handleHandoverStatusChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="yes">Completed</SelectItem>
                        <SelectItem value="no">Not Started</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Handover Details (tasks, projects, responsibilities)</Label>
                    <Textarea
                      value={formData.handover_details}
                      onChange={(e) => setFormData({ ...formData, handover_details: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label>Name of Handover Recipient</Label>
                    <Input
                      value={formData.handover_recipient_name}
                      onChange={(e) => setFormData({ ...formData, handover_recipient_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Recipient Contact</Label>
                    <Input
                      value={formData.handover_recipient_contact}
                      onChange={(e) => setFormData({ ...formData, handover_recipient_contact: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Outstanding Tasks / Projects</Label>
                    <Textarea
                      value={formData.outstanding_tasks}
                      onChange={(e) => setFormData({ ...formData, outstanding_tasks: e.target.value })}
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label>Outstanding Approvals or Deliverables</Label>
                    <Textarea
                      value={formData.outstanding_approvals}
                      onChange={(e) => setFormData({ ...formData, outstanding_approvals: e.target.value })}
                      rows={2}
                    />
                  </div>
                </FormSection>

                <FormSection title="Asset & Company Property Return" icon={<Briefcase className="text-blue-600" />}>
                  <div>
                    <Label>
                      List of items to return (laptops, phones, ID cards, etc.) <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      value={formData.assets_to_return}
                      onChange={(e) => setFormData({ ...formData, assets_to_return: e.target.value })}
                      rows={3}
                      placeholder="Please list all company assets in your possession. If none, write 'None' or 'No assets assigned'"
                    />
                  </div>
                  <div>
                    <Label>Asset Return Status</Label>
                    <Select
                      value={formData.asset_return_status}
                      onValueChange={(value) => setFormData({ ...formData, asset_return_status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="not_applicable">Not Applicable (No Assets Assigned)</SelectItem>
                        <SelectItem value="pending_return">Pending Return</SelectItem>
                        <SelectItem value="returned">Returned</SelectItem>
                        <SelectItem value="not_returned">Not Returned</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </FormSection>

                <FormSection title="Financial & Benefits Clearance" icon={<Landmark className="text-blue-600" />}>
                  <div>
                    <Label>Notes on Salary/Allowance Balance</Label>
                    <Textarea
                      value={formData.salary_balance_notes}
                      onChange={(e) => setFormData({ ...formData, salary_balance_notes: e.target.value })}
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label>Notes on Loan or Advance Deductions</Label>
                    <Textarea
                      value={formData.loan_deduction_notes}
                      onChange={(e) => setFormData({ ...formData, loan_deduction_notes: e.target.value })}
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label>Notes on Pension / Gratuity Processing</Label>
                    <Textarea
                      value={formData.pension_processing_notes}
                      onChange={(e) => setFormData({ ...formData, pension_processing_notes: e.target.value })}
                      rows={2}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="leave_encashment_request"
                      checked={formData.leave_encashment_request}
                      onCheckedChange={(checked) => setFormData({ ...formData, leave_encashment_request: checked })}
                    />
                    <Label htmlFor="leave_encashment_request">Request Leave Balance Encashment (if applicable)</Label>
                  </div>
                </FormSection>

                <FormSection title="Feedback & Exit Interview" icon={<Star className="text-blue-600" />}>
                  <div>
                    <Label>Overall Work Experience Rating (1=Poor, 5=Excellent)</Label>
                    <Select
                      value={formData.overall_experience_rating}
                      onValueChange={(value) => setFormData({ ...formData, overall_experience_rating: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <SelectItem key={n} value={n}>
                            {n}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Biggest Positive Experience</Label>
                    <Textarea
                      value={formData.positive_experience}
                      onChange={(e) => setFormData({ ...formData, positive_experience: e.target.value })}
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label>Areas for Improvement</Label>
                    <Textarea
                      value={formData.areas_for_improvement_org}
                      onChange={(e) => setFormData({ ...formData, areas_for_improvement_org: e.target.value })}
                      rows={2}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="would_recommend_org"
                      checked={formData.would_recommend_org}
                      onCheckedChange={(checked) => setFormData({ ...formData, would_recommend_org: checked })}
                    />
                    <Label htmlFor="would_recommend_org">I would recommend this organization to others</Label>
                  </div>
                </FormSection>

                {submitError ? <FormSubmitErrorV1>{submitError}</FormSubmitErrorV1> : null}

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Submitting...' : 'Submit Exit Form'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {activeRequest ? (
        <Card className="bg-white/90 backdrop-blur-sm">
          <CardHeader className="flex flex-row justify-between items-center">
            <CardTitle>Exit Process Status</CardTitle>
            <div className="flex gap-3">
              <Badge className={getStatusColor(activeRequest.status)}>
                {activeRequest.status.replace('_', ' ').toUpperCase()}
              </Badge>
              {!['approved', 'completed'].includes(activeRequest.status) && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 border-red-300 hover:bg-red-50"
                  onClick={() => handleDelete(activeRequest.id)}
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Delete Request
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold text-lg mb-2">Key Dates</h3>
                <p>
                  <strong>Submitted On:</strong> {new Date(activeRequest.resignationDate).toLocaleDateString()}
                </p>
                <p>
                  <strong>Proposed Last Day:</strong> {new Date(activeRequest.lastWorkingDate).toLocaleDateString()}
                </p>
                <p>
                  <strong>Notice Period:</strong> {activeRequest.noticePeriod} days
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold text-lg mb-2">Handover</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">
                      <strong>Status:</strong>
                    </p>
                    {isHrAdmin ? (
                      <Select
                        value={activeRequest.handoverStatus || 'in_progress'}
                        onValueChange={handleHandoverStatusChangeInProgress}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="yes">Completed</SelectItem>
                          <SelectItem value="no">Not Started</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="p-2 bg-gray-100 rounded border text-gray-700">
                        {activeRequest.handoverStatus === 'in_progress' && 'In Progress'}
                        {activeRequest.handoverStatus === 'yes' && 'Completed'}
                        {activeRequest.handoverStatus === 'no' && 'Not Started'}
                        {!activeRequest.handoverStatus && 'In Progress'}
                      </div>
                    )}
                  </div>
                  <p className="text-sm">
                    <strong>Recipient:</strong> {activeRequest.handoverRecipientName || 'N/A'}
                  </p>
                </div>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold text-lg mb-2">Asset Return</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">
                      <strong>Status:</strong>
                    </p>
                    {isHrAdmin ? (
                      <Select
                        value={activeRequest.assetReturnStatus || 'pending_return'}
                        onValueChange={async (value) => {
                          try {
                            await apiClient.put(apiRoutes.UpdateExit(activeRequest.id), {
                              assetReturnStatus: value,
                            });
                            showToast.success('Asset return status updated successfully');
                            loadData();
                          } catch (error) {
                            console.error('Error updating asset return status:', error);
                            showToast.error('Failed to update asset return status');
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="not_applicable">Not Applicable (No Assets Assigned)</SelectItem>
                          <SelectItem value="pending_return">Pending Return</SelectItem>
                          <SelectItem value="returned">Returned</SelectItem>
                          <SelectItem value="not_returned">Not Returned</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="p-2 bg-gray-100 rounded border text-gray-700">
                        {activeRequest.assetReturnStatus === 'not_applicable' && 'Not Applicable (No Assets Assigned)'}
                        {activeRequest.assetReturnStatus === 'pending_return' && 'Pending Return'}
                        {activeRequest.assetReturnStatus === 'returned' && 'Returned'}
                        {activeRequest.assetReturnStatus === 'not_returned' && 'Not Returned'}
                        {!activeRequest.assetReturnStatus && 'Pending Return'}
                      </div>
                    )}
                  </div>
                  <p className="text-sm">
                    <strong>Items:</strong> {activeRequest.assetsToReturn || 'None listed'}
                  </p>
                </div>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold text-lg mb-2">Feedback</h3>
                <p>
                  <strong>Experience Rating:</strong> {activeRequest.overallExperienceRating}/5
                </p>
              </div>
            </div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Approval & Clearance Status
                </CardTitle>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                <ApprovalStatusDisplay
                  title="Supervisor"
                  status={activeRequest.supervisorApprovalStatus}
                  date={activeRequest.supervisorApprovalDate}
                  comments={activeRequest.supervisorComments}
                />
                <ApprovalStatusDisplay
                  title="HR Department"
                  status={activeRequest.hrApprovalStatus}
                  date={activeRequest.hrApprovalDate}
                  comments={activeRequest.hrComments}
                />
                <ApprovalStatusDisplay
                  title="IT / Assets"
                  status={activeRequest.itClearanceStatus}
                  date={activeRequest.itClearanceDate}
                  comments={activeRequest.itComments}
                />
                <ApprovalStatusDisplay
                  title="Final Approval"
                  status={activeRequest.finalApprovalStatus}
                  date={activeRequest.finalApprovalDate}
                  comments={`By: ${activeRequest.finalApprovalBy || 'N/A'}`}
                />
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      ) : (
        !loading && (
          <Card className="bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Exit History</CardTitle>
            </CardHeader>
            <CardContent className="text-center p-12 text-gray-500">
              <Building className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold mb-2">No Active or Past Exit Records</h3>
              <p>You have not initiated any exit processes.</p>
            </CardContent>
          </Card>
        )
      )}

      {/* Handover Warning Modal */}
      <Dialog open={showHandoverWarning} onOpenChange={setShowHandoverWarning}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              Handover Status Notice
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Alert className="border-orange-200 bg-orange-50">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-700">
                {pendingHandoverStatus === 'no'
                  ? 'You have selected "Not Started" for handover status. Please ensure you meet with your supervisor to complete the handover process before your exit date.'
                  : 'You have selected "In Progress" for handover status. Please schedule a meeting with your supervisor to complete the handover process.'}
              </AlertDescription>
            </Alert>
            <p className="text-sm text-gray-600">
              A complete handover ensures a smooth transition and helps maintain continuity of work. Your supervisor will guide
              you through the remaining steps.
            </p>
          </div>
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setShowHandoverWarning(false);
                setPendingHandoverStatus(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={activeRequest ? confirmHandoverStatusInProgress : confirmHandoverStatus}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Confirm & Proceed
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Modal */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Resignation Submission</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-gray-700">Are you sure you want to submit your resignation? This action cannot be undone.</p>
            <p className="text-sm text-gray-500">
              Your resignation will be submitted to HR and relevant approvers will be notified.
            </p>
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setShowConfirmModal(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={confirmSubmit} disabled={isSubmitting} className="bg-red-600 hover:bg-red-700">
              {isSubmitting ? 'Submitting...' : 'Confirm Submission'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Delete Exit Request
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">
                Are you sure you want to delete this exit request? This action cannot be undone.
              </AlertDescription>
            </Alert>
          </div>
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteModal(false);
                setPendingDeleteId(null);
              }}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button onClick={confirmDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
