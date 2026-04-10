import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const ADMIN_EMAIL = 'admin@diu.edu.bd';
const ADMIN_PASSWORD = 'admin123';

// Always ensure the admin account exists with correct credentials and role.
// If someone registered with admin@diu.edu.bd as a student, this fixes it.
export function seedAdminAccount() {
  try {
    const users = JSON.parse(localStorage.getItem('diu_users') || '[]');
    const idx   = users.findIndex(u => u.email.toLowerCase() === ADMIN_EMAIL);
    if (idx === -1) {
      users.push({
        id: 'admin-seed',
        name: 'Admin',
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        role: 'admin',
        createdAt: new Date().toISOString(),
      });
    } else {
      // Enforce correct password and role regardless of how the account was created
      users[idx] = { ...users[idx], password: ADMIN_PASSWORD, role: 'admin' };
    }
    localStorage.setItem('diu_users', JSON.stringify(users));
  } catch {}
}

function getAdminConfig() {
  try {
    const s = localStorage.getItem('diu_admin_config');
    if (s) return JSON.parse(s);
  } catch {}
  return {
    currentSemester:        'Spring 2025',
    registrationStart:      '2025-01-05',
    registrationDeadline:   '2025-01-20',
    lateRegistrationEnabled: true,
    lateRegistrationEnd:    '2025-02-05',
    lateFee:                5000,
  };
}

function saveAdminConfig(cfg) {
  localStorage.setItem('diu_admin_config', JSON.stringify(cfg));
}

