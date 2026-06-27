// Dedicated API client for the Admin Portal.
// Kept separate from the public-site `api` instance so that:
//   • the admin JWT is stored under its own key (no collision with the
//     student session), and
//   • a 401 redirects to /admin (not the student /login).
import axios from 'axios';
import API_CONFIG from '../config/apiConfig';

const ADMIN_TOKEN_KEY = 'adminToken';
const ADMIN_USER_KEY = 'adminUser';

const adminApi = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: { 'Content-Type': 'application/json' },
});

adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

adminApi.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Session invalid/expired or not an admin — drop it and bounce to login.
      localStorage.removeItem(ADMIN_TOKEN_KEY);
      localStorage.removeItem(ADMIN_USER_KEY);
      if (!window.location.pathname.endsWith('/admin')) {
        window.location.href = '/admin';
      }
    }
    return Promise.reject(error);
  }
);

export const adminSession = {
  save(token, user) {
    localStorage.setItem(ADMIN_TOKEN_KEY, token);
    localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(user));
  },
  clear() {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(ADMIN_USER_KEY);
  },
  getToken: () => localStorage.getItem(ADMIN_TOKEN_KEY),
  getUser() {
    try { return JSON.parse(localStorage.getItem(ADMIN_USER_KEY)); } catch { return null; }
  },
  isAuthenticated: () => !!localStorage.getItem(ADMIN_TOKEN_KEY),
};

export default adminApi;
