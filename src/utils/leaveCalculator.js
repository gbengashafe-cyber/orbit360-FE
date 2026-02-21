/**
 * Calculate business days (excluding weekends) between two dates
 * @param {string|Date} startDate - Start date
 * @param {string|Date} endDate - End date
 * @param {string} period - Leave period type (full_day, half_day_morning, half_day_afternoon)
 * @returns {number} - Number of business days
 */
export const calculateBusinessDays = (startDate, endDate, period = 'full_day') => {
  if (!startDate || !endDate) return 0;

  const start = new Date(startDate);
  const end = new Date(endDate);

  // Handle same day half day
  if (period !== 'full_day' && start.toDateString() === end.toDateString()) {
    return 0.5;
  }

  let count = 0;
  const currentDate = new Date(start);

  while (currentDate <= end) {
    const dayOfWeek = currentDate.getDay();
    // 0 = Sunday, 6 = Saturday
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return count;
};

/**
 * Format leave type for API
 * Maps display values to API values
 * @param {string} displayValue - The display value from form
 * @returns {string} - The API value
 */
export const formatLeaveType = (displayValue) => {
  const typeMap = {
    'annual': 'annual',
    'Annual Leave': 'annual',
    'sick': 'sick',
    'Sick Leave': 'sick',
    'maternity': 'maternity',
    'Maternity Leave': 'maternity',
    'paternity': 'paternity',
    'Paternity Leave': 'paternity',
    'compassionate': 'compassionate',
    'Compassionate Leave': 'compassionate',
    'study': 'study',
    'Study Leave': 'study',
    'unpaid': 'unpaid',
    'Unpaid Leave': 'unpaid',
    'personal': 'personal',
    'Personal Leave': 'personal',
    'other': 'other',
    'Other': 'other'
  };

  return typeMap[displayValue] || displayValue.toLowerCase();
};

/**
 * Get leave type display name
 * @param {string} leaveType - The leave type value
 * @returns {string} - Formatted display name
 */
export const getLeaveTypeDisplay = (leaveType) => {
  const displayMap = {
    'annual': 'Annual Leave',
    'sick': 'Sick Leave',
    'maternity': 'Maternity Leave',
    'paternity': 'Paternity Leave',
    'compassionate': 'Compassionate Leave',
    'study': 'Study Leave',
    'unpaid': 'Unpaid Leave',
    'personal': 'Personal Leave',
    'vacation': 'Annual Leave',
    'other': 'Other'
  };

  return displayMap[leaveType] || leaveType;
};

/**
 * Validate leave type is acceptable
 * @param {string} leaveType - The leave type to validate
 * @returns {boolean}
 */
export const isValidLeaveType = (leaveType) => {
  const validTypes = [
    'annual',
    'sick',
    'maternity',
    'paternity',
    'compassionate',
    'study',
    'unpaid',
    'personal',
    'vacation',
    'other'
  ];

  return validTypes.includes(leaveType?.toLowerCase());
};

/**
 * Calculate remaining leave days
 * @param {number} entitlement - Total leave days entitlement
 * @param {Array} approvedLeaves - Array of approved leave requests
 * @param {string} leaveType - The type of leave to calculate for (default: annual)
 * @returns {number} - Remaining days
 */
export const calculateRemainingDays = (entitlement, approvedLeaves = [], leaveType = 'annual') => {
  const usedDays = approvedLeaves
    .filter(leave => leave.status === 'approved' && leave.type === leaveType)
    .reduce((total, leave) => {
      const days = calculateBusinessDays(leave.startDate, leave.endDate, leave.leave_period);
      return total + days;
    }, 0);

  return Math.max(0, entitlement - usedDays);
};