export const AdminPanel = () => {
  const navigate = useNavigate();

  // auth
  const [loggedIn, setLoggedIn] = useState(() => sessionStorage.getItem('diu_admin_session') === '1');
  const [creds, setCreds]       = useState({ email: '', password: '' });
  const [authErr, setAuthErr]   = useState('');

  useEffect(() => { seedAdminAccount(); }, []);

  // tabs
  const [tab, setTab] = useState('dashboard');

  // config
  const [config, setConfig]     = useState(getAdminConfig);
  const [configSaved, setConfigSaved] = useState(false);

  // course JSON upload
  const [jsonText, setJsonText] = useState('');
  const [jsonErr,  setJsonErr]  = useState('');

  // users
  const [users, setUsers]       = useState([]);

  // registrations
  const [registrations, setRegistrations] = useState([]);

  // payments
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    if (loggedIn) {
      loadData();
    }
  }, [loggedIn]);

  function loadData() {
    try {
      const u = JSON.parse(localStorage.getItem('diu_users') || '[]');
      setUsers(u);
    } catch {}
    try {
      const r = JSON.parse(localStorage.getItem('diu_late_requests') || '[]');
      setRegistrations(r);
    } catch {}
    try {
      const p = JSON.parse(localStorage.getItem('diu_late_payments') || '[]');
      setPayments(p);
    } catch {}
  }

  const handleLogin = (e) => {
    e.preventDefault();
    try {
      const users = JSON.parse(localStorage.getItem('diu_users') || '[]');
      const match = users.find(
        u => u.email.toLowerCase() === creds.email.trim().toLowerCase() &&
             u.password === creds.password &&
             u.role === 'admin'
      );
      if (match) {
        sessionStorage.setItem('diu_admin_session', '1');
        setLoggedIn(true);
        toast.success(`Welcome, ${match.name}!`);
      } else {
        setAuthErr('Invalid email or password, or account is not an admin.');
      }
    } catch {
      setAuthErr('Login error. Please try again.');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('diu_admin_session');
    setLoggedIn(false);
  };

  const saveConfig = () => {
    saveAdminConfig(config);
    setConfigSaved(true);
    toast.success('Configuration saved!');
    setTimeout(() => setConfigSaved(false), 3000);
  };

  const handleUploadJSON = () => {
    setJsonErr('');
    try {
      const parsed = JSON.parse(jsonText);
      // Validate structure
      if (typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Must be an object with semester keys');
      const semKeys = Object.keys(parsed);
      if (semKeys.length === 0) throw new Error('No semesters found');
      for (const key of semKeys) {
        if (!Array.isArray(parsed[key])) throw new Error(`"${key}" must be an array of courses`);
        for (const course of parsed[key]) {
          if (!course.course_code || !course.subject) throw new Error(`Each course must have course_code and subject`);
        }
      }
      localStorage.setItem('diu_admin_semester_courses', JSON.stringify(parsed));
      toast.success(`Semester courses updated! ${semKeys.length} semesters loaded.`);
      setJsonText('');
    } catch (err) {
      setJsonErr(`Invalid JSON: ${err.message}`);
    }
  };

  const clearCustomCourses = () => {
    localStorage.removeItem('diu_admin_semester_courses');
    toast.info('Custom courses cleared. Default courses restored.');
  };

  const deleteUser = (email) => {
    const updated = users.filter(u => u.email !== email);
    localStorage.setItem('diu_users', JSON.stringify(updated));
    setUsers(updated);
    toast.success(`User ${email} deleted`);
  };

  const resetUserPassword = (email) => {
    const updated = users.map(u => u.email === email ? { ...u, password: '123456' } : u);
    localStorage.setItem('diu_users', JSON.stringify(updated));
    toast.info(`Password reset to 123456 for ${email}`);
  };

  // Stats
  const stats = {
    totalUsers: users.length,
    lateRequests: registrations.length,
    pendingApprovals: registrations.filter(r => ['dept_pending', 'registrar_pending'].includes(r.status)).length,
    completed: registrations.filter(r => r.status === 'completed').length,
    totalRevenue: payments.filter(p => p.status === 'confirmed').reduce((s, p) => s + (p.total || 0), 0),
  };

  // ── Login screen ──────────────────────────────────────────────────────────
  if (!loggedIn) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0A1045' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-orange-500 text-3xl">admin_panel_settings</span>
          </div>
          <h1 className="text-2xl font-extrabold text-gray-800">Admin Panel</h1>
          <p className="text-sm text-gray-500 mt-1">DIU Portal Administration</p>
        </div>

        {authErr && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 flex items-center gap-2">
            <span className="material-symbols-outlined text-base">error</span>
            {authErr}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Email</label>
            <input type="email" value={creds.email} onChange={e => { setCreds(p => ({ ...p, email: e.target.value })); setAuthErr(''); }}
              placeholder="admin@diu.edu.bd"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Password</label>
            <input type="password" value={creds.password} onChange={e => { setCreds(p => ({ ...p, password: e.target.value })); setAuthErr(''); }}
              placeholder="••••"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
          </div>
          <button type="submit"
            className="w-full py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-colors">
            Login to Admin Panel
          </button>
        </form>
        <button onClick={() => navigate('/')} className="w-full mt-4 text-sm text-gray-400 hover:text-gray-600 text-center">
          ← Back to Portal
        </button>
      </div>
    </div>
  );

  // ── Admin panel ────────────────────────────────────────────────────────────
  const TABS = [
    { id: 'dashboard',   label: 'Dashboard',        icon: 'dashboard'              },
    { id: 'config',      label: 'Registration Config', icon: 'settings'             },
    { id: 'courses',     label: 'Upload Courses',    icon: 'upload_file'            },
    { id: 'users',       label: 'Manage Users',      icon: 'group'                  },
    { id: 'requests',    label: 'Late Requests',     icon: 'pending_actions'        },
    { id: 'payments',    label: 'Payment Records',   icon: 'receipt_long'           },
  ];

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: '#f7f9fb', fontFamily: 'Inter, sans-serif' }}>

      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col">
        <div className="h-16 flex items-center px-5 gap-3 border-b border-gray-100">
          <span className="material-symbols-outlined text-2xl text-orange-500">admin_panel_settings</span>
          <div>
            <p className="font-black text-sm text-gray-800">Admin Panel</p>
            <p className="text-[10px] text-orange-500 font-bold uppercase tracking-wider">DIU Portal</p>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all
                ${tab === t.id ? 'bg-orange-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
              <span className="material-symbols-outlined text-base">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-100 space-y-1">
          <button onClick={() => navigate('/')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-100">
            <span className="material-symbols-outlined text-base">home</span>
            Portal Home
          </button>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50">
            <span className="material-symbols-outlined text-base">logout</span>
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top bar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-6">
          <h1 className="font-extrabold text-gray-800 text-lg">{TABS.find(t => t.id === tab)?.label}</h1>
          <div className="ml-auto flex items-center gap-3">
            <button onClick={loadData} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
              <span className="material-symbols-outlined text-base">refresh</span> Refresh
            </button>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-xl">
              <span className="material-symbols-outlined text-base text-gray-500">person</span>
              <span className="text-sm font-bold text-gray-700">admin</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">

          {/* ── DASHBOARD ───────────────────────────────────────────────── */}
          {tab === 'dashboard' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                  { label: 'Total Users',       value: stats.totalUsers,        icon: 'group',          color: 'blue'   },
                  { label: 'Late Requests',      value: stats.lateRequests,      icon: 'pending_actions',color: 'orange' },
                  { label: 'Pending Approvals',  value: stats.pendingApprovals,  icon: 'hourglass_empty',color: 'yellow' },
                  { label: 'Completed',          value: stats.completed,         icon: 'check_circle',   color: 'green'  },
                  { label: 'Total Revenue',      value: `৳${stats.totalRevenue.toLocaleString()}`, icon: 'payments', color: 'purple' },
                ].map(s => (
                  <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-5">
                    <span className={`material-symbols-outlined text-${s.color}-500 text-2xl`}>{s.icon}</span>
                    <p className="text-2xl font-extrabold text-gray-800 mt-2">{s.value}</p>
                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mt-1">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Quick status */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-orange-500">info</span>
                  Current Configuration
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  {[
                    { label: 'Current Semester',         value: config.currentSemester         },
                    { label: 'Registration Start',        value: config.registrationStart       },
                    { label: 'Registration Deadline',     value: config.registrationDeadline    },
                    { label: 'Late Registration',         value: config.lateRegistrationEnabled ? '✅ Enabled' : '❌ Disabled' },
                    { label: 'Late Registration End',     value: config.lateRegistrationEnd     },
                    { label: 'Late Fee',                  value: `৳${config.lateFee?.toLocaleString()}` },
                  ].map(item => (
                    <div key={item.label} className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 font-semibold">{item.label}</p>
                      <p className="font-bold text-gray-800 mt-0.5">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent late requests */}
              {registrations.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="font-bold text-gray-700">Recent Late Requests</h3>
                  </div>
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        {['Request ID', 'Student', 'Semester', 'Courses', 'Status', 'Date'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {registrations.slice(0, 5).map(r => (
                        <tr key={r.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-mono text-xs">{r.id}</td>
                          <td className="px-4 py-3 font-semibold">{r.studentName}</td>
                          <td className="px-4 py-3">{r.semester}</td>
                          <td className="px-4 py-3">{r.courses?.length}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold
                              ${r.status === 'completed' ? 'bg-green-100 text-green-700'
                              : r.status === 'paid' ? 'bg-blue-100 text-blue-700'
                              : 'bg-orange-100 text-orange-700'}`}>
                              {r.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-500 text-xs">
                            {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── REGISTRATION CONFIG ──────────────────────────────────────── */}
          {tab === 'config' && (
            <div className="max-w-2xl space-y-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
                <h3 className="font-bold text-gray-800">Semester Settings</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Current Semester Name</label>
                    <input value={config.currentSemester}
                      onChange={e => setConfig(p => ({ ...p, currentSemester: e.target.value }))}
                      placeholder="e.g. Spring 2025"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Registration Start</label>
                      <input type="date" value={config.registrationStart}
                        onChange={e => setConfig(p => ({ ...p, registrationStart: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Registration Deadline</label>
                      <input type="date" value={config.registrationDeadline}
                        onChange={e => setConfig(p => ({ ...p, registrationDeadline: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-orange-50 rounded-xl border border-orange-100 space-y-4">
                    <h4 className="font-bold text-orange-800 text-sm">Late Registration Settings</h4>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-sm text-gray-700">Enable Late Registration</p>
                        <p className="text-xs text-gray-500">Allow students to register after deadline</p>
                      </div>
                      <button onClick={() => setConfig(p => ({ ...p, lateRegistrationEnabled: !p.lateRegistrationEnabled }))}
                        className={`relative w-12 h-6 rounded-full transition-colors ${config.lateRegistrationEnabled ? 'bg-orange-500' : 'bg-gray-300'}`}>
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow ${config.lateRegistrationEnabled ? 'left-7' : 'left-1'}`} />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Late Reg. End Date</label>
                        <input type="date" value={config.lateRegistrationEnd}
                          onChange={e => setConfig(p => ({ ...p, lateRegistrationEnd: e.target.value }))}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Late Fee (৳)</label>
                        <input type="number" value={config.lateFee}
                          onChange={e => setConfig(p => ({ ...p, lateFee: parseInt(e.target.value) || 0 }))}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <button onClick={saveConfig}
                  className={`w-full py-3 rounded-xl font-bold text-sm transition-colors
                    ${configSaved ? 'bg-green-500 text-white' : 'bg-orange-500 text-white hover:bg-orange-600'}`}>
                  {configSaved ? '✓ Saved Successfully' : 'Save Configuration'}
                </button>
              </div>
            </div>
          )}

          {/* ── UPLOAD COURSES ────────────────────────────────────────────── */}
          {tab === 'courses' && (
            <div className="max-w-3xl space-y-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
                <div>
                  <h3 className="font-bold text-gray-800 mb-1">Upload Semester Courses JSON</h3>
                  <p className="text-sm text-gray-500">Paste a JSON object mapping semester names to course arrays. This will override the default courses.</p>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 text-xs font-mono text-gray-600 border border-gray-200">
                  <p className="font-bold text-gray-700 mb-2">Expected Format:</p>
                  {`{\n  "Semester 1": [\n    { "course_code": "ENG101", "subject": "English Language I" },\n    { "course_code": "CIS115L", "subject": "Structured Programming Lab" }\n  ],\n  "Semester 2": [...]\n}`}
                </div>

                <textarea
                  value={jsonText}
                  onChange={e => { setJsonText(e.target.value); setJsonErr(''); }}
                  rows={12}
                  placeholder='Paste your JSON here...'
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none"
                />

                {jsonErr && (
                  <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 flex items-center gap-2">
                    <span className="material-symbols-outlined text-base">error</span>
                    {jsonErr}
                  </div>
                )}

                <div className="flex gap-3">
                  <button onClick={handleUploadJSON} disabled={!jsonText.trim()}
                    className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed">
                    Upload & Apply JSON
                  </button>
                  <button onClick={clearCustomCourses}
                    className="px-5 py-3 border border-gray-200 rounded-xl font-semibold text-sm text-gray-600 hover:bg-gray-50">
                    Reset to Default
                  </button>
                </div>

                {localStorage.getItem('diu_admin_semester_courses') && (
                  <div className="px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 flex items-center gap-2">
                    <span className="material-symbols-outlined text-base">check_circle</span>
                    Custom courses are currently active. Students will see these courses.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── MANAGE USERS ──────────────────────────────────────────────── */}
          {tab === 'users' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-500">{users.length} registered users</p>
                <button onClick={loadData} className="text-sm text-orange-600 font-semibold flex items-center gap-1">
                  <span className="material-symbols-outlined text-base">refresh</span> Refresh
                </button>
              </div>

              {users.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
                  <span className="material-symbols-outlined text-4xl mb-2 block">group_off</span>
                  No users registered yet
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        {['#', 'Name', 'Email', 'Registered', 'Actions'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {users.map((u, i) => (
                        <tr key={u.email} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-400 text-xs">{i + 1}</td>
                          <td className="px-4 py-3 font-semibold text-gray-800 flex items-center gap-2">
                            {u.name}
                            {u.role === 'admin' && (
                              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 uppercase tracking-wide">Admin</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-gray-600">{u.email}</td>
                          <td className="px-4 py-3 text-gray-400 text-xs">
                            {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '-'}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              {u.role !== 'admin' && (
                              <button onClick={() => resetUserPassword(u.email)}
                                className="text-xs px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg font-semibold hover:bg-blue-100">
                                Reset Pass
                              </button>
                              )}
                              {u.role !== 'admin' && (
                              <button onClick={() => deleteUser(u.email)}
                                className="text-xs px-3 py-1.5 bg-red-50 text-red-600 rounded-lg font-semibold hover:bg-red-100">
                                Delete
                              </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── LATE REQUESTS ─────────────────────────────────────────────── */}
          {tab === 'requests' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-500">{registrations.length} total late requests</p>
                <button onClick={loadData} className="text-sm text-orange-600 font-semibold flex items-center gap-1">
                  <span className="material-symbols-outlined text-base">refresh</span> Refresh
                </button>
              </div>
              {registrations.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
                  <span className="material-symbols-outlined text-4xl mb-2 block">pending_actions</span>
                  No late registration requests
                </div>
              ) : (
                <div className="space-y-4">
                  {registrations.map(r => (
                    <div key={r.id} className="bg-white rounded-xl border border-gray-200 p-5">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-bold text-gray-800">{r.studentName}</p>
                          <p className="text-xs text-gray-500">{r.studentEmail} · {r.id}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold
                          ${r.status === 'completed' ? 'bg-green-100 text-green-700'
                          : r.status === 'paid' ? 'bg-blue-100 text-blue-700'
                          : r.status === 'payment_enabled' ? 'bg-purple-100 text-purple-700'
                          : 'bg-orange-100 text-orange-700'}`}>
                          {r.status?.replace(/_/g, ' ').toUpperCase()}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-3 text-sm">
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs text-gray-500">Semester</p>
                          <p className="font-semibold">{r.semester}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs text-gray-500">Courses</p>
                          <p className="font-semibold">{r.courses?.length}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs text-gray-500">Total Fee</p>
                          <p className="font-semibold">৳{r.fees?.total?.toLocaleString()}</p>
                        </div>
                      </div>
                      {r.reason && (
                        <div className="mt-3 p-3 bg-orange-50 rounded-lg">
                          <p className="text-xs text-orange-700 font-semibold">Reason:</p>
                          <p className="text-sm text-gray-700 mt-1">{r.reason}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── PAYMENT RECORDS ───────────────────────────────────────────── */}
          {tab === 'payments' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                  { label: 'Total Payments',  value: payments.length, color: 'blue' },
                  { label: 'Confirmed',        value: payments.filter(p => p.status === 'confirmed').length, color: 'green' },
                  { label: 'Total Revenue',    value: `৳${payments.reduce((s, p) => s + (p.total || 0), 0).toLocaleString()}`, color: 'orange' },
                ].map(s => (
                  <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-5">
                    <p className="text-xs text-gray-500 font-semibold uppercase">{s.label}</p>
                    <p className={`text-2xl font-extrabold text-${s.color}-600 mt-1`}>{s.value}</p>
                  </div>
                ))}
              </div>

              {payments.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
                  <span className="material-symbols-outlined text-4xl mb-2 block">receipt_long</span>
                  No payment records
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        {['Payment ID', 'Student', 'Request ID', 'Tuition', 'Late Fee', 'Total', 'Date', 'Status'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {payments.map(p => (
                        <tr key={p.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-mono text-xs">{p.id}</td>
                          <td className="px-4 py-3 font-semibold">{p.studentName}</td>
                          <td className="px-4 py-3 font-mono text-xs text-gray-500">{p.requestId}</td>
                          <td className="px-4 py-3">৳{p.tuition?.toLocaleString()}</td>
                          <td className="px-4 py-3 text-red-600">৳{p.lateFee?.toLocaleString()}</td>
                          <td className="px-4 py-3 font-bold">৳{p.total?.toLocaleString()}</td>
                          <td className="px-4 py-3 text-gray-400 text-xs">{p.paidAt ? new Date(p.paidAt).toLocaleDateString() : '-'}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold
                              ${p.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                              {p.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </main>
      </div>
    </div>
  );
};
