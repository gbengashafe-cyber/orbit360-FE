import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calculator, DollarSign, Receipt } from "lucide-react";

// Nigerian PAYE Tax Brackets (2024)
const TAX_BRACKETS = [
  { min: 0, max: 300000, rate: 7 },
  { min: 300000, max: 600000, rate: 11 },
  { min: 600000, max: 1100000, rate: 15 },
  { min: 1100000, max: 1600000, rate: 19 },
  { min: 1600000, max: 3200000, rate: 21 },
  { min: 3200000, max: Infinity, rate: 24 }
];

export default function PayrollCalculator({ employee, onCalculate }) {
  const [salaryData, setSalaryData] = useState({
    // Convert annual to monthly automatically
    basic_salary: (employee?.annual_basic_salary || 0) / 12,
    housing_allowance: (employee?.annual_housing_allowance || 0) / 12,
    transport_allowance: (employee?.annual_transport_allowance || 0) / 12,
    leave_allowance: (employee?.annual_leave_allowance || 0) / 12,
    other_allowances: (employee?.annual_other_allowances || 0) / 12,
    pension_rate: employee?.pension_rate || 8,
    tax_relief: employee?.annual_tax_relief || 200000
  });

  const [calculation, setCalculation] = useState(null);

  const calculatePAYE = (annualIncome, taxRelief = 200000) => {
    const taxableIncome = Math.max(0, annualIncome - taxRelief);
    let tax = 0;
    let breakdown = [];

    for (const bracket of TAX_BRACKETS) {
      if (taxableIncome > bracket.min) {
        const taxableAtThisBracket = Math.min(taxableIncome - bracket.min, bracket.max - bracket.min);
        const taxAtThisBracket = (taxableAtThisBracket * bracket.rate) / 100;
        tax += taxAtThisBracket;
        
        if (taxableAtThisBracket > 0) {
          breakdown.push({
            range: `₦${bracket.min.toLocaleString()} - ${bracket.max === Infinity ? '∞' : '₦' + bracket.max.toLocaleString()}`,
            rate: `${bracket.rate}%`,
            taxableAmount: taxableAtThisBracket,
            tax: taxAtThisBracket
          });
        }
      }
    }

    return { tax, breakdown };
  };

  const calculatePayroll = () => {
    const basicSalary = parseFloat(salaryData.basic_salary) || 0;
    const housingAllowance = parseFloat(salaryData.housing_allowance) || 0;
    const transportAllowance = parseFloat(salaryData.transport_allowance) || 0;
    const leaveAllowance = parseFloat(salaryData.leave_allowance) || 0;
    const otherAllowances = parseFloat(salaryData.other_allowances) || 0;
    const pensionRate = parseFloat(salaryData.pension_rate) || 8;
    const taxRelief = parseFloat(salaryData.tax_relief) || 200000;

    // Calculate gross salary (monthly)
    const monthlyGross = basicSalary + housingAllowance + transportAllowance + leaveAllowance + otherAllowances;
    
    // Calculate annual gross for tax calculation
    const annualGross = monthlyGross * 12;
    
    // Calculate pension deduction (monthly)
    const pensionDeduction = (basicSalary * pensionRate) / 100;
    
    // Calculate PAYE tax (annual then monthly)
    const { tax: annualTax, breakdown: taxBreakdown } = calculatePAYE(annualGross, taxRelief);
    const monthlyTax = annualTax / 12;
    
    // Calculate total deductions and net salary
    const totalDeductions = pensionDeduction + monthlyTax;
    const netSalary = monthlyGross - totalDeductions;

    const result = {
      grossSalary: monthlyGross,
      basicSalary,
      allowances: {
        housing: housingAllowance,
        transport: transportAllowance,
        leave: leaveAllowance,
        other: otherAllowances,
        total: housingAllowance + transportAllowance + leaveAllowance + otherAllowances
      },
      deductions: {
        pension: pensionDeduction,
        tax: monthlyTax,
        total: totalDeductions
      },
      netSalary,
      taxBreakdown,
      annualGross,
      annualTax
    };

    setCalculation(result);
    if (onCalculate) onCalculate(result);
  };

  const handleInputChange = (field, value) => {
    setSalaryData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-xl shadow-gray-200/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-blue-700" />
            Monthly Payroll Calculator - Nigerian PAYE
          </CardTitle>
          <p className="text-sm text-gray-600">Values automatically calculated from annual compensation</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="basic_salary">Monthly Basic Salary (₦)</Label>
              <Input
                id="basic_salary"
                type="number"
                value={salaryData.basic_salary}
                onChange={(e) => handleInputChange("basic_salary", e.target.value)}
                placeholder="Monthly basic salary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="housing_allowance">Monthly Housing Allowance (₦)</Label>
              <Input
                id="housing_allowance"
                type="number"
                value={salaryData.housing_allowance}
                onChange={(e) => handleInputChange("housing_allowance", e.target.value)}
                placeholder="Monthly housing allowance"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="transport_allowance">Monthly Transport Allowance (₦)</Label>
              <Input
                id="transport_allowance"
                type="number"
                value={salaryData.transport_allowance}
                onChange={(e) => handleInputChange("transport_allowance", e.target.value)}
                placeholder="Monthly transport"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="leave_allowance">Monthly Leave Allowance (₦)</Label>
              <Input
                id="leave_allowance"
                type="number"
                value={salaryData.leave_allowance}
                onChange={(e) => handleInputChange("leave_allowance", e.target.value)}
                placeholder="Monthly leave allowance"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="other_allowances">Other Monthly Allowances (₦)</Label>
              <Input
                id="other_allowances"
                type="number"
                value={salaryData.other_allowances}
                onChange={(e) => handleInputChange("other_allowances", e.target.value)}
                placeholder="Other allowances"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pension_rate">Pension Rate (%)</Label>
              <Input
                id="pension_rate"
                type="number"
                value={salaryData.pension_rate}
                onChange={(e) => handleInputChange("pension_rate", e.target.value)}
                placeholder="8"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tax_relief">Annual Tax Relief (₦)</Label>
              <Input
                id="tax_relief"
                type="number"
                value={salaryData.tax_relief}
                onChange={(e) => handleInputChange("tax_relief", e.target.value)}
                placeholder="200000"
              />
            </div>
          </div>

          <Button onClick={calculatePayroll} className="w-full bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white">
            <Calculator className="w-4 h-4 mr-2" />
            Calculate Monthly Payroll
          </Button>
        </CardContent>
      </Card>

      {calculation && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Monthly Salary Breakdown */}
          <Card className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-xl shadow-gray-200/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                Monthly Salary Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Basic Salary:</span>
                  <span className="font-semibold">₦{calculation.basicSalary.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Housing Allowance:</span>
                  <span>₦{calculation.allowances.housing.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Transport Allowance:</span>
                  <span>₦{calculation.allowances.transport.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Leave Allowance:</span>
                  <span>₦{calculation.allowances.leave.toLocaleString()}</span>
                </div>
                {calculation.allowances.other > 0 && (
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Other Allowances:</span>
                    <span>₦{calculation.allowances.other.toLocaleString()}</span>
                  </div>
                )}
                <hr />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Gross Salary:</span>
                  <span className="text-green-600">₦{calculation.grossSalary.toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-2 border-t pt-4">
                <h4 className="font-semibold text-red-600">Deductions:</h4>
                <div className="flex justify-between text-sm">
                  <span>Pension ({salaryData.pension_rate}%):</span>
                  <span>₦{calculation.deductions.pension.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>PAYE Tax:</span>
                  <span>₦{calculation.deductions.tax.toLocaleString()}</span>
                </div>
                <hr />
                <div className="flex justify-between font-semibold">
                  <span>Total Deductions:</span>
                  <span className="text-red-600">₦{calculation.deductions.total.toLocaleString()}</span>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between font-bold text-xl">
                  <span>Net Salary:</span>
                  <Badge className="bg-blue-100 text-blue-700 text-lg px-4 py-2">
                    ₦{calculation.netSalary.toLocaleString()}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tax Breakdown */}
          <Card className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-xl shadow-gray-200/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-orange-600" />
                PAYE Tax Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span>Annual Gross:</span>
                  <span className="font-semibold">₦{calculation.annualGross.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax Relief:</span>
                  <span>₦{salaryData.tax_relief.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Taxable Income:</span>
                  <span>₦{(calculation.annualGross - salaryData.tax_relief).toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-3 border-t pt-4">
                <h4 className="font-semibold">Tax Calculation by Brackets:</h4>
                {calculation.taxBreakdown.map((bracket, index) => (
                  <div key={index} className="text-xs bg-gray-50 p-3 rounded">
                    <div className="flex justify-between mb-1">
                      <span className="font-medium">{bracket.range}</span>
                      <Badge variant="secondary">{bracket.rate}</Badge>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Taxable: ₦{bracket.taxableAmount.toLocaleString()}</span>
                      <span>Tax: ₦{bracket.tax.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between font-bold">
                  <span>Annual Tax:</span>
                  <span>₦{calculation.annualTax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-lg">
                  <span>Monthly Tax:</span>
                  <span className="text-orange-600">₦{calculation.deductions.tax.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}