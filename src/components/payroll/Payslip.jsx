import { Separator } from '@/components/ui/separator';
import { EmployeeUtil } from '@/pages/employees/employee.utils';

const Payslip = ({ payrollRecord, employee }) => {
  if (!payrollRecord || !employee) {
    return <div className="p-8 text-center">Loading payslip data...</div>;
  }

  return (
    <div className="p-8 sm:p-12 print:px-6 print:py-6 print:shadow-none print:drop-shadow-none" id="payslip-content">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Payslip</h1>
          <p className="text-gray-500">
            For the period of {new Date(payrollRecord.payPeriod).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="text-right">
          <h2 className="text-lg font-semibold text-blue-700">Orbit360</h2>
          <p className="text-xs text-gray-500">123 Innovation Drive, Lagos, Nigeria</p>
        </div>
      </div>

      <Separator className="my-4" />

      <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm mb-16">
        <div>
          <span className="font-semibold text-gray-600 min-w-[130px] inline-block">Employee Name: </span>
          <span>
            {employee?.firstName} {employee?.lastName}
          </span>
        </div>
        <div>
          <span className="font-semibold text-gray-600 min-w-[130px] inline-block">Staff ID: </span>
          <span>{employee?.staffId}</span>
        </div>
        <div>
          <span className="font-semibold text-gray-600 min-w-[130px] inline-block">Department: </span>
          <span>{employee?.departmentName}</span>
        </div>
        <div>
          <span className="font-semibold text-gray-600 min-w-[130px] inline-block">Job Role: </span>
          <span>{employee?.jobRole?.replace('_', ' ')}</span>
        </div>
        {/* <div>
          <span className="font-semibold text-gray-600 min-w-[130px] inline-block">Payment Date: </span>
          <span>{payrollRecord.paymentDate ? new Date(payrollRecord.paymentDate).toLocaleDateString() : 'N/A'}</span>
        </div> */}
        <div>
          <span className="font-semibold text-gray-600 min-w-[130px] inline-block">Pay Period: </span>
          <span>{new Date(payrollRecord.payPeriod).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-8">
        {/* Earnings */}
        <div>
          <h3 className="text-lg font-semibold border-b pb-2 mb-2 text-green-700">Earnings</h3>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Basic Salary:</span> <span>{EmployeeUtil.formatCurrency(payrollRecord.basicSalary)}</span>
            </div>
            <div className="flex justify-between">
              <span>Housing Allowance:</span> <span>{EmployeeUtil.formatCurrency(payrollRecord.housingAllowance)}</span>
            </div>
            <div className="flex justify-between">
              <span>Transport Allowance:</span> <span>{EmployeeUtil.formatCurrency(payrollRecord.transportAllowance)}</span>
            </div>
            <div className="flex justify-between">
              <span>Leave Allowance:</span> <span>{EmployeeUtil.formatCurrency(payrollRecord.leaveAllowance)}</span>
            </div>
            <div className="flex justify-between">
              <span>Other Allowances:</span> <span>{EmployeeUtil.formatCurrency(payrollRecord.otherAllowance)}</span>
            </div>
            {/*{taxBreakdown.thirteenth_month_payment > 0 && (
              <div className="flex justify-between text-green-700 font-semibold">
                <span>13th Month Bonus (Dec):</span> <span>{EmployeeUtil.formatCurrency(taxBreakdown.thirteenth_month_payment)}</span>
              </div>
            )} */}
            <Separator className="my-2" />
            <div className="flex justify-between font-bold text-base">
              <span>Gross Salary:</span> <span>{EmployeeUtil.formatCurrency(payrollRecord.grossSalary)}</span>
            </div>
          </div>
        </div>

        <div className="grid gap-y-6">
          <div>
            <h3 className="text-lg font-semibold border-b pb-2 mb-2 text-gray-700">Reliefs</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Rent Relief:</span>
                <span>{EmployeeUtil.formatCurrency(payrollRecord.rentRelief)}</span>
              </div>

              <Separator className="my-2" />
              <div className="flex justify-between font-bold text-base">
                <span>Total Relief:</span> <span>{EmployeeUtil.formatCurrency(payrollRecord.rentRelief)}</span>
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold border-b pb-2 mb-2 text-red-700">Deductions</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Pension ({8}%):</span>
                <span>{EmployeeUtil.formatCurrency(payrollRecord.pensionDeduction)}</span>
              </div>
              {employee.nhfApplicable && (
                <div className="flex justify-between">
                  <span>NHF ({2.5}%):</span>
                  <span>{EmployeeUtil.formatCurrency(payrollRecord.nhfDeduction)}</span>
                </div>
              )}
              {payrollRecord.loanDeduction > 0 && (
                <div className="flex justify-between">
                  <span>Loan Repayment:</span>
                  <span>{EmployeeUtil.formatCurrency(payrollRecord.loanDeduction)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>PAYE Tax:</span> <span>{EmployeeUtil.formatCurrency(payrollRecord.payeDeduction)}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between font-bold text-base">
                <span>Total Deductions:</span> <span>{EmployeeUtil.formatCurrency(payrollRecord.totalDeductions)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Separator className="my-6" />

      {/* Net Pay */}
      <div className="text-right">
        <p className="text-gray-600 font-semibold">NET PAY</p>
        <p className="text-3xl font-bold text-gray-900">{EmployeeUtil.formatCurrency(payrollRecord.netSalary)}</p>
      </div>

      {/* <Separator className="my-6" /> */}

      {/* Tax Calculation Summary */}
      {/* {taxBreakdown && (
        <div>
          <h3 className="text-lg font-semibold mb-2">Tax Calculation Summary (Annualised)</h3>
          <div className="text-xs text-gray-600 bg-gray-50 p-4 rounded-lg space-y-1">
            <div className="flex justify-between">
              <span>Annual Gross Income:</span> <span>{formatCurrency(taxBreakdown.annual_gross)}</span>
            </div>
            <Separator className="my-1" />
            <div className="flex justify-between text-red-600">
              <span>Less: Consolidated Relief Allowance:</span> <span>({formatCurrency(taxBreakdown.consolidated_relief)})</span>
            </div>
            <div className="flex justify-between text-red-600">
              <span>Less: Pension Contribution:</span> <span>({formatCurrency(taxBreakdown.annual_pension_deduction)})</span>
            </div>
            <div className="flex justify-between text-red-600">
              <span>Less: NHF Contribution:</span> <span>({formatCurrency(taxBreakdown.annual_nhf_deduction)})</span>
            </div>
            <Separator className="my-1" />
            <div className="flex justify-between font-bold">
              <span>Annual Taxable Income:</span> <span>{formatCurrency(taxBreakdown.taxable_income)}</span>
            </div>
            <div className="flex justify-between font-bold text-green-700">
              <span>Total Annual Tax (PAYE):</span> <span>{formatCurrency(taxBreakdown.annual_tax)}</span>
            </div>
          </div>
        </div>
      )} */}
    </div>
  );
};

export default Payslip;
