
import React, { useState, useEffect } from "react";
import { Employee } from "@/api/entities";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { format, parseISO } from 'date-fns';
import { Info, HelpCircle, UserPlus } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno", "Cross River",
  "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT - Abuja", "Gombe", "Imo", "Jigawa", "Kaduna",
  "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo",
  "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara"
];

// Nigerian PAYE Tax Brackets (2024) - used for reference but the calculation logic directly implements the tiers
const TAX_BRACKETS = [
  { min: 0, max: 300000, rate: 7 },
  { min: 300000, max: 600000, rate: 11 },
  { min: 600000, max: 1100000, rate: 15 },
  { min: 1100000, max: 1600000, rate: 19 },
  { min: 1600000, max: 3200000, rate: 21 },
  { min: 3200000, max: Infinity, rate: 24 }
];

export default function EmployeeForm({ employee, onSubmit, onCancel }) {
  const [allEmployees, setAllEmployees] = useState([]);
  const [formData, setFormData] = useState(
    employee
      ? { 
          ...employee, 
          hire_date: employee.hire_date ? format(parseISO(employee.hire_date), "yyyy-MM-dd") : "",
          date_of_birth: employee.date_of_birth ? format(parseISO(employee.date_of_birth), "yyyy-MM-dd") : ""
        }
      : {
          employee_id: "",
          first_name: "",
          last_name: "",
          email: "",
          phone: "",
          gender: "",
          date_of_birth: "",
          nationality: "Nigerian",
          home_address: "",
          department: "hr",
          position: "",
          employment_status: "active",
          hire_date: "",
          supervisor_id: "",
          supervisor_name: "",
          supervisor_role: "",
          supervisor_department: "",
          annual_basic_salary: 0,
          annual_housing_allowance: 0,
          annual_transport_allowance: 0,
          annual_leave_allowance: 0,
          annual_other_allowances: 0,
          pension_rate: 8,
          nhf_applicable: true,
          nhf_rate: 2.5,
          bank_name: "",
          account_number: "",
          account_name: "",
          beneficiary_name: "",
          beneficiary_relationship: "",
          beneficiary_phone: "",
          next_of_kin_name: "",
          next_of_kin_relationship: "",
          next_of_kin_phone: "",
          next_of_kin_address: "",
        }
  );
  const [createUserAccount, setCreateUserAccount] = useState(true);

  useEffect(() => {
    async function loadEmployees() {
      const employees = await Employee.list();
      setAllEmployees(employees);
    }
    loadEmployees();
  }, []);

  // Calculate total gross pay
  const calculateTotalGrossPay = () => {
    const basic = parseFloat(formData.annual_basic_salary) || 0;
    const housing = parseFloat(formData.annual_housing_allowance) || 0;
    const transport = parseFloat(formData.annual_transport_allowance) || 0;
    const leave = parseFloat(formData.annual_leave_allowance) || 0;
    const other = parseFloat(formData.annual_other_allowances) || 0;
    return basic + housing + transport + leave + other;
  };

  // Calculate pension deduction (8% of Basic + Housing + Transport)
  const calculatePensionDeduction = () => {
    const basic = parseFloat(formData.annual_basic_salary) || 0;
    const housing = parseFloat(formData.annual_housing_allowance) || 0;
    const transport = parseFloat(formData.annual_transport_allowance) || 0;
    const pensionableIncome = basic + housing + transport;
    return (pensionableIncome * 8) / 100;
  };

  // Calculate NHF deduction (2.5% of Basic Salary only, if applicable)
  const calculateNHFDeduction = () => {
    if (!formData.nhf_applicable) return 0;
    const basic = parseFloat(formData.annual_basic_salary) || 0;
    return (basic * 2.5) / 100;
  };

  const calculateConsolidatedReliefAllowance = () => {
    const totalGross = calculateTotalGrossPay();
    const onePercentOfGross = totalGross * 0.01;
    const twentyPercentOfGross = totalGross * 0.2;
    const higherAmount = Math.max(200000, onePercentOfGross);
    return {
      total: twentyPercentOfGross + higherAmount,
      breakdown: {
        onePercent: onePercentOfGross,
        twentyPercent: twentyPercentOfGross,
        higher: higherAmount
      }
    };
  };

  const calculatePAYE = () => {
    const annualGross = calculateTotalGrossPay();
    const annualPension = calculatePensionDeduction();
    const annualNhf = calculateNHFDeduction();
    const consolidatedRelief = calculateConsolidatedReliefAllowance().total;

    const taxableIncome = Math.max(0, annualGross - annualPension - annualNhf - consolidatedRelief);
    
    let tax = 0;
    let taxBreakdown = [];

    // Corrected tax bracket logic for progressive taxation
    let incomeLeft = taxableIncome;

    if (incomeLeft > 0) {
        let band = Math.min(incomeLeft, 300000); // First 300,000
        let bandTax = band * 0.07;
        tax += bandTax;
        taxBreakdown.push({ tier: "First ₦300,000", rate: "7%", tax: bandTax });
        incomeLeft -= band;
    }
    if (incomeLeft > 0) {
        let band = Math.min(incomeLeft, 300000); // Next 300,000 (up to 600,000 total)
        let bandTax = band * 0.11;
        tax += bandTax;
        taxBreakdown.push({ tier: "Next ₦300,000", rate: "11%", tax: bandTax });
        incomeLeft -= band;
    }
    if (incomeLeft > 0) {
        let band = Math.min(incomeLeft, 500000); // Next 500,000 (up to 1,100,000 total)
        let bandTax = band * 0.15;
        tax += bandTax;
        taxBreakdown.push({ tier: "Next ₦500,000", rate: "15%", tax: bandTax });
        incomeLeft -= band;
    }
    if (incomeLeft > 0) {
        let band = Math.min(incomeLeft, 500000); // Next 500,000 (up to 1,600,000 total)
        let bandTax = band * 0.19;
        tax += bandTax;
        taxBreakdown.push({ tier: "Next ₦500,000", rate: "19%", tax: bandTax });
        incomeLeft -= band;
    }
    if (incomeLeft > 0) {
        let band = Math.min(incomeLeft, 1600000); // Next 1,600,000 (up to 3,200,000 total)
        let bandTax = band * 0.21;
        tax += bandTax;
        taxBreakdown.push({ tier: "Next ₦1,600,000", rate: "21%", tax: bandTax });
        incomeLeft -= band;
    }
    if (incomeLeft > 0) {
        let band = incomeLeft; // Remaining income
        let bandTax = band * 0.24;
        tax += bandTax;
        taxBreakdown.push({ tier: "Above ₦3,200,000", rate: "24%", tax: bandTax });
    }

    return { tax, taxableIncome, breakdown: taxBreakdown };
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    const totalGrossPay = calculateTotalGrossPay();
    const consolidatedReliefData = calculateConsolidatedReliefAllowance();
    const submissionData = {
      ...formData,
      annual_basic_salary: parseFloat(formData.annual_basic_salary) || 0,
      annual_housing_allowance: parseFloat(formData.annual_housing_allowance) || 0,
      annual_transport_allowance: parseFloat(formData.annual_transport_allowance) || 0,
      annual_leave_allowance: parseFloat(formData.annual_leave_allowance) || 0,
      annual_other_allowances: parseFloat(formData.annual_other_allowances) || 0,
      pension_rate: 8,
      nhf_rate: 2.5,
      nhf_applicable: Boolean(formData.nhf_applicable),
      total_annual_gross_pay: parseFloat(totalGrossPay.toFixed(2)),
      consolidated_relief_allowance: parseFloat(consolidatedReliefData.total.toFixed(2)),
    };
    onSubmit({ employeeData: submissionData, createUser: !employee && createUserAccount });
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => {
      const newFormData = { ...prev, [field]: value };

      // Auto-calculate leave allowance as 10% of basic salary
      if (field === "annual_basic_salary") {
        const basicSalary = parseFloat(value) || 0;
        newFormData.annual_leave_allowance = basicSalary * 0.1;
      }
      return newFormData;
    });
  };

  const handleSupervisorChange = (supervisorId) => {
    const selectedSupervisor = allEmployees.find(emp => emp.id === supervisorId);
    if (selectedSupervisor) {
      setFormData(prev => ({
        ...prev,
        supervisor_id: selectedSupervisor.id,
        supervisor_name: `${selectedSupervisor.first_name} ${selectedSupervisor.last_name}`,
        supervisor_role: selectedSupervisor.position,
        supervisor_department: selectedSupervisor.department
      }));
    }
  };

  const totalGrossPay = calculateTotalGrossPay();
  const annualPensionDeduction = calculatePensionDeduction();
  const annualNHFDeduction = calculateNHFDeduction();
  const consolidatedReliefData = calculateConsolidatedReliefAllowance();
  const annualPAYEData = calculatePAYE();


  const formatCurrency = (value) => {
    return (value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <Card className="bg-white/90 backdrop-blur-sm border-slate-200/60 shadow-2xl shadow-slate-200/60 mt-6">
      <CardHeader>
        <CardTitle>{employee ? `Edit Employee: ${employee.first_name} ${employee.last_name}` : "Create New Employee"}</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <h3 className="font-semibold text-lg text-gray-800 border-b pb-2">Personal Information</h3>
          {/* Personal Information Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             {/* Employee ID */}
            <div className="space-y-2">
              <Label htmlFor="employee_id">Employee ID *</Label>
              <Input id="employee_id" value={formData.employee_id} onChange={(e) => handleInputChange("employee_id", e.target.value)} required />
            </div>
            {/* First Name */}
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name *</Label>
              <Input id="first_name" value={formData.first_name} onChange={(e) => handleInputChange("first_name", e.target.value)} required />
            </div>
            {/* Last Name */}
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name *</Label>
              <Input id="last_name" value={formData.last_name} onChange={(e) => handleInputChange("last_name", e.target.value)} required />
            </div>
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input id="email" type="email" value={formData.email} onChange={(e) => handleInputChange("email", e.target.value)} required />
            </div>
            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={formData.phone} onChange={(e) => handleInputChange("phone", e.target.value)} />
            </div>
            {/* Date of Birth */}
            <div className="space-y-2">
              <Label htmlFor="date_of_birth">Date of Birth</Label>
              <Input id="date_of_birth" type="date" value={formData.date_of_birth} onChange={(e) => handleInputChange("date_of_birth", e.target.value)} />
            </div>
             {/* Gender */}
            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select value={formData.gender} onValueChange={(value) => handleInputChange("gender", value)}>
                <SelectTrigger id="gender"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Nationality */}
            <div className="space-y-2">
              <Label htmlFor="nationality">Nationality</Label>
              <Input id="nationality" value={formData.nationality} onChange={(e) => handleInputChange("nationality", e.target.value)} />
            </div>
            {/* Home Address */}
            <div className="space-y-2 col-span-1 md:col-span-2">
              <Label htmlFor="home_address">Home Address</Label>
              <Input id="home_address" value={formData.home_address} onChange={(e) => handleInputChange("home_address", e.target.value)} />
            </div>
          </div>
          
          <h3 className="font-semibold text-lg text-gray-800 border-b pb-2 mt-6">Employment Details</h3>
          {/* Employment Details Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
              <Label htmlFor="hire_date">Hire Date *</Label>
              <Input id="hire_date" type="date" value={formData.hire_date} onChange={(e) => handleInputChange("hire_date", e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Select value={formData.department} onValueChange={(value) => handleInputChange("department", value)}>
                <SelectTrigger id="department"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="hr">HR</SelectItem>
                  <SelectItem value="sales">Sales</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                  <SelectItem value="operations">Operations</SelectItem>
                  <SelectItem value="it">IT</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="position">Position</Label>
              <Input id="position" value={formData.position} onChange={(e) => handleInputChange("position", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="employment_status">Employment Status</Label>
              <Select value={formData.employment_status} onValueChange={(value) => handleInputChange("employment_status", value)}>
                <SelectTrigger id="employment_status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="terminated">Terminated</SelectItem>
                  <SelectItem value="on_leave">On Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <h3 className="font-semibold text-lg text-gray-800 border-b pb-2 mt-6">Reporting Line</h3>
          {/* Reporting Line Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="supervisor_id">Supervisor</Label>
              <Select value={formData.supervisor_id} onValueChange={handleSupervisorChange}>
                <SelectTrigger id="supervisor_id"><SelectValue placeholder="Select a supervisor" /></SelectTrigger>
                <SelectContent>
                  {allEmployees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name} ({emp.employee_id})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Supervisor Department</Label>
              <Input value={formData.supervisor_department} disabled />
            </div>
          </div>

          <h3 className="font-semibold text-lg text-gray-800 border-b pb-2 mt-6">Compensation & Benefits (Annual)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="annual_basic_salary">Annual Basic Salary (₦) *</Label>
              <Input id="annual_basic_salary" type="number" value={formData.annual_basic_salary} onChange={(e) => handleInputChange("annual_basic_salary", e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="annual_housing_allowance">Annual Housing Allowance (₦)</Label>
              <Input id="annual_housing_allowance" type="number" value={formData.annual_housing_allowance} onChange={(e) => handleInputChange("annual_housing_allowance", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="annual_transport_allowance">Annual Transport Allowance (₦)</Label>
              <Input id="annual_transport_allowance" type="number" value={formData.annual_transport_allowance} onChange={(e) => handleInputChange("annual_transport_allowance", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="annual_leave_allowance">Annual Leave Allowance (₦)</Label>
              <Input id="annual_leave_allowance" type="number" value={formData.annual_leave_allowance} disabled className="bg-gray-100" />
              <p className="text-xs text-gray-400">10% of Basic Salary</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="annual_other_allowances">Other Allowances (Annual, ₦)</Label>
              <Input id="annual_other_allowances" type="number" value={formData.annual_other_allowances} onChange={(e) => handleInputChange("annual_other_allowances", e.target.value)} />
            </div>
            <div className="bg-blue-50 p-3 rounded-lg flex flex-col justify-center">
                <Label className="text-blue-800">Total Annual Gross Pay</Label>
                <p className="text-xl font-bold text-blue-800">₦{formatCurrency(totalGrossPay)}</p>
            </div>
          </div>
          
          <h3 className="font-semibold text-lg text-gray-800 border-b pb-2 mt-6">Deductions & Relief Configuration (Annual)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             <div className="space-y-2">
              <Label htmlFor="pension_rate">Pension Deduction (Fixed at 8%)</Label>
              <Input 
                id="pension_rate" 
                type="number" 
                value="8"
                disabled
                className="bg-gray-100 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 font-medium">
                Annual: ₦{formatCurrency(annualPensionDeduction)}
              </p>
              <p className="text-xs text-gray-500">
                Monthly: ₦{formatCurrency(annualPensionDeduction / 12)}
              </p>
              <p className="text-xs text-gray-400">Based on Basic + Housing + Transport</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="nhf_applicable"
                  checked={formData.nhf_applicable}
                  onCheckedChange={(checked) => handleInputChange("nhf_applicable", checked)}
                />
                <Label htmlFor="nhf_applicable" className="text-base font-normal">
                  Apply NHF Deduction (2.5%)
                </Label>
              </div>
               <p className="text-xs text-gray-500 font-medium">
                Annual: ₦{formatCurrency(annualNHFDeduction)}
              </p>
              <p className="text-xs text-gray-500">
                Monthly: ₦{formatCurrency(annualNHFDeduction / 12)}
              </p>
              <p className="text-xs text-gray-400">Based on Basic Salary only</p>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg space-y-2">
              <h4 className="font-semibold text-gray-700">Consolidated Relief Allowance (CRA)</h4>
              <div className="text-xs text-gray-500 space-y-1">
                <p>20% of Gross: ₦{formatCurrency(consolidatedReliefData.breakdown.twentyPercent)}</p>
                <p>Higher of ₦200,000 or 1% of Gross (₦{formatCurrency(consolidatedReliefData.breakdown.onePercent)}): ₦{formatCurrency(consolidatedReliefData.breakdown.higher)}</p>
              </div>
              <p className="text-sm font-bold text-gray-800 pt-1 border-t">
                Annual CRA: ₦{formatCurrency(consolidatedReliefData.total)}
              </p>
              <p className="text-sm text-gray-600">
                Monthly: ₦{formatCurrency(consolidatedReliefData.total / 12)}
              </p>
            </div>
          </div>
          
          <Card className="mt-6 border-blue-200 shadow-md">
            <CardHeader>
                <CardTitle className="text-blue-800 flex items-center">
                    Annual Tax Calculation Summary
                     <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <HelpCircle className="w-4 h-4 ml-2 text-gray-400 cursor-pointer" />
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Taxable Income = Gross - (CRA + Pension + NHF)</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                    <div className="space-y-2 text-sm pr-4">
                        <div className="flex justify-between"><span>Total Annual Gross Pay:</span> <span>₦{formatCurrency(totalGrossPay)}</span></div>
                        <div className="flex justify-between text-red-600"><span>Less: Consolidated Relief:</span> <span>(₦{formatCurrency(consolidatedReliefData.total)})</span></div>
                        <div className="flex justify-between text-red-600"><span>Less: Annual Pension:</span> <span>(₦{formatCurrency(annualPensionDeduction)})</span></div>
                        <div className="flex justify-between text-red-600"><span>Less: Annual NHF:</span> <span>(₦{formatCurrency(annualNHFDeduction)})</span></div>
                        <div className="flex justify-between font-bold border-t pt-2 mt-2"><span>Annual Taxable Income:</span> <span>₦{formatCurrency(annualPAYEData.taxableIncome)}</span></div>
                    </div>
                    <div>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                <TableHead>Tax Bracket</TableHead>
                                <TableHead>Rate</TableHead>
                                <TableHead className="text-right">Tax Payable (₦)</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {annualPAYEData.breakdown.map((item, index) => (
                                    <TableRow key={index}>
                                        <TableCell className="text-xs">{item.tier}</TableCell>
                                        <TableCell className="text-xs">{item.rate}</TableCell>
                                        <TableCell className="text-xs text-right">{formatCurrency(item.tax)}</TableCell>
                                    </TableRow>
                                ))}
                                <TableRow className="bg-gray-100 font-bold">
                                    <TableCell colSpan={2}>Total Annual PAYE Tax</TableCell>
                                    <TableCell className="text-right">₦{formatCurrency(annualPAYEData.tax)}</TableCell>
                                </TableRow>
                                <TableRow className="bg-blue-50 font-bold">
                                    <TableCell colSpan={2}>Effective Monthly PAYE Tax</TableCell>
                                    <TableCell className="text-right text-blue-700">₦{formatCurrency(annualPAYEData.tax / 12)}</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </CardContent>
          </Card>


          {/* Bank and Emergency Contact sections */}
          <h3 className="font-semibold text-lg text-gray-800 border-b pb-2 mt-6">Bank Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bank_name">Bank Name</Label>
              <Input id="bank_name" value={formData.bank_name} onChange={(e) => handleInputChange("bank_name", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="account_number">Account Number</Label>
              <Input id="account_number" value={formData.account_number} onChange={(e) => handleInputChange("account_number", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="account_name">Account Name</Label>
              <Input id="account_name" value={formData.account_name} onChange={(e) => handleInputChange("account_name", e.target.value)} />
            </div>
          </div>
          
          <h3 className="font-semibold text-lg text-gray-800 border-b pb-2 mt-6">Emergency Contact & Next of Kin</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
             <div className="space-y-2">
              <Label htmlFor="beneficiary_name">Beneficiary Name</Label>
              <Input id="beneficiary_name" value={formData.beneficiary_name} onChange={(e) => handleInputChange("beneficiary_name", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="beneficiary_relationship">Beneficiary Relationship</Label>
              <Input id="beneficiary_relationship" value={formData.beneficiary_relationship} onChange={(e) => handleInputChange("beneficiary_relationship", e.target.value)} />
            </div>
             <div className="space-y-2">
              <Label htmlFor="beneficiary_phone">Beneficiary Phone</Label>
              <Input id="beneficiary_phone" value={formData.beneficiary_phone} onChange={(e) => handleInputChange("beneficiary_phone", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="next_of_kin_name">Next of Kin Name</Label>
              <Input id="next_of_kin_name" value={formData.next_of_kin_name} onChange={(e) => handleInputChange("next_of_kin_name", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="next_of_kin_relationship">Next of Kin Relationship</Label>
              <Input id="next_of_kin_relationship" value={formData.next_of_kin_relationship} onChange={(e) => handleInputChange("next_of_kin_relationship", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="next_of_kin_phone">Next of Kin Phone</Label>
              <Input id="next_of_kin_phone" value={formData.next_of_kin_phone} onChange={(e) => handleInputChange("next_of_kin_phone", e.target.value)} />
            </div>
             <div className="space-y-2 col-span-1 md:col-span-2">
              <Label htmlFor="next_of_kin_address">Next of Kin Address</Label>
              <Input id="next_of_kin_address" value={formData.next_of_kin_address} onChange={(e) => handleInputChange("next_of_kin_address", e.target.value)} />
            </div>
          </div>

          {/* User Account Creation - Only shows for new employees */}
          {!employee && (
            <>
              <h3 className="font-semibold text-lg text-gray-800 border-b pb-2 mt-6">User Account Setup</h3>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="createUserAccount"
                    checked={createUserAccount}
                    onCheckedChange={setCreateUserAccount}
                    className="mt-1"
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor="createUserAccount"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center"
                    >
                      <UserPlus className="w-4 h-4 mr-2 text-blue-600"/>
                      Create User Account for this Employee
                    </label>
                    <p className="text-sm text-muted-foreground">
                      This will create a user profile, granting access to the Employee Self-Service Portal. An email will be sent with instructions to log in via their Google account.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

        </form>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSubmit} className="bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white shadow-lg shadow-blue-700/25">Save</Button>
      </CardFooter>
    </Card>
  );
}
