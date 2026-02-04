export const EmployeeSchema = {
  module: 'employees',
  sections: [
    {
      title: 'Personal Information',
      fields: [
        { label: 'Staff ID', path: 'staffId', type: 'string' },
        { label: 'First Name', path: 'firstName', type: 'string' },
        { label: 'Last Name', path: 'lastName', type: 'string' },
        { label: 'Email', path: 'email', type: 'string' },
        { label: 'Phone', path: 'phone', type: 'string' },
        { label: 'Date of Birth', path: 'dob', type: 'date' },
        { label: 'Gender', path: 'gender', type: 'string' },
        { label: 'Nationality', path: 'nationality', type: 'string' },
        { label: 'Home Address', path: 'address', type: 'string' },
      ],
    },
    {
      title: 'Employment Details',
      fields: [
        { label: 'Hire Date', path: 'hireDate', type: 'date' },
        { label: 'Department', path: 'departmentName', type: 'string' },
        { label: 'Job Role', path: 'jobRole', type: 'string' },
      ],
    },
    {
      title: 'Reporting Line',
      fields: [
        {
          label: 'Supervisor',
          path: 'supervisor',
          formatter: (emp) => (emp ? `${emp.firstName} ${emp.lastName}` : 'N/A'),
          type: 'string',
        },
      ],
    },
    {
      title: 'Compensation & Benefits (Annual)',
      fields: [
        { label: 'Annual Basic Salary', path: 'annualBasicSalary', type: 'currency' },
        { label: 'Annual Housing Allowance', path: 'annualHousingAllowance', type: 'currency' },
        { label: 'Annual Transport Allowance', path: 'annualTransportAllowance', type: 'currency' },
        { label: 'Annual Leave Allowance', path: 'annualLeaveAllowance', type: 'currency' },
        { label: 'Other Allowances', path: 'annualOtherAllowances', type: 'currency' },
        { label: 'Leave Entitlement (Annual - Days)', path: 'leaveEntitlement', type: 'string' },
      ],
    },
    {
      title: 'Deductions & Relief Configuration (Annual)',
      fields: [
        { label: 'Pension Deduction', path: 'pensionRate', formatter: () => '8', type: 'percentage' },
        {
          label: 'NHF Applicable',
          path: 'nhfApplicable',
          formatter: (val) => (val & JSON.parse(val) ? 'YES' : 'NO'),
          type: 'string',
        },
      ],
    },
    {
      title: 'Bank Information',
      fields: [
        { label: 'Bank Name', path: 'bankName', type: 'string' },
        { label: 'Bank Code', path: 'bankCode', type: 'string' },
        { label: 'Account Number', path: 'accountNumber', type: 'string' },
        { label: 'Account Name', path: 'accountName', type: 'string' },
      ],
    },
    {
      title: 'Emergency Contact & Next of Kin',
      fields: [
        { label: 'Beneficiary Name', path: 'beneficiaryName', type: 'string' },
        { label: 'Beneficiary Relationship', path: 'beneficiaryRelationship', type: 'string' },
        { label: 'Beneficiary Phone', path: 'beneficiaryPhone', type: 'string' },
        { label: 'Bank Code', path: 'bankCode', type: 'string' },
        { label: 'Next of Kin Name', path: 'nokName', type: 'string' },
        { label: 'Next of Kin Relationship', path: 'nokRelationship', type: 'string' },
        { label: 'Next of Kin Phone', path: 'nokPhone', type: 'string' },
        { label: 'Next of Kin Address', path: 'nokAddress', type: 'string' },
      ],
    },
  ],
};
