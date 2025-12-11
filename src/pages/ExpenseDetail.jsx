
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, ExpenseRequest, ExpenseCategory, ExpenseLog, ExpenseAttachment } from '@/api/entities';
import { UploadFile, SendEmail } from '@/api/integrations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Paperclip, Check, X, MessageSquare, Wallet, History, FileText, Upload, Printer } from 'lucide-react';
import { createPageUrl } from '@/utils';
import ExpenseInvoice from '../components/expenses/ExpenseInvoice';

const APPROVAL_WORKFLOW = {
  submitted: { nextStatus: 'level_1_approved', nextApprover: 'head_of_operations' },
  level_1_approved: { nextStatus: 'level_2_approved', nextApprover: 'internal_control' },
  level_2_approved: { nextStatus: 'final_approved', nextApprover: 'managing_director' },
};

const getWorkflowSteps = () => [
  { label: 'Submitted', status: 'submitted' },
  { label: 'Head of Operations', status: 'level_1_approved' },
  { label: 'Internal Control', status: 'level_2_approved' },
  { label: 'Managing Director', status: 'final_approved' },
  { label: 'Paid', status: 'paid' },
];

export default function ExpenseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === 'new';

  const [request, setRequest] = useState(null);
  const [formData, setFormData] = useState({ 
    title: '', 
    category_id: '', 
    amount: '', 
    date_incurred: '', 
    purpose: '',
    department_code: '',
    project_code: ''
  });
  const [attachments, setAttachments] = useState([]);
  const [logs, setLogs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(!isNew);
  const [isProcessing, setIsProcessing] = useState(false);
  const [comment, setComment] = useState('');
  const [filesToUpload, setFilesToUpload] = useState([]);
  const [showInvoice, setShowInvoice] = useState(false);

  useEffect(() => {
    const init = async () => {
      const user = await User.me();
      setCurrentUser(user);
      
      const cats = await ExpenseCategory.list();
      setCategories(cats);

      if (!isNew) {
        const reqData = await ExpenseRequest.get(id);
        const attData = await ExpenseAttachment.filter({ expense_request_id: id });
        const logData = await ExpenseLog.filter({ expense_request_id: id }, '-created_date');
        setRequest(reqData);
        setFormData(reqData);
        setAttachments(attData);
        setLogs(logData);
      }
      setLoading(false);
    };
    init();
  }, [id, isNew]);
  
  const handleFileChange = (e) => {
    setFilesToUpload([...e.target.files]);
  };

  const uploadFiles = async (requestId) => {
    for (const file of filesToUpload) {
      const { file_url } = await UploadFile({ file });
      await ExpenseAttachment.create({
        expense_request_id: requestId,
        file_name: file.name,
        file_url,
      });
    }
  };
  
  const createLog = async (requestId, action, fromStatus, toStatus, commentText = '') => {
    await ExpenseLog.create({
      expense_request_id: requestId,
      user_id: currentUser.id,
      user_name: currentUser.full_name,
      action,
      comment: commentText,
      from_status: fromStatus,
      to_status: toStatus,
    });
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.title || !formData.category_id || !formData.amount || !formData.purpose) {
      alert('Please fill in all required fields.');
      return;
    }

    setIsProcessing(true);
    try {
      if (isNew) {
        const newReq = await ExpenseRequest.create({
          ...formData,
          requester_id: currentUser.id,
          requester_name: currentUser.full_name,
          department: currentUser.department,
          status: 'submitted',
          expense_id: `EXP-${Date.now()}`,
          current_approver_role: 'head_of_operations',
        });
        
        if (filesToUpload.length > 0) {
          await uploadFiles(newReq.id);
        }
        
        await createLog(newReq.id, 'submitted', 'draft', 'submitted', 'Expense request submitted for approval.');
        
        // Send notification email to Head of Operations
        await SendEmail({
          to: 'headofoperations@orbit360.com',
          subject: `New Expense Request for Approval - ${formData.title}`,
          body: `
            <p>Dear Head of Operations,</p>
            <p>A new expense request has been submitted by <strong>${currentUser.full_name}</strong> and requires your approval.</p>
            <p><strong>Details:</strong></p>
            <ul>
              <li>Title: ${formData.title}</li>
              <li>Amount: ₦${formData.amount}</li>
              <li>Department: ${currentUser.department}</li>
              <li>Purpose: ${formData.purpose}</li>
            </ul>
            <p>Please log in to the system to review and approve this request.</p>
            <p>Best regards,<br/>Orbit360 Expense Management</p>
          `,
          from_name: "Orbit360 System"
        });

        alert('Expense request submitted successfully!');
        navigate(createPageUrl("Expenses"));
      }
    } catch (e) {
      console.error(e);
      alert('Failed to submit request. Please try again.');
    }
    setIsProcessing(false);
  };
  
  const handleApproval = async () => {
    setIsProcessing(true);
    const currentStep = APPROVAL_WORKFLOW[request.status];
    if (!currentStep) return;

    try {
        await ExpenseRequest.update(id, {
            status: currentStep.nextStatus,
            current_approver_role: currentStep.nextApprover,
        });
        await createLog(id, 'approved', request.status, currentStep.nextStatus, comment || 'Request approved.');
        
        // Send notification to next approver
        let nextApproverEmail = '';
        let nextApproverTitle = '';
        
        switch (currentStep.nextApprover) {
          case 'internal_control':
            nextApproverEmail = 'internalcontrol@isaac-bern.com';
            nextApproverTitle = 'Internal Control';
            break;
          case 'managing_director':
            nextApproverEmail = 'md@isaac-bern.com';
            nextApproverTitle = 'Managing Director';
            break;
          case 'finance_officer':
            nextApproverEmail = 'finance@isaac-bern.com';
            nextApproverTitle = 'Finance Officer';
            break;
        }

        if (nextApproverEmail) {
          await SendEmail({
            to: nextApproverEmail,
            subject: `Expense Request Approved - Awaiting Your Review: ${request.title}`,
            body: `
              <p>Dear ${nextApproverTitle},</p>
              <p>An expense request has been approved and is now awaiting your review.</p>
              <p><strong>Details:</strong></p>
              <ul>
                <li>Request ID: ${request.expense_id}</li>
                <li>Title: ${request.title}</li>
                <li>Amount: ₦${request.amount}</li>
                <li>Requester: ${request.requester_name}</li>
                <li>Department: ${request.department}</li>
              </ul>
              <p>Please log in to review and process this request.</p>
              <p>Best regards,<br/>Isaac-BernHR & PM System</p>
            `,
            from_name: "Isaac-BernHR & PM System"
          });
        }

        alert('Request approved successfully!');
        window.location.reload();
    } catch(e) {
        console.error(e);
        alert('Failed to approve request. Please try again.');
    }
    setIsProcessing(false);
  };
  
  const handleReject = async () => {
    if (!comment) {
      alert("A reason is required for rejection.");
      return;
    }
    setIsProcessing(true);
    try {
        await ExpenseRequest.update(id, { status: 'rejected', current_approver_role: null });
        await createLog(id, 'rejected', request.status, 'rejected', comment);
        
        // Notify requester of rejection
        await SendEmail({
          to: request.requester_email || 'requester@isaac-bern.com',
          subject: `Expense Request Rejected - ${request.title}`,
          body: `
            <p>Dear ${request.requester_name},</p>
            <p>Unfortunately, your expense request has been rejected.</p>
            <p><strong>Request Details:</strong></p>
            <ul>
              <li>Request ID: ${request.expense_id}</li>
              <li>Title: ${request.title}</li>
              <li>Amount: ₦${request.amount}</li>
            </ul>
            <p><strong>Reason for Rejection:</strong><br/>${comment}</p>
            <p>Please contact your supervisor for more details or to discuss resubmission.</p>
            <p>Best regards,<br/>Isaac-BernHR & PM System</p>
          `,
          from_name: "Isaac-BernHR & PM System"
        });

        alert('Request rejected.');
        window.location.reload();
    } catch(e) {
        console.error(e);
        alert('Failed to reject request. Please try again.');
    }
    setIsProcessing(false);
  };
  
  const handleMarkAsPaid = async () => {
    setIsProcessing(true);
    try {
        await ExpenseRequest.update(id, { status: 'paid', current_approver_role: null });
        await createLog(id, 'paid', request.status, 'paid', comment || 'Payment processed.');
        
        // Notify requester of payment
        await SendEmail({
          to: request.requester_email || 'requester@isaac-bern.com',
          subject: `Expense Request Paid - ${request.title}`,
          body: `
            <p>Dear ${request.requester_name},</p>
            <p>Your expense request has been processed and payment has been made.</p>
            <p><strong>Request Details:</strong></p>
            <ul>
              <li>Request ID: ${request.expense_id}</li>
              <li>Title: ${request.title}</li>
              <li>Amount: ₦${request.amount}</li>
            </ul>
            <p>Thank you for using the expense management system.</p>
            <p>Best regards,<br/>Isaac-BernHR & PM System</p>
          `,
          from_name: "Isaac-BernHR & PM System"
        });

        alert('Request marked as paid.');
        window.location.reload();
    } catch (e) {
        console.error(e);
        alert('Failed to mark as paid. Please try again.');
    }
    setIsProcessing(false);
  };

  const canApprove = currentUser?.role === request?.current_approver_role;
  const canMarkAsPaid = currentUser?.role === 'finance_officer' && request?.status === 'final_approved';
  const canSubmit = isNew && (currentUser?.role === 'admin_officer' || currentUser?.role === 'admin');
  const canPrintInvoice = !isNew && ['admin', 'managing_director', 'finance_officer'].includes(currentUser?.role);


  if (loading) return <div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-700" /></div>;

  const workflowSteps = getWorkflowSteps();
  const currentStatusIndex = workflowSteps.findIndex(step => step.status === request?.status);
  
  return (
    <div className="p-4 lg:p-8 min-h-screen grid grid-cols-1 lg:grid-cols-3 gap-8" style={{ backgroundColor: '#F5F5F5' }}>
      {/* Main Content */}
      <div className="lg:col-span-2 space-y-8">
        <Card>
          <CardHeader className="flex flex-row justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Wallet className="w-6 h-6 text-blue-700"/>
              {isNew ? 'New Expense Request' : `Expense Details - ${request?.expense_id}`}
            </CardTitle>
            {canPrintInvoice && (
              <>
                <Button variant="outline" onClick={() => setShowInvoice(true)}>
                  <Printer className="w-4 h-4 mr-2" />
                  Print Invoice
                </Button>
                <Dialog open={showInvoice} onOpenChange={setShowInvoice}>
                    <DialogContent className="max-w-4xl p-0 border-0">
                       <ExpenseInvoice request={request} logs={logs} />
                    </DialogContent>
                </Dialog>
              </>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Expense Type Selection */}
            <div className="space-y-2">
              <Label htmlFor="category">Expense Type *</Label>
              <Select value={formData.category_id} onValueChange={val => setFormData({...formData, category_id: val})} disabled={!isNew}>
                <SelectTrigger>
                  <SelectValue placeholder="Select expense type"/>
                </SelectTrigger>
                <SelectContent>
                  {categories.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Key Details Entry */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Expense Title/Description *</Label>
                <Input 
                  id="title"
                  placeholder="Brief description of the expense" 
                  value={formData.title} 
                  onChange={e => setFormData({...formData, title: e.target.value})} 
                  disabled={!isNew} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (₦) *</Label>
                <Input 
                  id="amount"
                  type="number" 
                  placeholder="0.00" 
                  value={formData.amount} 
                  onChange={e => setFormData({...formData, amount: parseFloat(e.target.value) || ''})} 
                  disabled={!isNew} 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date_incurred">Date Incurred/Requested *</Label>
                <Input 
                  id="date_incurred"
                  type="date" 
                  value={formData.date_incurred} 
                  onChange={e => setFormData({...formData, date_incurred: e.target.value})} 
                  disabled={!isNew} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department_code">Department/Project Code</Label>
                <Input 
                  id="department_code"
                  placeholder="e.g., DEPT-001" 
                  value={formData.department_code} 
                  onChange={e => setFormData({...formData, department_code: e.target.value})} 
                  disabled={!isNew} 
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="project_code">Project Code (if applicable)</Label>
              <Input 
                id="project_code"
                placeholder="e.g., PROJ-2024-001" 
                value={formData.project_code} 
                onChange={e => setFormData({...formData, project_code: e.target.value})} 
                disabled={!isNew} 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="purpose">Purpose/Justification *</Label>
              <Textarea 
                id="purpose"
                placeholder="Detailed explanation of why this expense is necessary..." 
                value={formData.purpose} 
                onChange={e => setFormData({...formData, purpose: e.target.value})} 
                disabled={!isNew}
                rows={4}
              />
            </div>
            
            {/* File Uploads */}
            {isNew && (
                <div className="space-y-2">
                    <Label>Supporting Documents (Invoices, Receipts, Quotations)</Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                      <Input 
                        type="file" 
                        multiple 
                        onChange={handleFileChange}
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        className="max-w-xs"
                      />
                      <p className="text-sm text-gray-500 mt-2">
                        Upload receipts, invoices, or other supporting documents
                      </p>
                    </div>
                </div>
            )}
            
            {!isNew && attachments.length > 0 && (
                <div className="space-y-2">
                    <Label>Supporting Documents</Label>
                    <div className="space-y-2">
                      {attachments.map(att => (
                        <a 
                          key={att.id} 
                          href={att.file_url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <Paperclip className="w-4 h-4 text-gray-500"/> 
                          <span className="font-medium">{att.file_name}</span>
                        </a>
                      ))}
                    </div>
                </div>
            )}
            
            {!isNew && (
                <div className="pt-4 border-t bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold mb-2">Request Information</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <p><strong>Submitted by:</strong> {request.requester_name}</p>
                      <p><strong>Department:</strong> {request.department}</p>
                      <p><strong>Request ID:</strong> {request.expense_id}</p>
                      <p><strong>Current Status:</strong> {request.status?.replace(/_/g, ' ').toUpperCase()}</p>
                    </div>
                </div>
            )}
            
            {/* Submit button for admin_officer and admin on new requests */}
            {canSubmit && (
              <div className="flex justify-end gap-3 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => navigate(createPageUrl("Expenses"))}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  disabled={isProcessing}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isProcessing ? <Loader2 className="animate-spin w-4 h-4 mr-2"/> : null}
                  Submit Request
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Approval Workflow Actions */}
        {!isNew && (canApprove || canMarkAsPaid) && (
            <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-blue-700"/>
                    Approval Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="comment">Comment (required for rejection)</Label>
                      <Textarea 
                        id="comment"
                        placeholder="Add your comments or feedback..." 
                        value={comment} 
                        onChange={e => setComment(e.target.value)}
                        rows={3}
                      />
                    </div>
                    <div className="flex gap-3">
                        {canApprove && (
                            <>
                                <Button 
                                  onClick={handleApproval} 
                                  disabled={isProcessing} 
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <Check className="w-4 h-4 mr-2"/> 
                                  Approve
                                </Button>
                                <Button 
                                  onClick={handleReject} 
                                  disabled={isProcessing} 
                                  variant="destructive"
                                >
                                  <X className="w-4 h-4 mr-2"/> 
                                  Reject
                                </Button>
                            </>
                        )}
                        {canMarkAsPaid && (
                            <Button 
                              onClick={handleMarkAsPaid} 
                              disabled={isProcessing} 
                              className="bg-purple-600 hover:bg-purple-700"
                            >
                              <Check className="w-4 h-4 mr-2"/> 
                              Mark as Paid
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        )}
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {!isNew && (
            <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-700"/>
                    Approval Workflow
                  </CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-4">
                        {workflowSteps.map((step, index) => (
                        <li key={index} className="flex items-start">
                            <div className="flex flex-col items-center mr-4">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                                  index <= currentStatusIndex 
                                    ? 'bg-green-500 text-white' 
                                    : 'bg-gray-300 text-gray-600'
                                }`}>
                                    {index <= currentStatusIndex ? <Check size={16} /> : index + 1}
                                </div>
                                {index < workflowSteps.length - 1 && (
                                  <div className={`w-0.5 h-6 mt-2 ${
                                    index < currentStatusIndex ? 'bg-green-500' : 'bg-gray-300'
                                  }`}></div>
                                )}
                            </div>
                            <div className="flex-1">
                                <h4 className={`font-medium text-sm ${
                                  index <= currentStatusIndex ? 'text-gray-900' : 'text-gray-500'
                                }`}>
                                  {step.label}
                                </h4>
                                {request?.status === step.status && (
                                  <p className="text-xs text-blue-600 font-medium mt-1">
                                    Current Stage
                                  </p>
                                )}
                            </div>
                        </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>
        )}
        
        {!isNew && logs.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5 text-blue-700"/>
                Activity History
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-80 overflow-y-auto">
              {logs.map(log => (
                <div key={log.id} className="p-3 bg-gray-50 rounded-lg border-l-4 border-blue-200">
                  <div className="flex justify-between items-start mb-1">
                    <p className="font-medium text-sm text-gray-900">
                      {log.user_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(log.created_date).toLocaleDateString()}
                    </p>
                  </div>
                  <p className="text-sm text-gray-600 capitalize">
                    {log.action} the request
                  </p>
                  {log.comment && (
                    <div className="mt-2 p-2 bg-white border rounded text-sm">
                      <strong>Comment:</strong> {log.comment}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
