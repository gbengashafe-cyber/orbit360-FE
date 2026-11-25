import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LoanUtil } from '../../components/cooperative/loan.utils';
import { EmployeeUtil } from './employee.utils';
import { formatDate } from '@/components/system';

export const EmployeeLoans = ({ employeeLoans, totalAnnualLoanDeduction, totalMonthlyLoanDeduction }) => {
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Active loans and deductions</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-100">
                <TableHead className="text-xs">Loan Type</TableHead>
                <TableHead className="text-xs">Principal</TableHead>
                <TableHead className="text-xs">Monthly Deduction</TableHead>
                <TableHead className="text-xs">Start Date</TableHead>
                <TableHead className="text-xs">End Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employeeLoans.map((loan) => (
                <TableRow key={loan.id}>
                  <TableCell className="text-xs capitalize">{loan.loanType?.replace('_', ' ')}</TableCell>
                  <TableCell className="text-xs">₦{EmployeeUtil.formatCurrency(loan.principalAmount)}</TableCell>
                  <TableCell className="text-xs font-semibold text-red-600">
                    ₦{EmployeeUtil.formatCurrency(LoanUtil.calculations(loan).monthlyDeduction)}
                  </TableCell>
                  <TableCell className="text-xs">{formatDate(loan.startDate)}</TableCell>
                  <TableCell className="text-xs">{formatDate(loan.endDate)}</TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-red-100 font-bold">
                <TableCell colSpan={2} className="text-sm">
                  Total Monthly Loan Deduction
                </TableCell>
                <TableCell className="text-sm text-red-700">₦{EmployeeUtil.formatCurrency(totalMonthlyLoanDeduction)}</TableCell>
                <TableCell colSpan={2} className="text-xs text-gray-600">
                  Annual: ₦{EmployeeUtil.formatCurrency(totalAnnualLoanDeduction)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
