// Queue links never contain a record ID. Each destination reloads the current user's queue.
const queues = {
  TRAINING_SUPERVISOR_REVIEW: ['/authorization-center'],
  LEAVE_REVIEW: ['/authorization-center'],
  TRAINING_HR_REVIEW: ['/training-request-reviews', 'LIST_TRAINING_REQUESTS', 'MANAGE_TRAINING_REQUESTS'],
  TRAINING_FINAL_APPROVAL: ['/authorization-center', 'APPROVE_TRAINING_REQUESTS'],
  LOAN_REVIEW: ['/cooperative', 'LIST_LOANS', 'MANAGE_LOANS'],
  LOAN_AUTHORIZATION: ['/authorization-center', 'APPROVE_LOANS'],
  EMPLOYEE_MANAGEMENT_AUTHORIZATION: ['/authorization-center', 'APPROVE_EMPLOYEES'],
  RECRUITMENT_AUTHORIZATION: ['/authorization-center', 'APPROVE_JOB_POSTINGS'],
  EXIT_REVIEW: ['/ExitApprovals', 'MANAGE_EXITS'],
  EXIT_AUTHORIZATION: ['/authorization-center', 'APPROVE_EXITS'],
  COMPLAINT_REVIEW: ['/complaint-management', 'MANAGE_COMPLAINTS'],
  COMPLAINT_AUTHORIZATION: ['/complaint-management', 'APPROVE_COMPLAINTS'],
  PAYROLL_AUTHORIZATION: ['/authorization-center', 'APPROVE_PAYROLLS'],
  DOCUMENTS_AUTHORIZATION: ['/DocumentManagement', 'APPROVE_DOCUMENT_DELETION'],
  ONBOARDING_REVIEW: ['/Onboarding', 'MANAGE_ONBOARDING'],
};

const ownerPages = {
  leave: '/leave-management', loan: '/employee-cooperative', training_request: '/request-training',
  complaint: '/staff-complaints', exit: '/exit-management',
};

export function notificationDestination(item, permissions = []) {
  if (item.audience === 'ACTOR_QUEUE') {
    const destination = queues[item.eventType];
    if (!destination) return '/notifications';
    const [path, ...required] = destination;
    const granted = new Set(permissions.map(value => value.toUpperCase()));
    return required.every(permission => granted.has(permission)) ? path : '/notifications';
  }
  return (item.entityId && ownerPages[item.entityType]) || '/notifications';
}
