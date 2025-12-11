
import React, { useState, useEffect } from "react";
import { Loan, LoanPayment, Employee, User } from "@/api/entities";
import { SendEmail } from "@/api/integrations";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Banknote, Plus, TrendingUp, Users, RefreshCw, ThumbsUp, ThumbsDown } from "lucide-react";
import LoanForm from "../components/cooperative/LoanForm";

const LoanApprovalCard = ({ loans, onApprove, onReject, loading }) => {
    if (loans.length === 0) return null;

    return (
        <Card className="bg-yellow-50 border-yellow-200">
            <CardHeader>
                <CardTitle>Loans Pending Your Approval</CardTitle>
                <CardDescription>Review the following loan requests and take action.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Employee</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Tenure</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loans.map(loan => (
                            <TableRow key={loan.id}>
                                <TableCell>{loan.employee_name || 'N/A'}</TableCell>
                                <TableCell>₦{loan.principal_amount?.toLocaleString()}</TableCell>
                                <TableCell className="capitalize">{loan.loan_type?.replace('_', ' ')}</TableCell>
                                <TableCell>{loan.tenure_months} months</TableCell>
                                <TableCell className="flex gap-2">
                                    <Button size="sm" variant="outline" className="text-green-600 border-green-600 hover:bg-green-50" onClick={() => onApprove(loan)} disabled={loading}>
                                        <ThumbsUp className="w-4 h-4 mr-1" /> Approve
                                    </Button>
                                    <Button size="sm" variant="outline" className="text-red-600 border-red-600 hover:bg-red-50" onClick={() => onReject(loan)} disabled={loading}>
                                        <ThumbsDown className="w-4 h-4 mr-1" /> Reject
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
};

export default function Cooperative() {
  const [loans, setLoans] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showLoanForm, setShowLoanForm] = useState(false);
  const [editingLoan, setEditingLoan] = useState(null);
  
  const [loanToReject, setLoanToReject] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const user = await User.me();
      setCurrentUser(user);

      const [loansData, employeesData] = await Promise.all([
        Loan.list("-created_date"),
        Employee.list(),
      ]);

      const enrichedLoans = loansData.map(loan => {
        const employee = employeesData.find(e => e.id === loan.employee_id);
        return { ...loan, employee_name: employee ? `${employee.first_name} ${employee.last_name}` : 'Unknown', employee_email: employee ? employee.email : null };
      });
      
      setLoans(enrichedLoans);
      setEmployees(employeesData);
      
      if (user && (user.role === 'head_of_operations' || user.role === 'managing_director')) {
          const pending = enrichedLoans.filter(l => l.status === 'pending_approval' && l.approver_role === user.role);
          setPendingApprovals(pending);
      }

    } catch (error) {
      console.error("Error loading cooperative data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoanSubmit = async (loanData) => {
    try {
      if (editingLoan) {
        await Loan.update(editingLoan.id, loanData);
      } else {
        const newLoan = await Loan.create(loanData);
        // Send notification to approver
        const approvers = await User.filter({ role: loanData.approver_role });
        const employee = employees.find(e => e.id === loanData.employee_id);
        
        for (const approver of approvers) {
            await SendEmail({
                to: approver.email,
                subject: 'New Loan Request for Approval',
                body: `
                    <p>Dear ${approver.full_name},</p>
                    <p>A new loan request from <strong>${employee?.first_name} ${employee?.last_name}</strong> for the amount of <strong>₦${loanData.principal_amount.toLocaleString()}</strong> is awaiting your approval.</p>
                    <p>Please log in to the Orbit360 platform to review and take action.</p>
                    <p>Thank you.</p>
                `,
                from_name: "Orbit360 System"
            });
        }
      }
      setShowLoanForm(false);
      setEditingLoan(null);
      loadData();
    } catch (error) {
      console.error("Error saving loan:", error);
    }
  };

  const handleEdit = (loan) => {
    setEditingLoan(loan);
    setShowLoanForm(true);
  };
  
  const getEmployeeName = (employeeId) => {
    const employee = employees.find(e => e.id === employeeId);
    return employee ? `${employee.first_name} ${employee.last_name}` : "Unknown Employee";
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-700";
      case "paid_off": return "bg-blue-100 text-blue-700";
      case "pending_approval": return "bg-yellow-100 text-yellow-700";
      case "rejected": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const handleApproveLoan = async (loan) => {
      setActionLoading(true);
      try {
          await Loan.update(loan.id, {
              status: 'active',
              approved_by: currentUser.full_name,
              approved_date: new Date().toISOString().split('T')[0]
          });
          if (loan.employee_email) {
              await SendEmail({
                  to: loan.employee_email,
                  subject: 'Your Loan Request Has Been Approved',
                  body: `<p>Dear ${loan.employee_name},</p><p>Your loan request for <strong>₦${loan.principal_amount.toLocaleString()}</strong> has been approved. Deductions will commence from your next payroll.</p><p>Thank you.</p>`,
                  from_name: "Orbit360 Finance"
              });
          }
          loadData();
      } catch (error) {
          console.error("Failed to approve loan:", error);
      } finally {
          setActionLoading(false);
      }
  };

  const handleRejectLoan = async () => {
      if (!loanToReject || !rejectionReason) return;
      setActionLoading(true);
      try {
          await Loan.update(loanToReject.id, {
              status: 'rejected',
              approved_by: currentUser.full_name,
              approved_date: new Date().toISOString().split('T')[0],
              rejection_reason: rejectionReason,
          });
          if (loanToReject.employee_email) {
              await SendEmail({
                  to: loanToReject.employee_email,
                  subject: 'Update on Your Loan Request',
                  body: `<p>Dear ${loanToReject.employee_name},</p><p>We regret to inform you that your loan request for <strong>₦${loanToReject.principal_amount.toLocaleString()}</strong> has been rejected.</p><p><strong>Reason:</strong> ${rejectionReason}</p><p>Thank you.</p>`,
                  from_name: "Orbit360 Finance"
              });
          }
          setLoanToReject(null);
          setRejectionReason("");
          loadData();
      } catch (error) {
          console.error("Failed to reject loan:", error);
      } finally {
          setActionLoading(false);
      }
  };
  
  const totalLoaned = loans.filter(l => l.status === 'active').reduce((sum, l) => sum + l.principal_amount, 0);
  const activeLoans = loans.filter(l => l.status === 'active').length;

  if (loading) {
    return <div className="p-8 text-center">Loading Cooperative data...</div>;
  }

  return (
    <div className="p-4 lg:p-8 min-h-screen" style={{ backgroundColor: '#F5F5F5' }}>
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-700 to-blue-800 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-700/25">
              <Banknote className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Cooperative / Thrift & Loans</h1>
              <p className="text-gray-600">Manage employee loans and deductions.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={loadData}>
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Dialog open={showLoanForm} onOpenChange={setShowLoanForm}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-blue-700 to-blue-800 text-white shadow-lg shadow-blue-700/25" onClick={() => setEditingLoan(null)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Loan
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>{editingLoan ? "Edit Loan" : "Create New Loan"}</DialogTitle>
                </DialogHeader>
                <LoanForm
                  loan={editingLoan}
                  employees={employees}
                  onSubmit={handleLoanSubmit}
                  onCancel={() => setShowLoanForm(false)}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <LoanApprovalCard loans={pendingApprovals} onApprove={handleApproveLoan} onReject={setLoanToReject} loading={actionLoading} />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Disbursed (Active)</CardTitle><TrendingUp className="h-4 w-4 text-muted-foreground" /></CardHeader>
                <CardContent><div className="text-2xl font-bold">₦{totalLoaned.toLocaleString()}</div></CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Active Loans</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader>
                <CardContent><div className="text-2xl font-bold">{activeLoans}</div></CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Paid Off Loans</CardTitle><Banknote className="h-4 w-4 text-muted-foreground" /></CardHeader>
                <CardContent><div className="text-2xl font-bold">{loans.filter(l => l.status === 'paid_off').length}</div></CardContent>
            </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Loans</CardTitle>
            <CardDescription>A list of all loans requested by employees.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Principal</TableHead>
                  <TableHead>Monthly Deduction</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loans.map(loan => (
                  <TableRow key={loan.id}>
                    <TableCell>{getEmployeeName(loan.employee_id)}</TableCell>
                    <TableCell className="capitalize">{loan.loan_type?.replace('_', ' ')}</TableCell>
                    <TableCell>₦{loan.principal_amount?.toLocaleString()}</TableCell>
                    <TableCell>₦{loan.monthly_deduction?.toLocaleString()}</TableCell>
                    <TableCell>{new Date(loan.start_date).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(loan.end_date).toLocaleDateString()}</TableCell>
                    <TableCell><Badge className={getStatusColor(loan.status)}>{loan.status.replace('_', ' ')}</Badge></TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => handleEdit(loan)}>
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {loans.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={8} className="text-center h-24">No loans found.</TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!loanToReject} onOpenChange={() => {
        setLoanToReject(null);
        setRejectionReason(""); // Clear reason on dialog close
      }}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>Reject Loan Request</DialogTitle>
                  <DialogDescription>Please provide a reason for rejecting this loan request. The employee will be notified.</DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-2">
                  <Label htmlFor="rejectionReason">Rejection Reason</Label>
                  <Input 
                      id="rejectionReason"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="e.g., Incomplete documentation, policy violation..."
                  />
              </div>
              <DialogFooter>
                  <Button variant="outline" onClick={() => {
                      setLoanToReject(null);
                      setRejectionReason("");
                  }}>Cancel</Button>
                  <Button variant="destructive" onClick={handleRejectLoan} disabled={actionLoading || !rejectionReason}>Confirm Rejection</Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
    </div>
  );
}
