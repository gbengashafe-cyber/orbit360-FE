import { format } from 'date-fns';

export const getStatusColor = (status) => {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-700',
    pending_review: 'bg-yellow-100 text-yellow-800',
    pending_approval: 'bg-yellow-300 text-yellow-900',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    authorized: 'bg-blue-100 text-blue-700',
    active: 'bg-green-100 text-green-700',
    draft: 'bg-gray-100 text-gray-700',
    submitted: 'bg-blue-100 text-blue-700',
    treated: 'bg-yellow-100 text-yellow-700',
    reported: 'bg-blue-100 text-blue-700',
    under_investigation: 'bg-yellow-100 text-yellow-700',
    hearing_scheduled: 'bg-purple-100 text-purple-700',
    verdict_delivered: 'bg-orange-100 text-orange-700',
    penalty_applied: 'bg-red-100 text-red-700',
    closed: 'bg-gray-100 text-gray-700',
    terminated: 'bg-red-100 text-red-700',
    paid_off: 'bg-blue-100 text-blue-700',
    pending_disbursement: 'bg-green-100 text-yellow-700',
    generated: 'bg-blue-100 text-blue-700',
    processed: 'bg-green-100 text-green-700',
    paid: 'bg-emerald-100 text-emerald-700',
    failed: 'bg-red-100 text-red-700',
  };
  return colors[status?.toLowerCase()] || 'bg-gray-100 text-gray-700';
};

export const getTransactionProps = (transaction, moduleName) => {
  let type = '_',
    description = '_',
    initiator = '_',
    createdAt = transaction.createdAt ? format(new Date(transaction.createdAt), 'dd-MMM-yyyy') : '_';

  switch (moduleName) {
    case 'loans':
      type = transaction?.loanType?.name;
      description = `${transaction.employee.firstName} - ${transaction.principalAmount}`;
      initiator = transaction?.reviewer?.firstName;
      break;
    case 'payrolls':
      type = 'Monthly Salaries';
      description = `Batch: ${transaction.payPeriod} | Count: ${transaction.recordCount}`;
      initiator = `${transaction?.initiator?.firstName} ${transaction?.initiator?.lastName}`;
      break;
    case 'employees':
      type = transaction.actionType;
      description = `${transaction.employee.firstName} ${transaction.employee.lastName}`;
      initiator = `${transaction?.initiator?.firstName} ${transaction?.initiator?.lastName}`;
      break;
    case 'leaves':
      type = transaction.type;
      description = `${transaction.employee.firstName} ${transaction.employee.lastName}`;
      initiator = `${transaction?.employee?.firstName} ${transaction?.employee?.lastName}`;
      break;

    default:
      break;
  }
  return { type, description, initiator, createdAt };
};
