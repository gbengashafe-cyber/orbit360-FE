import { apiClient } from './apiClient';
import { ApiRoutes } from './apiRoutes';

export const loanService = {
  async getLoans(page = 1, rows = 10) {
    return apiClient.get(`${ApiRoutes.GetLoans}?page=${page}&rows=${rows}`);
  },

  async getLoanDashboard() {
    return apiClient.get(`${ApiRoutes.GetLoanDashboard}`);
  },

  async getLoanById(id) {
    return apiClient.get(ApiRoutes.GetLoans(id));
  },

  async createLoan(data) {
    return apiClient.post(ApiRoutes.CreateLoan, data);
  },

  async updateLoan(id, data) {
    return apiClient.put(ApiRoutes.UpdateLoan(id), data);
  },

  async deleteLoan(id) {
    return apiClient.delete(ApiRoutes.DeleteLoan(id));
  },

  async approveLoan(id) {
    return apiClient.patch(ApiRoutes.loan.approve(id));
  },

  async rejectLoan(id) {
    return apiClient.patch(ApiRoutes.loan.reject(id));
  },
};
