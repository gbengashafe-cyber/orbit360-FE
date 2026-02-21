import { logger } from '@/utils';
import { localStorageKeys, LocalStorageUtil } from '@/utils/local-storage.util';
import axios from 'axios';
import { useEffect, useState } from 'react';
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
    const token = LocalStorageUtil.get(localStorageKeys.ACCESS_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

export const APIWithoutAuth = axios.create({
  baseURL: apiRoutes.BASE_URL,
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject, config }) => {
    if (error) {
      reject(error.response?.data);
    } else {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
      resolve(API(config));
    }
  });

  failedQueue = [];
};

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalConfig = error.config;
    const unauthorized = error.response?.status === 401;
    const attemptedRefreshToken = originalConfig?._retry;
    const isRefreshTokenCall = originalConfig?.url?.includes(apiRoutes.RefreshToken);

    if (attemptedRefreshToken || isRefreshTokenCall || !unauthorized) {
      logger.error({ caller: 'API call: ' + originalConfig.url, payload: error });
      return Promise.reject(error.response?.data);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject, config: originalConfig });
      });
    }

    isRefreshing = true;
    originalConfig._retry = true;

    try {
      const rs = await APIWithoutAuth.post(apiRoutes.RefreshToken);
      const newAccessToken = rs.data.data?.accessToken;
      if (!newAccessToken) throw new Error('Session expired');

      LocalStorageUtil.save(newAccessToken, 'orbit360-access-token');

      processQueue(null, newAccessToken);

      originalConfig.headers = originalConfig.headers || {};
      originalConfig.headers.Authorization = `Bearer ${newAccessToken}`;

      return API(originalConfig);
    } catch (refreshError) {
      logger.error({ caller: originalConfig, error: refreshError });
      processQueue(error);
      LocalStorageUtil.delete(localStorageKeys.ACCESS_TOKEN);
      window.location.href = '/login';
      return Promise.reject(error.response?.data);
    } finally {
      isRefreshing = false;
    }
  },
);

export const apiClient = {
  async request(method, endpoint, data = null, options = {}) {
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

export const makeQueryParams = (options = {}) =>
  Object.entries(options)
    // eslint-disable-next-line no-unused-vars
    .filter(([_, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');

export const useDebounce = (value, delay = 300) => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
};
