
import React, { useState, useEffect } from 'react';
import { Budget, ExpenseRequest, ExpenseCategory, User, ExpenseAttachment } from '@/api/entities';
import { SendEmail } from '@/api/integrations';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, Wallet, Loader2, BarChart2, Receipt } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import ExpenseRequestForm from '../components/expenses/ExpenseRequestForm';

// Material Design Color Palette & Elevation
const MATERIAL_COLORS = {
  primary: '#1976D2',
  background: '#FAFAFA',
  error: '#D32F2F',
  success: '#388E3C',
};

const ELEVATION = {
  2: 'shadow',
  4: 'shadow-md',
};

// Department and Category options
const departmentOptions = ["all", "hr", "sales", "marketing", "finance", "operations", "it", "admin", "management"];
const categoryOptions = ["general", "travel", "office_supplies", "marketing", "training", "salaries"];

export default function BudgetManager() {
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [formData, setFormData] = useState({
    period: new Date().toISOString().slice(0, 7),
    department: 'all',
    category: 'general',
    allocated_amount: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [budgetsData, categoriesData, userData] = await Promise.all([
        Budget.list('-period'),
        ExpenseCategory.list(),
        User.me()
      ]);
      setBudgets(budgetsData);
      setCategories(categoriesData);
      setCurrentUser(userData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (budget) => {
    setEditingBudget(budget);
    setFormData({
      period: budget.period,
      department: budget.department,
      category: budget.category,
      allocated_amount: budget.allocated_amount
    });
    setShowBudgetForm(true);
  };
  
  const handleNew = () => {
    setEditingBudget(null);
    setFormData({
      period: new Date().toISOString().slice(0, 7),
      department: 'all',
      category: 'general',
      allocated_amount: ''
    });
    setShowBudgetForm(true);
  };

  const handleCancel = () => {
    setShowBudgetForm(false);
    setEditingBudget(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this budget record?')) {
      try {
        await Budget.delete(id);
        loadData();
      } catch (error) {
        console.error('Error deleting budget:', error);
        alert('Failed to delete budget.');
      }
    }
  };
  
  const handleSave = async () => {
    const dataToSave = {
      ...formData,
      allocated_amount: parseFloat(formData.allocated_amount)
    };

    try {
      if (editingBudget) {
        await Budget.update(editingBudget.id, dataToSave);
      } else {
        await Budget.create(dataToSave);
      }
      loadData();
      handleCancel();
    } catch (error) {
      console.error('Error saving budget:', error);
      alert('Failed to save budget. Please check the input and try again.');
    }
  };

  const handleSubmitExpenseRequest = async (requestData) => {
    setSubmittingRequest(true);
    try {
      if (!currentUser) {
        throw new Error("Current user not loaded. Cannot submit expense request.");
      }

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

      for (const attachment of requestData.attachments) {
        await ExpenseAttachment.create({
          expense_request_id: expenseRequest.id,
          file_name: attachment.file_name,
          file_url: attachment.file_url,
        });
      }

      const approvers = await User.filter({ role: requestData.approval_manager });

      if (approvers.length > 0) {
        for (const approver of approvers) {
          try {
            await SendEmail({
              to: approver.email,
              subject: `New Expense Request for Approval - ${requestData.title}`,
              body: `<p>Dear ${approver.full_name || 'Manager'},</p><p>A new expense request has been submitted by <strong>${currentUser.full_name}</strong> and requires your approval.</p><p>Please log in to the Orbit360 system to review and approve this request.</p>`,
              from_name: "Orbit360 System"
            });
          } catch (emailError) {
            console.warn(`Failed to send notification email to ${approver.email}:`, emailError);
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

  return (
    <div className="p-4 lg:p-8 min-h-screen" style={{ backgroundColor: MATERIAL_COLORS.background }}>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-700 rounded-lg flex items-center justify-center shadow-lg">
            <Wallet className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Budget Manager</h1>
            <p className="text-gray-600">Set and manage monthly budgets for departments and categories.</p>
          </div>
        </div>

        <div className="flex gap-4">
          <Dialog open={showBudgetForm} onOpenChange={setShowBudgetForm}>
            <DialogTrigger asChild>
              <Button onClick={handleNew} className="bg-blue-700 hover:bg-blue-800 text-white shadow-md">
                <Plus className="w-4 h-4 mr-2" />
                Add New Budget
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingBudget ? 'Edit' : 'Create'} Budget</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="period">Period (YYYY-MM)</Label>
                  <Input
                    id="period"
                    type="month"
                    value={formData.period}
                    onChange={e => setFormData({...formData, period: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Select value={formData.department} onValueChange={val => setFormData({...formData, department: val})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {departmentOptions.map(opt => <SelectItem key={opt} value={opt} className="capitalize">{opt}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                   <Select value={formData.category} onValueChange={val => setFormData({...formData, category: val})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {categoryOptions.map(opt => <SelectItem key={opt} value={opt} className="capitalize">{opt}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Allocated Amount (₦)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="e.g., 500000"
                    value={formData.allocated_amount}
                    onChange={e => setFormData({...formData, allocated_amount: e.target.value})}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={handleCancel}>Cancel</Button>
                <Button onClick={handleSave} className="bg-blue-700 hover:bg-blue-800 text-white">Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button onClick={() => setShowRequestForm(true)} variant="outline">
            <Receipt className="w-4 h-4 mr-2" />
            Submit Expense
          </Button>
        </div>

        {showRequestForm && (
          <div className="my-8">
            <ExpenseRequestForm
              categories={categories}
              onSubmit={handleSubmitExpenseRequest}
              onCancel={() => setShowRequestForm(false)}
              loading={submittingRequest}
            />
          </div>
        )}

        <Card className={`bg-white rounded-lg ${ELEVATION[2]}`}>
          <CardHeader>
            <CardTitle>Existing Budgets</CardTitle>
            <CardDescription>Review and manage all configured budgets.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center p-8"><Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-700"/></div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead>Period</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Allocated Amount</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {budgets.map(b => (
                      <TableRow key={b.id} className="hover:bg-gray-50/50">
                        <TableCell>{b.period}</TableCell>
                        <TableCell className="capitalize">{b.department}</TableCell>
                        <TableCell className="capitalize">{b.category}</TableCell>
                        <TableCell>₦{b.allocated_amount.toLocaleString()}</TableCell>
                        <TableCell className="space-x-2">
                          <Button variant="outline" size="icon" onClick={() => handleEdit(b)}><Edit className="w-4 h-4"/></Button>
                          <Button variant="destructive" size="icon" onClick={() => handleDelete(b.id)}><Trash2 className="w-4 h-4"/></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
