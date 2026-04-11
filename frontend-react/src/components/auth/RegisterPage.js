import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export const RegisterPage = () => {
  const navigate  = useNavigate();
  const { register } = useAuth();

  const [form, setForm]               = useState({ name: '', email: '', studentId: '', password: '', confirm: '' });
  const [showPass, setShowPass]       = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreed, setAgreed]           = useState(false);
  const [error, setError]             = useState('');
  const [loading, setLoading]         = useState(false);
  const [showTerms, setShowTerms]     = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.email.trim().toLowerCase() === 'admin@diu.edu.bd') {
      setError('This email is reserved. Please use a different email address.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (form.password !== form.confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (!agreed) {
      setError('Please accept the terms to continue.');
      return;
    }
    setLoading(true);
    const result = await register({ name: form.name, email: form.email, password: form.password, studentId: form.studentId });
    if (result.success) {
      navigate('/');
    } else {
      setError(result.error || 'Registration failed. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 md:p-12 overflow-x-hidden relative"
      style={{ backgroundColor: '#f7f9fb', fontFamily: 'Manrope, sans-serif' }}>

      {/* Background blobs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute rounded-full"
          style={{ top: '-6rem', left: '-6rem', width: 384, height: 384, backgroundColor: 'rgba(12,18,130,0.05)', filter: 'blur(80px)' }} />
        <div className="absolute rounded-full"
          style={{ bottom: 0, right: 0, width: 500, height: 500, backgroundColor: 'rgba(213,227,252,0.1)', filter: 'blur(100px)' }} />
      </div>

      <main className="relative z-10 w-full max-w-6xl flex flex-col lg:flex-row gap-16 items-center">

        {/* ── Left editorial panel ──────────────────────────────────── */}
        <div className="hidden lg:flex flex-col flex-1 gap-8">
          <h1 className="font-black text-6xl tracking-tighter leading-none"
            style={{ color: '#000155', fontFamily: 'Manrope, sans-serif' }}>
            Academic <br /> Portal
          </h1>

          <div className="space-y-6 max-w-md">
            <h2 className="text-3xl font-bold tracking-tight" style={{ color: '#191c1e' }}>
              Access the Digital Archives.
            </h2>
            <p className="text-lg leading-relaxed" style={{ color: '#464652' }}>
              Join a community of scholars and researchers. Your gateway to institutional resources,
              course management, and academic excellence starts here.
            </p>

            {/* Quote block */}
            <div className="p-6 rounded-xl" style={{
              backgroundColor: 'rgba(213,227,252,0.3)',
              borderLeft: '4px solid #0c1282'
            }}>
              <p className="italic font-medium leading-relaxed" style={{ color: '#0d1c2e' }}>
                "The pursuit of knowledge is the highest form of service to society.
                Your journey begins with precision and discipline."
              </p>
              <p className="mt-4 text-xs font-bold uppercase tracking-widest" style={{ color: '#0c1282' }}>
                Institutional Registrar
              </p>
            </div>
          </div>

          {/* Avatar stack */}
          <div className="mt-8 flex items-center gap-4">
            <div className="flex" style={{ marginRight: 4 }}>
              {['#c7d2fe', '#a5b4fc', '#818cf8'].map((bg, i) => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold text-white"
                  style={{ backgroundColor: bg, marginLeft: i === 0 ? 0 : -12, zIndex: 3 - i }}>
                  <span className="material-symbols-outlined text-base" style={{ color: '#000155' }}>person</span>
                </div>
              ))}
            </div>
            <p className="text-sm font-medium" style={{ color: '#464652' }}>
              Joined by over 12,000 students this semester.
            </p>
          </div>
        </div>

        {/* ── Right form card ───────────────────────────────────────── */}
        <div className="w-full max-w-md lg:max-w-lg">
          <div className="p-8 md:p-12 rounded-xl"
            style={{
              backgroundColor: '#ffffff',
              boxShadow: '0 1px 3px rgba(25,28,30,0.06)',
              border: '1px solid rgba(198,197,212,0.1)'
            }}>

            {/* Mobile logo */}
            <div className="lg:hidden mb-8">
              <h1 className="font-black text-3xl tracking-tighter" style={{ color: '#000155' }}>
                Academic Portal
              </h1>
            </div>

            <div className="mb-10">
              <h3 className="text-2xl font-bold mb-2" style={{ color: '#191c1e' }}>Create Account</h3>
              <p className="text-sm" style={{ color: '#464652' }}>
                Please provide your institutional details to continue.
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-6 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2"
                style={{ backgroundColor: '#ffdad6', color: '#ba1a1a', border: '1px solid rgba(186,26,26,0.2)' }}>
                <span className="material-symbols-outlined text-base">error</span>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Full Name */}
              <div>
                <label className="block text-sm font-semibold mb-2 ml-1" style={{ color: '#464652' }}>
                  Full Name
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-xl"
                    style={{ color: '#767684' }}>person</span>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Dr. Julian Reed"
                    required
                    className="w-full pl-12 pr-4 py-3 rounded-lg outline-none transition-all text-sm"
                    style={{ backgroundColor: '#f2f4f6', border: 'none', color: '#191c1e' }}
                    onFocus={e => e.currentTarget.style.boxShadow = '0 0 0 2px rgba(12,18,130,0.3)'}
                    onBlur={e => e.currentTarget.style.boxShadow = 'none'}
                  />
                </div>
              </div>

              {/* University Email */}
              <div>
                <label className="block text-sm font-semibold mb-2 ml-1" style={{ color: '#464652' }}>
                  University Email
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-xl"
                    style={{ color: '#767684' }}>mail</span>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="j.reed@diu.edu.bd"
                    required
                    className="w-full pl-12 pr-4 py-3 rounded-lg outline-none transition-all text-sm"
                    style={{ backgroundColor: '#f2f4f6', border: 'none', color: '#191c1e' }}
                    onFocus={e => e.currentTarget.style.boxShadow = '0 0 0 2px rgba(12,18,130,0.3)'}
                    onBlur={e => e.currentTarget.style.boxShadow = 'none'}
                  />
                </div>
              </div>

              {/* Student ID */}
              <div>
                <label className="block text-sm font-semibold mb-2 ml-1" style={{ color: '#464652' }}>
                  Student ID / Application ID
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-xl"
                    style={{ color: '#767684' }}>badge</span>
                  <input
                    type="text"
                    name="studentId"
                    value={form.studentId}
                    onChange={handleChange}
                    placeholder="UID-8829-001"
                    className="w-full pl-12 pr-4 py-3 rounded-lg outline-none transition-all text-sm"
                    style={{ backgroundColor: '#f2f4f6', border: 'none', color: '#191c1e' }}
                    onFocus={e => e.currentTarget.style.boxShadow = '0 0 0 2px rgba(12,18,130,0.3)'}
                    onBlur={e => e.currentTarget.style.boxShadow = 'none'}
                  />
                </div>
              </div>

              {/* Password + Confirm (2-col grid) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Password */}
                <div>
                  <label className="block text-sm font-semibold mb-2 ml-1" style={{ color: '#464652' }}>
                    Password
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-xl"
                      style={{ color: '#767684' }}>lock</span>
                    <input
                      type={showPass ? 'text' : 'password'}
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      required
                      className="w-full pl-12 pr-10 py-3 rounded-lg outline-none transition-all text-sm"
                      style={{ backgroundColor: '#f2f4f6', border: 'none', color: '#191c1e' }}
                      onFocus={e => e.currentTarget.style.boxShadow = '0 0 0 2px rgba(12,18,130,0.3)'}
                      onBlur={e => e.currentTarget.style.boxShadow = 'none'}
                    />
                    <button type="button" onClick={() => setShowPass(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                      style={{ color: '#767684' }}
                      onMouseEnter={e => e.currentTarget.style.color = '#000155'}
                      onMouseLeave={e => e.currentTarget.style.color = '#767684'}>
                      <span className="material-symbols-outlined text-lg">
                        {showPass ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-semibold mb-2 ml-1" style={{ color: '#464652' }}>
                    Confirm
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-xl"
                      style={{ color: '#767684' }}>verified_user</span>
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      name="confirm"
                      value={form.confirm}
                      onChange={handleChange}
                      placeholder="••••••••"
                      required
                      className="w-full pl-12 pr-10 py-3 rounded-lg outline-none transition-all text-sm"
                      style={{ backgroundColor: '#f2f4f6', border: 'none', color: '#191c1e' }}
                      onFocus={e => e.currentTarget.style.boxShadow = '0 0 0 2px rgba(12,18,130,0.3)'}
                      onBlur={e => e.currentTarget.style.boxShadow = 'none'}
                    />
                    <button type="button" onClick={() => setShowConfirm(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                      style={{ color: '#767684' }}
                      onMouseEnter={e => e.currentTarget.style.color = '#000155'}
                      onMouseLeave={e => e.currentTarget.style.color = '#767684'}>
                      <span className="material-symbols-outlined text-lg">
                        {showConfirm ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Terms */}
              <div className="flex items-start gap-3 pt-2">
                <div className="flex items-center h-5">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={agreed}
                    onChange={e => setAgreed(e.target.checked)}
                    className="w-4 h-4 rounded"
                    style={{ accentColor: '#0c1282' }}
                  />
                </div>
                <label htmlFor="terms" className="text-xs leading-relaxed" style={{ color: '#464652' }}>
                  I agree to the{' '}
                  <button type="button" className="font-bold hover:underline underline-offset-2"
                    style={{ color: '#000155' }} onClick={() => setShowTerms(true)}>
                    Institutional Terms of Use
                  </button>{' '}
                  and acknowledge the{' '}
                  <button type="button" className="font-bold hover:underline underline-offset-2"
                    style={{ color: '#000155' }} onClick={() => setShowPrivacy(true)}>
                    Data Privacy Policy
                  </button>{' '}
                  for students.
                </label>
              </div>

              {/* Actions */}
              <div className="space-y-4 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 font-bold rounded-xl text-lg text-white active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: '#0c1282',
                    boxShadow: '0 8px 32px rgba(12,18,130,0.2)'
                  }}>
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
                      Creating account...
                    </span>
                  ) : 'Create Account'}
                </button>

                {/* Divider */}
                <div className="relative flex items-center justify-center py-2">
                  <div className="w-full border-t" style={{ borderColor: 'rgba(198,197,212,0.3)' }} />
                  <span className="absolute px-4 text-xs font-bold uppercase tracking-widest"
                    style={{ backgroundColor: '#ffffff', color: '#767684' }}>
                    or
                  </span>
                </div>

                <div className="text-center">
                  <p className="text-sm" style={{ color: '#464652' }}>
                    Already registered?{' '}
                    <button
                      type="button"
                      onClick={() => navigate('/login')}
                      className="font-bold ml-1 hover:underline underline-offset-4"
                      style={{ color: '#000155' }}>
                      Sign in to Portal
                    </button>
                  </p>
                </div>
              </div>
            </form>

            {/* Status badge */}
            <div className="mt-12 flex justify-center">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest"
                style={{ backgroundColor: '#d5e3fc', color: '#0d1c2e' }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: '#000155' }} />
                Institutional Enrollment Open
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="fixed bottom-8 left-8 hidden lg:block pointer-events-none">
        <p className="text-xs font-medium uppercase tracking-widest" style={{ color: '#767684' }}>
          © 2026 Daffodil International University — Office of Admissions
        </p>
      </footer>

      {/* ── Terms of Use Modal ──────────────────────────────────────────────── */}
      {showTerms && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowTerms(false)}>
          <div className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl"
            style={{ backgroundColor: 'white', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #e6e8ea' }}>
              <h2 className="text-lg font-extrabold tracking-tight" style={{ color: '#000155' }}>Institutional Terms of Use</h2>
              <button onClick={() => setShowTerms(false)} style={{ color: '#767684' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="px-6 py-4 overflow-y-auto text-sm space-y-4" style={{ color: '#464652', lineHeight: 1.7 }}>
              <p><strong>1. Acceptance</strong> — By creating an account on the DIU Academic Portal, you agree to these terms and all applicable university policies.</p>
              <p><strong>2. Eligibility</strong> — Access is restricted to current students, admitted applicants, and authorised university staff of Daffodil International University.</p>
              <p><strong>3. Account Security</strong> — You are responsible for maintaining the confidentiality of your credentials. Do not share your password with anyone.</p>
              <p><strong>4. Acceptable Use</strong> — The portal must only be used for legitimate academic purposes. Any attempt to manipulate records, impersonate others, or gain unauthorised access will result in immediate account suspension and potential legal action.</p>
              <p><strong>5. Academic Integrity</strong> — All course registrations, submissions, and records must reflect your own legitimate academic work. Fraudulent registrations are strictly prohibited.</p>
              <p><strong>6. Data Accuracy</strong> — You agree to provide accurate and truthful information during registration and throughout your use of the portal.</p>
              <p><strong>7. Modifications</strong> — DIU reserves the right to modify these terms at any time. Continued use constitutes acceptance of the updated terms.</p>
              <p><strong>8. Contact</strong> — For questions regarding these terms, contact the Registrar's Office at registrar@daffodilvarsity.edu.bd.</p>
            </div>
            <div className="px-6 py-4" style={{ borderTop: '1px solid #e6e8ea' }}>
              <button onClick={() => { setAgreed(true); setShowTerms(false); }}
                className="w-full py-3 rounded-xl font-bold text-white"
                style={{ backgroundColor: '#0c1282' }}>
                I Accept These Terms
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Privacy Policy Modal ────────────────────────────────────────────── */}
      {showPrivacy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowPrivacy(false)}>
          <div className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl"
            style={{ backgroundColor: 'white', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #e6e8ea' }}>
              <h2 className="text-lg font-extrabold tracking-tight" style={{ color: '#000155' }}>Data Privacy Policy</h2>
              <button onClick={() => setShowPrivacy(false)} style={{ color: '#767684' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="px-6 py-4 overflow-y-auto text-sm space-y-4" style={{ color: '#464652', lineHeight: 1.7 }}>
              <p><strong>1. Data We Collect</strong> — We collect your name, email, student ID, academic records, course registrations, and activity logs within this portal.</p>
              <p><strong>2. How We Use Your Data</strong> — Your data is used to manage your academic registration, process applications, communicate important notices, and maintain institutional records as required by the University Grants Commission of Bangladesh.</p>
              <p><strong>3. Data Storage</strong> — All personal data is stored on secure university servers within Bangladesh. We do not transfer your data outside the country without your explicit consent.</p>
              <p><strong>4. Data Retention</strong> — Academic records are retained for a minimum of 10 years after graduation or departure, as required by national education regulations.</p>
              <p><strong>5. Your Rights</strong> — You have the right to access, correct, or request deletion of your personal data by contacting the Data Protection Officer at dpo@daffodilvarsity.edu.bd.</p>
              <p><strong>6. Cookies</strong> — This portal uses session cookies and localStorage to maintain your login state. No third-party tracking cookies are used.</p>
              <p><strong>7. Security</strong> — We implement industry-standard security measures including JWT authentication, password hashing, and encrypted data transmission.</p>
              <p><strong>8. Contact</strong> — Data Protection Officer: Daffodil International University, 102/1 Shukrabad, Mirpur Road, Dhanmondi, Dhaka-1207.</p>
            </div>
            <div className="px-6 py-4" style={{ borderTop: '1px solid #e6e8ea' }}>
              <button onClick={() => setShowPrivacy(false)}
                className="w-full py-3 rounded-xl font-bold text-white"
                style={{ backgroundColor: '#0c1282' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
