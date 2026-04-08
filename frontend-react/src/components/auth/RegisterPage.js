import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';

export const RegisterPage = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    const res = await authService.register(email);
    if (res.success) {
      setResult(res.data);
    } else {
      const msg = res.error;
      if (msg === 'EMAIL_NOT_FOUND')
        setError('This email is not found in our admitted students database.');
      else if (msg === 'ACCOUNT_EXISTS')
        setError('An account already exists for this email. Please login.');
      else
        setError(msg || 'Something went wrong. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 md:p-12 overflow-x-hidden relative"
      style={{ backgroundColor: '#0A1045' }}>

      {/* Background blobs */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full blur-3xl opacity-20"
          style={{ backgroundColor: '#033860' }}></div>
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full blur-[100px] opacity-15"
          style={{ backgroundColor: '#033860' }}></div>
      </div>

      <main className="relative z-10 w-full max-w-6xl flex flex-col lg:flex-row gap-16 items-center">

        {/* Left editorial panel */}
        <div className="hidden lg:flex flex-col flex-1 gap-8">
          <h1
            className="font-headline font-black text-6xl tracking-tighter leading-none cursor-pointer text-white"
            onClick={() => navigate('/')}
          >
            Daffodil<br />International<br />University
          </h1>
          <div className="space-y-6 max-w-md">
            <h2 className="text-3xl font-headline font-bold tracking-tight text-white">
              Access the Digital Campus.
            </h2>
            <p className="leading-relaxed text-white/50">
              Only admitted students can create an account. Your gateway to institutional resources, course management, and academic excellence starts here.
            </p>
            <div className="p-6 rounded-xl border-l-4" style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderLeftColor: '#ffffff30' }}>
              <p className="text-sm italic font-medium text-white/70">
                "The pursuit of knowledge is the highest form of service to society. Your journey begins with precision and discipline."
              </p>
              <p className="mt-4 text-xs font-bold uppercase tracking-widest text-white/40">
                DIU Institutional Registrar
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm text-white"
              style={{ backgroundColor: '#0c1282' }}>
              35K
            </div>
            <p className="text-sm font-medium text-white/50">
              Over 35,000 active students at DIU this semester.
            </p>
          </div>
        </div>

        {/* Right form panel */}
        <div className="w-full max-w-md lg:max-w-lg">
          <div className="p-8 md:p-12 rounded-xl shadow-2xl" style={{ backgroundColor: '#033860', border: '1px solid rgba(255,255,255,0.08)' }}>

            {/* Mobile header */}
            <div
              className="lg:hidden mb-8 cursor-pointer"
              onClick={() => navigate('/')}
            >
              <h1 className="font-headline font-black text-3xl tracking-tighter text-white">DIU Portal</h1>
            </div>

            {result ? (
              /* Success State */
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                    <span className="material-symbols-outlined text-2xl text-white">mark_email_read</span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-headline font-bold text-white">Verification Sent</h3>
                    <p className="text-sm text-white/60">Welcome, {result.studentName}!</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <p className="text-sm font-medium mb-1 text-white/80">{result.message}</p>
                  <p className="text-xs text-white/40">In production, you would receive an email. For now, use the link below.</p>
                </div>

                <div className="p-4 rounded-xl" style={{ backgroundColor: 'rgba(12,18,130,0.4)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <p className="text-xs font-bold uppercase tracking-widest mb-3 text-white/50">
                    Demo Mode — Verification Link
                  </p>
                  <button
                    onClick={() => navigate(result.verificationLink)}
                    className="flex items-center gap-2 text-white font-bold text-sm hover:underline underline-offset-4"
                  >
                    <span className="material-symbols-outlined text-base">link</span>
                    Click to verify & set your password
                  </button>
                </div>

                <button
                  onClick={() => navigate('/login')}
                  className="w-full py-3 font-semibold rounded-xl transition-colors text-sm text-white/70 hover:text-white"
                  style={{ border: '1px solid rgba(255,255,255,0.15)', backgroundColor: 'transparent' }}
                >
                  Back to Login
                </button>
              </div>
            ) : (
              <>
                <div className="mb-10">
                  <h3 className="text-2xl font-headline font-bold mb-2 text-white">Create Account</h3>
                  <p className="text-sm text-white/50">
                    Enter your institutional EDU email used during admission to get started.
                  </p>
                </div>

                {error && (
                  <div className="mb-6 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 text-red-300"
                    style={{ backgroundColor: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)' }}>
                    <span className="material-symbols-outlined text-base text-red-400">error</span>
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold mb-2 ml-1 uppercase tracking-wider text-white/60">
                      University Email
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/40">mail</span>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setError(''); }}
                        placeholder="yourname@diu.edu.bd"
                        required
                        className="w-full pl-12 pr-4 py-3 rounded-xl text-white outline-none focus:ring-2 transition-all"
                        style={{
                          backgroundColor: 'rgba(255,255,255,0.07)',
                          border: '1px solid rgba(255,255,255,0.1)',
                        }}
                      />
                    </div>
                  </div>

                  <div className="p-4 rounded-xl flex items-start gap-3"
                    style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <span className="material-symbols-outlined text-base mt-0.5 text-white/50">info</span>
                    <p className="text-xs leading-relaxed text-white/50">
                      Only students who have completed the admission process at DIU can register. Your email must match our admitted students database.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 font-bold rounded-xl active:scale-[0.98] transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-white"
                    style={{ backgroundColor: '#0c1282' }}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
                        Checking...
                      </span>
                    ) : 'Send Verification Link'}
                  </button>

                  <div className="text-center">
                    <p className="text-sm text-white/50">
                      Already registered?{' '}
                      <button
                        type="button"
                        onClick={() => navigate('/login')}
                        className="text-white font-bold ml-1 hover:underline decoration-2 underline-offset-4"
                      >
                        Sign in to Portal
                      </button>
                    </p>
                  </div>
                </form>

                <div className="mt-10 flex justify-center">
                  <span className="inline-flex items-center gap-2 px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full text-white/60"
                    style={{ backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                    Institutional Enrollment Open
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      <footer className="fixed bottom-8 left-8 hidden lg:block">
        <p className="text-[10px] font-medium tracking-widest uppercase text-white/20">
          © 2024 Daffodil International University — Office of Admissions
        </p>
      </footer>
    </div>
  );
};
