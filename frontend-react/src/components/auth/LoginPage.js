import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const result = await login(form.email, form.password);
    if (result.success) {
      navigate('/');
    } else {
      const msg = result.error;
      if (msg === 'INVALID_CREDENTIALS') setError('Invalid email or password.');
      else if (msg === 'ACCOUNT_NOT_VERIFIED') setError('Account not verified. Please complete registration.');
      else setError(msg || 'Login failed. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 md:p-12 relative overflow-hidden"
      style={{ backgroundColor: '#0A1045' }}>

      {/* Decorative blobs */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full blur-[120px] opacity-30"
          style={{ backgroundColor: '#033860' }}></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] rounded-full blur-[100px] opacity-20"
          style={{ backgroundColor: '#033860' }}></div>
      </div>

      <main className="relative z-10 w-full max-w-5xl flex flex-col md:flex-row rounded-xl overflow-hidden shadow-2xl"
        style={{ backgroundColor: '#033860' }}>

        {/* Left branding panel */}
        <section className="hidden md:flex flex-col justify-between p-12 w-2/5"
          style={{ backgroundColor: '#0A1045' }}>
          <div>
            <div
              className="flex items-center gap-3 mb-12 cursor-pointer"
              onClick={() => navigate('/')}
            >
              <span className="material-symbols-outlined text-4xl text-white">school</span>
              <h1 className="text-2xl font-black tracking-tighter leading-none text-white">DIU Portal</h1>
            </div>
            <h2 className="text-4xl font-extrabold tracking-tight leading-tight mb-6 text-white">
              Access your academic journey from one place.
            </h2>
            <p className="font-medium text-lg max-w-xs text-white/60">
              Sign in to manage your courses, academic records, and institutional resources.
            </p>
          </div>
          <div className="p-4 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <p className="text-sm font-semibold mb-2 flex items-center gap-2 text-white">
              <span className="material-symbols-outlined text-sm">verified</span>
              OFFICIAL ACCESS
            </p>
            <p className="text-xs leading-relaxed text-white/50">
              This system is restricted to admitted students of Daffodil International University. All sessions are encrypted.
            </p>
          </div>
        </section>

        {/* Login form panel */}
        <section className="flex-1 p-8 md:p-16 flex flex-col justify-center" style={{ backgroundColor: '#033860' }}>
          {/* Mobile logo */}
          <div
            className="md:hidden flex items-center gap-2 mb-10 cursor-pointer"
            onClick={() => navigate('/')}
          >
            <span className="material-symbols-outlined text-3xl text-white">school</span>
            <h1 className="text-xl font-bold tracking-tight text-white">DIU Portal</h1>
          </div>

          <div className="mb-10">
            <h3 className="text-3xl font-extrabold tracking-tight mb-2 text-white">Welcome Back</h3>
            <p className="font-medium text-white/60">Please enter your credentials to continue.</p>
          </div>

          {error && (
            <div className="mb-6 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 text-red-300"
              style={{ backgroundColor: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)' }}>
              <span className="material-symbols-outlined text-base text-red-400">error</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold uppercase tracking-wider text-white/60">
                Institutional Email
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-xl text-white/40">mail</span>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="yourname@diu.edu.bd"
                  required
                  className="w-full pl-12 pr-4 py-4 rounded-xl transition-all text-white outline-none focus:ring-2"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.07)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    '--tw-ring-color': 'rgba(255,255,255,0.2)',
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold uppercase tracking-wider text-white/60">
                Secure Password
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-xl text-white/40">lock</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  className="w-full pl-12 pr-12 py-4 rounded-xl transition-all text-white outline-none focus:ring-2"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.07)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors"
                >
                  <span className="material-symbols-outlined text-xl">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 font-bold rounded-xl text-lg text-white active:scale-[0.98] transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#0c1282' }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
                  Signing in...
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          <p className="mt-10 text-center text-sm font-medium text-white/50">
            New admitted student?{' '}
            <button
              onClick={() => navigate('/register')}
              className="text-white font-bold hover:underline underline-offset-4"
            >
              Register Account
            </button>
          </p>

          <p className="mt-3 text-center">
            <button
              onClick={() => navigate('/')}
              className="text-sm text-white/30 hover:text-white/60 transition-colors"
            >
              ← Back to Dashboard
            </button>
          </p>
        </section>
      </main>

      <footer className="fixed bottom-6 left-0 w-full text-center px-6 pointer-events-none">
        <p className="text-xs font-bold uppercase tracking-widest text-white/20">
          Daffodil International University © 2024 • Academic Excellence
        </p>
      </footer>
    </div>
  );
};
