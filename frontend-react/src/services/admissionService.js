import api from './api';
import { API_ENDPOINTS } from '../config/apiConfig';

export const admissionService = {
  getApplications: async () => {
    try {
      const response = await api.get(API_ENDPOINTS.ADMISSION.APPLICATIONS);
      return {
        success: true,
        data: response.data?.data || [],
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  },

  getStats: async () => {
    try {
      const response = await api.get(API_ENDPOINTS.ADMISSION.STATS);
      return {
        success: true,
        data: response.data?.data || {},
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  },

  submitApplication: async (formData) => {
    try {
      const response = await api.post(API_ENDPOINTS.ADMISSION.SUBMIT_APPLICATION, formData);
      return {
        success: true,
        data: response.data?.data || response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  },

  getApplicationById: async (id) => {
    try {
      const response = await api.get(API_ENDPOINTS.ADMISSION.GET_APPLICATION.replace(':id', id));
      return {
        success: true,
        data: response.data?.data || response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  },

  updateStatus: async (appId, status) => {
    try {
      const response = await api.patch(
        API_ENDPOINTS.ADMISSION.UPDATE_STATUS.replace(':id', appId),
        { status }
      );
      return {
        success: true,
        data: response.data?.data || response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  },
};
