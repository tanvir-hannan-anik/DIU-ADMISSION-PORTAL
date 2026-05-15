// ── Auth service: tries Spring Boot backend first, falls back to localStorage ──
// Backend flow (admitted students): register email → verify token → set-password → login
// LocalStorage flow (self-registered): name + email + password stored locally

import api from './api';
import { signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import {
  auth,
  db,
  googleProvider,
  isFirebaseConfigured,
  ALLOWED_DOMAIN,
} from '../config/firebase';

const USERS_KEY = 'diu_users';
const TOKEN_KEY = 'authToken';
const USER_KEY  = 'authUser';
const RESET_KEY = 'diu_reset_tokens';

const getUsers  = () => { try { return JSON.parse(localStorage.getItem(USERS_KEY)) || []; } catch { return []; } };
const saveUsers = (u) => localStorage.setItem(USERS_KEY, JSON.stringify(u));
const makeToken = (email) => btoa(`${email}:${Date.now()}`).replace(/=/g, '');

// ── Helpers ────────────────────────────────────────────────────────────────────
function saveSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export const authService = {

  // ── Login: try backend JWT first, fall back to localStorage ────────────────
  login: async (email, password) => {
    // Special admin shortcut (localStorage only)
    const users = getUsers();
    const adminUser = users.find(u => u.email.toLowerCase() === email.trim().toLowerCase() && u.role === 'admin');
    if (adminUser && adminUser.password === password) {
      const token = makeToken(adminUser.email);
      const { password: _pw, ...safeUser } = adminUser;
      saveSession(token, safeUser);
      return { success: true, data: { user: safeUser, token } };
    }

    // Try backend
    try {
      const res = await api.post('/v1/auth/login', { email: email.trim(), password });
      const { token, user } = res.data.data;
      saveSession(token, user);
      return { success: true, data: { user, token } };
    } catch (backendErr) {
      const backendMsg = backendErr?.response?.data?.error || '';
      // If backend explicitly rejects credentials, surface that error
      if (backendErr?.response?.status === 400 && backendMsg) {
        // Fall through to localStorage for locally-registered users
      }
    }

    // Fall back to localStorage (for self-registered students)
    await new Promise(r => setTimeout(r, 300));
    const user = users.find(
      u => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password
    );
    if (!user) return { success: false, error: 'INVALID_CREDENTIALS' };
    const token = makeToken(user.email);
    const { password: _pw, ...safeUser } = user;
    saveSession(token, safeUser);
    return { success: true, data: { user: safeUser, token } };
  },

  // ── Self-register: try backend first, fall back to localStorage ──────────────
  register: async ({ name, email, password, studentId }) => {
    // Try backend
    try {
      const res = await api.post('/v1/auth/self-register', { name: name.trim(), email: email.trim(), password, studentId: (studentId || '').trim() });
      const { token, user } = res.data.data;
      saveSession(token, user);
      return { success: true, data: { user, token } };
    } catch (err) {
      const msg = err?.response?.data?.error || '';
      if (msg === 'ACCOUNT_EXISTS') {
        return { success: false, error: 'An account already exists for this email.' };
      }
      // Backend unavailable — fall back to localStorage
    }

    await new Promise(r => setTimeout(r, 300));
    const users = getUsers();
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      return { success: false, error: 'An account already exists for this email.' };
    }
    const newUser = {
      id: `local-${Date.now()}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      studentId: (studentId || '').trim(),
      password,
      role: 'student',
      createdAt: new Date().toISOString(),
    };
    saveUsers([...users, newUser]);
    const token = makeToken(newUser.email);
    const { password: _pw, ...safeUser } = newUser;
    saveSession(token, safeUser);
    return { success: true, data: { user: safeUser, token } };
  },

  // ── Backend register flow (admitted students only) ─────────────────────────
  registerAdmitted: async (email) => {
    try {
      const res = await api.post('/v1/auth/register', { email: email.trim() });
      return { success: true, data: res.data.data };
    } catch (err) {
      const msg = err?.response?.data?.error || 'Registration failed.';
      if (msg === 'EMAIL_NOT_FOUND') return { success: false, error: 'This email is not in the admitted students list.' };
      if (msg === 'ACCOUNT_EXISTS')  return { success: false, error: 'An account already exists for this email.' };
      return { success: false, error: msg };
    }
  },

  // ── Verify token (backend) ─────────────────────────────────────────────────
  verifyToken: async (token) => {
    if (!token) return { success: false, error: 'INVALID_TOKEN' };
    // Try backend
    try {
      const res = await api.get(`/v1/auth/verify?token=${token}`);
      return { success: true, data: res.data.data };
    } catch {}
    // Fallback: local reset token
    const map = JSON.parse(localStorage.getItem(RESET_KEY) || '{}');
    if (!map[token]) return { success: false, error: 'INVALID_TOKEN' };
    return { success: true };
  },

  // ── Set password (backend or localStorage) ─────────────────────────────────
  setPassword: async (token, password) => {
    // Try backend
    try {
      await api.post('/v1/auth/set-password', { token, password });
      return { success: true };
    } catch {}
    // Fallback: local reset token
    await new Promise(r => setTimeout(r, 400));
    const map   = JSON.parse(localStorage.getItem(RESET_KEY) || '{}');
    const email = map[token];
    if (!email) return { success: false, error: 'INVALID_TOKEN' };
    const users = getUsers();
    const idx   = users.findIndex(u => u.email.toLowerCase() === email);
    if (idx === -1) return { success: false, error: 'INVALID_TOKEN' };
    users[idx] = { ...users[idx], password };
    saveUsers(users);
    delete map[token];
    localStorage.setItem(RESET_KEY, JSON.stringify(map));
    return { success: true };
  },

  // ── Password reset (localStorage only in demo) ─────────────────────────────
  requestPasswordReset: async (email) => {
    await new Promise(r => setTimeout(r, 400));
    const users = getUsers();
    const user  = users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!user) return { success: false, error: 'No account found for this email.' };
    const token = Math.random().toString(36).slice(2) + Date.now().toString(36);
    const map   = JSON.parse(localStorage.getItem(RESET_KEY) || '{}');
    map[token]  = email.trim().toLowerCase();
    localStorage.setItem(RESET_KEY, JSON.stringify(map));
    // Return the reset link so the UI can show it (demo mode — no email)
    return { success: true, token, resetLink: `/set-password?token=${token}` };
  },

  // ── Google Workspace sign-in (students, @diu.edu.bd only) ──────────────────
  // Authenticates with Firebase, rejects any non-diu.edu.bd account, then
  // upserts the student profile into Firestore (collection: "students").
  loginWithGoogle: async () => {
    if (!isFirebaseConfigured) {
      return { success: false, error: 'Google sign-in is not configured. Contact the administrator.' };
    }

    let result;
    try {
      result = await signInWithPopup(auth, googleProvider);
    } catch (err) {
      const code = err?.code || '';
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        return { success: false, error: 'Sign-in cancelled.' };
      }
      if (code === 'auth/popup-blocked') {
        return { success: false, error: 'Popup blocked. Please allow popups for this site and try again.' };
      }
      return { success: false, error: 'Google sign-in failed. Please try again.' };
    }

    const fbUser = result.user;
    const email = (fbUser.email || '').toLowerCase();

    // Enforce the institutional domain. `hd` on the provider is only a hint —
    // this check is the actual gate.
    if (!email.endsWith(`@${ALLOWED_DOMAIN}`)) {
      await signOut(auth).catch(() => {});
      return {
        success: false,
        error: `Only @${ALLOWED_DOMAIN} Google Workspace accounts can sign in.`,
      };
    }

    const uid = fbUser.uid;
    const profile = {
      uid,
      name: fbUser.displayName || email.split('@')[0],
      email,
      photoURL: fbUser.photoURL || '',
      role: 'student',
      provider: 'google',
      emailVerified: fbUser.emailVerified,
    };

    // Store / refresh the student record in Firestore.
    try {
      const ref = doc(db, 'students', uid);
      const snap = await getDoc(ref);
      await setDoc(
        ref,
        {
          ...profile,
          ...(snap.exists() ? {} : { createdAt: serverTimestamp() }),
          lastLoginAt: serverTimestamp(),
        },
        { merge: true },
      );
    } catch (err) {
      await signOut(auth).catch(() => {});
      return { success: false, error: 'Could not save your student profile. Please try again.' };
    }

    const token = await fbUser.getIdToken();
    const user = { id: uid, ...profile };
    saveSession(token, user);
    return { success: true, data: { user, token } };
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    if (isFirebaseConfigured) signOut(auth).catch(() => {});
    return { success: true };
  },

  isAuthenticated: () => !!localStorage.getItem(TOKEN_KEY),
  getToken:        () => localStorage.getItem(TOKEN_KEY),
  getUser:         () => { try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; } },
};
