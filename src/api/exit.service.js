import { apiClient } from './apiClient';
import { ApiRoutes } from './apiRoutes';

/**
 * Exit Management Service
 * Handles all API calls related to exit/resignation management
 */
export const exitService = {
  /**
   * Get all exit requests (HR admin only)
   * @param {number} page - Page number (default: 1)
   * @param {number} rows - Rows per page (default: 10)
   * @returns {Promise} Exit requests with pagination
   */
  async getExits(page = 1, rows = 10) {
    return apiClient.get(
      `${ApiRoutes.GetExits}?page=${page}&rows=${rows}`
    );
  },

  /**
   * Get exit requests for a specific employee
   * @param {string} employeeId - Employee ID
   * @param {number} page - Page number (default: 1)
   * @param {number} rows - Rows per page (default: 10)
   * @returns {Promise} Employee's exit requests
   */
  async getExitsByEmployee(employeeId, page = 1, rows = 10) {
    return apiClient.get(
      `${ApiRoutes.GetExitsByEmployee(employeeId)}?page=${page}&rows=${rows}`
    );
  },

  /**
   * Get a specific exit request by ID
   * @param {string} id - Exit request ID
   * @returns {Promise} Exit request details
   */
  async getExitById(id) {
    return apiClient.get(ApiRoutes.GetExitById(id));
  },

  /**
   * Create a new exit/resignation request
   * @param {Object} data - Exit request data
   * @param {string} data.employee_id - Employee ID
   * @param {string} data.employee_name - Employee full name
   * @param {string} data.employee_email - Employee email
   * @param {string} data.employee_department - Employee department
   * @param {string} data.position - Employee position
   * @param {string} data.resignation_date - Date of resignation
   * @param {number} data.notice_period - Notice period in days
   * @param {string} data.last_working_date - Proposed last working date
   * @param {string} data.handover_status - Handover status (in_progress, yes, no)
   * @param {string} data.handover_details - Details of handover
   * @param {string} data.handover_recipient_name - Name of handover recipient
   * @param {string} data.handover_recipient_contact - Contact of recipient
   * @param {string} data.outstanding_tasks - Outstanding tasks/projects
   * @param {string} data.outstanding_approvals - Outstanding approvals
   * @param {string} data.assets_to_return - Assets to return
   * @param {string} data.salary_balance_notes - Salary balance notes
   * @param {string} data.loan_deduction_notes - Loan deduction notes
   * @param {boolean} data.leave_encashment_request - Leave encashment request flag
   * @param {string} data.pension_processing_notes - Pension processing notes
   * @param {number} data.overall_experience_rating - Experience rating (1-5)
   * @param {string} data.positive_experience - Positive experience feedback
   * @param {string} data.areas_for_improvement_org - Areas for improvement
   * @param {boolean} data.would_recommend_org - Would recommend organization
   * @returns {Promise} Created exit request
   */
  async createExit(data) {
    return apiClient.post(ApiRoutes.CreateExit, data);
  },

  /**
   * Update an exit request
   * @param {string} id - Exit request ID
   * @param {Object} data - Updated exit data
   * @returns {Promise} Updated exit request
   */
  async updateExit(id, data) {
    return apiClient.put(ApiRoutes.UpdateExit(id), data);
  },

  /**
   * Delete an exit request
   * @param {string} id - Exit request ID
   * @returns {Promise} Deletion response
   */
  async deleteExit(id) {
    return apiClient.delete(ApiRoutes.DeleteExit(id));
  },

  /**
   * Approve or reject an exit request (HR admin only)
   * @param {string} id - Exit request ID
   * @param {string} action - Action to take: 'approved' or 'rejected'
   * @returns {Promise} Updated exit request
   */
  async approveExit(id, action) {
    if (!['approved', 'rejected'].includes(action)) {
      throw new Error('Invalid action. Must be "approved" or "rejected"');
    }
    return apiClient.patch(ApiRoutes.ApproveExit(id), { action });
  },

  /**
   * Helper: Calculate notice period in days
   * @param {string} resignationDate - Date of resignation (YYYY-MM-DD)
   * @param {string} lastWorkingDate - Last working date (YYYY-MM-DD)
   * @returns {number} Number of days
   */
  calculateNoticePeriod(resignationDate, lastWorkingDate) {
    if (!resignationDate || !lastWorkingDate) return 0;
    const start = new Date(resignationDate);
    const end = new Date(lastWorkingDate);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  },

  /**
   * Helper: Get status color for UI display
   * @param {string} status - Status value
   * @returns {string} CSS class for badge
   */
  getStatusColor(status) {
    const statusColorMap = {
      submitted: 'bg-orange-100 text-orange-700',
      under_review: 'bg-blue-100 text-blue-700',
      clearance_pending: 'bg-yellow-100 text-yellow-700',
      approved: 'bg-green-100 text-green-700',
      completed: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
      withdrawn: 'bg-gray-100 text-gray-700',
    };
    return statusColorMap[status] || 'bg-gray-100 text-gray-700';
  },

  /**
   * Helper: Check if exit request is active
   * @param {string} status - Status value
   * @returns {boolean} True if exit is still in progress
   */
  isActiveExit(status) {
    return !['completed', 'withdrawn', 'rejected'].includes(status);
  },

  /**
   * Helper: Format approval status display
   * @param {string} status - Approval status
   * @returns {string} Formatted status text
   */
  formatApprovalStatus(status) {
    const statusMap = {
      pending: 'PENDING',
      approved: 'APPROVED',
      cleared: 'CLEARED',
      rejected: 'REJECTED',
      issues: 'ISSUES',
    };
    return statusMap[status] || 'UNKNOWN';
  },
};
