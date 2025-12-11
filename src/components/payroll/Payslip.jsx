
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const Payslip = ({ payrollRecord, employee }) => {
  if (!payrollRecord || !employee) {
    return <div className="p-8 text-center">Loading payslip data...</div>;
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(value ?? 0);
  };
  
  const taxBreakdown = payrollRecord.tax_breakdown || {};

  return (
    <div className="bg-white p-8 sm:p-12 shadow-lg" id="payslip-content">
      <style>
        {`
          @media print {
            body * {
              visibility: hidden;
            }
            #payslip-content, #payslip-content * {
              visibility: visible;
            }
            #payslip-content {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
            .no-print {
              display: none;
            }
          }
        `}
      </style>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Payslip</h1>
          <p className="text-gray-500">For the period of {new Date(payrollRecord.pay_period).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
        </div>
        <div className="text-right">
          <h2 className="text-lg font-semibold text-blue-700">Orbit360</h2>
          <p className="text-xs text-gray-500">123 Innovation Drive, Lagos, Nigeria</p>
        </div>
      </div>

      <Separator className="my-4" />

      <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm mb-6">
        <div>
          <span className="font-semibold text-gray-600">Employee Name: </span>
          <span>{employee?.first_name} {employee?.last_name}</span>
        </div>
        <div>
          <span className="font-semibold text-gray-600">Employee ID: </span>
          <span>{employee?.employee_id}</span>
        </div>
        <div>
          <span className="font-semibold text-gray-600">Department: </span>
          <span>{employee?.department}</span>
        </div>
        <div>
          <span className="font-semibold text-gray-600">Position: </span>
          <span>{employee?.position}</span>
        </div>
        <div>
          <span className="font-semibold text-gray-600">Payment Date: </span>
          <span>{payrollRecord.payment_date ? new Date(payrollRecord.payment_date).toLocaleDateString() : 'N/A'}</span>
        </div>
         <div>
          <span className="font-semibold text-gray-600">Pay Period: </span>
          <span>{new Date(payrollRecord.pay_period).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Earnings */}
        <div>
          <h3 className="text-lg font-semibold border-b pb-2 mb-2 text-green-700">Earnings</h3>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between"><span>Basic Salary:</span> <span>{formatCurrency(payrollRecord.basic_salary)}</span></div>
            <div className="flex justify-between"><span>Housing Allowance:</span> <span>{formatCurrency(payrollRecord.housing_allowance)}</span></div>
            <div className="flex justify-between"><span>Transport Allowance:</span> <span>{formatCurrency(payrollRecord.transport_allowance)}</span></div>
            <div className="flex justify-between"><span>Leave Allowance:</span> <span>{formatCurrency(payrollRecord.medical_allowance)}</span></div>
            <div className="flex justify-between"><span>Other Allowances:</span> <span>{formatCurrency(payrollRecord.other_allowances)}</span></div>
            <Separator className="my-2"/>
            <div className="flex justify-between font-bold text-base"><span>Gross Salary:</span> <span>{formatCurrency(payrollRecord.gross_salary)}</span></div>
          </div>
        </div>
        
        {/* Deductions */}
        <div>
          <h3 className="text-lg font-semibold border-b pb-2 mb-2 text-red-700">Deductions</h3>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Pension ({taxBreakdown.pension_rate || employee.pension_rate || 8}%):</span>
              <span>{formatCurrency(payrollRecord.pension_deduction)}</span>
            </div>
            {(taxBreakdown.nhf_applicable !== undefined ? taxBreakdown.nhf_applicable : employee.nhf_applicable) && (
              <div className="flex justify-between">
                <span>NHF ({taxBreakdown.nhf_rate || employee.nhf_rate || 2.5}%):</span>
                <span>{formatCurrency(payrollRecord.nhf_deduction)}</span>
              </div>
            )}
            {payrollRecord.loan_deduction > 0 && (
                 <div className="flex justify-between">
                    <span>Loan Repayment:</span>
                    <span>{formatCurrency(payrollRecord.loan_deduction)}</span>
                </div>
            )}
            <div className="flex justify-between"><span>PAYE Tax:</span> <span>{formatCurrency(payrollRecord.paye_tax)}</span></div>
            <Separator className="my-2"/>
            <div className="flex justify-between font-bold text-base"><span>Total Deductions:</span> <span>{formatCurrency(payrollRecord.total_deductions)}</span></div>
          </div>
        </div>
      </div>

      <Separator className="my-6" />

      {/* Net Pay */}
      <div className="text-right">
        <p className="text-gray-600 font-semibold">NET PAY</p>
        <p className="text-3xl font-bold text-gray-900">{formatCurrency(payrollRecord.net_salary)}</p>
      </div>
      
      <Separator className="my-6" />

      {/* Tax Calculation Summary */}
      {taxBreakdown && (
        <div>
          <h3 className="text-lg font-semibold mb-2">Tax Calculation Summary (Annualised)</h3>
          <div className="text-xs text-gray-600 bg-gray-50 p-4 rounded-lg space-y-1">
            <div className="flex justify-between"><span>Annual Gross Income:</span> <span>{formatCurrency(taxBreakdown.annual_gross)}</span></div>
            <Separator className="my-1"/>
            <div className="flex justify-between text-red-600"><span>Less: Consolidated Relief Allowance:</span> <span>({formatCurrency(taxBreakdown.consolidated_relief)})</span></div>
            <div className="flex justify-between text-red-600"><span>Less: Pension Contribution:</span> <span>({formatCurrency(taxBreakdown.annual_pension_deduction)})</span></div>
            <div className="flex justify-between text-red-600"><span>Less: NHF Contribution:</span> <span>({formatCurrency(taxBreakdown.annual_nhf_deduction)})</span></div>
            <Separator className="my-1"/>
            <div className="flex justify-between font-bold"><span>Annual Taxable Income:</span> <span>{formatCurrency(taxBreakdown.taxable_income)}</span></div>
            <div className="flex justify-between font-bold text-green-700"><span>Total Annual Tax (PAYE):</span> <span>{formatCurrency(taxBreakdown.annual_tax)}</span></div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Payslip;
