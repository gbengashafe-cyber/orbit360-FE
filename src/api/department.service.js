import { apiClient, makeQueryParams } from './apiClient';
import { ApiRoutes } from './apiRoutes';

export const departmentService = {
  async getDepartments({ page = 1, rows = 10, options }) {
    if (options) {
      const queryParams = makeQueryParams(options);
      return apiClient.get(`${ApiRoutes.GetDepartments}?page=${page}&rows=${rows}&${queryParams}`);
    }

    return apiClient.get(`${ApiRoutes.GetDepartments}?page=${page}&rows=${rows}`);
  },

  async getDepartmentEmployees({ id, page = 1, rows = 10, options }, { signal }) {
    let endpoint = `${ApiRoutes.GetDepartmentEmployees(id)}?page=${page}&rows=${rows}`;

    if (options) {
      const queryParams = makeQueryParams(options);
      endpoint = `${endpoint}&${queryParams}`;
    }

    return apiClient.get(endpoint, { signal });
  },

  async getDepartmentById(id) {
    return apiClient.get(ApiRoutes.GetDepartmentById(id));
  },

  async createDepartment(data) {
    return apiClient.post(ApiRoutes.CreateDepartment, data);
  },

  async updateDepartment(id, data) {
    return apiClient.put(ApiRoutes.UpdateDepartment(id), data);
  },

  async deleteDepartment(id) {
    return apiClient.delete(ApiRoutes.DeleteDepartment(id));
  },
};
