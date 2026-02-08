import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmployeeUtil } from './employee.utils';

export const SalaryBreakdown = ({
  formData,
  totalMonthlyLoanDeduction,
  monthlyGross,
  monthlyNetSalary,
  monthlyTax,
  monthlyPension,
  monthlyNHF,
  totalAnnualLoanDeduction,
  totalGrossPay,
  annualNetSalary,
  annualPAYEData,
  annualNHFDeduction,
  annualPensionDeduction,
}) => {
  return (
    <Card className="mt-6 border-green-200 shadow-lg bg-green-50/30">
      <CardHeader className="bg-gradient-to-r from-green-700 to-green-800 text-white rounded-t-lg">
        <CardTitle className="text-white">Net Salary Computation</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h4 className="font-semibold text-base mb-3 text-gray-800">Monthly Net Salary</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-1 text-green-700">
                <span className="font-medium">Gross Salary:</span>{' '}
                <span className="font-semibold">₦{EmployeeUtil.formatCurrency(monthlyGross)}</span>
              </div>
              <div className="border-t pt-2 space-y-1 text-red-600">
                {formData.pensionApplicable !== false && (
                  <div className="flex justify-between">
                    <span>Less: Pension (8%):</span> <span>(₦{EmployeeUtil.formatCurrency(monthlyPension)})</span>
                  </div>
                )}
                {formData.nhfApplicable && (
                  <div className="flex justify-between">
                    <span>Less: NHF (2.5%):</span> <span>(₦{EmployeeUtil.formatCurrency(monthlyNHF)})</span>
                  </div>
                )}
                {totalMonthlyLoanDeduction > 0 && (
                  <div className="flex justify-between font-semibold">
                    <span>Less: Loan Deduction:</span> <span>(₦{EmployeeUtil.formatCurrency(totalMonthlyLoanDeduction)})</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Less: PAYE Tax:</span> <span>(₦{EmployeeUtil.formatCurrency(monthlyTax)})</span>
                </div>
              </div>
              <div className="flex justify-between font-bold text-lg border-t-2 pt-3 text-green-800">
                <span>Monthly Net Salary:</span>
                <span>₦{EmployeeUtil.formatCurrency(monthlyNetSalary)}</span>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <h4 className="font-semibold text-base mb-3 text-gray-800">Annual Net Salary</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-1 text-green-700">
                <span className="font-medium">Annual Gross:</span>{' '}
                <span className="font-semibold">₦{EmployeeUtil.formatCurrency(totalGrossPay)}</span>
              </div>
              <div className="border-t pt-2 space-y-1 text-red-600">
                {formData.pensionApplicable !== false && (
                  <div className="flex justify-between">
                    <span>Less: Pension:</span> <span>(₦{EmployeeUtil.formatCurrency(annualPensionDeduction)})</span>
                  </div>
                )}
                {formData.nhfApplicable && (
                  <div className="flex justify-between">
                    <span>Less: NHF:</span> <span>(₦{EmployeeUtil.formatCurrency(annualNHFDeduction)})</span>
                  </div>
                )}
                {totalAnnualLoanDeduction > 0 && (
                  <div className="flex justify-between font-semibold">
                    <span>Less: Loan Deduction:</span> <span>(₦{EmployeeUtil.formatCurrency(totalAnnualLoanDeduction)})</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Less: PAYE Tax:</span> <span>(₦{EmployeeUtil.formatCurrency(annualPAYEData.tax)})</span>
                </div>
              </div>
              <div className="flex justify-between font-bold text-lg border-t-2 pt-3 text-green-800">
                <span>Annual Net Salary:</span>
                <span>₦{EmployeeUtil.formatCurrency(annualNetSalary)}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
