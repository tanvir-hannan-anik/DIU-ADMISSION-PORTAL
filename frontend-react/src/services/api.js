import axios from 'axios';
import API_CONFIG from '../config/apiConfig';

const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (API_CONFIG.DEBUG) {
      console.log('API Request:', config.method.toUpperCase(), config.url);
    }

    return config;
  },
  (error) => {
    if (API_CONFIG.DEBUG) console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    if (API_CONFIG.DEBUG) {
      console.log('API Response:', response.status, response.data);
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }

    if (API_CONFIG.DEBUG) console.error('Response error:', error);
    return Promise.reject(error);
  }
);

export default api;
