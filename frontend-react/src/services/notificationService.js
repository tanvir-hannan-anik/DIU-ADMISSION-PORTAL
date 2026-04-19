import api from './api';

export const notificationService = {
  getAll: () => api.get('/v1/notifications/my'),
  getUnread: () => api.get('/v1/notifications/my/unread'),
  getUnreadCount: () => api.get('/v1/notifications/my/count'),
  markRead: (id) => api.put(`/v1/notifications/${id}/read`),
  markAllRead: () => api.put('/v1/notifications/read-all'),
};
