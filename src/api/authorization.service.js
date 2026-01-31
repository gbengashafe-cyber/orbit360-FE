import { apiClient, makeQueryParams } from './apiClient';
import { ApiRoutes } from './apiRoutes';

export const authorizationService = {
  async getPendingCount() {
    let endpoint = ApiRoutes.PendingAuthorizationCount;

    return apiClient.get(endpoint);
  },

  async getPending(options) {
    let endpoint = ApiRoutes.PendingAuthorization;
    if (options) {
      endpoint = `${endpoint}?${makeQueryParams(options)}`;
    }
    return apiClient.get(endpoint);
  },
};
