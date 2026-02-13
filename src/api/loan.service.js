import { apiClient, makeQueryParams } from './apiClient';
import { ApiRoutes } from './apiRoutes';

export const loanService = {
  async getLoans(page = 1, rows = 10) {
    return apiClient.get(`${ApiRoutes.GetLoans}?page=${page}&rows=${rows}`);
  },

  async getLoanTypes() {
    return apiClient.get(ApiRoutes.loans.loanTypes);
  },

  async getMyLoans(options) {
    let endpoint = ApiRoutes.loans.getMyLoans;

    if (options) {
      const queryParams = makeQueryParams(options);
      endpoint = `${endpoint}?${queryParams}`;
    }

    if (options.signal) {
      return apiClient.get(endpoint, { signal: options.signal });
    }

    return apiClient.get(endpoint);
  },

  async cancelLoanRequest(loanId) {
    let endpoint = ApiRoutes.loans.cancelLoanRequest(loanId);

    return apiClient.patch(endpoint);
  },

  async createLoanRequest(request) {
    return apiClient.post(ApiRoutes.loans.createLoanRequest, request);
  },

  async reviewLoan(id, data) {
    return apiClient.patch(ApiRoutes.loans.reviewLoanRequest(id), data);
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
    return apiClient.patch(ApiRoutes.loans.approve(id));
  },

  async rejectLoan(id) {
    return apiClient.patch(ApiRoutes.loans.reject(id));
  },
};
