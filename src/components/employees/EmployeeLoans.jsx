import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LoanUtil } from '../cooperative/loan.utils';
import { EmployeeUtil } from './employee.utils';

const EmployeeLoans = ({ employeeLoans, totalAnnualLoanDeduction, totalMonthlyLoanDeduction }) => {
  return (
    <Card className="mt-6 border-orange-200 shadow-lg bg-orange-50/30">
      <CardHeader className="bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-t-lg">
        <CardTitle className="text-white">Active Loans & Deductions</CardTitle>
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
                  <TableCell className="text-xs">{new Date(loan.startDate).toLocaleDateString()}</TableCell>
                  <TableCell className="text-xs">{new Date(loan.endDate).toLocaleDateString()}</TableCell>
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

export default EmployeeLoans;
