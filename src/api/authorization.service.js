import { apiClient, makeQueryParams } from './apiClient';
import { ApiRoutes } from './apiRoutes';

export const authorizationService = {
  async getPendingCount() {
    let endpoint = ApiRoutes.pendingAuthorization.counts;

    return apiClient.get(endpoint);
  },

  async getPending(options) {
    let endpoint = ApiRoutes.pendingAuthorization.pendingItems;
    if (options) {
      endpoint = `${endpoint}?${makeQueryParams(options)}`;
    }
    return apiClient.get(endpoint);
  },

  async getModulePending(moduleName, options) {
    let endpoint = ApiRoutes.pendingAuthorization.modulePending(moduleName);
    if (options) {
      endpoint = `${endpoint}?${makeQueryParams(options)}`;
    }
    return apiClient.get(endpoint);
  },
};
