import { useState } from 'react';
import { adminAuth } from './adminAuth';
import { T } from './theme';

export default function AdminLoginPage({ onSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await adminAuth.login(email, password);
    setLoading(false);
    if (result.success) onSuccess?.(result.user);
    else setError(result.error);
  };

  const inputStyle = {
    backgroundColor: T.bg,
    border: `1px solid ${T.border}`,
    color: T.text,
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: T.bg }}>
      <div className="w-full max-w-sm rounded-2xl p-8" style={{ backgroundColor: T.card, border: `1px solid ${T.border}` }}>
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
               style={{ background: 'linear-gradient(135deg,#6366F1,#22D3EE)' }}>
            <span className="material-symbols-outlined text-white text-2xl">bolt</span>
          </div>
          <h1 className="text-2xl font-extrabold" style={{ color: T.text }}>DIU Admin</h1>
          <p className="text-[13px] mt-1" style={{ color: T.textDim }}>Restricted access — administrators only</p>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl text-[13px] flex items-center gap-2"
               style={{ backgroundColor: 'rgba(251,113,133,0.1)', border: '1px solid rgba(251,113,133,0.3)', color: T.down }}>
            <span className="material-symbols-outlined text-base">error</span>{error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: T.textFaint }}>Email</label>
            <input type="email" required value={email} autoComplete="username"
                   onChange={(e) => { setEmail(e.target.value); setError(''); }}
                   className="w-full px-4 py-3 rounded-xl text-[14px] outline-none focus:ring-2 focus:ring-indigo-500/40"
                   style={inputStyle} />
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: T.textFaint }}>Password</label>
            <input type="password" required value={password} autoComplete="current-password"
                   onChange={(e) => { setPassword(e.target.value); setError(''); }}
                   className="w-full px-4 py-3 rounded-xl text-[14px] outline-none focus:ring-2 focus:ring-indigo-500/40"
                   style={inputStyle} />
          </div>
          <button type="submit" disabled={loading}
                  className="w-full py-3 rounded-xl font-bold text-white disabled:opacity-50 transition-opacity"
                  style={{ background: 'linear-gradient(135deg,#6366F1,#4F46E5)' }}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
