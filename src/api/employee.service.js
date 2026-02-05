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

  async getActiveEmployees({ page = 1, rows = 25, options } = { page: 1, rows: 10 }) {
    let endpoint = `${ApiRoutes.employee.getActiveEmployees}?page=${page}&rows=${rows}`;

    if (options) {
      const queryParams = makeQueryParams(options);
      endpoint = endpoint + `&${queryParams}`;
    }
    return apiClient.get(endpoint);
  },

  approveMaintenance: async (id) => {
    return apiClient.post(ApiRoutes.employee.approve(id));
  },
  rejectMaintenance: async (id) => {
    return apiClient.post(ApiRoutes.employee.reject(id));
  },

  async searchEmployees({ page = 1, rows = 10, options }, { signal }) {
    let endpoint = `${ApiRoutes.employee.getEmployees}?page=${page}&rows=${rows}`;

    if (options) {
      const queryParams = makeQueryParams(options);
      endpoint = `${endpoint}&${queryParams}`;
    }

    return apiClient.get(endpoint, { signal });
  },

  async getUserEmployeeData() {
    let endpoint = ApiRoutes.employee.userEmployeeRecord;

    return apiClient.get(endpoint);
  },

  async getEmployeePayrollRecords(id, options) {
    let endpoint = ApiRoutes.employee.payrolls(id);

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

  async submitModificationRequest(id, data) {
    return apiClient.patch(ApiRoutes.employee.modificationRequest(id), data);
  },

  async deleteEmployee(id) {
    return apiClient.delete(ApiRoutes.DeleteEmployee(id));
  },
};
