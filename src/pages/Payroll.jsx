
import React, { useState, useEffect } from "react";
import { Employee, PayrollRecord, Loan, LoanPayment } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CreditCard, Users, Calculator, Plus, DollarSign, Receipt, Download, FileText, Calendar, Printer } from "lucide-react";

import PayrollGenerator from "../components/payroll/PayrollGenerator";
import Payslip from "../components/payroll/Payslip";

// Nigerian PAYE Tax Brackets (2024) - UPDATED AND VERIFIED
const TAX_BRACKETS = [
  { min: 0, max: 300000, rate: 7 },
  { min: 300000, max: 600000, rate: 11 },
  { min: 600000, max: 1100000, rate: 15 },
  { min: 1100000, max: 1600000, rate: 19 },
  { min: 1600000, max: 3200000, rate: 21 },
  { min: 3200000, max: Infinity, rate: 24 }
];

export default function Payroll() {
  const [employees, setEmployees] = useState([]);
  const [payrollRecords, setPayrollRecords] = useState([]);
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showGenerator, setShowGenerator] = useState(false);
  const [currentPeriod, setCurrentPeriod] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [generatingPayroll, setGeneratingPayroll] = useState(false);
  const [viewingPayslip, setViewingPayslip] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [employeesData, payrollData, loansData] = await Promise.all([
        Employee.list(),
        PayrollRecord.list('-created_date'),
        Loan.list()
      ]);
      setEmployees(employeesData);
      setPayrollRecords(payrollData);
      setLoans(loansData);
    } catch (error) {
      console.error('Error loading payroll data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculatePAYE = (annualIncome, annualPension, annualNhf, consolidatedRelief) => {
    // This function now uses the consolidated relief passed from the employee record
    const taxableIncome = parseFloat(Math.max(0, annualIncome - consolidatedRelief - annualPension - annualNhf).toFixed(2));

    let tax = 0;
    let taxBreakdown = [];
    let incomeLeft = taxableIncome;

    if (incomeLeft > 0) {
        let band = Math.min(incomeLeft, 300000);
        let bandTax = band * 0.07;
        tax += bandTax;
        taxBreakdown.push({ tier: "First ₦300,000", rate: "7%", tax: bandTax });
        incomeLeft -= band;
    }
    if (incomeLeft > 0) {
        let band = Math.min(incomeLeft, 300000);
        let bandTax = band * 0.11;
        tax += bandTax;
        taxBreakdown.push({ tier: "Next ₦300,000", rate: "11%", tax: bandTax });
        incomeLeft -= band;
    }
    if (incomeLeft > 0) {
        let band = Math.min(incomeLeft, 500000);
        let bandTax = band * 0.15;
        tax += bandTax;
        taxBreakdown.push({ tier: "Next ₦500,000", rate: "15%", tax: bandTax });
        incomeLeft -= band;
    }
    if (incomeLeft > 0) {
        let band = Math.min(incomeLeft, 500000);
        let bandTax = band * 0.19;
        tax += bandTax;
        taxBreakdown.push({ tier: "Next ₦500,000", rate: "19%", tax: bandTax });
        incomeLeft -= band;
    }
    if (incomeLeft > 0) {
        let band = Math.min(incomeLeft, 1600000);
        let bandTax = band * 0.21;
        tax += bandTax;
        taxBreakdown.push({ tier: "Next ₦1,600,000", rate: "21%", tax: bandTax });
        incomeLeft -= band;
    }
    if (incomeLeft > 0) {
        let band = incomeLeft;
        let bandTax = band * 0.24;
        tax += bandTax;
        taxBreakdown.push({ tier: "Above ₦3,200,000", rate: "24%", tax: bandTax });
    }

    return { 
      tax: parseFloat(tax.toFixed(2)), 
      breakdown: taxBreakdown, 
      taxableIncome, 
      relief: consolidatedRelief 
    };
  };

  const generateMonthlyPayroll = async (selectedPeriod) => {
    setGeneratingPayroll(true);
    try {
      const existingPayroll = payrollRecords.filter(r => r.pay_period === selectedPeriod);
      if (existingPayroll.length > 0) {
        if (!window.confirm(`Payroll for ${new Date(selectedPeriod).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })} already exists. Do you want to regenerate it?`)) {
          setGeneratingPayroll(false);
          return;
        }
        for (const record of existingPayroll) {
          await PayrollRecord.delete(record.id);
        }
      }

      const activeEmployees = employees.filter(emp => emp.employment_status === 'active');
      const payrollPromises = activeEmployees.map(async (employee) => {
        // Use the total annual gross pay directly from the employee record
        const annualGross = employee.total_annual_gross_pay || 0;
        const monthlyGross = annualGross / 12;
        
        // Calculate individual monthly components for display/record keeping, derived from annual values
        const monthlyBasic = (employee.annual_basic_salary || 0) / 12;
        const monthlyHousing = (employee.annual_housing_allowance || 0) / 12;
        const monthlyTransport = (employee.annual_transport_allowance || 0) / 12;
        const monthlyLeave = (employee.annual_leave_allowance || 0) / 12;
        const monthlyOther = (employee.annual_other_allowances || 0) / 12;

        // Calculate pension deduction based on employee's BHT and pension rate
        const annualPensionableIncome = (employee.annual_basic_salary || 0) + (employee.annual_housing_allowance || 0) + (employee.annual_transport_allowance || 0);
        const annualPensionDeduction = (annualPensionableIncome * (employee.pension_rate || 8)) / 100;
        const pensionDeduction = annualPensionDeduction / 12;
        
        // Calculate NHF deduction based on employee's basic salary, applicability, and rate
        let annualNhfDeduction = 0;
        if (employee.nhf_applicable) {
          annualNhfDeduction = ((employee.annual_basic_salary || 0) * (employee.nhf_rate || 2.5)) / 100;
        }
        const nhfDeduction = annualNhfDeduction / 12;
        
        // --- NEW LOAN DEDUCTION LOGIC ---
        let loanDeduction = 0;
        const employeeActiveLoans = loans.filter(l => l.employee_id === employee.id && l.status === 'active');
        const periodDate = new Date(selectedPeriod + '-01'); // Ensure it's a valid date object for comparison

        const applicableLoansForPeriod = [];
        for (const loan of employeeActiveLoans) {
          const startDate = new Date(loan.start_date);
          const endDate = new Date(loan.end_date);
          // Check if the pay period month falls within the loan's start and end dates
          if (periodDate >= startDate && periodDate <= endDate) {
            loanDeduction += loan.monthly_deduction || 0;
            applicableLoansForPeriod.push(loan);
          }
        }
        // --- END LOAN DEDUCTION LOGIC ---

        // Use the pre-calculated consolidated relief allowance directly from the employee record
        const consolidatedRelief = employee.consolidated_relief_allowance || 0;
        
        // Calculate PAYE using all data from the employee record
        const { tax: annualTax, breakdown: taxBreakdown, taxableIncome } = calculatePAYE(annualGross, annualPensionDeduction, annualNhfDeduction, consolidatedRelief);
        const monthlyTax = annualTax / 12;
        
        const totalDeductions = pensionDeduction + nhfDeduction + monthlyTax + loanDeduction;
        const netSalary = monthlyGross - totalDeductions;

        const newPayrollRecord = {
          employee_id: employee.id,
          pay_period: selectedPeriod,
          basic_salary: parseFloat(monthlyBasic.toFixed(2)),
          gross_salary: parseFloat(monthlyGross.toFixed(2)),
          housing_allowance: parseFloat(monthlyHousing.toFixed(2)),
          transport_allowance: parseFloat(monthlyTransport.toFixed(2)),
          medical_allowance: parseFloat(monthlyLeave.toFixed(2)),
          other_allowances: parseFloat(monthlyOther.toFixed(2)),
          pension_deduction: parseFloat(pensionDeduction.toFixed(2)),
          nhf_deduction: parseFloat(nhfDeduction.toFixed(2)),
          loan_deduction: parseFloat(loanDeduction.toFixed(2)), // Added loan_deduction
          paye_tax: parseFloat(monthlyTax.toFixed(2)),
          total_deductions: parseFloat(totalDeductions.toFixed(2)),
          net_salary: parseFloat(netSalary.toFixed(2)),
          status: "generated",
          tax_breakdown: {
            annual_gross: parseFloat(annualGross.toFixed(2)),
            consolidated_relief: parseFloat(consolidatedRelief.toFixed(2)),
            taxable_income: parseFloat(taxableIncome.toFixed(2)),
            annual_tax: parseFloat(annualTax.toFixed(2)),
            annual_pensionable_income: parseFloat(annualPensionableIncome.toFixed(2)),
            annual_pension_deduction: parseFloat(annualPensionDeduction.toFixed(2)),
            annual_nhf_deduction: parseFloat(annualNhfDeduction.toFixed(2)),
            pension_rate: employee.pension_rate || 8,
            nhf_rate: employee.nhf_rate || 2.5,
            nhf_applicable: employee.nhf_applicable,
            brackets: taxBreakdown,
          }
        };

        // Create Payroll Record first
        const createdRecord = await PayrollRecord.create(newPayrollRecord);

        // Then create loan payment records if applicable
        if (loanDeduction > 0) {
            for (const loan of applicableLoansForPeriod) {
                await LoanPayment.create({
                    loan_id: loan.id,
                    employee_id: employee.id,
                    payroll_record_id: createdRecord.id, // Link to the created payroll record
                    amount_paid: loan.monthly_deduction, // The actual monthly deduction for this specific loan
                    payment_date: new Date().toISOString().split('T')[0], // Today's date as payment date
                    pay_period: selectedPeriod
                });
            }
        }

        return createdRecord;
      });

      await Promise.all(payrollPromises);
      await loadData();
      alert(`Payroll generated successfully for ${activeEmployees.length} employees using individual compensation details!`);
    } catch (error) {
      console.error('Error generating payroll:', error);
      alert('Error generating payroll. Please try again.');
    } finally {
      setGeneratingPayroll(false);
    }
  };

  const processPayroll = async (recordId) => {
    try {
      await PayrollRecord.update(recordId, { 
        status: "processed",
        payment_date: new Date().toISOString().split('T')[0]
      });
      loadData();
    } catch (error) {
      console.error('Error processing payroll:', error);
    }
  };

  const downloadPayrollReport = () => {
    const currentPeriodRecords = payrollRecords.filter(r => r.pay_period === currentPeriod);
    if (currentPeriodRecords.length === 0) {
      alert('No payroll data available for the selected period.');
      return;
    }

    const headers = [
      'Employee Name', 'Employee ID', 'Position', 'Department',
      'Basic Salary', 'Housing Allowance', 'Transport Allowance', 'Leave Allowance', 'Other Allowances',
      'Gross Salary', 'Pension Deduction', 'NHF Deduction', 'Loan Deduction', 'PAYE Tax', 'Total Deductions', 'Net Salary',
      'Bank Name', 'Account Number', 'Status'
    ];

    const csvContent = [
      headers.join(','),
      ...currentPeriodRecords.map(record => {
        const employee = employees.find(e => e.id === record.employee_id);
        return [
          `"${employee?.first_name || ''} ${employee?.last_name || ''}"`,
          employee?.employee_id || '',
          employee?.position || '',
          employee?.department || '',
          (record.basic_salary || 0).toFixed(2),
          (record.housing_allowance || 0).toFixed(2),
          (record.transport_allowance || 0).toFixed(2),
          (record.medical_allowance || 0).toFixed(2),
          (record.other_allowances || 0).toFixed(2),
          (record.gross_salary || 0).toFixed(2),
          (record.pension_deduction || 0).toFixed(2),
          (record.nhf_deduction || 0).toFixed(2),
          (record.loan_deduction || 0).toFixed(2), // Added loan_deduction to CSV
          (record.paye_tax || 0).toFixed(2),
          (record.total_deductions || 0).toFixed(2),
          (record.net_salary || 0).toFixed(2),
          employee?.bank_name || '',
          employee?.account_number || '',
          record.status || ''
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Payroll_${currentPeriod}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const getStatusColor = (status) => {
    const colors = {
      generated: "bg-blue-100 text-blue-700",
      processed: "bg-green-100 text-green-700",
      paid: "bg-emerald-100 text-emerald-700",
      failed: "bg-red-100 text-red-700"
    };
    return colors[status] || "bg-gray-100 text-gray-700";
  };

  if (loading) {
    return <div className="p-8 text-center">Loading payroll data...</div>;
  }

  const summaryCards = [
    {
      title: "Active Employees",
      value: employees.filter(e => e.employment_status === 'active').length,
      icon: Users,
      color: "text-blue-600"
    },
    {
      title: "Generated This Month",
      value: payrollRecords.filter(r => r.pay_period === currentPeriod).length,
      icon: Receipt,
      color: "text-green-600"
    },
    {
      title: "Total Gross Pay (Monthly)",
      value: `₦${payrollRecords
        .filter(r => r.pay_period === currentPeriod)
        .reduce((sum, r) => sum + (r.gross_salary || 0), 0)
        .toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`,
      icon: DollarSign,
      color: "text-purple-600"
    },
    {
      title: "Total Net Pay (Monthly)",
      value: `₦${payrollRecords
        .filter(r => r.pay_period === currentPeriod)
        .reduce((sum, r) => sum + (r.net_salary || 0), 0)
        .toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`,
      icon: CreditCard,
      color: "text-orange-600"
    }
  ];

  return (
    <div className="p-4 lg:p-8 min-h-screen" style={{ backgroundColor: '#F5F5F5' }}>
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-700 to-blue-800 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-700/25">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Payroll & Payments</h1>
              <p className="text-gray-600">Automated monthly payroll processing with PAYE tax calculations using individual employee rates</p>
            </div>
          </div>
          <div className="flex gap-3 flex-wrap">
            <Select value={currentPeriod} onValueChange={setCurrentPeriod}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => {
                  const date = new Date();
                  date.setMonth(date.getMonth() - i);
                  const period = date.toISOString().slice(0, 7);
                  return (
                    <SelectItem key={period} value={period}>
                      {date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <Button
              onClick={() => generateMonthlyPayroll(currentPeriod)}
              disabled={generatingPayroll}
              className="bg-gradient-to-r from-green-700 to-green-800 hover:from-green-800 hover:to-green-900 text-white shadow-lg shadow-green-700/25"
            >
              {generatingPayroll ? (
                <>
                  <Calculator className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Calculator className="w-4 h-4 mr-2" />
                  Generate Payroll
                </>
              )}
            </Button>
            <Button
              onClick={downloadPayrollReport}
              variant="outline"
              className="border-blue-300 text-blue-700 hover:bg-blue-50"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Report
            </Button>
            <Dialog open={showGenerator} onOpenChange={setShowGenerator}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white shadow-lg shadow-blue-700/25">
                  <FileText className="w-4 h-4 mr-2" />
                  Tax Calculator
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Nigerian PAYE Tax Calculator</DialogTitle>
                </DialogHeader>
                <PayrollGenerator onClose={() => setShowGenerator(false)} />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {summaryCards.map((card, index) => (
            <Card key={index} className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-xl shadow-gray-200/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{card.title}</p>
                    <p className={`text-2xl font-bold text-gray-900`}>
                      {card.value}
                    </p>
                  </div>
                  <card.icon className={`w-8 h-8 ${card.color}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-xl shadow-gray-200/50">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Monthly Payroll Schedule - {new Date(currentPeriod).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}</span>
              <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                {payrollRecords.filter(r => r.pay_period === currentPeriod).length} records
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>Employee Details</TableHead>
                    <TableHead>Gross Salary</TableHead>
                    <TableHead>Deductions</TableHead>
                    <TableHead>Net Salary</TableHead>
                    <TableHead>Bank Details</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payrollRecords
                    .filter(record => record.pay_period === currentPeriod)
                    .map((record) => {
                      const employee = employees.find(e => e.id === record.employee_id);
                      const taxBreakdown = record.tax_breakdown || {};
                      return (
                        <TableRow key={record.id} className="hover:bg-gray-50/50 transition-colors">
                          <TableCell>
                            <div>
                              <p className="font-semibold text-gray-900">
                                {employee?.first_name} {employee?.last_name}
                              </p>
                              <p className="text-sm text-gray-500">{employee?.employee_id}</p>
                              <p className="text-xs text-gray-500">{employee?.position}</p>
                            </div>
                          </TableCell>
                          <TableCell className="font-bold text-green-600">₦{record.gross_salary?.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</TableCell>
                          <TableCell>
                            <div className="text-sm text-red-600">
                              <div>Pension ({taxBreakdown.pension_rate || 8}%): ₦{record.pension_deduction?.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                              {record.nhf_deduction > 0 ? (
                                <div>NHF ({taxBreakdown.nhf_rate || 2.5}%): ₦{record.nhf_deduction?.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                              ) : (
                                <div className="text-gray-400">NHF: N/A</div>
                              )}
                              {record.loan_deduction > 0 && ( // Display loan deduction
                                <div>Loan: ₦{record.loan_deduction?.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                              )}
                              <div>Tax: ₦{record.paye_tax?.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                              <div className="font-semibold border-t mt-1 pt-1">Total: ₦{record.total_deductions?.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                            </div>
                          </TableCell>
                          <TableCell className="font-bold text-blue-600">₦{record.net_salary?.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>{employee?.bank_name}</div>
                              <div>{employee?.account_number}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(record.status)}>
                              {record.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col sm:flex-row gap-2">
                                {record.status === 'generated' && (
                                <Button
                                    size="sm"
                                    onClick={() => processPayroll(record.id)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1"
                                >
                                    Process
                                </Button>
                                )}
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setViewingPayslip({ record, employee })}
                                    className="text-xs px-2 py-1"
                                >
                                    <FileText className="w-3 h-3 mr-1" />
                                    Payslip
                                </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </div>

            {payrollRecords.filter(r => r.pay_period === currentPeriod).length === 0 && (
              <div className="p-12 text-center text-gray-500">
                <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold mb-2">No payroll records for this period</h3>
                <p className="mb-4">Generate payroll for {new Date(currentPeriod).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}</p>
                <Button
                  onClick={() => generateMonthlyPayroll(currentPeriod)}
                  disabled={generatingPayroll}
                  className="bg-gradient-to-r from-green-700 to-green-800 hover:from-green-800 hover:to-green-900 text-white"
                >
                  <Calculator className="w-4 h-4 mr-2" />
                  Generate Monthly Payroll
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!viewingPayslip} onOpenChange={() => setViewingPayslip(null)}>
        <DialogContent className="max-w-4xl p-0 border-0">
          {viewingPayslip && (
            <div>
              <Payslip payrollRecord={viewingPayslip.record} employee={viewingPayslip.employee} />
              <div className="p-4 bg-gray-100 flex justify-end no-print">
                <Button onClick={() => window.print()}>
                  <Printer className="w-4 h-4 mr-2" />
                  Print / Save as PDF
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
