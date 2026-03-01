import { format } from 'date-fns';

export const getStatusColor = (status) => {
  const colors = {
    active: 'bg-green-100 text-green-700',
    approved: 'bg-green-100 text-green-700',
    archived: 'bg-gray-100 text-gray-700',
    authorized: 'bg-blue-100 text-blue-700',
    cancelled: 'bg-gray-100 text-gray-700',
    cleared: 'bg-green-100 text-green-800',
    closed: 'bg-gray-100 text-gray-700',
    completed: 'bg-green-100 text-green-700',
    draft: 'bg-gray-100 text-gray-700',
    failed: 'bg-red-100 text-red-700',
    generated: 'bg-blue-100 text-blue-700',
    hearing_scheduled: 'bg-purple-100 text-purple-700',
    in_progress: 'bg-blue-100 text-blue-700',
    investigating: 'bg-orange-100 text-orange-700',
    issues: 'bg-orange-100 text-orange-800',
    not_started: 'bg-gray-100 text-gray-700',
    on_hold: 'bg-yellow-100 text-yellow-700',
    open: 'bg-blue-100 text-blue-700',
    overdue: 'bg-red-100 text-red-700',
    paid: 'bg-emerald-100 text-emerald-700',
    paid_off: 'bg-blue-100 text-blue-700',
    pending: 'bg-yellow-100 text-yellow-700',
    penalty_applied: 'bg-red-100 text-red-700',
    pending_approval: 'bg-yellow-300 text-yellow-900',
    pending_disbursement: 'bg-green-100 text-yellow-700',
    pending_hr_approval: 'bg-yellow-100 text-yellow-700',
    pending_review: 'bg-yellow-100 text-yellow-800',
    pending_supervisor_approval: 'bg-orange-100 text-orange-700',
    processed: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    reported: 'bg-blue-100 text-blue-700',
    resolved: 'bg-green-100 text-green-700',
    submitted: 'bg-blue-100 text-blue-700',
    terminated: 'bg-red-100 text-red-700',
    treated: 'bg-yellow-100 text-yellow-700',
    under_investigation: 'bg-yellow-100 text-yellow-700',
    under_review: 'bg-yellow-100 text-yellow-700',
    verdict_delivered: 'bg-orange-100 text-orange-700',
  };
  return colors[status?.toLowerCase()] || 'bg-gray-100 text-gray-700';
};

export const getTransactionProps = (transaction, moduleName) => {
  const normalizedModuleName = moduleName?.toString().toLowerCase().replace(/-/g, '_');
  const firstValidValue = (...values) =>
    values.find((value) => {
      if (value === undefined || value === null) return false;
      const parsed = value.toString().trim();
      return parsed !== '' && parsed !== '-' && parsed !== '_';
    });
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
      initiator = `${transaction?.employee?.firstName} ${transaction?.employee?.lastName}`;
      break;
    case 'job postings':
      {
        type = transaction?.employment_type;
        description = transaction?.description?.substring(0, 50);
        initiator = transaction?.created_by;
      }

      break;
    case 'exits':
      type = 'Exit Request';
      description = `${transaction.employee.firstName} ${transaction.employee.lastName}`;
      initiator = `${transaction.employee.firstName} ${transaction.employee.lastName}`;
      break;
    default:
      break;
  }
  switch (normalizedModuleName) {
    case 'training':
    case 'trainings':
    case 'training_requests':
      type = (transaction.trainingType || transaction.training_type || 'Training').replaceAll('_', ' ');
      description = transaction.trainingTitle || transaction.training_title || transaction.trainingDescription || '_';
      initiator =
        firstValidValue(
          transaction.employee_name,
          transaction.employeeName,
          transaction.requester_name,
          transaction.requesterName,
          transaction.requested_by,
          transaction.requestedBy,
          transaction.created_by_name,
          transaction.createdByName,
          transaction.submitted_by,
          transaction.submittedBy,
          `${transaction?.employee?.firstName || ''} ${transaction?.employee?.lastName || ''}`.trim(),
          transaction?.employee?.full_name,
          transaction?.employee?.fullName,
          transaction?.employee?.name,
          transaction.created_by,
          transaction.createdBy,
          transaction.employee_id,
          transaction.employeeId,
        ) || '_';
      break;
    case 'exit':
    case 'exits':
    case 'recruitment':
    case 'recruitments':
      break;

    default:
      break;
  }

  return { type, description, initiator, createdAt };
};
