import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';
import { EmployeeUtil } from './employee.utils';

export const TaxBreakdown = ({ employee, totalGrossPay, annualPensionDeduction, annualNHFDeduction, annualPAYEData }) => {
  return (
    <Card className="mt-6 border-blue-200 shadow-lg bg-blue-50/30">
      <CardHeader className="bg-gradient-to-r from-blue-700 to-blue-800 text-white rounded-t-lg">
        <CardTitle className="flex items-center text-white">
          Annual Tax Calculation Summary (2026 Tax Law)
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="w-4 h-4 ml-2 text-blue-100 cursor-pointer" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Taxable Income = Gross - (CRA + Pension + NHF)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 gap-x-8 gap-y-14">
          <div className="space-y-3 text-sm">
            <h4 className="font-semibold text-base mb-4 text-gray-800">Income & Deductions Breakdown</h4>
            <div className="flex justify-between py-1">
              <span className="font-medium">Total Annual Gross Pay:</span>{' '}
              <span className="font-semibold">₦{EmployeeUtil.formatCurrency(totalGrossPay)}</span>
            </div>
            {employee.pensionApplicable !== false && (
              <div className="flex justify-between text-red-600 py-1">
                <span>Less: Annual Pension (8%):</span> <span>(₦{EmployeeUtil.formatCurrency(annualPensionDeduction)})</span>
              </div>
            )}
            {employee.nhfApplicable && (
              <div className="flex justify-between text-red-600 py-1">
                <span>Less: Annual NHF (2.5%):</span> <span>(₦{EmployeeUtil.formatCurrency(annualNHFDeduction)})</span>
              </div>
            )}
            {employee.annualRentAmount && (
              <div className="flex justify-between text-red-600 py-1">
                <span>Less: Rent Relief (Max 500k):</span>{' '}
                <span>(₦{EmployeeUtil.formatCurrency(EmployeeUtil.calculateRentRelief(employee.annualRentAmount))})</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base border-t-2 pt-3 mt-3 text-blue-900">
              <span>Annual Taxable Income:</span>
              <span>₦{EmployeeUtil.formatCurrency(annualPAYEData.taxableIncome)}</span>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-base mb-4 text-gray-800">Tax Bands & Computation (2026)</h4>
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-100">
                  <TableHead className="text-xs font-semibold">Band</TableHead>
                  <TableHead className="text-xs font-semibold">Description</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Amount</TableHead>
                  <TableHead className="text-xs font-semibold text-center">Rate</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Tax</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {annualPAYEData.breakdown.map((item, index) => (
                  <TableRow key={index} className="hover:bg-gray-50">
                    <TableCell className="text-xs font-medium">{item.band}</TableCell>
                    <TableCell className="text-xs">{item.tier}</TableCell>
                    <TableCell className="text-xs text-right">₦{EmployeeUtil.formatCurrency(item.taxablePortion)}</TableCell>
                    <TableCell className="text-xs text-center font-medium">{item.rate}</TableCell>
                    <TableCell className="text-xs text-right font-semibold">₦{EmployeeUtil.formatCurrency(item.tax)}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-blue-100 font-bold border-t-2">
                  <TableCell colSpan={4} className="text-sm py-3">
                    Total Annual PAYE Tax
                  </TableCell>
                  <TableCell className="text-right text-sm py-3">₦{EmployeeUtil.formatCurrency(annualPAYEData.tax)}</TableCell>
                </TableRow>
                <TableRow className="bg-green-100 font-bold border-t-2">
                  <TableCell colSpan={4} className="text-sm py-3 text-green-800">
                    Monthly PAYE Tax
                    <div className="text-xs font-normal text-gray-600 mt-1">
                      (₦{EmployeeUtil.formatCurrency(annualPAYEData.tax)} ÷ 12)
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-sm py-3 text-green-800">
                    ₦{EmployeeUtil.formatCurrency(annualPAYEData.tax / 12)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
