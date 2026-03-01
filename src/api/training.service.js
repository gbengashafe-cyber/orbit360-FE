import { ApiRoutes } from './apiRoutes';
import { apiClient, apiRoutes } from './index';

export const trainingService = {
  submitRequest: (requestData) => {
    return apiClient.post(ApiRoutes.TrainingRequests, requestData);
  },

  // Get all training requests for current user
  getRequests: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.limit) params.append('limit', filters.limit);
      if (filters.offset) params.append('offset', filters.offset);

      const url = `${apiRoutes.TrainingRequests}${params.toString() ? '?' + params.toString() : ''}`;
      const response = await apiClient.get(url);
      return response;
    } catch (error) {
      console.error('Error fetching training requests:', error);
      throw error;
    }
  },

  // Get specific training request details
  getRequestById: async (requestId) => {
    try {
      const response = await apiClient.get(apiRoutes.GetTrainingRequest(requestId));
      return response;
    } catch (error) {
      console.error('Error fetching training request:', error);
      throw error;
    }
  },

  // Supervisor approve or reject training request
  supervisorApprove: async (requestId, approved, rejectionReason = '') => {
    try {
      const response = await apiClient.put(apiRoutes.SupervisorApproveTrainingRequest(requestId), {
        approved,
        rejectionReason,
      });
      return response;
    } catch (error) {
      console.error('Error submitting supervisor approval:', error);
      throw error;
    }
  },

  // HR Officer approve or reject training request
  hrApprove: async (requestId, approved, rejectionReason = '') => {
    try {
      const response = await apiClient.put(apiRoutes.HRApproveTrainingRequest(requestId), {
        approved,
        rejectionReason,
      });
      return response;
    } catch (error) {
      console.error('Error submitting HR approval:', error);
      throw error;
    }
  },

  // HR Manager give final approval or rejection
  finalApprove: async (requestId, approved, rejectionReason = '') => {
    try {
      const response = await apiClient.put(apiRoutes.FinalApproveTrainingRequest(requestId), {
        approved,
        rejectionReason,
      });
      return response;
    } catch (error) {
      console.error('Error submitting final approval:', error);
      throw error;
    }
  },

  // Delete training request
  deleteRequest: async (requestId) => {
    try {
      const response = await apiClient.delete(apiRoutes.DeleteTrainingRequest(requestId));
      return response;
    } catch (error) {
      console.error('Error deleting training request:', error);
      throw error;
    }
  },
};
