
import React, { useState, useEffect } from 'react';
import { Vendor, ExpenseRequest, ExpenseAttachment, ExpenseCategory, User } from '@/api/entities';
import { UploadFile, SendEmail } from '@/api/integrations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Banknote,
  Upload,
  Paperclip,
  X,
  Loader2,
  CheckCircle,
  Clock,
  Building,
  User as UserIcon,
  FileText
} from 'lucide-react';

// Material Design Colors
const MATERIAL_COLORS = {
  primary: '#1976D2',
  background: '#FAFAFA',
};

const ELEVATION = {
  2: 'shadow',
  4: 'shadow-md',
};

export default function VendorPaymentProcessing() {
  const [vendors, setVendors] = useState([]);
  const [categories, setCategories] = useState([]);
  const [paymentRequests, setPaymentRequests] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    vendor_id: '',
    category_id: '',
    payment_amount: '',
    invoice_number: '',
    invoice_date: '',
    due_date: '',
    payment_description: '',
    department_code: '',
    project_code: '',
    approval_manager: '',
    payment_priority: 'normal'
  });

  const [attachments, setAttachments] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [vendorsData, categoriesData, paymentsData, userData] = await Promise.all([
        Vendor.list(),
        ExpenseCategory.list(),
        ExpenseRequest.list('-created_date'),
        User.me()
      ]);

      // Filter only active vendors
      const activeVendors = vendorsData.filter(v => v.status === 'active');
      setVendors(activeVendors);
      setCategories(categoriesData);

      // Filter vendor payment requests
      const vendorPayments = paymentsData.filter(p => p.vendor_id);
      setPaymentRequests(vendorPayments);

      setCurrentUser(userData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.vendor_id) newErrors.vendor_id = 'Vendor is required';
    if (!formData.category_id) newErrors.category_id = 'Expense category is required';
    if (!formData.payment_amount || parseFloat(formData.payment_amount) <= 0) newErrors.payment_amount = 'Valid payment amount is required';
    if (!formData.invoice_number.trim()) newErrors.invoice_number = 'Invoice number is required';
    if (!formData.invoice_date) newErrors.invoice_date = 'Invoice date is required';
    if (!formData.payment_description.trim()) newErrors.payment_description = 'Payment description is required';
    if (!formData.approval_manager) newErrors.approval_manager = 'Approval manager is required';
    if (attachments.length === 0) newErrors.attachments = 'At least one supporting document is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = files.map(async (file) => {
        const { file_url } = await UploadFile({ file });
        return {
          file_name: file.name,
          file_url,
          file_size: file.size
        };
      });

      const uploadedFiles = await Promise.all(uploadPromises);
      setAttachments(prev => [...prev, ...uploadedFiles]);
      setErrors(prev => ({ ...prev, attachments: '' }));
    } catch (error) {
      console.error('Error uploading files:', error);
      setError('Failed to upload files. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const selectedVendor = vendors.find(v => v.id === formData.vendor_id);

      // Create the vendor payment request
      const paymentRequest = await ExpenseRequest.create({
        title: `Vendor Payment - ${selectedVendor.vendor_name}`,
        vendor_id: formData.vendor_id,
        vendor_name: selectedVendor.vendor_name,
        category_id: formData.category_id,
        amount: parseFloat(formData.payment_amount),
        date_incurred: formData.invoice_date,
        purpose: formData.payment_description,
        department_code: formData.department_code,
        project_code: formData.project_code,
        requester_id: currentUser.id,
        requester_name: currentUser.full_name,
        department: currentUser.department,
        status: 'submitted',
        expense_id: `VND-${Date.now()}`,
        current_approver_role: formData.approval_manager,
        invoice_number: formData.invoice_number,
        invoice_date: formData.invoice_date,
        due_date: formData.due_date,
        payment_priority: formData.payment_priority,
        payment_type: 'vendor_payment'
      });

      // Save attachments
      for (const attachment of attachments) {
        await ExpenseAttachment.create({
          expense_request_id: paymentRequest.id,
          file_name: attachment.file_name,
          file_url: attachment.file_url,
        });
      }

      // Send notification email to the selected approver by role
      const approvers = await User.filter({ role: formData.approval_manager });

      if (approvers.length > 0) {
        for (const approver of approvers) {
          try {
            await SendEmail({
              to: approver.email,
              subject: `Vendor Payment Authorization Required - ${selectedVendor.vendor_name}`,
              body: `
                <p>Dear ${approver.full_name || 'Manager'},</p>
                <p>A new vendor payment request has been submitted by <strong>${currentUser.full_name}</strong> and requires your authorization.</p>

                <p><strong>Payment Details:</strong></p>
                <ul>
                  <li>Request ID: ${paymentRequest.expense_id}</li>
                  <li>Vendor: ${selectedVendor.vendor_name}</li>
                  <li>Amount: ₦${parseFloat(formData.payment_amount).toLocaleString()}</li>
                  <li>Invoice Number: ${formData.invoice_number}</li>
                  <li>Invoice Date: ${new Date(formData.invoice_date).toLocaleDateString()}</li>
                  <li>Priority: ${formData.payment_priority.toUpperCase()}</li>
                  <li>Description: ${formData.payment_description}</li>
                </ul>

                <p><strong>Vendor Banking Details:</strong></p>
                <ul>
                  <li>Bank: ${selectedVendor.bank_name || 'Not provided'}</li>
                  <li>Account Name: ${selectedVendor.account_name || 'Not provided'}</li>
                  <li>Account Number: ${selectedVendor.account_number || 'Not provided'}</li>
                </ul>

                <p>Please log in to the Orbit360 system to review the supporting documents and authorize this payment.</p>
                <p>Best regards,<br/>Orbit360 Finance System</p>
              `,
              from_name: "Orbit360 System"
            });
          } catch (emailError) {
             console.warn(`Failed to send notification email to ${approver.email}:`, emailError);
          }
        }
      } else {
         console.warn(`No user found with role '${formData.approval_manager}' to send notification email.`);
      }

      setSuccess('Vendor payment request submitted successfully! The selected approver has been notified.');

      // Reset form
      setFormData({
        vendor_id: '',
        category_id: '',
        payment_amount: '',
        invoice_number: '',
        invoice_date: '',
        due_date: '',
        payment_description: '',
        department_code: '',
        project_code: '',
        approval_manager: '',
        payment_priority: 'normal'
      });
      setAttachments([]);
      setErrors({});

      // Reload data to show new request
      loadData();

    } catch (error) {
      setError('Failed to submit vendor payment request. Please try again.');
      console.error('Error submitting payment request:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      submitted: { color: 'bg-blue-100 text-blue-700', icon: <Clock className="w-3 h-3" /> },
      approved: { color: 'bg-green-100 text-green-700', icon: <CheckCircle className="w-3 h-3" /> },
      rejected: { color: 'bg-red-100 text-red-700', icon: <X className="w-3 h-3" /> },
      paid: { color: 'bg-purple-100 text-purple-700', icon: <CheckCircle className="w-3 h-3" /> }
    };

    const config = statusConfig[status] || statusConfig.submitted;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        {config.icon}
        {status.toUpperCase()}
      </Badge>
    );
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const canProcessPayments = ['admin', 'finance_officer', 'head_of_finance'].includes(currentUser?.role);

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700 mx-auto"></div>
      </div>
    );
  }

  if (!canProcessPayments) {
    return (
      <div className="p-8 text-center">
        <Banknote className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Access Denied</h2>
        <p className="text-gray-500">You don't have permission to process vendor payments.</p>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 min-h-screen" style={{ backgroundColor: MATERIAL_COLORS.background }}>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-green-700 to-green-800 rounded-2xl flex items-center justify-center shadow-lg shadow-green-700/25">
            <Banknote className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Vendor Payment Processing</h1>
            <p className="text-gray-600">Process and authorize vendor payments with supporting documentation</p>
          </div>
        </div>

        {/* Alerts */}
        {success && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription className="text-green-700">{success}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <X className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Payment Request Form */}
        <Card className={`bg-white rounded-lg ${ELEVATION[2]}`}>
          <CardHeader>
            <CardTitle>Create Vendor Payment Request</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Vendor Selection and Category */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vendor_id">Select Vendor *</Label>
                  <Select value={formData.vendor_id} onValueChange={(value) => setFormData({...formData, vendor_id: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose vendor to pay" />
                    </SelectTrigger>
                    <SelectContent>
                      {vendors.map(vendor => (
                        <SelectItem key={vendor.id} value={vendor.id}>
                          <div className="flex items-center gap-2">
                            <Building className="w-4 h-4" />
                            <div>
                              <p className="font-medium">{vendor.vendor_name}</p>
                              <p className="text-xs text-gray-500">{vendor.vendor_code}</p>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.vendor_id && <p className="text-sm text-red-600">{errors.vendor_id}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category_id">Expense Category *</Label>
                  <Select value={formData.category_id} onValueChange={(value) => setFormData({...formData, category_id: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select expense category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.category_id && <p className="text-sm text-red-600">{errors.category_id}</p>}
                </div>
              </div>

              {/* Payment Amount */}
              <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="payment_amount">Payment Amount (₦) *</Label>
                  <Input
                    id="payment_amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.payment_amount}
                    onChange={(e) => setFormData({...formData, payment_amount: e.target.value})}
                  />
                  {errors.payment_amount && <p className="text-sm text-red-600">{errors.payment_amount}</p>}
                </div>
              </div>

              {/* Invoice Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="invoice_number">Invoice Number *</Label>
                  <Input
                    id="invoice_number"
                    placeholder="e.g., INV-2024-001"
                    value={formData.invoice_number}
                    onChange={(e) => setFormData({...formData, invoice_number: e.target.value})}
                  />
                  {errors.invoice_number && <p className="text-sm text-red-600">{errors.invoice_number}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="invoice_date">Invoice Date *</Label>
                  <Input
                    id="invoice_date"
                    type="date"
                    value={formData.invoice_date}
                    onChange={(e) => setFormData({...formData, invoice_date: e.target.value})}
                  />
                  {errors.invoice_date && <p className="text-sm text-red-600">{errors.invoice_date}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="due_date">Due Date</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                  />
                </div>
              </div>

              {/* Additional Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="department_code">Department Code</Label>
                  <Input
                    id="department_code"
                    placeholder="e.g., DEPT-001"
                    value={formData.department_code}
                    onChange={(e) => setFormData({...formData, department_code: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="project_code">Project Code</Label>
                  <Input
                    id="project_code"
                    placeholder="e.g., PROJ-2024-001"
                    value={formData.project_code}
                    onChange={(e) => setFormData({...formData, project_code: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payment_priority">Payment Priority</Label>
                  <Select value={formData.payment_priority} onValueChange={(value) => setFormData({...formData, payment_priority: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low Priority</SelectItem>
                      <SelectItem value="normal">Normal Priority</SelectItem>
                      <SelectItem value="high">High Priority</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Authorization */}
              <div className="space-y-2">
                <Label htmlFor="approval_manager">Select Authorizing Manager *</Label>
                <Select value={formData.approval_manager} onValueChange={(value) => setFormData({...formData, approval_manager: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose who should authorize this payment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="managing_director">Managing Director</SelectItem>
                    <SelectItem value="head_of_operations">Head of Operations</SelectItem>
                    <SelectItem value="human_resources_manager">Head of Human Resources</SelectItem>
                  </SelectContent>
                </Select>
                {errors.approval_manager && <p className="text-sm text-red-600">{errors.approval_manager}</p>}
                <p className="text-xs text-gray-500">
                  Choose the appropriate manager based on payment amount and company policy
                </p>
              </div>

              {/* Payment Description */}
              <div className="space-y-2">
                <Label htmlFor="payment_description">Payment Description *</Label>
                <Textarea
                  id="payment_description"
                  placeholder="Describe what this payment is for, goods/services received, etc..."
                  value={formData.payment_description}
                  onChange={(e) => setFormData({...formData, payment_description: e.target.value})}
                  rows={4}
                />
                {errors.payment_description && <p className="text-sm text-red-600">{errors.payment_description}</p>}
              </div>

              {/* File Upload */}
              <div className="space-y-4">
                <Label>Supporting Documents (Invoices, Receipts, Contracts) *</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      Upload invoices, receipts, contracts, or other supporting documents
                    </p>
                    <Input
                      type="file"
                      multiple
                      onChange={handleFileUpload}
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      className="max-w-xs mx-auto"
                      disabled={uploading}
                    />
                  </div>
                  {uploading && (
                    <div className="flex items-center justify-center mt-2">
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      <span className="text-sm text-gray-600">Uploading...</span>
                    </div>
                  )}
                </div>
                {errors.attachments && <p className="text-sm text-red-600">{errors.attachments}</p>}

                {/* Show uploaded files */}
                {attachments.length > 0 && (
                  <div className="space-y-2">
                    <Label>Uploaded Documents</Label>
                    <div className="space-y-2">
                      {attachments.map((attachment, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Paperclip className="w-4 h-4 text-gray-500" />
                            <div>
                              <p className="text-sm font-medium">{attachment.file_name}</p>
                              <p className="text-xs text-gray-500">{formatFileSize(attachment.file_size)}</p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeAttachment(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-6 border-t">
                <Button
                  type="submit"
                  disabled={submitting || uploading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting for Authorization...
                    </>
                  ) : (
                    'Submit Payment Request'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Recent Payment Requests */}
        {paymentRequests.length > 0 && (
          <Card className={`bg-white rounded-lg ${ELEVATION[2]}`}>
            <CardHeader>
              <CardTitle>Recent Vendor Payment Requests</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead>Request ID</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submitted</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paymentRequests.slice(0, 5).map(request => (
                      <TableRow key={request.id} className="hover:bg-gray-50/50">
                        <TableCell className="font-medium">{request.expense_id}</TableCell>
                        <TableCell>{request.vendor_name}</TableCell>
                        <TableCell>₦{request.amount.toLocaleString()}</TableCell>
                        <TableCell>{request.invoice_number}</TableCell>
                        <TableCell>
                          {getStatusBadge(request.status)}
                        </TableCell>
                        <TableCell>
                          {new Date(request.created_date).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
