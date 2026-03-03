export const leaveSchema = {
  module: 'Leaves',
  sections: [
    {
      title: 'Leave Information',
      fields: [
        { label: 'Leave Type', path: 'type', formatter: (val) => val?.toUpperCase(), type: 'string' },
        {
          label: 'Employee Name',
          path: 'employee',
          formatter: (emp) => (emp ? `${emp.firstName} ${emp.lastName}` : 'N/A'),
          type: 'string',
        },
        { label: 'Start Date', path: 'startDate', type: 'date' },
        { label: 'End Date', path: 'endDate', type: 'date' },
        { label: 'Reason', path: 'reason', type: 'string' },
      ],
    },
  ],
};
