import { format } from 'date-fns';

export const getStatusColor = (status) => {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-700',
    pending_approval: 'bg-yellow-100 text-yellow-700',
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
  };
  return colors[status?.toLowerCase()] || 'bg-gray-100 text-gray-700';
};

export const getTransactionProps = (transaction, moduleName) => {
  console.log('🚀 ~ getTransactionProps ~ transaction:', transaction);
  let type = '_',
    description = '_',
    initiator = '_',
    createdAt = transaction.createdAt ? format(new Date(transaction.createdAt), 'dd-MMM-yyyy') : '_';

  switch (moduleName) {
    case 'loans':
      type = transaction.loanType;
      description = `${transaction.employee.firstName} - ${transaction.principalAmount}`;
      initiator = transaction?.initiator?.firstName;
      break;
    case 'payrolls':
      type = 'Monthly Salaries';
      description = `Batch: ${transaction.payPeriod} | Count: ${transaction.recordCount}`;
      initiator = `${transaction?.initiator?.firstName} ${transaction?.initiator?.lastName}`;
      break;
    case 'employees':
      type = 'Employees';
      description = `${transaction.firstName} ${transaction.lastName}`;
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
