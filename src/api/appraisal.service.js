import { apiClient, makeQueryParams } from './apiClient';
import { ApiRoutes } from './apiRoutes';

export const appraisalService = {
  // Appraisals CRUD
  async getAppraisals({ page = 1, rows = 10, options } = { page: 1, rows: 10 }) {
    if (options) {
      const queryParams = makeQueryParams(options);
      return apiClient.get(
        `${ApiRoutes.GetPerformanceAppraisals}?page=${page}&rows=${rows}&${queryParams}`
      );
    }
    return apiClient.get(
      `${ApiRoutes.GetPerformanceAppraisals}?page=${page}&rows=${rows}`
    );
  },

  async getAppraisalById(id) {
    return apiClient.get(ApiRoutes.GetPerformanceAppraisalById(id));
  },

  async createAppraisal(data) {
    return apiClient.post(ApiRoutes.CreatePerformanceAppraisal, data);
  },

  async updateAppraisal(id, data) {
    return apiClient.put(ApiRoutes.UpdatePerformanceAppraisal(id), data);
  },

  async deleteAppraisal(id) {
    return apiClient.delete(ApiRoutes.DeletePerformanceAppraisal(id));
  },

  async submitAppraisal(id) {
    return apiClient.post(ApiRoutes.SubmitPerformanceAppraisal(id), {});
  },

  async reviewAppraisal(id, data) {
    return apiClient.post(ApiRoutes.ReviewPerformanceAppraisal(id), data);
  },
};
