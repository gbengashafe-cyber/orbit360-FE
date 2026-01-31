import { employeeService } from '@/api';
import { Loan } from '@/api/entities';
import { SendEmail } from '@/api/integrations';
import { loanService } from '@/api/loan.service';
import { LoanUtil } from '@/components/cooperative/loan.utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useGlobalContext } from '@/state/context';
import { Banknote, Download, Plus, RefreshCw, ThumbsDown, ThumbsUp, Trash2, TrendingUp, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { LoanForm } from './loans/loan-form';
import { logger } from '@/utils';
import { toast } from 'sonner';

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
            {loans.map((loan) => (
              <TableRow key={loan.id}>
                <TableCell>{loan.employee.firstName || 'N/A'}</TableCell>
                <TableCell>₦{loan.principalAmount?.toLocaleString()}</TableCell>
                <TableCell className="capitalize">{loan.loanType?.replace('_', ' ')}</TableCell>
                <TableCell>{loan.tenureMonths} months</TableCell>
                <TableCell className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-green-600 border-green-600 hover:bg-green-50"
                    onClick={() => onApprove(loan)}
                    disabled={loading}
                  >
                    <ThumbsUp className="w-4 h-4 mr-1" /> Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 border-red-600 hover:bg-red-50"
                    onClick={() => onReject(loan)}
                    disabled={loading}
                  >
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
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showLoanForm, setShowLoanForm] = useState(false);
  const [editingLoan, setEditingLoan] = useState({ principalAmount: 0 });
  const [loanToReject, setLoanToReject] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [totalLoaned, setTotalLoaned] = useState(0);
  const [activeLoans, setActiveLoaned] = useState(0);

  const { currentUser } = useGlobalContext();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [loanDashboard, loansData, employeesData] = await Promise.all([
        loanService.getLoanDashboard(),
        loanService.getLoans(),
        employeeService.getEmployees(),
      ]);

      setTotalLoaned(loanDashboard.data.activeLoanSum || 0);
      setActiveLoaned(loanDashboard.data.activeLoans || 0);

      const enrichedLoans = loansData.data.map((loan) => {
        const { monthlyDeduction, totalRepayment } = LoanUtil.calculations(loan);
        return {
          ...loan,
          employeeName: loan.employee ? `${loan.employee.firstName} ${loan.employee.lastName}` : 'Unknown',
          employeeEmail: loan.employee ? loan.employee.email : null,
          monthlyDeduction,
          totalRepayment,
        };
      });

      setLoans(enrichedLoans);
      setEmployees(employeesData.data);

      if (currentUser && (currentUser.role === 'headOfOperations' || currentUser.role === 'managingDirector')) {
        const pending = enrichedLoans.filter((l) => l.status === 'pendingApproval' && l.approverRole === currentUser.role);
        setPendingApprovals(pending);
      }
    } catch (error) {
      console.error('Error loading cooperative data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLoan = async (loanId) => {
    if (window.confirm('Are you sure you want to delete this loan? This action cannot be undone.')) {
      try {
        await loanService.deleteLoan(loanId);
        loadData();
      } catch (error) {
        alert(`Failed to delete loan: ${error.message ? error.message + '.' : ''} Please try again.`);
      }
    }
  };

  const downloadRepaymentSchedule = (loan) => {
    const employeeName = loan.employee ? `${loan.employee.firstName} ${loan.employee.lastName}` : 'Unknown';

    // Calculate monthly interest rate
    const monthlyInterestRate = loan.interestRate / 12 / 100;
    const principal = loan.principalAmount;
    const months = loan.tenureMonths;

    // Generate repayment schedule
    let remainingBalance = principal;
    const schedule = [];
    const startDate = new Date(loan.startDate);

    for (let month = 1; month <= months; month++) {
      const interestPayment = remainingBalance * monthlyInterestRate;
      const principalPayment = loan.monthlyDeduction - interestPayment;
      remainingBalance = Math.max(0, remainingBalance - principalPayment);

      const paymentDate = new Date(startDate);
      paymentDate.setMonth(startDate.getMonth() + month - 1);

      schedule.push({
        month,
        paymentDate: paymentDate.toISOString().split('T')[0],
        monthlyPayment: loan.monthlyDeduction.toFixed(2),
        principalPayment: principalPayment.toFixed(2),
        interestPayment: interestPayment.toFixed(2),
        remainingBalance: remainingBalance.toFixed(2),
      });
    }

    // Create CSV content
    const headers = ['Loan Repayment Schedule', '', '', '', '', ''];

    const loanDetails = [
      `Employee: ${employeeName}`,
      `Loan Type: ${loan.loanType.replace('_', ' ')}`,
      `Principal Amount: ₦${principal.toLocaleString()}`,
      `Interest Rate: ${loan.interestRate}% per annum`,
      `Tenure: ${months} months`,
      `Monthly Deduction: ₦${loan.monthlyDeduction.toLocaleString()}`,
      `Total Repayment: ₦${loan.totalRepayment.toLocaleString()}`,
      `Start Date: ${loan.startDate}`,
      `End Date: ${loan.endDate}`,
      `Status: ${loan.status}`,
      '',
      '',
    ];

    const scheduleHeaders = [
      'Month',
      'Payment Date',
      'Monthly Payment (₦)',
      'Principal Payment (₦)',
      'Interest Payment (₦)',
      'Remaining Balance (₦)',
    ];

    const csvContent = [
      headers.join(','),
      ...loanDetails.map((detail) => `"${detail}"`),
      scheduleHeaders.join(','),
      ...schedule.map((row) =>
        [row.month, row.paymentDate, row.monthlyPayment, row.principalPayment, row.interestPayment, row.remainingBalance].join(
          ',',
        ),
      ),
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Loan_Repayment_Schedule_${employeeName.replace(' ', '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleLoanSubmit = async (loanData) => {
    try {
      if (editingLoan) {
        await loanService.updateLoan(editingLoan.id, loanData);
      } else {
        await loanService.createLoan(loanData);
      }
      setShowLoanForm(false);
      setEditingLoan(null);
      loadData();
    } catch (error) {
      logger.error({ caller: 'Error saving loan:', payload: error });
      toast.error('Error', { description: error.message || 'Unable to complete your request. Kindly contact the system admin' });
    }
  };

  const handleEdit = (loan) => {
    setEditingLoan(loan);
    setShowLoanForm(true);
  };

  const handleCreate = () => {
    setEditingLoan(null);
    setShowLoanForm(true);
  };

  const getEmployeeName = (employeeId) => {
    const employee = employees.find((e) => e.id === employeeId);
    return employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown Employee';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-200 text-green-700';
      case 'paid_off':
        return 'bg-blue-100 text-blue-700';
      case 'pending_approval':
        return 'bg-yellow-100 text-yellow-700';
      case 'pending_disbursement':
        return 'bg-green-100 text-yellow-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const handleApproveLoan = async (loan) => {
    setActionLoading(true);
    try {
      await Loan.update(loan.id, {
        status: 'active',
        approvedBy: currentUser.fullName,
        approvedDate: new Date().toISOString().split('T')[0],
      });
      if (loan.employeeEmail) {
        await SendEmail({
          to: loan.employeeEmail,
          subject: 'Your Loan Request Has Been Approved',
          body: `<p>Dear ${loan.employeeName},</p><p>Your loan request for <strong>₦${loan.principal.toLocaleString()}</strong> has been approved. Deductions will commence from your next payroll.</p><p>Thank you.</p>`,
          fromName: 'Orbit360 Finance',
        });
      }
      loadData();
    } catch (error) {
      console.error('Failed to approve loan:', error);
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
        approvedBy: currentUser.fullName,
        approvedDate: new Date().toISOString().split('T')[0],
        rejectionReason: rejectionReason,
      });
      if (loanToReject.employeeEmail) {
        await SendEmail({
          to: loanToReject.employeeEmail,
          subject: 'Update on Your Loan Request',
          body: `<p>Dear ${loanToReject.employeeName},</p><p>We regret to inform you that your loan request for <strong>₦${loanToReject.principal.toLocaleString()}</strong> has been rejected.</p><p><strong>Reason:</strong> ${rejectionReason}</p><p>Thank you.</p>`,
          fromName: 'Orbit360 Finance',
        });
      }
      setLoanToReject(null);
      setRejectionReason('');
      loadData();
    } catch (error) {
      console.error('Failed to reject loan:', error);
    } finally {
      setActionLoading(false);
    }
  };

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
            <Button
              className="bg-gradient-to-r from-blue-700 to-blue-800 text-white shadow-lg shadow-blue-700/25"
              onClick={handleCreate}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Loan
            </Button>
          </div>
        </div>

        <LoanApprovalCard
          loans={pendingApprovals}
          onApprove={handleApproveLoan}
          onReject={setLoanToReject}
          loading={actionLoading}
        />

        <LoanForm
          key={editingLoan?.id ?? 'new'}
          loan={editingLoan}
          showForm={showLoanForm}
          employees={employees}
          onSubmit={handleLoanSubmit}
          onCancel={() => setShowLoanForm(false)}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Disbursed (Active)</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₦{totalLoaned.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Loans</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeLoans}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Paid Off Loans</CardTitle>
              <Banknote className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loans.filter((l) => l.status === 'paid_off').length}</div>
            </CardContent>
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
                {loans.map((loan) => (
                  <TableRow key={loan.id}>
                    <TableCell>{getEmployeeName(loan.employeeId)}</TableCell>
                    <TableCell className="capitalize">{loan.loanType?.replace('_', ' ')}</TableCell>
                    <TableCell>₦{loan.principal?.toLocaleString()}</TableCell>
                    <TableCell>₦{loan.monthlyDeduction?.toLocaleString()}</TableCell>
                    <TableCell>{new Date(loan.startDate).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(loan.endDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(loan.status)}>{loan.status.replace('_', ' ')}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(loan)}>
                          Edit
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => downloadRepaymentSchedule(loan)}>
                          <Download className="w-4 h-4 mr-1" />
                          Schedule
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteLoan(loan.id)}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {loans.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center h-24">
                      No loans found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={!!loanToReject}
        onOpenChange={() => {
          setLoanToReject(null);
          setRejectionReason('');
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Loan Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this loan request. The employee will be notified.
            </DialogDescription>
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
            <Button
              variant="outline"
              onClick={() => {
                setLoanToReject(null);
                setRejectionReason('');
              }}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRejectLoan} disabled={actionLoading || !rejectionReason}>
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
