import { employeeService } from '@/api';
import { useDebounce } from '@/api/apiClient';
import { companyService } from '@/api/company.service';
import { departmentService } from '@/api/department.service';
import { FormSubmitErrorV1 } from '@/components/shared/submit-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { logger } from '@/utils';
import { Command } from 'cmdk';
import { format, parseISO } from 'date-fns';
import { Check, ChevronsUpDown, Loader2, UserPlus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { EmployeeLoans } from './employee-form-loans-section';
import { SalaryBreakdown } from './employee-form-salary-breakdown-section';
import { TaxBreakdown } from './employee-form-tax-section';
import { EmployeeUtil } from './employee.utils';
import { useEmployeeCompensation } from './hooks/use-employee-compensation';
import { useSupervisorSearch } from './hooks/use-supervisor-search';

export function EmployeeForm({ showForm, employee, onSubmit, onCancel, error, allCompanies = [] }) {
  const [employeeLoans, setEmployeeLoans] = useState([]);
  const [query, setQuery] = useState('');
  const [shouldCreateUser, setShouldCreateUser] = useState(true);
  const [open, setOpen] = useState(false);
  const [companyDepartments, setCompanyDepartments] = useState([]);
  const [departmentJobRoles, setDepartmentJobRoles] = useState([]);
  const [formData, setFormData] = useState(
    employee
      ? {
          ...employee,
          hireDate: employee.hireDate ? format(parseISO(employee.hireDate), 'yyyy-MM-dd') : '',
          dob: employee.dob ? format(parseISO(employee.dob), 'yyyy-MM-dd') : '',
        }
      : {
          staffId: '',
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          gender: '',
          dob: '',
          nationality: 'Nigerian',
          address: '',
          companyId: '',
          departmentId: '',
          jobRoleId: '',
          hireDate: '',
          supervisorId: '',
          supervisorName: '',
          supervisorRole: '',
          supervisorDepartment: '',
          annualBasicSalary: '',
          annualHousingAllowance: '',
          annualTransportAllowance: '',
          annualLeaveAllowance: '',
          annualOtherAllowances: '',
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
          annualRentAmount: 0,
        },
  );

  const debouncedQuery = useDebounce(query, 600);
  const { employees: departmentEmployees, loading: isLoading } = useSupervisorSearch({
    query: debouncedQuery,
  });

  const compensation = useEmployeeCompensation(formData, employeeLoans);

  useEffect(() => {
    async function loadEmployeeLoans() {
      try {
        if (employee?.id) {
          const employeeData = await employeeService.getEmployeeById(employee.id);
          const activeLoans = employeeData.data.loans.filter((l) => l.status === 'active');
          setEmployeeLoans(activeLoans);
        }
      } catch (error) {
        logger.error({ caller: 'Employee form - load employee data', payload: error });
        toast.error('Error', { description: error.message ?? 'Unable to load employee loan data' });
      }
    }
    loadEmployeeLoans();
  }, [employee?.id]);

  useEffect(() => {
    const loadCompanyDepartments = async () => {
      try {
        if (!formData.companyId) {
          return;
        }
        const response = await companyService.getCompanyDepartments(formData.companyId);
        setCompanyDepartments(response.data?.departments || []);
      } catch (error) {
        logger.error({ caller: 'Employee form - load company departments', payload: error });
        toast.error('Error', { description: error.message ?? 'Error loading company departments' });
      }
    };

    loadCompanyDepartments(formData.companyId);
  }, [formData.companyId]);

  useEffect(() => {
    const loadDepartmentJobRoles = async () => {
      try {
        const response = await departmentService.getDepartmentJobRoles(formData.departmentId, { rows: 100 });
        setDepartmentJobRoles(response.data?.departmentJobRoles || []);
      } catch (error) {
        logger.error({ caller: 'Employee form - load department job roles', payload: error });
        toast.error('Error', { description: error.message ?? 'Unable to load job roles data.' });
      }
    };
    formData.departmentId && loadDepartmentJobRoles();
  }, [formData.departmentId]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const totalGrossPay = compensation.totalGrossPay;
    const submissionData = {
      ...formData,
      annualBasicSalary: parseFloat(formData.annualBasicSalary) || 0,
      annualHousingAllowance: parseFloat(formData.annualHousingAllowance) || 0,
      annualTransportAllowance: parseFloat(formData.annualTransportAllowance) || 0,
      annualLeaveAllowance: parseInt(formData.annualLeaveAllowance) || 0,
      annualOtherAllowances: parseFloat(formData.annualOtherAllowances) || 0,
      annualRentAmount: parseFloat(formData.annualRentAmount) || 0,
      pensionApplicable: formData.pensionApplicable !== false,
      pensionRate: 8,
      nhfRate: 2.5,
      nhfApplicable: Boolean(formData.nhfApplicable),
      totalAnnualGrossPay: parseFloat(totalGrossPay.toFixed(2)),
      supervisorId: String(formData.supervisorId || ''),
    };
    onSubmit({ employeeData: { ...submissionData, shouldCreateUser }, shouldCreateUser: shouldCreateUser });
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => {
      const newFormData = { ...prev, [field]: value };

      if (field === 'annualBasicSalary') {
        const basicSalary = parseFloat(value) || 0;
        newFormData.annualLeaveAllowance = parseFloat(basicSalary * 0.1).toFixed(2);
      }

      if (field === 'annualRentAmount') {
        const annualRentAmount = parseFloat(value) || 0;
        newFormData.annualRentRelief = EmployeeUtil.calculateRentRelief(annualRentAmount);
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
        supervisorDepartment: selectedSupervisor.department?.name,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        supervisorId: null,
      }));
    }
  };

  const getSupervisorName = () => {
    if (!departmentEmployees?.length || !formData.supervisorId) {
      return '';
    }

    const supervisor = departmentEmployees.find((_emp) => _emp.id === formData.supervisorId);
    return `${supervisor.firstName} ${supervisor.lastName}`;
  };

  return (
    <Dialog open={showForm} onOpenChange={onCancel}>
      <DialogContent className="lg:max-w-4xl mx-[2%] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {employee ? `Edit Employee: ${employee.firstName} ${employee.lastName}` : 'Create New Employee'}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {employee ? `Edit Employee: ${employee.firstName} ${employee.lastName}` : 'Create New Employee'}
          </DialogDescription>
        </DialogHeader>
        <div className="px-4">
          <form onSubmit={handleSubmit} className="space-y-6">
            <h3 className="font-semibold text-lg text-gray-800 border-b pb-2">Personal Information</h3>
            {error ? <FormSubmitErrorV1>{error}</FormSubmitErrorV1> : null}
            {/* Personal Information Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Employee ID */}
              <div className="space-y-2">
                <Label htmlFor="staffId">Staff ID *</Label>
                <Input
                  id="staffId"
                  value={formData.staffId}
                  onChange={(e) => handleInputChange('staffId', e.target.value)}
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
                <Label htmlFor="companyId">SBU (Company)</Label>
                <Select value={Number(formData.companyId)} onValueChange={(value) => handleInputChange('companyId', value)}>
                  <SelectTrigger id="companyId">
                    <SelectValue placeholder="Select company" />
                  </SelectTrigger>
                  <SelectContent>
                    {allCompanies.map((_company) => {
                      return (
                        <SelectItem key={_company.id} value={_company.id}>
                          {_company.name}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="departmentId">Department</Label>
                <Select value={Number(formData.departmentId)} onValueChange={(value) => handleInputChange('departmentId', value)}>
                  <SelectTrigger id="departmentId">
                    <SelectValue placeholder="Select employee's department" />
                  </SelectTrigger>
                  <SelectContent>
                    {companyDepartments.length
                      ? companyDepartments.map((_department) => (
                          <SelectItem key={_department.id} value={_department.id}>
                            {_department.name}
                          </SelectItem>
                        ))
                      : null}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="jobRoleId">Job Role</Label>
                <Select value={Number(formData.jobRoleId)} onValueChange={(value) => handleInputChange('jobRoleId', value)}>
                  <SelectTrigger id="jobRoleId">
                    <SelectValue placeholder="Select job role" />
                  </SelectTrigger>
                  <SelectContent>
                    {departmentJobRoles?.length
                      ? departmentJobRoles.map((_jobRole) => {
                          return (
                            <SelectItem key={_jobRole.id} value={_jobRole.id}>
                              {_jobRole.title}
                            </SelectItem>
                          );
                        })
                      : null}
                  </SelectContent>
                </Select>
              </div>
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
              {/* {formData.id ? (
                <div className="space-y-2">
                  <Label htmlFor="status">Employment Status</Label>
                  <Select value={formData.status?.toLowerCase()} onValueChange={(value) => handleInputChange('status', value)}>
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {formData.status.toLowerCase() === 'pending_approval' ? (
                        <SelectItem value="pending_approval">Pending Approval</SelectItem>
                      ) : null}
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                      <SelectItem value="terminated">Terminated</SelectItem>
                      <SelectItem value="on_leave">On Leave</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ) : null} */}
            </div>

            <h3 className="font-semibold text-lg text-gray-800 border-b pb-2 mt-6">Reporting Line</h3>
            {/* Reporting Line Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                {/*  */}

                {/* Supervisor Search Field */}
                <div className="space-y-2 flex flex-col">
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
                        {formData.supervisorId ? getSupervisorName() : 'Select supervisor...'}
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
                              {departmentEmployees?.length === 0 && query.length > 0 ? (
                                <CommandEmpty>No supervisor found.</CommandEmpty>
                              ) : departmentEmployees?.length === 0 ? (
                                <div className="py-6 text-center text-sm text-muted-foreground">Start typing to search...</div>
                              ) : (
                                <CommandGroup>
                                  {departmentEmployees?.map((emp) => (
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
                                        {emp.jobRole?.title} • {emp.department?.name}
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

                {/*  */}
              </div>
            </div>

            <h3 className="font-semibold text-lg text-gray-800 border-b pb-2 mt-6">Compensation & Benefits (Annual)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="annualBasicSalary">Annual Basic Salary (₦) *</Label>
                <Input
                  id="annualBasicSalary"
                  type="number"
                  min={0}
                  step={0.01}
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
                  min={0}
                  step={0.01}
                  value={formData.annualHousingAllowance}
                  onChange={(e) => handleInputChange('annualHousingAllowance', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="annualTransportAllowance">Annual Transport Allowance (₦)</Label>
                <Input
                  id="annualTransportAllowance"
                  type="number"
                  min={0}
                  step={0.01}
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
                  min={0}
                  step={0.01}
                  value={formData.annualOtherAllowances}
                  onChange={(e) => handleInputChange('annualOtherAllowances', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="leaveEntitlement">Leave Entitlement (Annual - Days)</Label>
                <Input
                  id="leaveEntitlement"
                  type="number"
                  min={0}
                  step={0.01}
                  value={formData.leaveEntitlement}
                  onChange={(e) => handleInputChange('leaveEntitlement', e.target.value)}
                />
              </div>
              <div className="bg-blue-50 p-3 rounded-lg flex flex-col justify-center">
                <Label className="text-blue-800">Total Annual Gross Pay</Label>
                <p className="text-xl font-bold text-blue-800">₦{EmployeeUtil.formatCurrency(compensation.totalGrossPay)}</p>
              </div>
            </div>

            <h3 className="font-semibold text-lg text-gray-800 border-b pb-2 mt-6">Deductions & Relief Configuration (Annual)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="annualRentAmount">Rent Amount</Label>
                <Input
                  id="annualRentAmount"
                  type="number"
                  min={0}
                  step={0.01}
                  value={formData.annualRentAmount}
                  onChange={(e) => handleInputChange('annualRentAmount', e.target.value)}
                />
              </div>
              <div className="space-y-2 flex justify-end items-center ">
                <p>
                  <Label>Rent Relief:</Label>
                  <span className="inline-block ms-6">
                    ₦{EmployeeUtil.formatCurrency(EmployeeUtil.calculateRentRelief(formData.annualRentAmount))}
                  </span>
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="pension_rate">Pension Deduction (Fixed at 8%)</Label>
                <Input id="pension_rate" type="number" value="8" disabled className="bg-gray-100 cursor-not-allowed" />
                <p className="text-xs text-gray-500 font-medium">
                  Annual: ₦{EmployeeUtil.formatCurrency(compensation.annualPensionDeduction)}
                </p>
                <p className="text-xs text-gray-500">
                  Monthly: ₦{EmployeeUtil.formatCurrency(compensation.annualPensionDeduction / 12)}
                </p>
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
                <p className="text-xs text-gray-500 font-medium">
                  Annual: ₦{EmployeeUtil.formatCurrency(compensation.annualNHFDeduction)}
                </p>
                <p className="text-xs text-gray-500">
                  Monthly: ₦{EmployeeUtil.formatCurrency(compensation.annualNHFDeduction / 12)}
                </p>
                <p className="text-xs text-gray-400">Based on Basic Salary only</p>
              </div>
            </div>

            {employee && employeeLoans.length > 0 ? (
              <EmployeeLoans
                employeeLoans={employeeLoans}
                totalAnnualLoanDeduction={compensation.totalAnnualLoanDeduction}
                totalMonthlyLoanDeduction={compensation.totalMonthlyLoanDeduction}
              />
            ) : null}

            <TaxBreakdown
              employee={formData}
              totalGrossPay={compensation.totalGrossPay}
              annualPensionDeduction={compensation.annualPensionDeduction}
              annualPAYEData={compensation.annualPAYEData}
              annualNHFDeduction={compensation.annualNHFDeduction}
            />

            <SalaryBreakdown
              formData={formData}
              totalMonthlyLoanDeduction={compensation.totalMonthlyLoanDeduction}
              monthlyGross={compensation.monthlyGross}
              monthlyNetSalary={compensation.monthlyNetSalary}
              monthlyTax={compensation.monthlyTax}
              monthlyPension={compensation.monthlyPension}
              monthlyNHF={compensation.monthlyNHF}
              totalAnnualLoanDeduction={compensation.totalAnnualLoanDeduction}
              totalGrossPay={compensation.totalGrossPay}
              annualNetSalary={compensation.annualNetSalary}
              annualPAYEData={compensation.annualPAYEData}
              annualNHFDeduction={compensation.annualNHFDeduction}
              annualPensionDeduction={compensation.annualPensionDeduction}
            />

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
                  value={formData.beneficiaryName || ''}
                  onChange={(e) => handleInputChange('beneficiaryName', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="beneficiaryRelationship">Beneficiary Relationship</Label>
                <Input
                  id="beneficiaryRelationship"
                  value={formData.beneficiaryRelationship || ''}
                  onChange={(e) => handleInputChange('beneficiaryRelationship', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="beneficiaryPhone">Beneficiary Phone</Label>
                <Input
                  id="beneficiaryPhone"
                  value={formData.beneficiaryPhone || ''}
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
                  value={formData.nokAddress || ''}
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
                      checked={shouldCreateUser}
                      onCheckedChange={setShouldCreateUser}
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
                        This will create a user profile, granting access to the Employee Self-Service Portal. An email will be
                        sent with instructions to log in via their Google account.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {error ? <FormSubmitErrorV1>{error}</FormSubmitErrorV1> : null}

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
        </div>
      </DialogContent>
    </Dialog>
  );
}
