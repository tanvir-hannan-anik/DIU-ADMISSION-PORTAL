import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { authService } from '../../services/authService';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login, loginWithGoogle } = useAuth();

  const [form,         setForm]         = useState({ email: '', password: '' });
  const [error,        setError]        = useState('');
  const [loading,      setLoading]      = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [remember,     setRemember]     = useState(false);

  // Forgot password modal state
  const [showForgot,   setShowForgot]   = useState(false);
  const [resetEmail,   setResetEmail]   = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetResult,  setResetResult]  = useState(null); // { link } | { error }

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setResetLoading(true);
    setResetResult(null);
    const res = await authService.requestPasswordReset(resetEmail);
    if (res.success) {
      setResetResult({ link: res.resetLink });
    } else {
      setResetResult({ error: res.error });
    }
    setResetLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError('');
    const result = await loginWithGoogle();
    if (result.success) {
      navigate('/');
    } else {
      setError(result.error || 'Google sign-in failed. Please try again.');
    }
    setGoogleLoading(false);
  };

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
      // Persist "remember me" preference
      if (remember) {
        localStorage.setItem('diu_remember_me', '1');
      } else {
        localStorage.removeItem('diu_remember_me');
      }
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
    <div className="h-screen flex items-center justify-center p-3 sm:p-4 relative overflow-hidden"
      style={{ backgroundColor: '#f7f9fb', fontFamily: 'Manrope, sans-serif' }}>

      {/* Decorative background blobs */}
      <div className="absolute inset-0 z-0 pointer-events-none" style={{ opacity: 0.1 }}>
        <div className="absolute rounded-full"
          style={{ top: '-10%', right: '-10%', width: 420, height: 420, backgroundColor: '#0c1282', filter: 'blur(120px)' }} />
        <div className="absolute rounded-full"
          style={{ bottom: '-10%', left: '-10%', width: 340, height: 340, backgroundColor: '#d5e3fc', filter: 'blur(100px)' }} />
      </div>

      {/* Card */}
      <main className="relative z-10 w-full max-w-3xl flex flex-col md:flex-row rounded-2xl overflow-hidden"
        style={{ backgroundColor: '#ffffff', boxShadow: '0 12px 40px rgba(25,28,30,0.10)', maxHeight: '94vh' }}>

        {/* ── Left branding panel ─────────────────────────────────────── */}
        <section className="hidden md:flex flex-col justify-between p-7 w-2/5 text-white"
          style={{ backgroundColor: '#0c1282' }}>
          <div className="cursor-pointer" onClick={() => navigate('/')}>
            <img src="/diulogo.png" alt="Daffodil International University" className="h-8 w-auto brightness-0 invert" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight leading-tight mb-2">
              Access the digital archives of knowledge.
            </h2>
            <p className="font-medium text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
              Manage your courses, academic records, and institutional resources.
            </p>
          </div>
          <div className="p-3 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
            <p className="text-xs font-semibold mb-1 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">verified</span>
              OFFICIAL ACCESS
            </p>
            <p className="text-xs leading-relaxed" style={{ opacity: 0.7 }}>
              Restricted to authorized university personnel and students. All sessions are encrypted.
            </p>
          </div>
        </section>

        {/* ── Login form panel ─────────────────────────────────────────── */}
        <section className="flex-1 p-6 sm:p-8 flex flex-col justify-center overflow-y-auto"
          style={{ backgroundColor: '#ffffff' }}>

          {/* Header row: Back + mobile logo */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}
              className="inline-flex items-center gap-1 text-sm font-bold rounded-lg px-2.5 py-1.5 transition-colors"
              style={{ color: '#0c1282', backgroundColor: '#f2f4f6' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#e6e8ea'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = '#f2f4f6'}>
              <span className="material-symbols-outlined text-base">arrow_back</span>
              Back
            </button>
            <img src="/diulogo.png" alt="DIU" className="md:hidden h-7 w-auto cursor-pointer"
              onClick={() => navigate('/')} />
          </div>

          <div className="mb-5">
            <h3 className="text-2xl font-extrabold tracking-tight mb-1" style={{ color: '#000155' }}>Welcome Back</h3>
            <p className="text-sm font-medium" style={{ color: '#464652' }}>Enter your credentials to continue.</p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 px-3 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2"
              style={{ backgroundColor: '#ffdad6', color: '#ba1a1a', border: '1px solid rgba(186,26,26,0.2)' }}>
              <span className="material-symbols-outlined text-base">error</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: '#464652' }}>
                Institutional Email
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-lg"
                  style={{ color: '#464652' }}>mail</span>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="name@diu.edu.bd"
                  required
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl outline-none transition-all text-sm"
                  style={{ backgroundColor: '#e6e8ea', border: 'none', color: '#191c1e' }}
                  onFocus={e => e.currentTarget.style.boxShadow = '0 0 0 2px rgba(12,18,130,0.3)'}
                  onBlur={e => e.currentTarget.style.boxShadow = 'none'}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: '#464652' }}>
                  Secure Password
                </label>
                <button type="button" className="text-xs font-bold hover:underline underline-offset-4"
                  style={{ color: '#0c1282' }}
                  onClick={() => { setShowForgot(true); setResetEmail(form.email); setResetResult(null); }}>
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-lg"
                  style={{ color: '#464652' }}>lock</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  className="w-full pl-11 pr-11 py-2.5 rounded-xl outline-none transition-all text-sm"
                  style={{ backgroundColor: '#e6e8ea', border: 'none', color: '#191c1e' }}
                  onFocus={e => e.currentTarget.style.boxShadow = '0 0 0 2px rgba(12,18,130,0.3)'}
                  onBlur={e => e.currentTarget.style.boxShadow = 'none'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: '#464652' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#000155'}
                  onMouseLeave={e => e.currentTarget.style.color = '#464652'}>
                  <span className="material-symbols-outlined text-lg">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Remember me */}
            <div className="flex items-center gap-2.5">
              <input
                type="checkbox"
                id="remember"
                checked={remember}
                onChange={e => setRemember(e.target.checked)}
                className="w-4 h-4 rounded"
                style={{ accentColor: '#0c1282' }}
              />
              <label htmlFor="remember" className="text-sm font-medium" style={{ color: '#464652' }}>
                Keep me signed in for 30 days
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 font-bold rounded-xl text-base text-white active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#0c1282' }}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
                  Signing in...
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-4 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" style={{ borderColor: 'rgba(198,197,212,0.4)' }} />
            </div>
            <span className="relative px-3 text-xs font-semibold uppercase tracking-widest"
              style={{ backgroundColor: '#ffffff', color: '#464652' }}>
              or continue with
            </span>
          </div>

          {/* Google button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading || loading}
            className="flex items-center justify-center gap-2.5 w-full py-2.5 px-4 text-sm font-bold rounded-xl border transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#f2f4f6', borderColor: 'rgba(198,197,212,0.3)', color: '#191c1e' }}
            onMouseEnter={e => { if (!googleLoading && !loading) e.currentTarget.style.backgroundColor = '#e6e8ea'; }}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#f2f4f6'}>
            {googleLoading ? (
              <>
                <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
                Signing in…
              </>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign in with Google Workspace
              </>
            )}
          </button>
          <p className="mt-2 text-center text-xs font-medium" style={{ color: '#767684' }}>
            Students: use your <strong>@diu.edu.bd</strong> Google Workspace account
          </p>

          {/* Register link */}
          <p className="mt-4 text-center text-sm font-medium" style={{ color: '#464652' }}>
            New to the portal?{' '}
            <button onClick={() => navigate('/register')}
              className="font-bold hover:underline underline-offset-4" style={{ color: '#0c1282' }}>
              Create an Account
            </button>
          </p>
        </section>
      </main>

      {/* ── Forgot Password Modal ─────────────────────────────────────────── */}
      {showForgot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowForgot(false)}>
          <div className="w-full max-w-md rounded-2xl p-8 shadow-2xl"
            style={{ backgroundColor: 'white', fontFamily: 'Manrope, sans-serif' }}
            onClick={e => e.stopPropagation()}>

            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-extrabold tracking-tight" style={{ color: '#000155' }}>Reset Password</h2>
                <p className="text-xs mt-1" style={{ color: '#767684' }}>Enter your registered email to get a reset link.</p>
              </div>
              <button onClick={() => setShowForgot(false)} style={{ color: '#767684' }}
                onMouseEnter={e => e.currentTarget.style.color = '#191c1e'}
                onMouseLeave={e => e.currentTarget.style.color = '#767684'}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {!resetResult ? (
              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#464652' }}>
                    Email Address
                  </label>
                  <input
                    type="email" required value={resetEmail}
                    onChange={e => setResetEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                    style={{ backgroundColor: '#f2f4f6', border: 'none', color: '#191c1e' }}
                    onFocus={e => e.currentTarget.style.boxShadow = '0 0 0 2px rgba(12,18,130,0.3)'}
                    onBlur={e => e.currentTarget.style.boxShadow = 'none'}
                  />
                </div>
                <button type="submit" disabled={resetLoading}
                  className="w-full py-3 rounded-xl font-bold text-white transition-all disabled:opacity-50"
                  style={{ backgroundColor: '#0c1282' }}>
                  {resetLoading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>
            ) : resetResult.error ? (
              <div className="text-center space-y-4">
                <span className="material-symbols-outlined text-4xl" style={{ color: '#ba1a1a' }}>error</span>
                <p className="font-bold" style={{ color: '#ba1a1a' }}>{resetResult.error}</p>
                <button onClick={() => setResetResult(null)}
                  className="w-full py-3 rounded-xl font-bold border"
                  style={{ borderColor: '#0c1282', color: '#0c1282' }}>
                  Try Again
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 rounded-xl" style={{ backgroundColor: '#d5e3fc' }}>
                  <span className="material-symbols-outlined" style={{ color: '#0c1282', fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <p className="text-sm font-bold" style={{ color: '#000155' }}>Reset link generated!</p>
                </div>
                <p className="text-xs" style={{ color: '#464652' }}>
                  In production this would be emailed. Click the link below to reset your password:
                </p>
                <button
                  onClick={() => { setShowForgot(false); navigate(resetResult.link); }}
                  className="w-full py-3 rounded-xl font-bold text-white"
                  style={{ backgroundColor: '#0c1282' }}>
                  Open Reset Link
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
