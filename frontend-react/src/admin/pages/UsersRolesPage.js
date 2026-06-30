import { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import adminApi from '../adminApi';
import { adminAuth } from '../adminAuth';
import { ROLE_LABELS } from '../adminNav';
import { T } from '../theme';

const ROLE_OPTIONS = ['admin', 'admission_officer', 'marketing', 'faculty_admin'];
const roleColor = {
  admin: '#FB7185', admission_officer: '#6366F1', marketing: '#FBBF24', faculty_admin: '#34D399',
};

// Staff accounts + roles, plus the counselor roster that leads can be assigned to.
export default function UsersRolesPage() {
  const me = adminAuth.getUser();
  const isSuper = (me?.role || '').toLowerCase() === 'admin';

  const [users, setUsers] = useState([]);
  const [counselors, setCounselors] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'admission_officer' });
  const [cForm, setCForm] = useState({ name: '', email: '' });

  const load = useCallback(async () => {
    try {
      const [u, c] = await Promise.all([
        adminApi.get('/v1/admin/users'),
        adminApi.get('/v1/admin/counselors'),
      ]);
      setUsers(u.data.data.users || []);
      setCounselors(c.data.data || []);
    } catch { toast.error('Failed to load users'); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const createUser = async (e) => {
    e.preventDefault();
    if (!form.email.trim() || form.password.length < 8) { toast.error('Email + 8-char password required'); return; }
    try {
      await adminApi.post('/v1/admin/users', form);
      toast.success('User created');
      setForm({ name: '', email: '', password: '', role: 'admission_officer' });
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Could not create user'); }
  };
  const changeRole = async (id, role) => {
    try { await adminApi.put(`/v1/admin/users/${id}/role`, { role }); toast.success('Role updated'); load(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };
  const toggleActive = async (id, active) => {
    try { await adminApi.put(`/v1/admin/users/${id}/active`, { active }); load(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };
  const addCounselor = async (e) => {
    e.preventDefault();
    if (!cForm.name.trim()) { toast.error('Counselor name required'); return; }
    try { await adminApi.post('/v1/admin/counselors', cForm); toast.success('Counselor added'); setCForm({ name: '', email: '' }); load(); }
    catch { toast.error('Could not add counselor'); }
  };

  const input = { backgroundColor: T.bg, color: T.text, border: `1px solid ${T.border}` };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {!isSuper && (
        <div className="flex items-start gap-2 px-3 py-2 rounded-lg text-[12px]"
             style={{ backgroundColor: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', color: '#FBBF24' }}>
          <span className="material-symbols-outlined text-[16px]">info</span>
          <span>You can view the team, but only a <b>Super Admin</b> can add or change users.</span>
        </div>
      )}

      {/* Staff accounts */}
      <section>
        <h3 className="text-[15px] font-bold mb-3" style={{ color: T.text }}>Admin Team</h3>

        {isSuper && (
          <form onSubmit={createUser} className="grid grid-cols-1 sm:grid-cols-5 gap-2 mb-4 rounded-xl p-3"
                style={{ backgroundColor: T.card, border: `1px solid ${T.border}` }}>
            <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                   className="px-3 py-2 rounded-lg text-[13px] outline-none" style={input} />
            <input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                   className="px-3 py-2 rounded-lg text-[13px] outline-none" style={input} />
            <input placeholder="Password (8+)" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                   className="px-3 py-2 rounded-lg text-[13px] outline-none" style={input} />
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="px-3 py-2 rounded-lg text-[13px] outline-none" style={input}>
              {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
            </select>
            <button type="submit" className="px-3 py-2 rounded-lg text-[13px] font-semibold text-white" style={{ backgroundColor: T.accent }}>
              Add User
            </button>
          </form>
        )}

        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: T.card, border: `1px solid ${T.border}` }}>
          <table className="w-full text-[13px]">
            <thead>
              <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                {['Name', 'Email', 'Role', 'Status', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider" style={{ color: T.textFaint }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center" style={{ color: T.textFaint }}>No staff accounts yet.</td></tr>
              ) : users.map((u) => (
                <tr key={u.id} style={{ borderTop: `1px solid ${T.border}` }}>
                  <td className="px-4 py-3 font-semibold" style={{ color: T.text }}>{u.name || '—'}</td>
                  <td className="px-4 py-3" style={{ color: T.textDim }}>{u.email}</td>
                  <td className="px-4 py-3">
                    {isSuper && u.email !== me?.email ? (
                      <select value={u.role} onChange={(e) => changeRole(u.id, e.target.value)}
                              className="px-2 py-1 rounded-lg text-[12px] outline-none" style={input}>
                        {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                      </select>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold"
                            style={{ backgroundColor: `${roleColor[u.role] || '#64748B'}22`, color: roleColor[u.role] || '#64748B' }}>
                        {ROLE_LABELS[u.role] || u.role}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[12px] font-semibold" style={{ color: u.active ? T.up : T.textFaint }}>
                      {u.active ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {isSuper && u.email !== me?.email && (
                      <button onClick={() => toggleActive(u.id, !u.active)}
                              className="px-2.5 h-7 rounded-lg text-[12px] font-semibold" style={input}>
                        {u.active ? 'Disable' : 'Enable'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Counselors */}
      <section>
        <h3 className="text-[15px] font-bold mb-1" style={{ color: T.text }}>Counselors</h3>
        <p className="text-[12px] mb-3" style={{ color: T.textDim }}>People that leads can be assigned to in the CRM.</p>

        <form onSubmit={addCounselor} className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4 rounded-xl p-3"
              style={{ backgroundColor: T.card, border: `1px solid ${T.border}` }}>
          <input placeholder="Counselor name" value={cForm.name} onChange={(e) => setCForm({ ...cForm, name: e.target.value })}
                 className="px-3 py-2 rounded-lg text-[13px] outline-none" style={input} />
          <input placeholder="Email (optional)" type="email" value={cForm.email} onChange={(e) => setCForm({ ...cForm, email: e.target.value })}
                 className="px-3 py-2 rounded-lg text-[13px] outline-none" style={input} />
          <button type="submit" className="px-3 py-2 rounded-lg text-[13px] font-semibold text-white" style={{ backgroundColor: T.accent }}>
            Add Counselor
          </button>
        </form>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {counselors.length === 0 ? (
            <p className="text-[13px]" style={{ color: T.textFaint }}>No counselors yet.</p>
          ) : counselors.map((c) => (
            <div key={c.id} className="rounded-xl p-3 flex items-center gap-3" style={{ backgroundColor: T.card, border: `1px solid ${T.border}` }}>
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                   style={{ background: 'linear-gradient(135deg,#6366F1,#A78BFA)' }}>
                {(c.name || '?').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold truncate" style={{ color: T.text }}>{c.name}</p>
                <p className="text-[11px] truncate" style={{ color: T.textDim }}>{c.email || '—'}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
