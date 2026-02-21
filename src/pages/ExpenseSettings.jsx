
import React, { useState, useEffect } from 'react';
import { ExpenseCategory, ExpenseRequest, ExpenseAttachment, User } from '@/api/entities';
import { SendEmail } from '@/api/integrations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit, Trash2, Settings, Loader2, Receipt, FileText } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';

import ExpenseRequestForm from '../components/expenses/ExpenseRequestForm';

export default function ExpenseSettings() {
  const [categories, setCategories] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [submittingRequest, setSubmittingRequest] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [categoriesData, userData] = await Promise.all([
        ExpenseCategory.list(),
        User.me()
      ]);
      setCategories(categoriesData);
      setCurrentUser(userData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setFormData({ name: category.name, description: category.description });
    setShowCategoryForm(true);
  };
  
  const handleNewCategory = () => {
    setEditingCategory(null);
    setFormData({ name: '', description: '' });
    setShowCategoryForm(true);
  };

  const handleCancelCategory = () => {
    setShowCategoryForm(false);
    setEditingCategory(null);
    setFormData({ name: '', description: '' });
  };

  const handleDeleteCategory = async (id) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      await ExpenseCategory.delete(id);
      loadData();
    }
  };
  
  const handleSaveCategory = async () => {
    if (editingCategory) {
      await ExpenseCategory.update(editingCategory.id, formData);
    } else {
      await ExpenseCategory.create(formData);
    }
    loadData();
    handleCancelCategory();
  };

  const handleSubmitExpenseRequest = async (requestData) => {
    setSubmittingRequest(true);
    try {
      // Create the expense request
      const expenseRequest = await ExpenseRequest.create({
        title: requestData.title,
        category_id: requestData.category_id,
        amount: requestData.amount,
        date_incurred: requestData.date_incurred,
        purpose: requestData.purpose,
        department_code: requestData.department_code,
        project_code: requestData.project_code,
        requester_id: currentUser.id,
        requester_name: currentUser.full_name,
        department: currentUser.department,
        status: 'submitted',
        expense_id: `EXP-${Date.now()}`,
        current_approver_role: requestData.approval_manager,
      });

      // Save attachments
      for (const attachment of requestData.attachments) {
        await ExpenseAttachment.create({
          expense_request_id: expenseRequest.id,
          file_name: attachment.file_name,
          file_url: attachment.file_url,
        });
      }

      // Find approvers by role and send email notifications
      const approvers = await User.filter({ role: requestData.approval_manager });

      if (approvers.length > 0) {
        for (const approver of approvers) {
          try {
            await SendEmail({
              to: approver.email,
              subject: `New Expense Request for Approval - ${requestData.title}`,
              body: `
                <p>Dear ${approver.full_name || 'Manager'},</p>
                <p>A new expense request has been submitted by <strong>${currentUser.full_name}</strong> and requires your approval.</p>
                <p><strong>Request Details:</strong></p>
                <ul>
                  <li>Request ID: ${expenseRequest.expense_id}</li>
                  <li>Title: ${requestData.title}</li>
                  <li>Amount: ₦${requestData.amount.toLocaleString()}</li>
                  <li>Department: ${currentUser.department}</li>
                  <li>Purpose: ${requestData.purpose}</li>
                  <li>Date Incurred: ${new Date(requestData.date_incurred).toLocaleDateString()}</li>
                </ul>
                <p>Please log in to the Orbit360 system to review and approve this request.</p>
                <p>Best regards,<br/>Orbit360 Expense Management</p>
              `,
              from_name: "Orbit360 System"
            });
          } catch (emailError) {
            console.warn(`Failed to send notification email to ${approver.email}:`, emailError);
            // Don't block the whole process if one email fails
          }
        }
      } else {
        console.warn(`No user found with role '${requestData.approval_manager}' to send notification email.`);
      }

      alert('Expense request submitted successfully!');
      setShowRequestForm(false);
      
    } catch (error) {
      console.error('Error submitting expense request:', error);
      alert('Failed to submit expense request. Please try again.');
    } finally {
      setSubmittingRequest(false);
    }
  };

  const canManageCategories = ['admin', 'admin_officer', 'head_of_operations'].includes(currentUser?.role);
  const canCreateRequests = true; // All users can create expense requests

  return (
    <div className="p-4 lg:p-8 min-h-screen" style={{ backgroundColor: '#F5F5F5' }}>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-700 to-blue-800 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-700/25">
            <Settings className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Expense Settings</h1>
            <p className="text-gray-600">Manage expense categories and submit requests.</p>
          </div>
        </div>

        <Tabs defaultValue="request" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="request" className="flex items-center gap-2">
              <Receipt className="w-4 h-4" />
              Submit Request
            </TabsTrigger>
            {canManageCategories && (
              <TabsTrigger value="categories" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Manage Categories
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="request" className="space-y-6">
            {canCreateRequests && (
              <>
                {!showRequestForm ? (
                  <Card className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-xl shadow-gray-200/50">
                    <CardHeader>
                      <CardTitle>Create New Expense Request</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center py-12">
                      <Receipt className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                      <h3 className="text-lg font-semibold mb-2 text-gray-700">Submit an Expense Request</h3>
                      <p className="text-gray-500 mb-6">
                        Create a new expense request with supporting documents for approval.
                      </p>
                      <Button 
                        onClick={() => setShowRequestForm(true)}
                        className="bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white shadow-lg shadow-blue-700/25"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Submit Expense Request
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <ExpenseRequestForm
                    categories={categories}
                    onSubmit={handleSubmitExpenseRequest}
                    onCancel={() => setShowRequestForm(false)}
                    loading={submittingRequest}
                  />
                )}
              </>
            )}
          </TabsContent>

          {canManageCategories && (
            <TabsContent value="categories" className="space-y-6">
              <Dialog open={showCategoryForm} onOpenChange={setShowCategoryForm}>
                <DialogTrigger asChild>
                  <Button onClick={handleNewCategory}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add New Category
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingCategory ? 'Edit' : 'Create'} Expense Category</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <Input 
                      placeholder="Category Name" 
                      value={formData.name} 
                      onChange={e => setFormData({...formData, name: e.target.value})} 
                    />
                    <Input 
                      placeholder="Description" 
                      value={formData.description} 
                      onChange={e => setFormData({...formData, description: e.target.value})} 
                    />
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={handleCancelCategory}>Cancel</Button>
                    <Button onClick={handleSaveCategory}>Save</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Card className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-xl shadow-gray-200/50">
                <CardHeader><CardTitle>Expense Categories</CardTitle></CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center p-8"><Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-700"/></div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {categories.map(cat => (
                          <TableRow key={cat.id}>
                            <TableCell>{cat.name}</TableCell>
                            <TableCell>{cat.description}</TableCell>
                            <TableCell className="space-x-2">
                              <Button variant="outline" size="icon" onClick={() => handleEditCategory(cat)}>
                                <Edit className="w-4 h-4"/>
                              </Button>
                              <Button variant="destructive" size="icon" onClick={() => handleDeleteCategory(cat.id)}>
                                <Trash2 className="w-4 h-4"/>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
