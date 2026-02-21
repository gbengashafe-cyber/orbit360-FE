import { apiClient } from './apiClient';
import { ApiRoutes } from './apiRoutes';

export const payrollService = {
  async getPayrolls(page = 1, rows = 10) {
    return apiClient.get(`${ApiRoutes.payroll.list}?page=${page}&rows=${rows}`);
  },

  async getPayrollById(id) {
    return apiClient.get(ApiRoutes.payroll.get(id));
  },

  async getPayrollByEmployee({ id, page = 1, rows = 10 }) {
    return apiClient.get(`${ApiRoutes.GetPayrollsByEmployee(id)}?page=${page}&rows=${rows}`);
  },

  async getPayrollByPeriod({ payPeriod, page = 1, rows = 20 }) {
    return apiClient.get(`${ApiRoutes.GetPayrollsByPeriod(payPeriod)}?page=${page}&rows=${rows}`);
  },
  async getPayrollBatchByPeriod({ payPeriod }) {
    return apiClient.get(`${ApiRoutes.payroll.getBatchByPeriod(payPeriod)}`);
  },

  async generatePayroll(payPeriod) {
    return apiClient.post(ApiRoutes.GeneratePayroll, { payPeriod });
  },

  async regeneratePayroll(payPeriod) {
    return apiClient.post(ApiRoutes.regeneratePayroll, { payPeriod });
  },

  approvePayrollBatch: async (id) => {
    return apiClient.patch(ApiRoutes.payroll.approveBatch(id));
  },
  rejectPayrollBatch: async (id) => {
    return apiClient.patch(ApiRoutes.payroll.rejectBatch(id));
  },

  async updatePayroll(id, data) {
    return apiClient.put(ApiRoutes.payroll.update(id), data);
  },

  async updatePayrollStatus(id, data) {
    return apiClient.put(ApiRoutes.UpdatePayrollStatus(id), data);
  },

  async deletePayroll(id) {
    return apiClient.delete(ApiRoutes.payroll.delete(id));
  },

  async payPayroll(id) {
    return apiClient.post(ApiRoutes.payroll.pay(id));
  },

  async uploadReport(report) {
    return apiClient.post(ApiRoutes.UploadPayrollReport, report);
  },

  async getUploadedPayrolls({ rows = 20, page = 1 } = { rows: 20, page: 1 }) {
    return apiClient.get(`${ApiRoutes.GetUploadedPayrollReports}?page=${page}&rows=${rows}`);
  },

  async deleteUploadedPayroll(id) {
    return apiClient.delete(ApiRoutes.DeleteUploadedPayrollReport(id));
  },
};
