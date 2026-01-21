import { LoginUtil } from '@/pages/login/local-storage.util';
import axios from 'axios';
import { apiRoutes } from './apiRoutes';

export const API = axios.create({
  baseURL: apiRoutes.BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  crossDomain: true,
});

// Add request interceptor to include auth token
API.interceptors.request.use(
  (config) => {
    const token = LoginUtil.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Add response interceptor for error handling
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized
      LoginUtil.removeAccessToken();
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error.response.data);
  },
);

export const apiClient = {
  async request(method, endpoint, data = null, options = {}) {
    try {
      const config = {
        ...options,
      };

      // Check if data is FormData (for file uploads)
      const isFormData = data instanceof FormData;

      // Remove undefined values from request body (skip for FormData)
      if (data && typeof data === 'object' && !isFormData) {
        Object.keys(data).forEach((key) => {
          if (data[key] === undefined) {
            delete data[key];
          }
        });
      }

      // Set proper content-type for FormData
      if (isFormData) {
        config.headers = {
          ...config.headers,
          'Content-Type': 'multipart/form-data',
        };
      }

      let response;
      switch (method) {
        case 'GET':
          response = await API.get(endpoint, config);
          break;
        case 'POST':
          response = await API.post(endpoint, data, config);
          break;
        case 'PUT':
          response = await API.put(endpoint, data, config);
          break;
        case 'PATCH':
          response = await API.patch(endpoint, data, config);
          break;
        case 'DELETE':
          response = await API.delete(endpoint, config);
          break;
        default:
          throw new Error(`Unsupported HTTP method: ${method}`);
      }

      return response.data;
    } catch (error) {
      console.error(`API Error [${method} ${endpoint}]:`, error);
      throw error;
    }
  },

  get(endpoint, options) {
    return this.request('GET', endpoint, null, options);
  },

  post(endpoint, data, options) {
    return this.request('POST', endpoint, data, options);
  },

  put(endpoint, data, options) {
    return this.request('PUT', endpoint, data, options);
  },

  patch(endpoint, data, options) {
    return this.request('PATCH', endpoint, data, options);
  },

  delete(endpoint, options) {
    return this.request('DELETE', endpoint, null, options);
  },
};
