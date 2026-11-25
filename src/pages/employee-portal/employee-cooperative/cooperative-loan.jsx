import { loanService } from '@/api/loan.service';
import { LoanUtil } from '@/components/cooperative/loan.utils';
import { PaginationIconsOnly } from '@/components/shared/pagination';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader, StatusBadge, formatCurrency, formatDate } from '@/components/system';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { logger } from '@/utils';
import { RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import LoanRequestCancellationDialog from './loan-cancellation-dialog';
import EmployeeLoanForm from './loan-request-form';

export function EmployeeCooperative() {
  const [loans, setLoans] = useState([]);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLoanForm, setShowLoanForm] = useState(false);
  const [showCancellationModal, setShowCancellationModal] = useState(false);
  const [rows, setRows] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loanTypes, setLoanTypes] = useState([]);

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
      logger.error({ caller: 'Load employee loan data', payload: error });
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

  const handleCreate = () => {
    setShowLoanForm(true);
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading loan requests…</div>;
  }

  return (
    <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
      <div className="space-y-6">
        <PageHeader title="Cooperative / thrift and loans" description="View and make loan requests." actions={<div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={loadData}>
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button onClick={handleCreate}>Initiate new request</Button>
          </div>} />
        {showLoanForm ? (
          <EmployeeLoanForm
            loan={selectedLoan}
            loanTypes={loanTypes}
            open={showLoanForm}
            onOpenChange={() => {
              setShowLoanForm(false);
              setSelectedLoan(null);
            }}
            onSuccess={() => {
              setSelectedLoan();
              loadData();
            }}
          />
        ) : null}

        {showCancellationModal ? (
          <LoanRequestCancellationDialog
            loan={selectedLoan}
            open={showCancellationModal}
            onOpenChange={() => {
              setShowCancellationModal(false);
              setSelectedLoan(null);
            }}
            onSuccess={() => {
              setShowCancellationModal(false);
              loadData();
            }}
          />
        ) : null}

        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Principal</TableHead>
                  <TableHead>Monthly Deduction</TableHead>
                  <TableHead>Request Date</TableHead>
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
                    <TableCell className="text-right tabular-nums">{formatCurrency(loan.principalAmount)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatCurrency(loan.monthlyDeduction)}</TableCell>
                    <TableCell>{formatDate(loan?.createdAt)}</TableCell>
                    <TableCell>{formatDate(loan.startDate)}</TableCell>
                    <TableCell>{formatDate(loan.endDate)}</TableCell>
                    <TableCell><StatusBadge status={loan.status} /></TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedLoan(loan);
                            setShowLoanForm(true);
                          }}
                        >
                          View
                        </Button>
                        {['PENDING_APPROVAL', 'PENDING_REVIEW'].includes(loan?.status?.toUpperCase()) ? (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setSelectedLoan(loan);
                              setShowCancellationModal(true);
                            }}
                          >
                            Cancel
                          </Button>
                        ) : null}
                        {['ACTIVE'].includes(loan?.status?.toUpperCase()) ? (
                          <Button variant="outline" size="sm" onClick={() => downloadRepaymentSchedule(loan)}>Schedule</Button>
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
