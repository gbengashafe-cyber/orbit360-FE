export const exitSchema = {
  module: 'exits',
  sections: [
    {
      title: 'Employee',
      fields: [
        { label: 'Staff ID', path: 'employee.staffId', type: 'string' },
        {
          label: 'Employee Name',
          path: 'employee',
          formatter: (value) => `${value.firstName} ${value.lastName}`,
          type: 'string',
        },
        { label: 'Department', path: 'employee.department.name', type: 'string' },
        { label: 'Job Role', path: 'employee.jobRole.title', type: 'string' },
        { label: 'Hire Date', path: 'employee.hireDate', type: 'date' },
      ],
    },
    {
      title: 'Exit Details',
      fields: [
        { label: 'Resignation Date', path: 'resignationDate', type: 'string' },
        { label: 'Status', path: 'status', type: 'badge' },
      ],
    },
  ],
};
