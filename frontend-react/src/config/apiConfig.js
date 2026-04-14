// Render's fromService property:host returns https://service.onrender.com (no /api suffix).
// Spring Boot has context-path=/api, so we append /api when the URL doesn't already include it.
const rawApiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';
const BASE_URL = rawApiUrl.endsWith('/api') || rawApiUrl.endsWith('/api/')
  ? rawApiUrl.replace(/\/$/, '')
  : `${rawApiUrl}/api`;

const API_CONFIG = {
  BASE_URL,
  AI_BASE_URL: process.env.REACT_APP_AI_URL || 'http://localhost:5000',
  TIMEOUT: parseInt(process.env.REACT_APP_TIMEOUT || '30000', 10),
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
