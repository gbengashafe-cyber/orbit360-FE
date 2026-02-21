import { apiClient } from './apiClient';
import { ApiRoutes } from './apiRoutes';

export const jobRoleService = {
  async getJobRoles({ page = 1, rows = 10, options } = { page: 1, rows: 10 }) {
    if (options && options.search) {
      return apiClient.get(`${ApiRoutes.GetJobRoles}?page=${page}&rows=${rows}&search=${options.search}`);
    }
    return apiClient.get(`${ApiRoutes.GetJobRoles}?page=${page}&rows=${rows}`);
  },

  async getJobRoleById(id) {
    return apiClient.get(ApiRoutes.GetJobRoleById(id));
  },

  async createJob(data) {
    return apiClient.post(ApiRoutes.CreateJobRole, data);
  },

  async updateJobRole(id, data) {
    return apiClient.put(ApiRoutes.UpdateJobRole(id), data);
  },

  async deleteJobRole(id) {
    return apiClient.delete(ApiRoutes.DeleteJobRole(id));
  },
};
