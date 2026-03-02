import { apiClient, makeQueryParams } from './apiClient';
import { ApiRoutes } from './apiRoutes';

export const dashboardService = {
  async getDashboard(options) {
    let endpoint = `${ApiRoutes.GetDashboard}`;

    if (options) {
      const queryParams = makeQueryParams(options);
      endpoint = endpoint + `?${queryParams}`;
    }
    return apiClient.get(endpoint);
  },
  async getHRDashboard(options) {
    let endpoint = `${ApiRoutes.GetHRDashboard}`;

    if (options) {
      const queryParams = makeQueryParams(options);
      endpoint = endpoint + `?${queryParams}`;
    }
    return apiClient.get(endpoint);
  },
};
