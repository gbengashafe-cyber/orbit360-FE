export const loanSchema = {
  module: 'loans',
  sections: [
    {
      title: 'Employee Information',
      fields: [
        { label: 'Staff ID', path: 'employee.staffId', type: 'string' },
        {
          label: 'Employee Name',
          path: 'employee',
          formatter: (emp) => (emp ? `${emp.firstName} ${emp.lastName}` : 'N/A'),
          type: 'string',
        },
        { label: 'Employee Email', path: 'employee.email', type: 'string' },
      ],
    },
    {
      title: 'Loan Details',
      fields: [
        { label: 'Loan Type', path: 'loanType.name', type: 'string' },
        {
          label: 'Loan Amount',
          type: 'currency',
          path: 'principalAmount',
        },
        { label: 'Interest Rate', path: 'interestRate', type: 'percentage' },
        { label: 'Tenure (Months)', path: 'tenureMonths', type: 'number' },
        { label: 'Start Date', path: 'startDate', type: 'date' },
        {
          label: 'End Date',
          path: '_calculations.endDate',
          type: 'date',
        },
        {
          label: 'Monthly Deduction',
          path: '_calculations.monthlyDeduction',
          type: 'currency',
        },
        {
          label: 'Total Repayment',
          path: '_calculations.totalRepayment',
          type: 'currency',
        },
        {
          label: "Employee's Note",
          path: 'employeeNote',
          formatter: (_value) => (_value === '' ? '-' : _value),
          type: 'string',
          fullWidth: true,
        },
        {
          label: "Reviewer's Note",
          path: 'reviewerNote',
          formatter: (_value) => (_value === '' ? '-' : _value),
          type: 'string',
          fullWidth: true,
        },
        { label: "Reviewer's Recommendation", path: 'reviewerDecision', type: 'string' },
      ],
    },
  ],
};
