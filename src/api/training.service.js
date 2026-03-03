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

  getRequestsByEmployee: (options) => {
    const params = makeQueryParams(options);

    const url = `${apiRoutes.training.employeeRequests}?${params}`;
    return apiClient.get(url);
  },

  getRequestById: async (requestId) => {
    return await apiClient.get(apiRoutes.GetTrainingRequest(requestId));
  },

  supervisorApprove: (requestId, approved, supervisorNote = '') => {
    return apiClient.put(apiRoutes.SupervisorApproveTrainingRequest(requestId), {
      approved,
      supervisorNote,
    });
  },

  hrReview: (requestId, payload) => {
    return apiClient.put(apiRoutes.HRReviewTrainingRequest(requestId), payload);
  },

  finalApprove: (requestId, approved, finalNote = '') => {
    return apiClient.put(apiRoutes.FinalApproveTrainingRequest(requestId), {
      approved,
      finalNote,
    });
  },

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
