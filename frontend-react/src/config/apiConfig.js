const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:8081/api',
  AI_BASE_URL: process.env.REACT_APP_AI_URL || process.env.REACT_APP_API_URL || 'http://localhost:5000',
  TIMEOUT: process.env.REACT_APP_TIMEOUT || 30000,
  DEBUG: process.env.REACT_APP_DEBUG === 'true',
};

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/v1/auth/login',
    SIGNUP: '/v1/auth/signup',
    REGISTER: '/v1/auth/register',
    VERIFY: '/v1/auth/verify',
    SET_PASSWORD: '/v1/auth/set-password',
    LOGOUT: '/v1/auth/logout',
    REFRESH: '/v1/auth/refresh',
  },
  AI: {
    PROCESS_PROMPT: '/api/v1/ai/process',
    HEALTH: '/api/v1/health/check',
  },
  ADMISSION: {
    APPLICATIONS: '/v1/admission/applications',
    SUBMIT_APPLICATION: '/v1/admission/submit',
    GET_APPLICATION: '/v1/admission/applications/:id',
    STATS: '/v1/admission/stats',
    UPDATE_STATUS: '/v1/admission/applications/:id/status',
  },
};

export default API_CONFIG;
