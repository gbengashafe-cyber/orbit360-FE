/*
 * The one status map for every module (DESIGN.md §7). Add new statuses here; never style a status locally.
 * Keys are normalised to UPPER_SNAKE_CASE, so 'pending', 'PENDING' and 'Pending' all match.
 */

export const STATUS_TONES = ['pending', 'info', 'success', 'danger', 'neutral'];

const STATUS_MAP = {
  // Waiting for someone
  PENDING: { tone: 'pending', label: 'Pending' },
  PENDING_REVIEW: { tone: 'pending', label: 'Pending review' },
  PENDING_APPROVAL: { tone: 'pending', label: 'Pending approval' },
  PENDING_SUPERVISOR_APPROVAL: { tone: 'pending', label: 'Awaiting supervisor' },
  PENDING_HR_REVIEW: { tone: 'pending', label: 'Awaiting HR review' },
  PENDING_HR_APPROVAL: { tone: 'pending', label: 'Awaiting HR approval' },
  SUBMITTED: { tone: 'pending', label: 'Submitted' },
  OPEN: { tone: 'pending', label: 'Open' },
  UNDER_REVIEW: { tone: 'pending', label: 'Under review' },
  INTERVIEW_SCHEDULED: { tone: 'pending', label: 'Interview scheduled' },

  // In progress / active
  PENDING_DISBURSEMENT: { tone: 'info', label: 'Awaiting disbursement' },
  ACTIVE: { tone: 'info', label: 'Active' },
  ON_LEAVE: { tone: 'info', label: 'On leave' },
  IN_PROGRESS: { tone: 'info', label: 'In progress' },

  // Done well
  APPROVED: { tone: 'success', label: 'Approved' },
  PAID_OFF: { tone: 'success', label: 'Paid off' },
  COMPLETED: { tone: 'success', label: 'Completed' },
  CLEARED: { tone: 'success', label: 'Cleared' },
  RESOLVED: { tone: 'success', label: 'Resolved' },
  PAID: { tone: 'success', label: 'Paid' },

  // Rejected / failed
  REJECTED: { tone: 'danger', label: 'Rejected' },
  SUPERVISOR_REJECTED: { tone: 'danger', label: 'Rejected' },
  HR_REJECTED: { tone: 'danger', label: 'Rejected' },
  REJECTED_BY_REVIEWER: { tone: 'danger', label: 'Rejected' },
  REJECTED_BY_APPROVER: { tone: 'danger', label: 'Rejected' },
  DECLINED: { tone: 'danger', label: 'Declined' },
  FAILED: { tone: 'danger', label: 'Failed' },

  // Ended without a decision
  CANCELLED: { tone: 'neutral', label: 'Cancelled' },
  CANCELED: { tone: 'neutral', label: 'Cancelled' },
  DRAFT: { tone: 'neutral', label: 'Draft' },
  CLOSED: { tone: 'neutral', label: 'Closed' },
  INACTIVE: { tone: 'neutral', label: 'Inactive' },
  WITHDRAWN: { tone: 'neutral', label: 'Withdrawn' },
};

const normalise = (status) =>
  String(status ?? '')
    .trim()
    .replace(/[\s-]+/g, '_')
    .toUpperCase();

// "PENDING_SOMETHING_NEW" -> "Pending something new", so unknown statuses still read as words.
const humanise = (status) => {
  const words = normalise(status).toLowerCase().split('_').filter(Boolean).join(' ');
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : '—';
};

/** { tone, label } for any status value from any module. Unknown values fall back to a neutral, readable label. */
export const getStatusMeta = (status) => STATUS_MAP[normalise(status)] ?? { tone: 'neutral', label: humanise(status) };

export const getStatusTone = (status) => getStatusMeta(status).tone;
export const getStatusLabel = (status) => getStatusMeta(status).label;
