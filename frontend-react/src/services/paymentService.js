import api from './api';

export const paymentService = {
  getMyPayments: () => api.get('/v1/payments/my'),
  getMyTotal: () => api.get('/v1/payments/my/total'),
  getAllPayments: () => api.get('/v1/payments/all'),
  createPayment: (data) => api.post('/v1/payments', data),
  updateStatus: (id, status) => api.patch(`/v1/payments/${id}/status`, { status }),
};
