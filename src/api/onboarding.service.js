import { apiClient } from './apiClient';
import { ApiRoutes } from './apiRoutes';

export const onboardingService = {
  // Get all onboardings
  async getOnboardings(page = 1, rows = 10) {
    return apiClient.get(`${ApiRoutes.GetOnboardings}?page=${page}&rows=${rows}`);
  },

  // Get onboarding by ID
  async getOnboardingById(id) {
    return apiClient.get(ApiRoutes.GetOnboardingById(id));
  },

  // Create onboarding document
  async createOnboarding(data) {
    return apiClient.post(ApiRoutes.CreateOnboarding, data);
  },

  // Update onboarding
  async updateOnboarding(id, data) {
    return apiClient.put(ApiRoutes.UpdateOnboarding(id), data);
  },

  // Delete onboarding
  async deleteOnboarding(id) {
    return apiClient.delete(ApiRoutes.DeleteOnboarding(id));
  },

  // Get onboardings by employee
  async getOnboardingsByEmployee(employeeId, page = 1, rows = 10) {
    return apiClient.get(`${ApiRoutes.GetOnboardingsByEmployee(employeeId)}?page=${page}&rows=${rows}`);
  },
};
