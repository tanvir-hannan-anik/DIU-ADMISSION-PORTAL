import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../../services/authService';

export const SetPasswordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setTokenValid(false);
      return;
    }
    authService.verifyToken(token).then((res) => {
      setTokenValid(res.success);
      if (!res.success) setError('This verification link is invalid or has already been used.');
    });
  }, [token]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    const res = await authService.setPassword(token, form.password);

    if (res.success) {
      setSuccess(true);
    } else {
      const msg = res.error;
      if (msg === 'INVALID_TOKEN' || msg === 'TOKEN_ALREADY_USED')
        setError('This link is invalid or has already been used.');
      else
        setError(msg || 'Something went wrong. Please try again.');
    }
    setLoading(false);
  };

  if (tokenValid === null) {
    return (
      <div className="min-h-screen bg-[#060d4e] flex items-center justify-center">
        <p className="text-slate-400">Verifying link...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060d4e] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div
          className="text-center text-2xl font-bold text-white mb-8 cursor-pointer"
          onClick={() => navigate('/')}
        >
          Daffodil International University
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-md">
          <h2 className="text-2xl font-bold text-white mb-2">Set New Password</h2>
          <p className="text-slate-400 text-sm mb-6">Create a password to activate your account</p>

          {error && (
            <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {success ? (
            <div className="space-y-4">
              <div className="px-4 py-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">
                Account activated successfully! You can now log in.
              </div>
              <button
                onClick={() => navigate('/login')}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors"
              >
                Go to Login
              </button>
            </div>
          ) : tokenValid ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-slate-300 text-sm mb-1">New Password</label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Minimum 6 characters"
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-400 transition-colors"
                />
              </div>
              <div>
                <label className="block text-slate-300 text-sm mb-1">Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Repeat your password"
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-400 transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Activating...' : 'Set Password & Activate Account'}
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                This verification link is invalid or has already been used.
              </div>
              <button
                onClick={() => navigate('/register')}
                className="w-full py-3 border border-white/20 text-slate-300 hover:bg-white/5 rounded-lg transition-colors"
              >
                Request New Link
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
