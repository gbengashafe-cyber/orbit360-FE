import { employeeService } from '@/api';
import { useDebounce } from '@/api/apiClient';
import { departmentService } from '@/api/department.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { CanceledError } from 'axios';
import { Command } from 'cmdk';
import { format, parseISO } from 'date-fns';
import { Check, ChevronsUpDown, HelpCircle, Loader2, UserPlus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { LoanUtil } from '../cooperative/loan.utils';
import { EmployeeUtil } from './employee.utils';
import EmployeeLoans from './EmployeeLoans';

export default function EmployeeForm({ employee, onSubmit, onCancel, allDepartments = [], jobRoles = [] }) {
  const [employeeLoans, setEmployeeLoans] = useState([]);
  const [query, setQuery] = useState('');
  const [departmentEmployees, setDepartmentEmployees] = useState([]);
  const [createUserAccount, setCreateUserAccount] = useState(true);
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState(
    employee
      ? {
          ...employee,
          hireDate: employee.hireDate ? format(parseISO(employee.hireDate), 'yyyy-MM-dd') : '',
          dob: employee.dob ? format(parseISO(employee.dob), 'yyyy-MM-dd') : '',
        }
      : {
          employeeId: '',
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          gender: '',
          dob: '',
          nationality: 'Nigerian',
          address: '',
          departmentName: 'hr',
          jobRole: '',
          status: 'active',
          hireDate: '',
          supervisorId: '',
          supervisorName: '',
          supervisorRole: '',
          supervisorDepartment: '',
          annualBasicSalary: null,
          annualHousingAllowance: null,
          annualTransportAllowance: null,
          annualLeaveAllowance: null,
          annualOtherAllowances: null,
          pensionApplicable: true,
          pensionRate: 8,
          nhfApplicable: true,
          nhfRate: 2.5,
          bankName: '',
          bankCode: '',
          accountNumber: '',
          accountName: '',
          beneficiaryName: '',
          beneficiaryRelationship: '',
          beneficiaryPhone: '',
          nextOfKinName: '',
          nextOfKinRelationship: '',
          nextOfKinPhone: '',
          nextOfKinAddress: '',
          leaveEntitlement: 22,
        },
  );
  const debouncedQuery = useDebounce(query, 600);

  // Map job roles to departments
  const getExpectedDepartmentForJobRole = (jobRole) => {
    if (!jobRole) return null;
    const lowerJobRole = jobRole.toLowerCase();
    
    if (lowerJobRole.includes('hr') || lowerJobRole.includes('human')) return 'HR';
    if (lowerJobRole.includes('engineer')) return 'Engineering';
    if (lowerJobRole.includes('sales')) return 'Sales';
    if (lowerJobRole.includes('operation')) return 'Operations';
    if (lowerJobRole.includes('finance') || lowerJobRole.includes('accounting')) return 'Finance';
    if (lowerJobRole.includes('market')) return 'Marketing';
    return null;
  };

  useEffect(() => {
    const controller = new AbortController();

    const loadSupervisors = async (signal) => {
      setIsLoading(true);
      try {
        // Load all employees to use as potential supervisors
        const allEmpsResponse = await employeeService.getEmployees(
          {
            page: 1,
            rows: 500,
          },
          { signal },
        );

        // Filter out the current employee being edited
        let supervisors = allEmpsResponse.data || [];
        if (employee?.id) {
          supervisors = supervisors.filter(emp => emp.id !== employee.id);
        }

        // Filter by search query on client side (name, email, phone)
        if (debouncedQuery) {
          const query = debouncedQuery.toLowerCase();
          supervisors = supervisors.filter(emp => 
            (emp.firstName && emp.firstName.toLowerCase().includes(query)) ||
            (emp.lastName && emp.lastName.toLowerCase().includes(query)) ||
            (emp.email && emp.email.toLowerCase().includes(query)) ||
            (emp.phone && emp.phone.includes(query))
          );
        }

        setDepartmentEmployees(supervisors);
      } catch (error) {
        if (error instanceof CanceledError) {
          return;
        }
        toast.error('Error:', {
          description: `${error.message ? error.message : 'Could not load supervisors.'}`,
        });
      } finally {
        setIsLoading(false);
      }
    };
    loadSupervisors(controller.signal);

    return () => {
      controller.abort();
    };
  }, [debouncedQuery, employee?.id]);

  useEffect(() => {
    async function loadData() {
      try {
        if (employee?.id) {
          const employeeData = await employeeService.getEmployeeById(employee.id);
          const activeLoans = employeeData.data.loans.filter((l) => l.status === 'active');
          setEmployeeLoans(activeLoans);
        }
      } catch (error) {
        toast.log('Error', { description: `${error.message ? error.message : 'Unable to load employee loan data'}` });
      }
    }
    loadData();
  }, [employee]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const totalGrossPay = EmployeeUtil.calculateTotalGrossPay(formData);
    const submissionData = {
      ...formData,
      annualBasicSalary: parseFloat(formData.annualBasicSalary) || 0,
      annualHousingAllowance: parseFloat(formData.annualHousingAllowance) || 0,
      annualTransportAllowance: parseFloat(formData.annualTransportAllowance) || 0,
      annualLeaveAllowance: parseFloat(formData.annualLeaveAllowance) || 0,
      annualOtherAllowances: parseFloat(formData.annualOtherAllowances) || 0,
      pensionApplicable: formData.pensionApplicable !== false,
      pensionRate: 8,
      nhfRate: 2.5,
      nhfApplicable: Boolean(formData.nhfApplicable),
      totalAnnualGrossPay: parseFloat(totalGrossPay.toFixed(2)),
      supervisorId: String(formData.supervisorId || ''),
    };
    onSubmit({ employeeData: submissionData, createUser: !employee && createUserAccount });
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => {
      const newFormData = { ...prev, [field]: value };

      if (field === 'annualBasicSalary') {
        const basicSalary = parseFloat(value) || 0;
        newFormData.annualLeaveAllowance = basicSalary * 0.1;
      }
      return newFormData;
    });
  };

  const handleSupervisorChange = (supervisorId) => {
    const selectedSupervisor = departmentEmployees.find((emp) => emp.id === supervisorId);
    if (selectedSupervisor) {
      setFormData((prev) => ({
        ...prev,
        supervisorId: selectedSupervisor.id,
        supervisorName: `${selectedSupervisor.firstName} ${selectedSupervisor.lastName}`,
        supervisorRole: selectedSupervisor.jobRole,
        supervisorDepartment: selectedSupervisor.departmentName,
        // Don't auto-populate the employee's department - let it stay as selected
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        supervisorId: null,
        supervisorName: '',
        supervisorRole: '',
        supervisorDepartment: '',
      }));
    }
  };

  const totalGrossPay = EmployeeUtil.calculateTotalGrossPay(formData);
  const annualPensionDeduction = EmployeeUtil.calculatePensionDeduction(formData);
  const annualNHFDeduction = EmployeeUtil.calculateNHFDeduction(formData);
  const annualPAYEData = EmployeeUtil.calculatePAYE(formData);

  const totalMonthlyLoanDeduction = employeeLoans.reduce(
    (sum, loan) => sum + (LoanUtil.calculations(loan).monthlyDeduction || 0),
    0,
  );
  const totalAnnualLoanDeduction = totalMonthlyLoanDeduction * 12;

  const monthlyGross = totalGrossPay / 12;
  const monthlyPension = annualPensionDeduction / 12;
  const monthlyNHF = annualNHFDeduction / 12;
  const monthlyTax = annualPAYEData.tax / 12;
  const monthlyNetSalary = monthlyGross - monthlyPension - monthlyNHF - monthlyTax - totalMonthlyLoanDeduction;

  const annualNetSalary = monthlyNetSalary * 12;

  const formatCurrency = (value) =>
    (value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <Card className="bg-white/90 backdrop-blur-sm border-slate-200/60 shadow-2xl shadow-slate-200/60 mt-6">
      <CardHeader>
        <CardTitle>{employee ? `Edit Employee: ${employee.firstName} ${employee.lastName}` : 'Create New Employee'}</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <h3 className="font-semibold text-lg text-gray-800 border-b pb-2">Personal Information</h3>
          {/* Personal Information Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Employee ID */}
            <div className="space-y-2">
              <Label htmlFor="employeeId">Employee ID *</Label>
              <Input
                id="employeeId"
                value={formData.employeeId}
                onChange={(e) => handleInputChange('employeeId', e.target.value)}
                required
              />
            </div>
            {/* First Name */}
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                required
              />
            </div>
            {/* Last Name */}
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                required
              />
            </div>
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
              />
            </div>
            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Phone *</Label>
              <Input id="phone" value={formData.phone} onChange={(e) => handleInputChange('phone', e.target.value)} />
            </div>
            {/* Date of Birth */}
            <div className="space-y-2">
              <Label htmlFor="dob">Date of Birth *</Label>
              <Input id="dob" type="date" value={formData.dob} onChange={(e) => handleInputChange('dob', e.target.value)} />
            </div>
            {/* Gender */}
            <div className="space-y-2">
              <Label htmlFor="gender">Gender *</Label>
              <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                <SelectTrigger id="gender">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="M">Male</SelectItem>
                  <SelectItem value="F">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Nationality */}
            <div className="space-y-2">
              <Label htmlFor="nationality">Nationality</Label>
              <Input
                id="nationality"
                value={formData.nationality}
                onChange={(e) => handleInputChange('nationality', e.target.value)}
              />
            </div>
            {/* Home Address */}
            <div className="space-y-2 col-span-1 md:col-span-2">
              <Label htmlFor="address">Home Address</Label>
              <Input id="address" value={formData.address} onChange={(e) => handleInputChange('address', e.target.value)} />
            </div>
          </div>

          <h3 className="font-semibold text-lg text-gray-800 border-b pb-2 mt-6">Employment Details</h3>
          {/* Employment Details Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hireDate">Hire Date *</Label>
              <Input
                id="hireDate"
                type="date"
                value={formData.hireDate}
                onChange={(e) => handleInputChange('hireDate', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="departmentName">Department</Label>
              <Select value={formData.departmentName} onValueChange={(value) => handleInputChange('departmentName', value)}>
                <SelectTrigger id="departmentName">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {allDepartments.map((_department) => (
                    <SelectItem key={_department.id} value={_department.name}>
                      {_department.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="jobRole">Job Role</Label>

              <Select value={formData.jobRole} onValueChange={(value) => handleInputChange('jobRole', value)}>
                <SelectTrigger id="jobRole">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {jobRoles.map((_jobRole) => {
                    return (
                      <SelectItem key={_jobRole.id} value={_jobRole.title}>
                        {_jobRole.title}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            {formData.id ? (
              <div className="space-y-2">
                <Label htmlFor="status">Employment Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="terminated">Terminated</SelectItem>
                    <SelectItem value="on_leave">On Leave</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : null}
          </div>

          <h3 className="font-semibold text-lg text-gray-800 border-b pb-2 mt-6">Reporting Line</h3>
          {/* Reporting Line Fields */}
          <div className="flex gap-4">
            <div className="flex-1 space-y-2">
              {/* Supervisor Search Field */}
              <div className="space-y-2">
                <Label htmlFor="supervisor">Supervisor</Label>
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      id="supervisor"
                      variant="outline"
                      role="combobox"
                      aria-expanded={open}
                      className="w-full justify-between font-normal border-slate-200"
                    >
                      {formData.supervisorId ? formData.supervisorName : 'Select supervisor...'}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                    <Command shouldFilter={false}>
                      <CommandInput placeholder="Search by name, email..." value={query} onValueChange={setQuery} />
                      <CommandList className="max-h-[300px] overflow-y-auto">
                        {isLoading ? (
                          <div className="flex items-center justify-center py-6">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            <span className="ml-2 text-sm text-muted-foreground">Searching...</span>
                          </div>
                        ) : (
                          <>
                            {departmentEmployees.length === 0 && query.length > 0 ? (
                              <CommandEmpty>No supervisor found.</CommandEmpty>
                            ) : departmentEmployees.length === 0 ? (
                              <div className="py-6 text-center text-sm text-muted-foreground">Start typing to search...</div>
                            ) : (
                              <CommandGroup>
                                {departmentEmployees.map((emp) => (
                                  <CommandItem
                                    key={emp.id}
                                    value={emp.id}
                                    onSelect={() => {
                                      handleSupervisorChange(emp.id);
                                      setOpen(false);
                                      setQuery('');
                                    }}
                                    className="flex flex-col items-start py-2"
                                  >
                                    <div className="flex items-center w-full">
                                      <Check
                                        className={cn(
                                          'mr-2 h-4 w-4',
                                          formData.supervisorId === emp.id ? 'opacity-100' : 'opacity-0',
                                        )}
                                      />
                                      <span className="font-medium">
                                        {emp.firstName} {emp.lastName}
                                      </span>
                                    </div>
                                    <span className="text-xs text-muted-foreground ml-6">
                                      {emp.jobRole} • {emp.departmentName}
                                    </span>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            )}
                          </>
                        )}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                </div>
                </div>
                <div className="flex-1 space-y-2">
                <Label htmlFor="supervisor_department">Supervisor Department</Label>
                <Input 
                id="supervisor_department" 
                value={formData.supervisorDepartment} 
                readOnly 
                className="bg-gray-100" 
                placeholder="Department will auto-populate"
                />
                </div>
                </div>

              <h3 className="font-semibold text-lg text-gray-800 border-b pb-2 mt-6">Compensation & Benefits (Annual)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="annualBasicSalary">Annual Basic Salary (₦) *</Label>
              <Input
                id="annualBasicSalary"
                type="number"
                value={formData.annualBasicSalary}
                onChange={(e) => handleInputChange('annualBasicSalary', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="annualHousingAllowance">Annual Housing Allowance (₦)</Label>
              <Input
                id="annualHousingAllowance"
                type="number"
                value={formData.annualHousingAllowance}
                onChange={(e) => handleInputChange('annualHousingAllowance', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="annualTransportAllowance">Annual Transport Allowance (₦)</Label>
              <Input
                id="annualTransportAllowance"
                type="number"
                value={formData.annualTransportAllowance}
                onChange={(e) => handleInputChange('annualTransportAllowance', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="annualLeaveAllowance">Annual Leave Allowance (₦)</Label>
              <Input
                id="annualLeaveAllowance"
                type="number"
                value={formData.annualLeaveAllowance}
                disabled
                className="bg-gray-100"
              />
              <p className="text-xs text-gray-400">10% of Basic Salary</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="annualOtherAllowances">Other Allowances (Annual, ₦)</Label>
              <Input
                id="annualOtherAllowances"
                type="number"
                value={formData.annualOtherAllowances}
                onChange={(e) => handleInputChange('annualOtherAllowances', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="leaveEntitlement">Leave Entitlement (Annual - Days)</Label>
              <Input
                id="leaveEntitlement"
                type="number"
                value={formData.leaveEntitlement}
                onChange={(e) => handleInputChange('leaveEntitlement', e.target.value)}
              />
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
              <Input id="pension_rate" type="number" value="8" disabled className="bg-gray-100 cursor-not-allowed" />
              <p className="text-xs text-gray-500 font-medium">Annual: ₦{formatCurrency(annualPensionDeduction)}</p>
              <p className="text-xs text-gray-500">Monthly: ₦{formatCurrency(annualPensionDeduction / 12)}</p>
              <p className="text-xs text-gray-400">Based on Basic + Housing + Transport</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="pensionApplicable"
                  checked={formData.pensionApplicable !== false}
                  onCheckedChange={(checked) => handleInputChange('pensionApplicable', checked)}
                />
                <Label htmlFor="pensionApplicable" className="text-base font-normal">
                  Apply Pension Deduction (8%)
                </Label>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="nhfApplicable"
                  checked={formData.nhfApplicable}
                  onCheckedChange={(checked) => handleInputChange('nhfApplicable', checked)}
                />
                <Label htmlFor="nhfApplicable" className="text-base font-normal">
                  Apply NHF Deduction (2.5%)
                </Label>
              </div>
              <p className="text-xs text-gray-500 font-medium">Annual: ₦{formatCurrency(annualNHFDeduction)}</p>
              <p className="text-xs text-gray-500">Monthly: ₦{formatCurrency(annualNHFDeduction / 12)}</p>
              <p className="text-xs text-gray-400">Based on Basic Salary only</p>
            </div>
          </div>

          {employee && employeeLoans.length > 0 ? (
            <EmployeeLoans
              employeeLoans={employeeLoans}
              totalAnnualLoanDeduction={totalAnnualLoanDeduction}
              totalMonthlyLoanDeduction={totalMonthlyLoanDeduction}
            />
          ) : null}

          <Card className="mt-6 border-blue-200 shadow-lg bg-blue-50/30 sticky top-4 z-10">
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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-6">
                <div className="space-y-3 text-sm">
                  <h4 className="font-semibold text-base mb-4 text-gray-800">Income & Deductions Breakdown</h4>
                  <div className="flex justify-between py-1">
                    <span className="font-medium">Total Annual Gross Pay:</span>{' '}
                    <span className="font-semibold">₦{formatCurrency(totalGrossPay)}</span>
                  </div>
                  {formData.pensionApplicable !== false && (
                    <div className="flex justify-between text-red-600 py-1">
                      <span>Less: Annual Pension (8%):</span> <span>(₦{formatCurrency(annualPensionDeduction)})</span>
                    </div>
                  )}
                  {formData.nhfApplicable && (
                    <div className="flex justify-between text-red-600 py-1">
                      <span>Less: Annual NHF (2.5%):</span> <span>(₦{formatCurrency(annualNHFDeduction)})</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-base border-t-2 pt-3 mt-3 text-blue-900">
                    <span>Annual Taxable Income:</span>
                    <span>₦{formatCurrency(annualPAYEData.taxableIncome)}</span>
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
                          <TableCell className="text-xs text-right">₦{formatCurrency(item.taxablePortion)}</TableCell>
                          <TableCell className="text-xs text-center font-medium">{item.rate}</TableCell>
                          <TableCell className="text-xs text-right font-semibold">₦{formatCurrency(item.tax)}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-blue-100 font-bold border-t-2">
                        <TableCell colSpan={4} className="text-sm py-3">
                          Total Annual PAYE Tax
                        </TableCell>
                        <TableCell className="text-right text-sm py-3">₦{formatCurrency(annualPAYEData.tax)}</TableCell>
                      </TableRow>
                      <TableRow className="bg-green-100 font-bold border-t-2">
                        <TableCell colSpan={4} className="text-sm py-3 text-green-800">
                          Monthly PAYE Tax
                          <div className="text-xs font-normal text-gray-600 mt-1">
                            (₦{formatCurrency(annualPAYEData.tax)} ÷ 12)
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-sm py-3 text-green-800">
                          ₦{formatCurrency(annualPAYEData.tax / 12)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>

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
                      <span className="font-semibold">₦{formatCurrency(monthlyGross)}</span>
                    </div>
                    <div className="border-t pt-2 space-y-1 text-red-600">
                      {formData.pensionApplicable !== false && (
                        <div className="flex justify-between">
                          <span>Less: Pension (8%):</span> <span>(₦{formatCurrency(monthlyPension)})</span>
                        </div>
                      )}
                      {formData.nhfApplicable && (
                        <div className="flex justify-between">
                          <span>Less: NHF (2.5%):</span> <span>(₦{formatCurrency(monthlyNHF)})</span>
                        </div>
                      )}
                      {totalMonthlyLoanDeduction > 0 && (
                        <div className="flex justify-between font-semibold">
                          <span>Less: Loan Deduction:</span> <span>(₦{formatCurrency(totalMonthlyLoanDeduction)})</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Less: PAYE Tax:</span> <span>(₦{formatCurrency(monthlyTax)})</span>
                      </div>
                    </div>
                    <div className="flex justify-between font-bold text-lg border-t-2 pt-3 text-green-800">
                      <span>Monthly Net Salary:</span>
                      <span>₦{formatCurrency(monthlyNetSalary)}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold text-base mb-3 text-gray-800">Annual Net Salary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between py-1 text-green-700">
                      <span className="font-medium">Annual Gross:</span>{' '}
                      <span className="font-semibold">₦{formatCurrency(totalGrossPay)}</span>
                    </div>
                    <div className="border-t pt-2 space-y-1 text-red-600">
                      {formData.pensionApplicable !== false && (
                        <div className="flex justify-between">
                          <span>Less: Pension:</span> <span>(₦{formatCurrency(annualPensionDeduction)})</span>
                        </div>
                      )}
                      {formData.nhfApplicable && (
                        <div className="flex justify-between">
                          <span>Less: NHF:</span> <span>(₦{formatCurrency(annualNHFDeduction)})</span>
                        </div>
                      )}
                      {totalAnnualLoanDeduction > 0 && (
                        <div className="flex justify-between font-semibold">
                          <span>Less: Loan Deduction:</span> <span>(₦{formatCurrency(totalAnnualLoanDeduction)})</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Less: PAYE Tax:</span> <span>(₦{formatCurrency(annualPAYEData.tax)})</span>
                      </div>
                    </div>
                    <div className="flex justify-between font-bold text-lg border-t-2 pt-3 text-green-800">
                      <span>Annual Net Salary:</span>
                      <span>₦{formatCurrency(annualNetSalary)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bank and Emergency Contact sections */}
          <h3 className="font-semibold text-lg text-gray-800 border-b pb-2 mt-6">Bank Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bankName">Bank Name</Label>
              <Input id="bankName" value={formData.bankName} onChange={(e) => handleInputChange('bankName', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bankCode">Bank Code</Label>
              <Input id="bankCode" value={formData.bankCode} onChange={(e) => handleInputChange('bankCode', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accountNumber">Account Number</Label>
              <Input
                id="accountNumber"
                value={formData.accountNumber}
                onChange={(e) => handleInputChange('accountNumber', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accountName">Account Name</Label>
              <Input
                id="accountName"
                value={formData.accountName}
                onChange={(e) => handleInputChange('accountName', e.target.value)}
              />
            </div>
          </div>

          <h3 className="font-semibold text-lg text-gray-800 border-b pb-2 mt-6">Emergency Contact & Next of Kin</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div className="space-y-2">
              <Label htmlFor="beneficiaryName">Beneficiary Name</Label>
              <Input
                id="beneficiaryName"
                value={formData.beneficiaryName}
                onChange={(e) => handleInputChange('beneficiaryName', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="beneficiaryRelationship">Beneficiary Relationship</Label>
              <Input
                id="beneficiaryRelationship"
                value={formData.beneficiaryRelationship}
                onChange={(e) => handleInputChange('beneficiaryRelationship', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="beneficiaryPhone">Beneficiary Phone</Label>
              <Input
                id="beneficiaryPhone"
                value={formData.beneficiaryPhone}
                onChange={(e) => handleInputChange('beneficiaryPhone', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nokName">Next of Kin Name</Label>
              <Input id="nokName" value={formData.nokName} onChange={(e) => handleInputChange('nokName', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nokRelationship">Next of Kin Relationship</Label>
              <Input
                id="nokRelationship"
                value={formData.nokRelationship}
                onChange={(e) => handleInputChange('nokRelationship', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nokPhone">Next of Kin Phone</Label>
              <Input id="nokPhone" value={formData.nokPhone} onChange={(e) => handleInputChange('nokPhone', e.target.value)} />
            </div>
            <div className="space-y-2 col-span-1 md:col-span-2">
              <Label htmlFor="nokAddress">Next of Kin Address</Label>
              <Input
                id="nokAddress"
                value={formData.nokAddress}
                onChange={(e) => handleInputChange('nokAddress', e.target.value)}
              />
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
                      <UserPlus className="w-4 h-4 mr-2 text-blue-600" />
                      Create User Account for this Employee
                    </label>
                    <p className="text-sm text-muted-foreground">
                      This will create a user profile, granting access to the Employee Self-Service Portal. An email will be sent
                      with instructions to log in via their Google account.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="flex justify-end gap-2 mt-8 pt-6 border-t">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white shadow-lg shadow-blue-700/25"
            >
              {employee ? 'Update Employee' : 'Save Employee'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
