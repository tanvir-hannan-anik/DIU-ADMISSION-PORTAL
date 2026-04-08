import api from './api';
import { API_ENDPOINTS } from '../config/apiConfig';

export const authService = {
  login: async (email, password) => {
    try {
      const response = await api.post(API_ENDPOINTS.AUTH.LOGIN, { email, password });
      const token = response.data?.data?.token;
      if (token) {
        localStorage.setItem('authToken', token);
        const user = response.data?.data?.user;
        if (user) localStorage.setItem('authUser', JSON.stringify(user));
      }
      return { success: true, data: response.data?.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  },

  register: async (email) => {
    try {
      const response = await api.post(API_ENDPOINTS.AUTH.REGISTER, { email });
      return { success: true, data: response.data?.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  },

  verifyToken: async (token) => {
    try {
      const response = await api.get(`${API_ENDPOINTS.AUTH.VERIFY}?token=${token}`);
      return { success: true, data: response.data?.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  },

  setPassword: async (token, password) => {
    try {
      const response = await api.post(API_ENDPOINTS.AUTH.SET_PASSWORD, { token, password });
      return { success: true, data: response.data?.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  },

  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    return { success: true };
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('authToken');
  },

  getToken: () => {
    return localStorage.getItem('authToken');
  },

  getUser: () => {
    const user = localStorage.getItem('authUser');
    return user ? JSON.parse(user) : null;
  },
};
