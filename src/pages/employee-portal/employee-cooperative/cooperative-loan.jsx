import { loanService } from '@/api/loan.service';
import { LoanUtil } from '@/components/cooperative/loan.utils';
import { PaginationIconsOnly } from '@/components/shared/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { logger } from '@/utils';
import { Banknote, Download, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import EmployeeLoanForm from './loan-request-form';
import { getStatusColor } from '@/pages/authorization-center/authorization-center.util';

export function EmployeeCooperative() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLoanForm, setShowLoanForm] = useState(false);
  const [rows, setRows] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loanTypes, setLoanTypes] = useState([]);
  const [isCancelling, setIsCancelling] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const response = await loanService.getMyLoans({ rows, page: currentPage });
      setPages(response?.pagination?.pages);

      const enrichedLoans = response?.data?.map((loan) => {
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
      toast.error('Error', {
        description: error.message || 'Unable to load your loan history. Kindly contact the administrator.',
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, rows]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const loadLoanTypes = useCallback(async () => {
    try {
      const response = await loanService.getLoanTypes();
      setLoanTypes(response.data || []);
    } catch (error) {
      logger.error({ caller: 'Load loan types', payload: error });
      toast.error('Error', { description: error.message ?? 'Unable to load loan types' });
    }
  }, []);

  useEffect(() => {
    loadLoanTypes();
  }, [loadLoanTypes]);

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

  const cancelLoanRequest = async (loanId) => {
    setIsCancelling(true);
    try {
      await loanService.cancelLoanRequest(loanId);
      loadData();
    } catch (error) {
      logger.error({ caller: 'Cancel loan', payload: error });
      toast.error('Error', { description: error.message ?? 'Unable to cancel loan' });
    } finally {
      setIsCancelling(false);
    }
  };

  const handleCreate = () => {
    setShowLoanForm(true);
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
              <p className="text-gray-600">View and make loan requests.</p>
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
              Initiate new request
            </Button>
          </div>
        </div>
        {showLoanForm ? (
          <EmployeeLoanForm loanTypes={loanTypes} open={showLoanForm} onOpenChange={setShowLoanForm} onSuccess={loadData} />
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Requested Loans</CardTitle>
            <CardDescription>A list of all previously requested.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
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
                        {['PENDING_APPROVAL', 'PENDING_REVIEW'].includes(loan?.status?.toUpperCase()) ? (
                          <Button
                            variant="destructive"
                            disabled={isCancelling}
                            size="sm"
                            onClick={() => cancelLoanRequest(loan.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        ) : null}
                        {['ACTIVE'].includes(loan?.status?.toUpperCase()) ? (
                          <Button variant="outline" size="sm" onClick={() => downloadRepaymentSchedule(loan)}>
                            <Download className="w-4 h-4 mr-1" />
                            Schedule
                          </Button>
                        ) : null}
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

            {loans?.length ? (
              <div className="my-10">
                <PaginationIconsOnly
                  setCurrentPage={setCurrentPage}
                  setRows={setRows}
                  rows={rows}
                  pages={pages}
                  currentPage={currentPage}
                />
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
