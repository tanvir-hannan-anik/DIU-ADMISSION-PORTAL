import api from './api';
import { API_ENDPOINTS } from '../config/apiConfig';

export const authService = {
  login: async (email, password) => {
    try {
      const response = await api.post(API_ENDPOINTS.AUTH.LOGIN, {
        email,
        password,
      });

      const token = response.data?.data?.token;
      if (token) {
        localStorage.setItem('authToken', token);
      }

      return { success: true, data: response.data?.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  },

  signup: async (userData) => {
    try {
      const response = await api.post(API_ENDPOINTS.AUTH.SIGNUP, userData);
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
    return { success: true };
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('authToken');
  },

  getToken: () => {
    return localStorage.getItem('authToken');
  },
};
