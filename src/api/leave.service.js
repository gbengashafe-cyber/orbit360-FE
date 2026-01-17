import { apiClient } from './apiClient';
import { apiRoutes } from './apiRoutes';

export const leaveService = {
  async getLeaves(page = 1, rows = 10) {
    return apiClient.get(`${apiRoutes.leaves.list}?page=${page}&rows=${rows}`);
  },

  async getLeaveById(id) {
    return apiClient.get(apiRoutes.leaves.get(id));
  },

  async getLeavesByEmployee(employeeId, page = 1, rows = 10) {
    return apiClient.get(`${apiRoutes.leaves.byEmployee(employeeId)}?page=${page}&rows=${rows}`);
  },

  async createLeave(data) {
    return apiClient.post(apiRoutes.leaves.create, data);
  },

  async updateLeave(id, data) {
    return apiClient.put(apiRoutes.leaves.update(id), data);
  },

  async deleteLeave(id) {
    return apiClient.delete(apiRoutes.leaves.delete(id));
  },

  async getLeaveTypes() {
    return apiClient.get(apiRoutes.leaves.types);
  },

  async getLeaveBalance(employeeId) {
    return apiClient.get(apiRoutes.leaves.balance(employeeId));
  },

  async updateLeaveStatus(id, status) {
    return apiClient.patch(apiRoutes.leaves.updateStatus(id), { status });
  },
};
