// ── Demo-mode auth: all data lives in localStorage ───────────────────────────
// No backend required. Registered users persist across sessions.

const USERS_KEY   = 'diu_users';
const TOKEN_KEY   = 'authToken';
const USER_KEY    = 'authUser';
const RESET_KEY   = 'diu_reset_tokens'; // { token: email } map for password reset

const getUsers = () => {
  try { return JSON.parse(localStorage.getItem(USERS_KEY)) || []; }
  catch { return []; }
};

const saveUsers = (users) =>
  localStorage.setItem(USERS_KEY, JSON.stringify(users));

// Simple deterministic token — good enough for demo
const makeToken = (email) =>
  btoa(`${email}:${Date.now()}`).replace(/=/g, '');

export const authService = {

  // ── Register: name + email + password, stored locally ─────────────────────
  register: async ({ name, email, password }) => {
    await new Promise(r => setTimeout(r, 400)); // tiny delay for UX
    const users = getUsers();
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      return { success: false, error: 'An account already exists for this email.' };
    }
    const newUser = {
      id: `demo-${Date.now()}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,          // plain-text is fine for demo
      role: 'student',
      createdAt: new Date().toISOString(),
    };
    saveUsers([...users, newUser]);

    // auto-login after register
    const token = makeToken(newUser.email);
    const { password: _pw, ...safeUser } = newUser;
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(safeUser));
    return { success: true, data: { user: safeUser, token } };
  },

  // ── Login: match email + password against stored users ─────────────────────
  login: async (email, password) => {
    await new Promise(r => setTimeout(r, 400));
    const users = getUsers();
    const user = users.find(
      u => u.email.toLowerCase() === email.trim().toLowerCase() &&
           u.password === password
    );
    if (!user) {
      return { success: false, error: 'Invalid email or password.' };
    }
    const token = makeToken(user.email);
    const { password: _pw, ...safeUser } = user;
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(safeUser));
    return { success: true, data: { user: safeUser, token } };
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    return { success: true };
  },

  // ── Password reset (demo mode) ─────────────────────────────────────────────
  // Generates a reset token and stores it; in production this would send email.
  requestPasswordReset: async (email) => {
    await new Promise(r => setTimeout(r, 400));
    const users = getUsers();
    const user  = users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!user) return { success: false, error: 'No account found for this email.' };
    const token = Math.random().toString(36).slice(2) + Date.now().toString(36);
    const map   = JSON.parse(localStorage.getItem(RESET_KEY) || '{}');
    map[token]  = email.trim().toLowerCase();
    localStorage.setItem(RESET_KEY, JSON.stringify(map));
    return { success: true, token }; // In production: send email with token
  },

  verifyToken: async (token) => {
    await new Promise(r => setTimeout(r, 300));
    if (!token) return { success: false, error: 'INVALID_TOKEN' };
    const map = JSON.parse(localStorage.getItem(RESET_KEY) || '{}');
    if (!map[token]) return { success: false, error: 'INVALID_TOKEN' };
    return { success: true };
  },

  setPassword: async (token, password) => {
    await new Promise(r => setTimeout(r, 400));
    const map   = JSON.parse(localStorage.getItem(RESET_KEY) || '{}');
    const email = map[token];
    if (!email) return { success: false, error: 'INVALID_TOKEN' };
    const users = getUsers();
    const idx   = users.findIndex(u => u.email.toLowerCase() === email);
    if (idx === -1) return { success: false, error: 'INVALID_TOKEN' };
    users[idx] = { ...users[idx], password };
    saveUsers(users);
    // Invalidate token after use
    delete map[token];
    localStorage.setItem(RESET_KEY, JSON.stringify(map));
    return { success: true };
  },

  isAuthenticated: () => !!localStorage.getItem(TOKEN_KEY),
  getToken:        () => localStorage.getItem(TOKEN_KEY),
  getUser:         () => {
    try { return JSON.parse(localStorage.getItem(USER_KEY)); }
    catch { return null; }
  },
};
