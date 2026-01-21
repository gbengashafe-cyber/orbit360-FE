import { apiClient } from './apiClient';
import { ApiRoutes } from './apiRoutes';

export const departmentService = {
  async getDepartments({ page = 1, rows = 10, options }) {
    if (options && options.search) {
      return apiClient.get(`${ApiRoutes.GetDepartments}?page=${page}&rows=${rows}&search=${options.search}`);
    }
    return apiClient.get(`${ApiRoutes.GetDepartments}?page=${page}&rows=${rows}`);
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
