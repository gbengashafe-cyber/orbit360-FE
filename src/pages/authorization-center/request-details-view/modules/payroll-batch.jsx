export const payrollBatchSchema = {
  module: 'payrolls',
  sections: [
    {
      title: 'Batch Details',
      fields: [
        { label: 'Batch Reference', path: 'batchId', type: 'string' },
        { label: 'Pay Period', path: 'payPeriod', type: 'string' },
        { label: 'Record Count', path: 'recordCount', type: 'number' },
        { label: 'Total Gross', path: 'totalGross', type: 'currency' },
        { label: 'Total Net', path: 'totalNet', type: 'currency' },
        { label: 'Status', path: 'status', type: 'badge' },
      ],
    },
  ],
};
