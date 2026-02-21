const headers = [
  'Employee Name',
  'Employee ID',
  'Position',
  'Department',
  'Basic Salary',
  'Housing Allowance',
  'Transport Allowance',
  'Leave Allowance',
  'Other Allowances',
  'Gross Salary',
  'Pension Deduction',
  'NHF Deduction',
  'Loan Deduction',
  'PAYE Tax',
  'Total Deductions',
  'Net Salary',
  'Bank Name',
  'Account Number',
  'Status',
];

export const generatePayrollCSV = (currentPeriodRecords) => {
  const csvContent = [
    headers.join(','),
    ...currentPeriodRecords.map((record) => {
      const employee = record.employee;
      return [
        `"${employee?.firstName || ''} ${employee?.lastName || ''}"`,
        employee?.employeeId || '',
        employee?.jobRole || '',
        employee?.department?.name || '',
        (record.basicSalary || 0).toFixed(2),
        (record.housingAllowance || 0).toFixed(2),
        (record.transportAllowance || 0).toFixed(2),
        (record.leaveAllowance || 0).toFixed(2),
        (record.otherAllowance || 0).toFixed(2),
        (record.grossSalary || 0).toFixed(2),
        (record.pensionDeduction || 0).toFixed(2),
        (record.nhfDeduction || 0).toFixed(2),
        (record.loanDeduction || 0).toFixed(2),
        (record.payeDeduction || 0).toFixed(2),
        (record.totalDeductions || 0).toFixed(2),
        (record.netSalary || 0).toFixed(2),
        employee?.bankName || '',
        employee?.accountNumber || '',
        record.status || '',
      ].join(',');
    }),
  ].join('\n');

  return csvContent;
};
