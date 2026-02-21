
import React, { useState, useEffect } from "react";
import { Employee, PayrollRecord } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users, Calculator } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function CompensationTool() {
  const [employees, setEmployees] = useState([]);
  const [payrollRecords, setPayrollRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPeriod, setCurrentPeriod] = useState(new Date().toISOString().slice(0, 7));
  const [generatingPayroll, setGeneratingPayroll] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [employeesData, payrollData] = await Promise.all([
          Employee.list("-created_date"),
          PayrollRecord.list()
      ]);
      setEmployees(employeesData);
      setPayrollRecords(payrollData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculatePAYE = (annualIncome, annualPension, annualNhf, consolidatedRelief) => {
    // This function now uses the consolidated relief passed from the employee record
    const taxableIncome = parseFloat(Math.max(0, annualIncome - consolidatedRelief - annualPension - annualNhf).toFixed(2));
    let tax = 0;
    let incomeLeft = taxableIncome;
    const taxBrackets = [
        { limit: 300000, rate: 0.07 }, { limit: 300000, rate: 0.11 },
        { limit: 500000, rate: 0.15 }, { limit: 500000, rate: 0.19 },
        { limit: 1600000, rate: 0.21 }, { limit: Infinity, rate: 0.24 }
    ];

    for (const bracket of taxBrackets) {
        if (incomeLeft <= 0) break;
        const taxableAtThisBracket = Math.min(incomeLeft, bracket.limit);
        tax += taxableAtThisBracket * bracket.rate;
        incomeLeft -= taxableAtThisBracket;
    }
    return { tax: parseFloat(tax.toFixed(2)), taxableIncome };
  };

  const generateMonthlyPayroll = async (selectedPeriod) => {
    setGeneratingPayroll(true);
    try {
      const existingPayroll = payrollRecords.filter(r => r.pay_period === selectedPeriod);
      if (existingPayroll.length > 0) {
        if (!window.confirm(`Payroll for ${new Date(selectedPeriod).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })} already exists. Regenerating will delete the old records for this period. Continue?`)) {
          setGeneratingPayroll(false);
          return;
        }
        for (const record of existingPayroll) {
          await PayrollRecord.delete(record.id);
        }
      }

      const activeEmployeesForPayroll = employees.filter(emp => emp.employment_status === 'active');
      const payrollPromises = activeEmployeesForPayroll.map(async (employee) => {
        // Use the total annual gross pay directly from the employee record
        const annualGross = employee.total_annual_gross_pay || 0;
        
        // Calculate pension deduction based on employee's BHT and pension rate
        const annualPensionableIncome = (employee.annual_basic_salary || 0) + (employee.annual_housing_allowance || 0) + (employee.annual_transport_allowance || 0);
        const annualPensionDeduction = (annualPensionableIncome * (employee.pension_rate || 8)) / 100;
        
        // Calculate NHF deduction based on employee's basic salary, applicability, and rate
        const annualNhfDeduction = employee.nhf_applicable ? ((employee.annual_basic_salary || 0) * (employee.nhf_rate || 2.5)) / 100 : 0;
        
        // Use the pre-calculated consolidated relief allowance directly from the employee record
        const consolidatedRelief = employee.consolidated_relief_allowance || 0;
        
        // Calculate PAYE using all data from the employee record
        const { tax: annualTax } = calculatePAYE(annualGross, annualPensionDeduction, annualNhfDeduction, consolidatedRelief);

        const monthlyGross = annualGross / 12;
        const totalDeductions = (annualPensionDeduction + annualNhfDeduction + annualTax) / 12;

        return PayrollRecord.create({
            employee_id: employee.id,
            pay_period: selectedPeriod,
            gross_salary: parseFloat(monthlyGross.toFixed(2)),
            pension_deduction: parseFloat((annualPensionDeduction / 12).toFixed(2)),
            nhf_deduction: parseFloat((annualNhfDeduction / 12).toFixed(2)),
            paye_tax: parseFloat((annualTax / 12).toFixed(2)),
            total_deductions: parseFloat(totalDeductions.toFixed(2)),
            net_salary: parseFloat((monthlyGross - totalDeductions).toFixed(2)),
            status: "generated",
            basic_salary: (employee.annual_basic_salary || 0) / 12,
            housing_allowance: (employee.annual_housing_allowance || 0) / 12,
            transport_allowance: (employee.annual_transport_allowance || 0) / 12,
            medical_allowance: (employee.annual_leave_allowance || 0) / 12,
            other_allowances: (employee.annual_other_allowances || 0) / 12,
        });
      });

      await Promise.all(payrollPromises);
      await loadData();
      alert(`Payroll generated successfully for ${activeEmployeesForPayroll.length} active employees!`);
    } catch (error) {
      console.error('Error generating payroll:', error);
      alert('Error generating payroll. Please check the console for details.');
    } finally {
      setGeneratingPayroll(false);
    }
  };

  const formatCurrency = (value) => {
    return (value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  if (loading) {
    return <div className="p-8 text-center">Loading compensation data...</div>;
  }

  return (
    <div className="p-4 lg:p-8 min-h-screen" style={{ backgroundColor: '#F5F5F5' }}>
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-green-700 to-green-800 rounded-2xl flex items-center justify-center shadow-lg shadow-green-700/25">
              <Calculator className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Compensation & Payroll</h1>
              <p className="text-gray-600">Review compensation details and generate monthly payroll.</p>
            </div>
          </div>
        </div>
        
        <Card className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-xl shadow-gray-200/50">
            <CardHeader>
                <CardTitle>Payroll Generation Tool</CardTitle>
                <CardDescription>Generate monthly payroll for all active employees.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row items-center gap-4">
                 <Select value={currentPeriod} onValueChange={setCurrentPeriod}>
                  <SelectTrigger className="w-full sm:w-48">
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
                  className="w-full sm:w-auto bg-gradient-to-r from-green-700 to-green-800 hover:from-green-800 hover:to-green-900 text-white shadow-lg shadow-green-700/25"
                >
                  {generatingPayroll ? 'Generating...' : 'Generate Payroll'}
                  <Calculator className="w-4 h-4 ml-2" />
                </Button>
            </CardContent>
        </Card>

        <Card className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-xl shadow-gray-200/50">
            <CardHeader>
                <CardTitle>Employee Compensation Overview</CardTitle>
                <CardDescription>A summary of annual compensation figures for all active employees.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
               <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead>Employee</TableHead>
                      <TableHead>Total Gross Pay (Annual)</TableHead>
                      <TableHead>Consolidated Relief (Annual)</TableHead>
                      <TableHead>Pensionable Income (Annual)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employees.filter(e => e.employment_status === 'active').map((employee) => (
                      <TableRow key={employee.id}>
                        <TableCell>
                            <p className="font-semibold text-gray-900">{employee.first_name} {employee.last_name}</p>
                            <p className="text-sm text-gray-500">{employee.position}</p>
                        </TableCell>
                        <TableCell>₦{formatCurrency(employee.total_annual_gross_pay)}</TableCell>
                        <TableCell>₦{formatCurrency(employee.consolidated_relief_allowance)}</TableCell>
                        <TableCell>₦{formatCurrency((employee.annual_basic_salary || 0) + (employee.annual_housing_allowance || 0) + (employee.annual_transport_allowance || 0))}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
