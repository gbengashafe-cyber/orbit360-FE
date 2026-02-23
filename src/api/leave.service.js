import { apiClient } from './apiClient';
import { ApiRoutes } from './apiRoutes';

export const leaveService = {
  async getLeaves(page = 1, rows = 10) {
    return apiClient.get(`${ApiRoutes.GetLeaves}?page=${page}&rows=${rows}`);
  },

  async getLeaveById(id) {
    return apiClient.get(ApiRoutes.GetLeaveById(id));
  },

  async getLeavesByEmployee(employeeId, page = 1, rows = 10) {
    return apiClient.get(`${ApiRoutes.GetLeavesByEmployee(employeeId)}?page=${page}&rows=${rows}`);
  },

  async createLeave(data) {
    return apiClient.post(ApiRoutes.CreateLeave, data);
  },

  async updateLeave(id, data) {
    return apiClient.put(ApiRoutes.UpdateLeave(id), data);
  },

  async deleteLeave(id) {
    return apiClient.delete(ApiRoutes.DeleteLeave(id));
  },

  async getLeaveTypes() {
    return apiClient.get(ApiRoutes.GetLeaveTypes);
  },

  async getLeaveBalance(employeeId) {
    return apiClient.get(ApiRoutes.GetLeaveBalance(employeeId));
  },

  async updateLeaveStatus(id, status, rejectionReason = null) {
    const payload = { action: status };
    if (rejectionReason) {
      payload.rejection_reason = rejectionReason;
    }
    return apiClient.patch(ApiRoutes.UpdateLeaveStatus(id), payload);
  },

  async calculateLeaveDays(data) {
    return apiClient.post(ApiRoutes.CalculateLeaveDays, data);
  },
};
