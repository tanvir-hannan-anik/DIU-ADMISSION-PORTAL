import api from './api';

export const scholarshipService = {
  getMyApplications: () => api.get('/v1/scholarships/my'),
  getAllApplications: () => api.get('/v1/scholarships/all'),
  getByStatus: (status) => api.get(`/v1/scholarships/all/status/${status}`),
  apply: (data) => api.post('/v1/scholarships/apply', data),
  updateStatus: (id, data) => api.patch(`/v1/scholarships/${id}/status`, data),
};
