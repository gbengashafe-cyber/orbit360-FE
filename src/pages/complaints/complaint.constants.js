// Values must match the backend complaint model.

export const COMPLAINT_TYPES = [
  { value: 'harassment', label: 'Harassment' },
  { value: 'discrimination', label: 'Discrimination' },
  { value: 'safety', label: 'Health & Safety' },
  { value: 'wage_dispute', label: 'Wage Dispute' },
  { value: 'working_conditions', label: 'Working Conditions' },
  { value: 'other', label: 'Other' },
];

export const COMPLAINT_URGENCY = [
  { value: 'low', label: 'Low', className: 'bg-green-100 text-green-800' },
  { value: 'medium', label: 'Medium', className: 'bg-yellow-100 text-yellow-800' },
  { value: 'high', label: 'High', className: 'bg-orange-100 text-orange-800' },
  { value: 'critical', label: 'Critical', className: 'bg-red-100 text-red-800' },
];

// Labels shown to the employee who submitted the complaint.
export const EMPLOYEE_STATUS_LABELS = {
  PENDING_REVIEW: 'Awaiting HR Officer',
  PENDING_APPROVAL: 'Awaiting HR Manager',
  REJECTED_BY_REVIEWER: 'Rejected',
  REJECTED_BY_APPROVER: 'Rejected',
  APPROVED: 'Approved',
};

// Labels shown to HR Officers and HR Managers.
export const HR_STATUS_LABELS = {
  PENDING_REVIEW: 'Awaiting HR Officer review',
  PENDING_APPROVAL: 'Awaiting HR Manager authorization',
  REJECTED_BY_REVIEWER: 'Rejected by HR Officer',
  REJECTED_BY_APPROVER: 'Rejected by HR Manager',
  APPROVED: 'Approved',
};

export const ANONYMOUS_NOTICE =
  'Anonymous complaints may take longer to investigate as we cannot contact you directly for clarification.';

export const complaintTypeLabel = (value) => COMPLAINT_TYPES.find((type) => type.value === value)?.label ?? value ?? '—';

export const urgencyOption = (value) => COMPLAINT_URGENCY.find((urgency) => urgency.value === value);

export const statusLabel = (status, labels = HR_STATUS_LABELS) => labels[status] ?? status?.replaceAll('_', ' ') ?? '—';

export const submitterName = (complaint) =>
  complaint?.isAnonymous || !complaint?.submittedBy
    ? 'Anonymous'
    : `${complaint.submittedBy.firstName} ${complaint.submittedBy.lastName}`;
