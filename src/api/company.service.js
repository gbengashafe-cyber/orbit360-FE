import { apiClient, makeQueryParams } from './apiClient';
import { ApiRoutes } from './apiRoutes';

export const companyService = {
  async getCompanies({ page = 1, rows = 25, options } = { page: 1, rows: 25 }) {
    const endpoint = ApiRoutes.company.getCompanies;

    if (options) {
      const queryParams = makeQueryParams(options);
      return apiClient.get(`${endpoint}?page=${page}&rows=${rows}&${queryParams}`);
    }
    return apiClient.get(`${endpoint}?page=${page}&rows=${rows}`);
  },

  async getCompanyDepartments(companyId, options) {
    const endpoint = ApiRoutes.company.getCompanyDepartment(companyId);

    const queryParams = makeQueryParams(options);
    return apiClient.get(`${endpoint}?${queryParams}`);
  },
};
