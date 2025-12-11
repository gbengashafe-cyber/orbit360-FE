
import React, { useState, useEffect } from 'react';
import { ResignationRequest, User } from '@/api/entities';
import { SendEmail } from '@/api/integrations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, AlertTriangle, Calendar, Building, User as UserIcon, Hand, Briefcase, Landmark, Star, CheckCircle, Clock, Shield, XCircle, AlertCircle } from 'lucide-react';

const FormSection = ({ title, icon, children }) => (
  <Card>
    <CardHeader className="bg-gray-50 p-4 rounded-t-lg">
      <CardTitle className="flex items-center gap-2 text-base">
        {icon}
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent className="p-4 space-y-4">
      {children}
    </CardContent>
  </Card>
);

const ApprovalStatusDisplay = ({ title, status, date, comments }) => {
    const getStatusColor = (status) => ({
        pending: 'bg-yellow-100 text-yellow-800',
        approved: 'bg-green-100 text-green-800',
        cleared: 'bg-green-100 text-green-800',
        rejected: 'bg-red-100 text-red-800',
        issues: 'bg-orange-100 text-orange-800',
    }[status] || 'bg-gray-100 text-gray-800');

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

export default function ExitManagement({ employee, onUpdate }) {
  const [resignationRequests, setResignationRequests] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    last_working_date: '',
    handover_status: 'in_progress',
    handover_details: '',
    handover_recipient_name: '',
    handover_recipient_contact: '',
    outstanding_tasks: '',
    outstanding_approvals: '',
    assets_to_return: '',
    salary_balance_notes: '',
    loan_deduction_notes: '',
    leave_encashment_request: false,
    pension_processing_notes: '',
    overall_experience_rating: 3,
    positive_experience: '',
    areas_for_improvement_org: '',
    would_recommend_org: false
  });

  useEffect(() => {
    loadData();
  }, [employee]);

  const loadData = async () => {
    try {
      const requests = await ResignationRequest.filter({ employee_id: employee.id }, '-created_date');
      setResignationRequests(requests);
    } catch (error) {
      console.error('Error loading resignation data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (requestId) => {
    if (window.confirm('Are you sure you want to delete this exit request? This action cannot be undone.')) {
      try {
        await ResignationRequest.delete(requestId);
        alert('Exit request deleted successfully');
        loadData();
        if(onUpdate) onUpdate();
      } catch (error) {
        console.error('Error deleting exit request:', error);
        alert('Failed to delete exit request. Please try again.');
      }
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
    if (window.confirm('Are you sure you want to submit your resignation? This action cannot be undone.')) {
      setIsSubmitting(true);
      try {
        const resignationDate = new Date().toISOString().split('T')[0];
        const noticePeriod = formData.last_working_date ? calculateNoticePeriod(resignationDate, formData.last_working_date) : 0;
        
        const resignationData = {
          employee_id: employee.id,
          employee_name: `${employee.first_name} ${employee.last_name}`,
          employee_department: employee.department,
          employee_email: employee.email,
          position: employee.position,
          resignation_date: resignationDate,
          notice_period: noticePeriod,
          ...formData,
          status: 'submitted',
          employee_signature_date: new Date().toISOString().split('T')[0],
        };
        await ResignationRequest.create(resignationData);

        try {
          // Find HR users with the 'admin_officer' role to notify
          const hrUsers = await User.filter({ role: 'admin_officer' });
          if (hrUsers.length > 0) {
            for (const hrUser of hrUsers) {
              await SendEmail({
                to: hrUser.email, // Send to the registered HR user's email
                subject: `Resignation Submitted - ${employee.first_name} ${employee.last_name}`,
                body: `<p>A resignation form has been submitted by ${employee.first_name} ${employee.last_name}. Please review it in the Orbit360 HR portal.</p>`,
                from_name: "Orbit360 HR System"
              });
            }
          } else {
            console.warn("Resignation submitted, but no HR Officer (admin_officer) found to send a notification to.");
          }
        } catch (emailError) {
          console.error("Failed to send resignation notification email:", emailError);
          // Do not block the user, just log the error. The main resignation request was successful.
        }

        alert('Resignation submitted successfully. HR will be notified.');
        setShowForm(false);
        resetForm();
        loadData();
        if(onUpdate) onUpdate();
      } catch (error) {
        console.error('Error submitting resignation:', error);
        alert(`Failed to submit resignation. Please check the details and try again. Error: ${error.message}`);
      } finally {
        setIsSubmitting(false);
      }
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
      salary_balance_notes: '',
      loan_deduction_notes: '',
      leave_encashment_request: false,
      pension_processing_notes: '',
      overall_experience_rating: 3,
      positive_experience: '',
      areas_for_improvement_org: '',
      would_recommend_org: false
    });
  };

  const getStatusColor = (status) => ({
      submitted: 'bg-orange-100 text-orange-700',
      under_review: 'bg-blue-100 text-blue-700',
      clearance_pending: 'bg-yellow-100 text-yellow-700',
      approved: 'bg-green-100 text-green-700',
      completed: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
      withdrawn: 'bg-gray-100 text-gray-700'
    }[status] || 'bg-gray-100 text-gray-700');

  const activeRequest = resignationRequests.find(r => !['completed', 'withdrawn', 'rejected'].includes(r.status));

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
              <DialogHeader><DialogTitle>Exit Process & Offboarding Form</DialogTitle></DialogHeader>
              <Alert className="border-orange-200 bg-orange-50"><AlertCircle className="h-4 w-4 text-orange-600" /><AlertDescription className="text-orange-700">Please complete all sections to the best of your ability. While not mandatory, complete information ensures a smooth exit process.</AlertDescription></Alert>
              <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                
                <FormSection title="Personal / Identification Details" icon={<UserIcon className="text-blue-600"/>}>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><Label>Full Name:</Label><p>{employee.first_name} {employee.last_name}</p></div>
                    <div><Label>Employee ID:</Label><p>{employee.employee_id || 'N/A'}</p></div>
                    <div><Label>Department:</Label><p>{employee.department}</p></div>
                    <div><Label>Job Title:</Label><p>{employee.position}</p></div>
                  </div>
                </FormSection>

                <FormSection title="Resignation Details" icon={<Calendar className="text-blue-600"/>}>
                    <div>
                      <Label htmlFor="last_working_date">Proposed Last Working Day</Label>
                      <Input id="last_working_date" type="date" value={formData.last_working_date} onChange={(e) => setFormData({...formData, last_working_date: e.target.value})}/>
                    </div>
                </FormSection>
                
                <FormSection title="Handover & Work Transition" icon={<Hand className="text-blue-600"/>}>
                   <div><Label>Handover Status</Label><Select value={formData.handover_status} onValueChange={(value) => setFormData({...formData, handover_status: value})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="in_progress">In Progress</SelectItem><SelectItem value="yes">Completed</SelectItem><SelectItem value="no">Not Started</SelectItem></SelectContent></Select></div>
                   <div><Label>Handover Details (tasks, projects, responsibilities)</Label><Textarea value={formData.handover_details} onChange={(e) => setFormData({...formData, handover_details: e.target.value})} rows={3}/></div>
                   <div><Label>Name of Handover Recipient</Label><Input value={formData.handover_recipient_name} onChange={(e) => setFormData({...formData, handover_recipient_name: e.target.value})}/></div>
                   <div><Label>Recipient Contact</Label><Input value={formData.handover_recipient_contact} onChange={(e) => setFormData({...formData, handover_recipient_contact: e.target.value})}/></div>
                   <div><Label>Outstanding Tasks / Projects</Label><Textarea value={formData.outstanding_tasks} onChange={(e) => setFormData({...formData, outstanding_tasks: e.target.value})} rows={2}/></div>
                   <div><Label>Outstanding Approvals or Deliverables</Label><Textarea value={formData.outstanding_approvals} onChange={(e) => setFormData({...formData, outstanding_approvals: e.target.value})} rows={2}/></div>
                </FormSection>

                <FormSection title="Asset & Company Property Return" icon={<Briefcase className="text-blue-600"/>}>
                   <div><Label>List of items to return (laptops, phones, ID cards, etc.)</Label><Textarea value={formData.assets_to_return} onChange={(e) => setFormData({...formData, assets_to_return: e.target.value})} rows={3} placeholder="Please list all company assets in your possession."/></div>
                </FormSection>

                <FormSection title="Financial & Benefits Clearance" icon={<Landmark className="text-blue-600"/>}>
                   <div><Label>Notes on Salary/Allowance Balance</Label><Textarea value={formData.salary_balance_notes} onChange={(e) => setFormData({...formData, salary_balance_notes: e.target.value})} rows={2}/></div>
                   <div><Label>Notes on Loan or Advance Deductions</Label><Textarea value={formData.loan_deduction_notes} onChange={(e) => setFormData({...formData, loan_deduction_notes: e.target.value})} rows={2}/></div>
                   <div><Label>Notes on Pension / Gratuity Processing</Label><Textarea value={formData.pension_processing_notes} onChange={(e) => setFormData({...formData, pension_processing_notes: e.target.value})} rows={2}/></div>
                   <div className="flex items-center space-x-2"><Checkbox id="leave_encashment_request" checked={formData.leave_encashment_request} onCheckedChange={(checked) => setFormData({...formData, leave_encashment_request: checked})}/><Label htmlFor="leave_encashment_request">Request Leave Balance Encashment (if applicable)</Label></div>
                </FormSection>

                <FormSection title="Feedback & Exit Interview" icon={<Star className="text-blue-600"/>}>
                   <div><Label>Overall Work Experience Rating (1=Poor, 5=Excellent)</Label><Select value={formData.overall_experience_rating} onValueChange={(value) => setFormData({...formData, overall_experience_rating: parseInt(value)})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{[1,2,3,4,5].map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent></Select></div>
                   <div><Label>Biggest Positive Experience</Label><Textarea value={formData.positive_experience} onChange={(e) => setFormData({...formData, positive_experience: e.target.value})} rows={2}/></div>
                   <div><Label>Areas for Improvement</Label><Textarea value={formData.areas_for_improvement_org} onChange={(e) => setFormData({...formData, areas_for_improvement_org: e.target.value})} rows={2}/></div>
                   <div className="flex items-center space-x-2"><Checkbox id="would_recommend_org" checked={formData.would_recommend_org} onCheckedChange={(checked) => setFormData({...formData, would_recommend_org: checked})}/><Label htmlFor="would_recommend_org">I would recommend this organization to others</Label></div>
                </FormSection>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                  <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Submitting...' : 'Submit Exit Form'}</Button>
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
                    <p><strong>Submitted On:</strong> {new Date(activeRequest.resignation_date).toLocaleDateString()}</p>
                    <p><strong>Proposed Last Day:</strong> {new Date(activeRequest.last_working_date).toLocaleDateString()}</p>
                    <p><strong>Notice Period:</strong> {activeRequest.notice_period} days</p>
                </div>
                <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold text-lg mb-2">Handover</h3>
                    <p><strong>Status:</strong> {activeRequest.handover_status}</p>
                    <p><strong>Recipient:</strong> {activeRequest.handover_recipient_name}</p>
                </div>
                 <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold text-lg mb-2">Feedback</h3>
                    <p><strong>Experience Rating:</strong> {activeRequest.overall_experience_rating}/5</p>
                </div>
            </div>
             <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Shield className="w-5 h-5"/>Approval & Clearance Status</CardTitle></CardHeader>
                <CardContent className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                    <ApprovalStatusDisplay title="Supervisor" status={activeRequest.supervisor_approval_status} date={activeRequest.supervisor_approval_date} comments={activeRequest.supervisor_comments} />
                    <ApprovalStatusDisplay title="HR Department" status={activeRequest.hr_approval_status} date={activeRequest.hr_approval_date} comments={activeRequest.hr_comments} />
                    <ApprovalStatusDisplay title="IT / Assets" status={activeRequest.it_clearance_status} date={activeRequest.it_clearance_date} comments={activeRequest.it_comments} />
                    <ApprovalStatusDisplay title="Final Approval" status={activeRequest.final_approval_status} date={activeRequest.final_approval_date} comments={`By: ${activeRequest.final_approval_by || 'N/A'}`} />
                </CardContent>
            </Card>
          </CardContent>
        </Card>
      ) : (
        !loading && (
            <Card className="bg-white/90 backdrop-blur-sm">
                <CardHeader><CardTitle>Exit History</CardTitle></CardHeader>
                <CardContent className="text-center p-12 text-gray-500">
                    <Building className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-semibold mb-2">No Active or Past Exit Records</h3>
                    <p>You have not initiated any exit processes.</p>
                </CardContent>
            </Card>
        )
      )}
    </div>
  );
}
