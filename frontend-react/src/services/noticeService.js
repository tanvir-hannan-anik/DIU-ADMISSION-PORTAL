import api from './api';

export const noticeService = {
  getActiveNotices: () => api.get('/v1/notices'),
  getAllNotices: () => api.get('/v1/notices/all'),
  getById: (id) => api.get(`/v1/notices/${id}`),
  create: (data) => api.post('/v1/notices', data),
  update: (id, data) => api.put(`/v1/notices/${id}`, data),
  delete: (id) => api.delete(`/v1/notices/${id}`),
};
