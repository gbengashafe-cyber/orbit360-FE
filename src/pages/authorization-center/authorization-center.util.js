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
