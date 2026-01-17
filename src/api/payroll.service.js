import { apiClient } from './apiClient';
import { apiRoutes } from './apiRoutes';

export const payrollService = {
  async getPayrolls(page = 1, rows = 10) {
    return apiClient.get(`${apiRoutes.payroll.list}?page=${page}&rows=${rows}`);
  },

  async getPayrollById(id) {
    return apiClient.get(apiRoutes.payroll.get(id));
  },

  async getPayrollByEmployee(employeeId, page = 1, rows = 10) {
    return apiClient.get(`${apiRoutes.payroll.byEmployee(employeeId)}?page=${page}&rows=${rows}`);
  },

  async getPayrollByPeriod(payPeriod, page = 1, rows = 10) {
    return apiClient.get(`${apiRoutes.payroll.byPeriod(payPeriod)}?page=${page}&rows=${rows}`);
  },

  async createPayroll(data) {
    return apiClient.post(apiRoutes.payroll.create, data);
  },

  async updatePayroll(id, data) {
    return apiClient.put(apiRoutes.payroll.update(id), data);
  },

  async deletePayroll(id) {
    return apiClient.delete(apiRoutes.payroll.delete(id));
  },

  async processPayroll(id) {
    return apiClient.post(apiRoutes.payroll.process(id));
  },

  async payPayroll(id) {
    return apiClient.post(apiRoutes.payroll.pay(id));
  },
};
