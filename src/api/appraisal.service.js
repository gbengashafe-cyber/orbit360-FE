import { apiClient } from './apiClient';
import { ApiRoutes } from './apiRoutes';

export const appraisalService = {
  // Appraisals
  async getAppraisals(page = 1, rows = 10) {
    return apiClient.get(`${ApiRoutes.GetPerformanceAppraisals}?page=${page}&rows=${rows}`);
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

  async submitAppraisal(id, data) {
    return apiClient.post(ApiRoutes.SubmitPerformanceAppraisal(id), data);
  },

  async reviewAppraisal(id, data) {
    return apiClient.post(ApiRoutes.ReviewPerformanceAppraisal(id), data);
  },

  // Appraisal Cycles
  async getAppraisalCycles(page = 1, rows = 10) {
    return apiClient.get(`${ApiRoutes.GetPerformanceCycles}?page=${page}&rows=${rows}`);
  },

  async getAppraisalCycleById(id) {
    return apiClient.get(ApiRoutes.GetPerformanceCycleById(id));
  },

  async createAppraisalCycle(data) {
    return apiClient.post(ApiRoutes.CreatePerformanceCycle, data);
  },

  async updateAppraisalCycle(id, data) {
    return apiClient.put(ApiRoutes.UpdatePerformanceCycle(id), data);
  },

  async activateAppraisalCycle(id) {
    return apiClient.post(ApiRoutes.ActivatePerformanceCycle(id));
  },

  async closeAppraisalCycle(id) {
    return apiClient.post(ApiRoutes.ClosePerformanceCycle(id));
  },

  // KPIs
  async getKPIs(page = 1, rows = 10) {
    return apiClient.get(`/v1/performance/kpis?page=${page}&rows=${rows}`);
  },

  async getKPIById(id) {
    return apiClient.get(`/v1/performance/kpis/${id}`);
  },

  async createKPI(data) {
    return apiClient.post('/v1/performance/kpis', data);
  },

  async updateKPI(id, data) {
    return apiClient.put(`/v1/performance/kpis/${id}`, data);
  },

  async deleteKPI(id) {
    return apiClient.delete(`/v1/performance/kpis/${id}`);
  },

  // Appraisal KPIs
  async getAppraisalKPIs(appraisalId) {
    return apiClient.get(`/v1/performance/appraisals/${appraisalId}/kpis`);
  },

  async updateAppraisalKPI(appraisalId, kpiId, data) {
    return apiClient.put(`/v1/performance/appraisals/${appraisalId}/kpis/${kpiId}`, data);
  },

  // Performance Dashboard
  async getPerformanceDashboard() {
    return apiClient.get(ApiRoutes.GetPerformanceDashboard);
  },

  // Filter operations (for legacy support)
  async filterAppraisals(filters) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value);
      }
    });
    return apiClient.get(`${ApiRoutes.GetPerformanceAppraisals}?${params.toString()}`);
  },

  async filterAppraisalCycles(filters) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value);
      }
    });
    return apiClient.get(`${ApiRoutes.GetPerformanceCycles}?${params.toString()}`);
  },

  async filterKPIs(filters) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value);
      }
    });
    return apiClient.get(`/v1/performance/kpis?${params.toString()}`);
  },
};
