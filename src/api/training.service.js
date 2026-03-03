import { makeQueryParams } from './apiClient';
import { ApiRoutes } from './apiRoutes';
import { apiClient, apiRoutes } from './index';

export const trainingService = {
  submitRequest: (requestData) => {
    return apiClient.post(ApiRoutes.TrainingRequests, requestData);
  },

  getRequests: (options) => {
    const params = makeQueryParams(options);

    const url = `${apiRoutes.TrainingRequests}?${params}`;
    return apiClient.get(url);
  },

  // Get specific training request details
  getRequestById: async (requestId) => {
    return await apiClient.get(apiRoutes.GetTrainingRequest(requestId));
  },

  // Supervisor approve or reject training request
  supervisorApprove: (requestId, approved, supervisorNote = '') => {
    return apiClient.put(apiRoutes.SupervisorApproveTrainingRequest(requestId), {
      approved,
      supervisorNote,
    });
  },

  // HR Officer review. Approve or reject training request
  hrApprove: async (requestId, approved, rejectionReason = '') => {
    return await apiClient.put(apiRoutes.HRReviewTrainingRequest(requestId), {
      approved,
      rejectionReason,
    });
  },

  // HR Manager give final approval or rejection
  finalApprove: (requestId, approved, finalNote = '') => {
    return apiClient.put(apiRoutes.FinalApproveTrainingRequest(requestId), {
      approved,
      finalNote,
    });
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
