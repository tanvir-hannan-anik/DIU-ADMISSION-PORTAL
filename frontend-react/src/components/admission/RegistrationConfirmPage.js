import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navigation } from '../common/Navigation';
import { Footer } from '../common/Footer';
import { toast } from 'react-toastify';

export const RegistrationConfirmPage = () => {
  const navigate = useNavigate();
  useEffect(() => { window.scrollTo(0, 0); }, []);

  const studentId = localStorage.getItem('studentId') || '';
  const registrationEmail = localStorage.getItem('registrationEmail') || '';
  const savedDraft = JSON.parse(localStorage.getItem('preregisterDraft') || '{}');
  const userName = savedDraft.fullName || 'Student';
  const userPhone = savedDraft.contactNumber || '';
  const selectedProgram = savedDraft.selectedProgram || '';
  const appId = localStorage.getItem('applicationId') || '';
  const paymentMethod = localStorage.getItem('paymentMethod') || '';
  const issuedOn = localStorage.getItem('idCardIssuedOn') || '';

  const [showPassword, setShowPassword] = useState(false);

  // Redirect if payment not done
  useEffect(() => {
    if (localStorage.getItem('paymentStatus') !== 'completed') {
      navigate('/admission/payment');
    }
  }, [navigate]);

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text).then(() => toast.success(`${label} copied!`)).catch(() => toast.error('Copy failed'));
  };

  const handleDownloadConfirmation = () => {
    const content = `DAFFODIL INTERNATIONAL UNIVERSITY
=====================================
     REGISTRATION CONFIRMATION
=====================================

Congratulations, ${userName}!

Your admission to Daffodil International University has been
successfully confirmed. Please keep this document safe.

-------------------------------------
  STUDENT CREDENTIALS
-------------------------------------
  Student ID     : ${studentId}
  Email          : ${registrationEmail}
  Password       : ${userPhone}  (your registered phone number)
  Program        : ${selectedProgram}
  Application ID : ${appId}
  Payment Method : ${paymentMethod.toUpperCase()}
  Registered On  : ${issuedOn}

-------------------------------------
  IMPORTANT NOTES
-------------------------------------
  1. Use ${registrationEmail} to log into all DIU systems.
  2. Your password is your registered phone number.
     Please change it upon first login.
  3. Keep your Student ID (${studentId}) safe — required
     for all academic and administrative purposes.
  4. Download your Student ID Card from the portal.
  5. Report to the Admission Office with original documents
     within 7 days.

-------------------------------------
  CONTACT
-------------------------------------
  Admission Office  : admission@diu.edu.bd
  Helpline          : 09617-000340
  Campus            : Ashulia, Savar, Dhaka-1341
  Office Hours      : Sun–Thu, 9:00 AM – 5:00 PM

=====================================
     DAFFODIL INTERNATIONAL UNIVERSITY
     Accredited by UGC Bangladesh
=====================================
`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DIU-Registration-${studentId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Confirmation letter downloaded!');
  };

  return (
    <div className="min-h-screen bg-surface">
      <Navigation />

      <main className="pt-28 pb-20 px-4 md:px-8 max-w-2xl mx-auto">

        {/* Success Banner */}
        <div className="relative bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl p-8 mb-8 text-white overflow-hidden text-center">
          {/* Decorative circles */}
          <div className="absolute -top-8 -left-8 w-32 h-32 bg-white/10 rounded-full" />
          <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-white/10 rounded-full" />
          <div className="absolute top-4 right-4 w-12 h-12 bg-white/5 rounded-full" />

          <div className="relative z-10">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
            </div>
            <h1 className="font-headline text-3xl font-extrabold mb-2">Registration Confirmed!</h1>
            <p className="text-white/85 text-base">
              Welcome to <span className="font-bold">Daffodil International University</span>
            </p>
            <div className="mt-4 inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full text-sm font-bold">
              <span className="material-symbols-outlined text-base">badge</span>
              {studentId}
            </div>
          </div>
        </div>

        {/* Credentials Card */}
        <div className="bg-surface-container-low rounded-2xl border border-outline-variant/30 overflow-hidden mb-6">
          <div className="px-6 py-4 bg-primary/5 border-b border-outline-variant/30 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>key</span>
            <h2 className="font-headline font-bold text-lg">Your Login Credentials</h2>
          </div>
          <div className="p-6 space-y-4">

            {/* University Email */}
            <div className="bg-surface rounded-xl p-4 border border-outline-variant/20">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">University Email ID</span>
                <button onClick={() => copyToClipboard(registrationEmail, 'Email')}
                  className="text-primary hover:text-primary/70 transition-colors">
                  <span className="material-symbols-outlined text-sm">content_copy</span>
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>mail</span>
                <span className="font-mono font-bold text-primary text-base break-all">{registrationEmail}</span>
              </div>
              <p className="text-[11px] text-on-surface-variant mt-1">Use this email to access all DIU portals and systems</p>
            </div>

            {/* Password */}
            <div className="bg-surface rounded-xl p-4 border border-outline-variant/20">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">Password</span>
                <div className="flex gap-2">
                  <button onClick={() => setShowPassword(s => !s)}
                    className="text-on-surface-variant hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-sm">{showPassword ? 'visibility_off' : 'visibility'}</span>
                  </button>
                  <button onClick={() => copyToClipboard(userPhone, 'Password')}
                    className="text-primary hover:text-primary/70 transition-colors">
                    <span className="material-symbols-outlined text-sm">content_copy</span>
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-on-surface-variant text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
                <span className="font-mono font-bold text-on-surface text-base tracking-widest">
                  {showPassword ? userPhone : userPhone.replace(/./g, '•')}
                </span>
              </div>
              <p className="text-[11px] text-amber-600 mt-1 font-medium">⚠ Your phone number is the default password. Change it after first login.</p>
            </div>

            {/* Student ID */}
            <div className="bg-surface rounded-xl p-4 border border-outline-variant/20">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">Student ID</span>
                <button onClick={() => copyToClipboard(studentId, 'Student ID')}
                  className="text-primary hover:text-primary/70 transition-colors">
                  <span className="material-symbols-outlined text-sm">content_copy</span>
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-on-surface-variant text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>badge</span>
                <span className="font-mono font-bold text-on-surface text-xl tracking-widest">{studentId}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Program & Payment Info */}
        <div className="bg-surface-container-low rounded-2xl border border-outline-variant/30 p-6 mb-6">
          <h3 className="font-headline font-bold text-base mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl">info</span>
            Admission Details
          </h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              { label: 'Name', value: userName },
              { label: 'Program', value: selectedProgram, full: true },
              { label: 'Registration Date', value: issuedOn },
              { label: 'Payment Method', value: paymentMethod.toUpperCase() },
              { label: 'Application ID', value: appId, mono: true },
            ].map((item, i) => (
              <div key={i} className={item.full ? 'col-span-2' : ''}>
                <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block mb-0.5">{item.label}</span>
                <span className={`font-semibold text-on-surface ${item.mono ? 'font-mono' : ''}`}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Important Notes */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6">
          <h3 className="font-headline font-bold text-sm text-amber-800 mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-600 text-base" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
            Important Instructions
          </h3>
          <ul className="space-y-1.5 text-xs text-amber-800">
            <li className="flex gap-2"><span className="font-bold">1.</span> <span>Report to the Admission Office with <strong>original documents</strong> within 7 working days.</span></li>
            <li className="flex gap-2"><span className="font-bold">2.</span> <span>Change your default password immediately after your first login.</span></li>
            <li className="flex gap-2"><span className="font-bold">3.</span> <span>Keep your Student ID card safe — required for all campus activities.</span></li>
            <li className="flex gap-2"><span className="font-bold">4.</span> <span>Class schedule will be shared via your university email within 3 days.</span></li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 gap-3">
          <button onClick={() => navigate('/admission/id-card')}
            className="w-full bg-primary text-white font-bold py-4 rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2 text-base">
            <span className="material-symbols-outlined">badge</span>
            View & Download Student ID Card
          </button>
          <button onClick={handleDownloadConfirmation}
            className="w-full border-2 border-primary text-primary font-bold py-3.5 rounded-xl hover:bg-primary/5 transition-all flex items-center justify-center gap-2">
            <span className="material-symbols-outlined">download</span>
            Download Confirmation Letter
          </button>
          <button onClick={() => navigate('/admit-card')}
            className="w-full border border-outline-variant/40 text-on-surface-variant font-medium py-3 rounded-xl hover:bg-surface-container transition-all flex items-center justify-center gap-2 text-sm">
            <span className="material-symbols-outlined text-base">home</span>
            Return to Dashboard
          </button>
        </div>
      </main>

      <Footer />
    </div>
  );
};
