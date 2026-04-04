import axios from 'axios';
import API_CONFIG, { API_ENDPOINTS } from '../config/apiConfig';

const aiApi = axios.create({
  baseURL: API_CONFIG.AI_BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: { 'Content-Type': 'application/json' },
});

export const aiService = {
  processPrompt: async (promptData) => {
    try {
      const response = await aiApi.post(API_ENDPOINTS.AI.PROCESS_PROMPT, {
        prompt: promptData.prompt,
        context: promptData.context || '',
        userId: promptData.userId || '',
        moduleType: promptData.moduleType || 'general',
        history: promptData.history || [],
      });

      return {
        success: true,
        data: response.data?.data || response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        errorCode: error.response?.data?.errorCode,
      };
    }
  },

  checkHealth: async () => {
    try {
      const response = await aiApi.get(API_ENDPOINTS.AI.HEALTH);
      return response.data?.data || response.data;
    } catch (error) {
      console.error('AI service health check failed:', error);
      return null;
    }
  },
};
