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

  switch (normalizedModuleName) {
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
    case 'exit_requests':
      type = 'Exit Request';
      description =
        firstValidValue(
          transaction.employee_name,
          transaction.employeeName,
          transaction.employee_email,
          transaction.employeeEmail,
        ) || '_';
      initiator =
        firstValidValue(
          transaction.requested_by,
          transaction.requestedBy,
          transaction.created_by_name,
          transaction.createdByName,
          transaction.created_by,
          transaction.createdBy,
        ) || '_';
      break;
    case 'recruitment':
    case 'recruitments':
    case 'job_postings':
      type = firstValidValue(transaction.employment_type?.replace('_', ' '), 'Job Posting');
      description = firstValidValue(transaction.title, transaction.position, transaction.department) || '_';
      initiator =
        firstValidValue(
          transaction.hiring_manager,
          transaction.created_by_name,
          transaction.createdByName,
          transaction.created_by,
          transaction.createdBy,
        ) || '_';
      break;

    default:
      break;
  }
  return { type, description, initiator, createdAt };
};
