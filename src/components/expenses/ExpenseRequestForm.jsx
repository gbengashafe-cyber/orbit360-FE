
import React, { useState } from 'react';
import { ExpenseCategory } from '@/api/entities';
import { UploadFile } from '@/api/integrations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Paperclip, X, Loader2 } from 'lucide-react';

export default function ExpenseRequestForm({ categories, onSubmit, onCancel, loading }) {
  const [formData, setFormData] = useState({
    title: '',
    category_id: '',
    amount: '',
    date_incurred: '',
    purpose: '',
    department_code: '',
    project_code: '',
    approval_manager: '' // New field for selecting approval manager
  });
  
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.category_id) newErrors.category_id = 'Category is required';
    if (!formData.amount || parseFloat(formData.amount) <= 0) newErrors.amount = 'Valid amount is required';
    if (!formData.date_incurred) newErrors.date_incurred = 'Date incurred is required';
    if (!formData.purpose.trim()) newErrors.purpose = 'Purpose is required';
    if (!formData.approval_manager) newErrors.approval_manager = 'Approval manager is required';
    
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
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('Failed to upload files. Please try again.');
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

    const submissionData = {
      ...formData,
      amount: parseFloat(formData.amount),
      attachments
    };

    onSubmit(submissionData);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-xl shadow-gray-200/50">
      <CardHeader>
        <CardTitle>Create New Expense Request</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Expense Title/Description *</Label>
              <Input
                id="title"
                placeholder="Brief description of the expense"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
              />
              {errors.title && <p className="text-sm text-red-600">{errors.title}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Expense Category *</Label>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (₦) *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
              />
              {errors.amount && <p className="text-sm text-red-600">{errors.amount}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="date_incurred">Date Incurred *</Label>
              <Input
                id="date_incurred"
                type="date"
                value={formData.date_incurred}
                onChange={(e) => setFormData({...formData, date_incurred: e.target.value})}
              />
              {errors.date_incurred && <p className="text-sm text-red-600">{errors.date_incurred}</p>}
            </div>
          </div>

          {/* Additional Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="department_code">Department/Project Code</Label>
              <Input
                id="department_code"
                placeholder="e.g., DEPT-001"
                value={formData.department_code}
                onChange={(e) => setFormData({...formData, department_code: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="project_code">Project Reference</Label>
              <Input
                id="project_code"
                placeholder="e.g., PROJ-2024-001"
                value={formData.project_code}
                onChange={(e) => setFormData({...formData, project_code: e.target.value})}
              />
            </div>
          </div>

          {/* Approval Manager Selection */}
          <div className="space-y-2">
            <Label htmlFor="approval_manager">Select Approval Manager *</Label>
            <Select value={formData.approval_manager} onValueChange={(value) => setFormData({...formData, approval_manager: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Choose who should approve this request" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="managing_director">Managing Director</SelectItem>
                <SelectItem value="head_of_operations">Head of Operations</SelectItem>
                <SelectItem value="human_resources_manager">Head of Human Resources</SelectItem>
              </SelectContent>
            </Select>
            {errors.approval_manager && <p className="text-sm text-red-600">{errors.approval_manager}</p>}
            <p className="text-xs text-gray-500">
              Choose the appropriate manager based on the expense amount and type
            </p>
          </div>

          {/* Purpose */}
          <div className="space-y-2">
            <Label htmlFor="purpose">Purpose/Justification *</Label>
            <Textarea
              id="purpose"
              placeholder="Detailed explanation of why this expense is necessary..."
              value={formData.purpose}
              onChange={(e) => setFormData({...formData, purpose: e.target.value})}
              rows={4}
            />
            {errors.purpose && <p className="text-sm text-red-600">{errors.purpose}</p>}
          </div>

          {/* File Upload */}
          <div className="space-y-4">
            <Label>Supporting Documents (Invoices, Receipts, etc.)</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  Upload receipts, invoices, or other supporting documents
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
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || uploading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting Request...
                </>
              ) : (
                'Submit Expense Request'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
