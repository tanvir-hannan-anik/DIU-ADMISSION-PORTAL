import api from './api';
import API_CONFIG from '../config/apiConfig';
import axios from 'axios';

// Uses Spring Boot (MySQL-backed). Falls back to Python AI service if unavailable.
const aiApi = axios.create({ baseURL: API_CONFIG.AI_URL, timeout: API_CONFIG.TIMEOUT });

// Direct client for Python Flask service (external jobs proxy — API key stays server-side)
const flaskApi = axios.create({ baseURL: API_CONFIG.AI_BASE_URL, timeout: 15000 });

export const jobService = {
  searchJobs: async (term = '') => {
    try {
      const params = term ? { term } : {};
      return await api.get('/v1/jobs', { params });
    } catch {
      // fallback to Python service
      return aiApi.get('/api/v1/jobs/search', { params: { term } });
    }
  },

  searchExternalJobs: async (keyword, location = 'Bangladesh') => {
    return flaskApi.get('/api/v1/jobs/external', { params: { keyword, location } });
  },

  getJobsByCategory: (category) => api.get(`/v1/jobs/category/${category}`),

  getById: (id) => api.get(`/v1/jobs/${id}`),

  createJob: (data) => api.post('/v1/jobs', data),

  updateJob: (id, data) => api.put(`/v1/jobs/${id}`, data),

  deleteJob: (id) => api.delete(`/v1/jobs/${id}`),
};
