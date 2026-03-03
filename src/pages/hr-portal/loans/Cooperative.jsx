import { loanService } from '@/api/loan.service';
import { LoanUtil } from '@/components/cooperative/loan.utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Banknote, Download, RefreshCw, TrendingUp, Users, ViewIcon } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { getStatusColor } from '../../authorization-center/authorization-center.util';
import { LoanForm } from './loan-form';

export default function Cooperative() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLoanForm, setShowLoanForm] = useState(false);
  const [editingLoan, setEditingLoan] = useState({ principalAmount: 0 });
  const [totalLoaned, setTotalLoaned] = useState(0);
  const [paidOff, setPaidOff] = useState(0);
  const [activeLoans, setActiveLoaned] = useState(0);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [loanDashboard, loansData] = await Promise.all([loanService.getLoanDashboard(), loanService.getLoans()]);

      setTotalLoaned(loanDashboard.data.activeLoanSum || 0);
      setPaidOff(loanDashboard.data.paidOffLoans || 0);
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
    } catch (error) {
      console.error('Error loading cooperative data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

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

  const handleEdit = (loan) => {
    setEditingLoan(loan);
    setShowLoanForm(true);
  };

  const getEmployeeName = (employee) => {
    return employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown';
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
              <p className="text-gray-600">Manage employee loans.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={loadData}>
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
        {showLoanForm ? (
          <LoanForm
            key={editingLoan?.id ?? 'new'}
            loan={editingLoan}
            showForm={showLoanForm}
            setShowForm={setShowLoanForm}
            onCancel={() => setShowLoanForm(false)}
            loadData={loadData}
          />
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
              <div className="text-2xl font-bold">{paidOff}</div>
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
                    <TableCell>{getEmployeeName(loan?.employee)}</TableCell>
                    <TableCell className="capitalize">{loan.loanType?.name?.toUpperCase()}</TableCell>
                    <TableCell>₦{loan.principalAmount?.toLocaleString()}</TableCell>
                    <TableCell>₦{loan.monthlyDeduction?.toLocaleString()}</TableCell>
                    <TableCell>{new Date(loan.startDate).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(loan.endDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(loan.status?.toLowerCase())}>{loan.status.replace('_', ' ')}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(loan)}>
                          <ViewIcon />
                          View
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => downloadRepaymentSchedule(loan)}>
                          <Download className="w-4 h-4 mr-1" />
                          Schedule
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
    </div>
  );
}
