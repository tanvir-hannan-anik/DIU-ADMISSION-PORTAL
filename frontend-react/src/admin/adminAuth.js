// Admin authentication: talks straight to the Spring Boot backend.
// The real authorization gate is server-side (hasRole("ADMIN") on /v1/admin/**);
// the role check here is for UX so non-admins never see the dashboard shell.
import adminApi, { adminSession } from './adminApi';

const ERROR_MESSAGES = {
  INVALID_CREDENTIALS: 'Invalid email or password.',
  ACCOUNT_NOT_VERIFIED: 'This account is not verified.',
  ACCOUNT_LOCKED: 'Too many failed attempts. Try again in a few minutes.',
  NOT_ADMIN: 'This account does not have admin access.',
};

export const adminAuth = {
  async login(email, password) {
    let res;
    try {
      res = await adminApi.post('/v1/auth/login', { email: email.trim(), password });
    } catch (err) {
      // Distinguish "server problem" from "wrong credentials" so the message is useful.
      if (!err.response) {
        return { success: false, error: 'Cannot reach the server. It may be offline, suspended, or waking up — please try again in a minute.' };
      }
      const status = err.response.status;
      if (status === 503) {
        return { success: false, error: 'The server is unavailable (suspended or restarting on Render). Try again shortly.' };
      }
      if (status >= 500) {
        return { success: false, error: 'Server error. Please try again in a moment.' };
      }
      const code = err.response.data?.error || '';
      return { success: false, error: ERROR_MESSAGES[code] || 'Login failed. Please try again.' };
    }

    const { token, user } = res.data.data || {};
    const role = (user?.role || '').toLowerCase();
    if (!token || role !== 'admin') {
      // Not an admin — do not establish an admin session.
      return { success: false, error: ERROR_MESSAGES.NOT_ADMIN };
    }

    adminSession.save(token, user);
    return { success: true, user };
  },

  // Confirms the stored token is still valid AND still has admin role,
  // by hitting the protected /v1/admin/me endpoint.
  async verify() {
    if (!adminSession.isAuthenticated()) return false;
    try {
      const res = await adminApi.get('/v1/admin/me');
      const user = res.data.data;
      if (user) adminSession.save(adminSession.getToken(), user);
      return true;
    } catch {
      adminSession.clear();
      return false;
    }
  },

  logout() {
    adminSession.clear();
  },

  getUser: () => adminSession.getUser(),
};
