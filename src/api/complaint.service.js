import { apiClient, apiRoutes } from '.';
import { logger } from '@/utils';

/**
 * Complaint Service
 * Handles all API calls related to staff complaints
 */
export const complaintService = {
  /**
   * Get all complaints with optional filters
   * @param {number} page - Page number for pagination
   * @param {number} rows - Number of rows per page
   * @param {Object} filters - Filter options { status, severity, complaint_type, employee_id }
   * @returns {Promise} Complaints data with pagination
   */
  async getComplaints(page = 1, rows = 10, filters = {}) {
    try {
      let url = `${apiRoutes.GetComplaints}?page=${page}&rows=${rows}`;
      if (filters.status) url += `&status=${filters.status}`;
      if (filters.severity) url += `&severity=${filters.severity}`;
      if (filters.complaint_type) url += `&complaint_type=${filters.complaint_type}`;
      if (filters.employee_id) url += `&employee_id=${filters.employee_id}`;

      const response = await apiClient.get(url);
      return response.data || response;
    } catch (error) {
      logger.error('Error fetching complaints:', error);
      throw error;
    }
  },

  /**
   * Get a specific complaint by ID
   * @param {number} id - Complaint ID
   * @returns {Promise} Complaint data
   */
  async getComplaintById(id) {
    try {
      const response = await apiClient.get(apiRoutes.GetComplaintById(id));
      return response.data || response;
    } catch (error) {
      logger.error(`Error fetching complaint ${id}:`, error);
      throw error;
    }
  },

  /**
   * Create a new complaint
   * @param {Object} data - Complaint data { employee_id, complaint_type, title, description, severity, reported_to }
   * @returns {Promise} Created complaint
   */
  async createComplaint(data) {
    try {
      const response = await apiClient.post(apiRoutes.CreateComplaint, data);
      return response.data || response;
    } catch (error) {
      logger.error('Error creating complaint:', error);
      throw error;
    }
  },

  /**
   * Update a complaint
   * @param {number} id - Complaint ID
   * @param {Object} data - Updated complaint data
   * @returns {Promise} Updated complaint
   */
  async updateComplaint(id, data) {
    try {
      const response = await apiClient.put(apiRoutes.UpdateComplaint(id), data);
      return response.data || response;
    } catch (error) {
      logger.error(`Error updating complaint ${id}:`, error);
      throw error;
    }
  },

  /**
   * Resolve a complaint
   * @param {number} id - Complaint ID
   * @param {string} resolution_notes - Notes on resolution
   * @returns {Promise} Resolved complaint
   */
  async resolveComplaint(id, resolution_notes) {
    try {
      const response = await apiClient.post(apiRoutes.ResolveComplaint(id), {
        resolution_notes,
      });
      return response.data || response;
    } catch (error) {
      logger.error(`Error resolving complaint ${id}:`, error);
      throw error;
    }
  },

  /**
   * Close a complaint
   * @param {number} id - Complaint ID
   * @returns {Promise} Closed complaint
   */
  async closeComplaint(id) {
    try {
      const response = await apiClient.post(apiRoutes.CloseComplaint(id));
      return response.data || response;
    } catch (error) {
      logger.error(`Error closing complaint ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete a complaint
   * @param {number} id - Complaint ID
   * @returns {Promise} Confirmation
   */
  async deleteComplaint(id) {
    try {
      const response = await apiClient.delete(apiRoutes.DeleteComplaint(id));
      return response.data || response;
    } catch (error) {
      logger.error(`Error deleting complaint ${id}:`, error);
      throw error;
    }
  },
};
