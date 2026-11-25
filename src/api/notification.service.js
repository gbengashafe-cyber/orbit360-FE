import { apiClient } from './apiClient';
import { ApiRoutes } from './apiRoutes';

export const notificationService = {
  getFeed: (params = {}) => apiClient.get(`${ApiRoutes.notifications.feed}?${new URLSearchParams(params)}`),
  getUnreadCount: () => apiClient.get(ApiRoutes.notifications.unreadCount),
  markRead: (id) => apiClient.patch(ApiRoutes.notifications.markRead(id), {}),
  markAllRead: (category) =>
    apiClient.patch(`${ApiRoutes.notifications.markAllRead}${category ? `?category=${encodeURIComponent(category)}` : ''}`, {}),
  getPreferences: () => apiClient.get(ApiRoutes.notifications.preferences),
  updatePreference: (category, values) => apiClient.patch(ApiRoutes.notifications.preferences, { category, ...values }),
  getRealtime: () => apiClient.get(`${ApiRoutes.notifications.realtime}?rows=20`),
  acknowledgeRealtime: (ids) => apiClient.post(ApiRoutes.notifications.acknowledgeRealtime, { ids }),
};
