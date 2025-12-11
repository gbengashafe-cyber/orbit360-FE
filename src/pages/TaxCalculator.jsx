import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calculator, DollarSign, Receipt, FileText } from "lucide-react";

// Nigerian PAYE Tax Brackets (2024)
const TAX_BRACKETS = [
  { min: 0, max: 300000, rate: 7 },
  { min: 300000, max: 600000, rate: 11 },
  { min: 600000, max: 1100000, rate: 15 },
  { min: 1100000, max: 1600000, rate: 19 },
  { min: 1600000, max: 3200000, rate: 21 },
  { min: 3200000, max: Infinity, rate: 24 }
];

export default function TaxCalculator() {
  const [formData, setFormData] = useState({
    annualSalary: "",
    pensionContribution: "",
    nhfContribution: "",
    lifeAssurance: "",
    nhisContribution: ""
  });

  const [calculation, setCalculation] = useState(null);

  const calculateTax = () => {
    const annualSalary = parseFloat(formData.annualSalary) || 0;
    const pensionContribution = parseFloat(formData.pensionContribution) || 0;
    const nhfContribution = parseFloat(formData.nhfContribution) || 0;
    const lifeAssurance = parseFloat(formData.lifeAssurance) || 0;
    const nhisContribution = parseFloat(formData.nhisContribution) || 0;

    const twentyPercentOfSalary = annualSalary * 0.2;
    const onePercentOfSalary = annualSalary * 0.01;
    const higherAmount = Math.max(200000, onePercentOfSalary);
    const consolidatedRelief = twentyPercentOfSalary + higherAmount;

    const totalDeductions = pensionContribution + nhfContribution + lifeAssurance + nhisContribution + consolidatedRelief;
    const taxableIncome = Math.max(0, annualSalary - totalDeductions);
    
    let totalTax = 0;
    let taxBreakdown = [];
    let incomeLeft = taxableIncome;

    if (incomeLeft > 0) {
        let band = Math.min(incomeLeft, 300000);
        let bandTax = band * 0.07;
        totalTax += bandTax;
        taxBreakdown.push({ range: "First ₦300,000", rate: "7%", taxableAmount: band, tax: bandTax });
        incomeLeft -= band;
    }
    if (incomeLeft > 0) {
        let band = Math.min(incomeLeft, 300000);
        let bandTax = band * 0.11;
        totalTax += bandTax;
        taxBreakdown.push({ range: "Next ₦300,000", rate: "11%", taxableAmount: band, tax: bandTax });
        incomeLeft -= band;
    }
    if (incomeLeft > 0) {
        let band = Math.min(incomeLeft, 500000);
        let bandTax = band * 0.15;
        totalTax += bandTax;
        taxBreakdown.push({ range: "Next ₦500,000", rate: "15%", taxableAmount: band, tax: bandTax });
        incomeLeft -= band;
    }
    if (incomeLeft > 0) {
        let band = Math.min(incomeLeft, 500000);
        let bandTax = band * 0.19;
        totalTax += bandTax;
        taxBreakdown.push({ range: "Next ₦500,000", rate: "19%", taxableAmount: band, tax: bandTax });
        incomeLeft -= band;
    }
    if (incomeLeft > 0) {
        let band = Math.min(incomeLeft, 1600000);
        let bandTax = band * 0.21;
        totalTax += bandTax;
        taxBreakdown.push({ range: "Next ₦1,600,000", rate: "21%", taxableAmount: band, tax: bandTax });
        incomeLeft -= band;
    }
    if (incomeLeft > 0) {
        let band = incomeLeft;
        let bandTax = band * 0.24;
        totalTax += bandTax;
        taxBreakdown.push({ range: "Above ₦3,200,000", rate: "24%", taxableAmount: band, tax: bandTax });
    }

    const netAnnualIncome = annualSalary - totalTax - pensionContribution - nhfContribution - lifeAssurance - nhisContribution;
    const monthlyNetIncome = netAnnualIncome / 12;
    const monthlyTax = totalTax / 12;

    setCalculation({
      annualSalary,
      taxableIncome,
      totalTax,
      netAnnualIncome,
      monthlyNetIncome,
      monthlyTax,
      taxBreakdown,
      deductions: {
        taxRelief: consolidatedRelief,
        pensionContribution,
        nhfContribution,
        lifeAssurance,
        nhisContribution,
        total: totalDeductions
      },
      consolidatedReliefBreakdown: {
        twentyPercent: twentyPercentOfSalary,
        onePercent: onePercentOfSalary,
        higherAmount: higherAmount,
        total: consolidatedRelief
      }
    });
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const formatCurrency = (value) => {
    return (value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="p-4 lg:p-8 min-h-screen" style={{ backgroundColor: '#F5F5F5' }}>
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-700 to-blue-800 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-700/25">
              <Calculator className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Nigerian PAYE Tax Calculator</h1>
              <p className="text-gray-700">Calculate income tax and deductions based on Nigerian tax law</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <Card className="bg-white/95 backdrop-blur-sm border-gray-300 shadow-xl" style={{ boxShadow: '0 10px 30px rgba(189, 195, 199, 0.3)' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-700" />
                Income & Deductions Calculator
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="annualSalary">Annual Gross Salary (₦) *</Label>
                <Input
                  id="annualSalary"
                  type="number"
                  value={formData.annualSalary}
                  onChange={(e) => handleInputChange("annualSalary", e.target.value)}
                  placeholder="5000000"
                  className="border-gray-300"
                />
              </div>
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-800">Allowable Deductions</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="pensionContribution">Pension Contribution (₦)</Label>
                  <Input
                    id="pensionContribution"
                    type="number"
                    value={formData.pensionContribution}
                    onChange={(e) => handleInputChange("pensionContribution", e.target.value)}
                    placeholder="400000"
                    className="border-gray-300"
                  />
                  <p className="text-xs text-gray-600">e.g., 8% of Basic + Housing + Transport</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nhfContribution">NHF Contribution (₦)</Label>
                  <Input
                    id="nhfContribution"
                    type="number"
                    value={formData.nhfContribution}
                    onChange={(e) => handleInputChange("nhfContribution", e.target.value)}
                    placeholder="25000"
                    className="border-gray-300"
                  />
                  <p className="text-xs text-gray-600">e.g., 2.5% of Basic Salary</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lifeAssurance">Life Assurance Premium (₦)</Label>
                  <Input
                    id="lifeAssurance"
                    type="number"
                    value={formData.lifeAssurance}
                    onChange={(e) => handleInputChange("lifeAssurance", e.target.value)}
                    placeholder="50000"
                    className="border-gray-300"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nhisContribution">NHIS Contribution (₦)</Label>
                  <Input
                    id="nhisContribution"
                    type="number"
                    value={formData.nhisContribution}
                    onChange={(e) => handleInputChange("nhisContribution", e.target.value)}
                    placeholder="15000"
                    className="border-gray-300"
                  />
                </div>
              </div>

              <Button onClick={calculateTax} className="w-full bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white">
                <Calculator className="w-4 h-4 mr-2" />
                Calculate Tax
              </Button>
            </CardContent>
          </Card>

          {calculation && (
            <div className="space-y-6">
              <Card className="bg-white/95 backdrop-blur-sm border-gray-300 shadow-xl" style={{ boxShadow: '0 10px 30px rgba(189, 195, 199, 0.3)' }}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-purple-600" />
                    Consolidated Relief Allowance (CRA) Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                      <div className="text-center">
                        <div className="font-medium text-gray-700">Annual Salary</div>
                        <div className="text-purple-800 font-bold">₦{formatCurrency(calculation.annualSalary)}</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-gray-700">20% of Salary</div>
                        <div className="text-purple-800 font-bold">₦{formatCurrency(calculation.consolidatedReliefBreakdown.twentyPercent)}</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-gray-700">Higher Amount</div>
                        <div className="text-purple-800 font-bold">₦{formatCurrency(calculation.consolidatedReliefBreakdown.higherAmount)}</div>
                        <div className="text-xs text-gray-500">Max of (₦200k or 1%)</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-gray-700">Total CRA</div>
                        <div className="text-purple-800 font-bold text-lg">₦{formatCurrency(calculation.consolidatedReliefBreakdown.total)}</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/95 backdrop-blur-sm border-gray-300 shadow-xl" style={{ boxShadow: '0 10px 30px rgba(189, 195, 199, 0.3)' }}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    Tax Calculation Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">Annual Gross Salary</p>
                      <p className="text-xl font-bold text-gray-900">₦{formatCurrency(calculation.annualSalary)}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">Taxable Income</p>
                      <p className="text-xl font-bold text-blue-700">₦{formatCurrency(calculation.taxableIncome)}</p>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <p className="text-sm text-gray-600">Annual Tax</p>
                        <p className="text-xl font-bold text-red-600">₦{formatCurrency(calculation.totalTax)}</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-gray-600">Monthly Tax</p>
                        <p className="text-xl font-bold text-red-600">₦{formatCurrency(calculation.monthlyTax)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <p className="text-sm text-gray-600">Net Annual Income</p>
                        <p className="text-2xl font-bold text-green-600">₦{formatCurrency(calculation.netAnnualIncome)}</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-gray-600">Net Monthly Income</p>
                        <p className="text-2xl font-bold text-green-600">₦{formatCurrency(calculation.monthlyNetIncome)}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/95 backdrop-blur-sm border-gray-300 shadow-xl" style={{ boxShadow: '0 10px 30px rgba(189, 195, 199, 0.3)' }}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-orange-600" />
                    PAYE Tax Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {calculation.taxBreakdown.map((bracket, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-gray-900">{bracket.range}</span>
                        <Badge variant="secondary">{bracket.rate}</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>
                          <p>Taxable Amount: ₦{formatCurrency(bracket.taxableAmount)}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">Tax: ₦{formatCurrency(bracket.tax)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <div className="border-t border-gray-300 pt-4">
                    <div className="flex justify-between items-center font-bold text-lg">
                      <span>Total PAYE Tax:</span>
                      <span className="text-red-600">₦{formatCurrency(calculation.totalTax)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}