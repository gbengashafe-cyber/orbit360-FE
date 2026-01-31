import { apiClient, makeQueryParams } from './apiClient';
import { ApiRoutes } from './apiRoutes';

export const employeeService = {
  async getEmployees({ page = 1, rows = 10, options } = { page: 1, rows: 10 }) {
    if (options) {
      const queryParams = makeQueryParams(options);
      return apiClient.get(`${ApiRoutes.GetEmployees}?page=${page}&rows=${rows}&${queryParams}`);
    }
    return apiClient.get(`${ApiRoutes.GetEmployees}?page=${page}&rows=${rows}`);
  },

  async searchEmployees({ page = 1, rows = 10, options }, { signal }) {
    let endpoint = `${ApiRoutes.employee.getEmployees}?page=${page}&rows=${rows}`;

    if (options) {
      const queryParams = makeQueryParams(options);
      endpoint = `${endpoint}&${queryParams}`;
    }

    return apiClient.get(endpoint, { signal });
  },

  async getUserEmployeeData(options) {
    let endpoint = ApiRoutes.employee.userEmployeeRecord;

    if (options) {
      endpoint = `${endpoint}?${makeQueryParams(options)}`;
    }
    return apiClient.get(endpoint);
  },

  async getEmployeeById(id) {
    return apiClient.get(ApiRoutes.GetEmployeeById(id));
  },

  async createEmployee(data) {
    return apiClient.post(ApiRoutes.CreateEmployee, data);
  },

  async updateEmployee(id, data) {
    return apiClient.put(ApiRoutes.UpdateEmployee(id), data);
  },

  async deleteEmployee(id) {
    return apiClient.delete(ApiRoutes.DeleteEmployee(id));
  },
};
