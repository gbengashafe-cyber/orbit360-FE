export const loanSchema = {
  module: 'loans',
  sections: [
    {
      title: 'Employee Information',
      fields: [
        {
          label: 'Employee Name',
          path: 'employee',
          formatter: (emp) => (emp ? `${emp.firstName} ${emp.lastName}` : 'N/A'),
          type: 'string',
        },
        { label: 'Employee Email', path: 'employee.email', type: 'string' },
        {
          label: 'Loan Amount',
          type: 'currency',
          path: 'principalAmount',
        },
        { label: 'Interest Rate', path: 'interestRate', type: 'percentage' },
        { label: 'Tenure (Months)', path: 'tenureMonths', type: 'number' },
        { label: 'Start Date', path: 'startDate', type: 'date' },
        { label: 'Status', path: 'status', type: 'badge' },
      ],
    },
  ],
};
