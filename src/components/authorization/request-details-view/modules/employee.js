export const EmployeeSchema = {
  module: 'employees',
  sections: [
    {
      title: 'Personal Information',
      fields: [
        { label: 'Staff ID', path: 'employeeDraft.staffId', type: 'string' },
        { label: 'First Name', path: 'employeeDraft.firstName', type: 'string' },
        { label: 'Last Name', path: 'employeeDraft.lastName', type: 'string' },
        { label: 'Email', path: 'employeeDraft.email', type: 'string' },
        { label: 'Phone', path: 'employeeDraft.phone', type: 'string' },
        { label: 'Date of Birth', path: 'employeeDraft.dob', type: 'date' },
        { label: 'Gender', path: 'employeeDraft.gender', type: 'string' },
        { label: 'Nationality', path: 'employeeDraft.nationality', type: 'string' },
        { label: 'Home Address', path: 'employeeDraft.address', type: 'string' },
      ],
    },
    {
      title: 'Employment Details',
      fields: [
        { label: 'Hire Date', path: 'employeeDraft.hireDate', type: 'date' },
        { label: 'Department', path: 'employeeDraft.departmentName', type: 'string' },
        { label: 'Job Role', path: 'employeeDraft.jobRole', type: 'string' },
      ],
    },
    {
      title: 'Reporting Line',
      fields: [
        {
          label: 'Supervisor',
          path: 'employeeDraft.supervisor',
          formatter: (emp) => (emp ? `${emp.firstName} ${emp.lastName}` : 'N/A'),
          type: 'string',
        },
      ],
    },
    {
      title: 'Compensation & Benefits (Annual)',
      fields: [
        { label: 'Annual Basic Salary', path: 'employeeDraft.annualBasicSalary', type: 'currency' },
        { label: 'Annual Housing Allowance', path: 'employeeDraft.annualHousingAllowance', type: 'currency' },
        { label: 'Annual Transport Allowance', path: 'employeeDraft.annualTransportAllowance', type: 'currency' },
        { label: 'Annual Leave Allowance', path: 'employeeDraft.annualLeaveAllowance', type: 'currency' },
        { label: 'Other Allowances', path: 'employeeDraft.annualOtherAllowances', type: 'currency' },
        { label: 'Leave Entitlement (Annual - Days)', path: 'employeeDraft.leaveEntitlement', type: 'string' },
      ],
    },
    {
      title: 'Deductions & Relief Configuration (Annual)',
      fields: [
        { label: 'Pension Deduction', path: 'pensionRate', formatter: () => '8', type: 'percentage' },
        {
          label: 'NHF Applicable',
          path: 'employeeDraft',
          formatter: (val) => (val & val.nhfApplicable ? 'YES' : 'NO'),
          type: 'string',
        },
      ],
    },
    {
      title: 'Bank Information',
      fields: [
        { label: 'Bank Name', path: 'employeeDraft.bankName', type: 'string' },
        { label: 'Bank Code', path: 'employeeDraft.bankCode', type: 'string' },
        { label: 'Account Number', path: 'employeeDraft.accountNumber', type: 'string' },
        { label: 'Account Name', path: 'employeeDraft.accountName', type: 'string' },
      ],
    },
    {
      title: 'Emergency Contact & Next of Kin',
      fields: [
        { label: 'Beneficiary Name', path: 'employeeDraft.beneficiaryName', type: 'string' },
        { label: 'Beneficiary Relationship', path: 'employeeDraft.beneficiaryRelationship', type: 'string' },
        { label: 'Beneficiary Phone', path: 'employeeDraft.beneficiaryPhone', type: 'string' },
        { label: 'Bank Code', path: 'employeeDraft.bankCode', type: 'string' },
        { label: 'Next of Kin Name', path: 'employeeDraft.nokName', type: 'string' },
        { label: 'Next of Kin Relationship', path: 'employeeDraft.nokRelationship', type: 'string' },
        { label: 'Next of Kin Phone', path: 'employeeDraft.nokPhone', type: 'string' },
        { label: 'Next of Kin Address', path: 'employeeDraft.nokAddress', type: 'string' },
      ],
    },
  ],
};
