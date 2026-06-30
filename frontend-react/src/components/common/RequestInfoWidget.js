import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { leadService } from '../../services/leadService';
import { trackEvent } from '../../utils/tracking';

// Floating "Request Info" CTA + modal lead-capture form. Mounted once globally
// (see App.js) so it appears on every public marketing page. Hidden on the admin
// portal and inside auth flows where it would be noise.
const PROGRAMS = [
  'B.Sc. in CSE', 'B.Sc. in SWE', 'B.Sc. in CIS', 'B.Sc. in EEE',
  'BBA', 'B.Sc. in Multimedia & Creative Technology', 'B.Pharm', 'LLB (Hons)',
  'B.A. in English', 'B.Sc. in Civil Engineering', 'B.Sc. in Textile Engineering',
  'Other / Not sure yet',
];

const HIDE_ON = ['/admin', '/login', '/register', '/set-password', '/admission/payment'];

export default function RequestInfoWidget() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', program: '', message: '' });

  if (HIDE_ON.some((p) => location.pathname.startsWith(p))) return null;

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const openModal = () => {
    setOpen(true);
    setDone(false);
    trackEvent('request_info_opened', { path: location.pathname });
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.email.trim()) { toast.error('Please enter your email'); return; }
    setSubmitting(true);
    const res = await leadService.capture(form);
    setSubmitting(false);
    if (res.success) {
      setDone(true);
      setForm({ name: '', email: '', phone: '', program: '', message: '' });
    } else {
      toast.error(res.error || 'Something went wrong. Please try again.');
    }
  };

  return (
    <>
      {/* Floating trigger — bottom-left so it never overlaps the chatbot (bottom-right). */}
      <button
        onClick={openModal}
        className="fixed bottom-6 left-6 z-40 flex items-center gap-2 px-4 py-3 rounded-full shadow-lg text-white font-semibold text-sm hover:scale-105 transition-transform"
        style={{ backgroundColor: '#0C1282' }}
        aria-label="Request admission information"
      >
        <span className="material-symbols-outlined text-[20px]">contact_support</span>
        <span className="hidden sm:inline">Request Info</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 text-white" style={{ backgroundColor: '#0C1282' }}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold">Talk to a Counselor</h3>
                  <p className="text-xs text-white/80 mt-0.5">
                    Get admission details, fees &amp; scholarship info — free.
                  </p>
                </div>
                <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white" aria-label="Close">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
            </div>

            {done ? (
              <div className="px-6 py-10 text-center">
                <span className="material-symbols-outlined text-5xl text-green-500">check_circle</span>
                <h4 className="text-lg font-bold mt-3 text-gray-800">Thank you!</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Our admission team will reach out shortly. Check your email for next steps.
                </p>
                <button
                  onClick={() => setOpen(false)}
                  className="mt-5 px-5 py-2.5 rounded-lg text-white font-semibold text-sm"
                  style={{ backgroundColor: '#0C1282' }}
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={submit} className="px-6 py-5 space-y-3">
                <Field label="Full Name">
                  <input value={form.name} onChange={set('name')} type="text" placeholder="Your name"
                         className="form-input" />
                </Field>
                <Field label="Email" required>
                  <input value={form.email} onChange={set('email')} type="email" required placeholder="you@example.com"
                         className="form-input" />
                </Field>
                <Field label="Phone / WhatsApp">
                  <input value={form.phone} onChange={set('phone')} type="tel" placeholder="01XXXXXXXXX"
                         className="form-input" />
                </Field>
                <Field label="Interested Program">
                  <select value={form.program} onChange={set('program')} className="form-input">
                    <option value="">Select a program…</option>
                    {PROGRAMS.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </Field>
                <Field label="Message (optional)">
                  <textarea value={form.message} onChange={set('message')} rows={2}
                            placeholder="Anything you'd like to know?" className="form-input resize-none" />
                </Field>
                <button type="submit" disabled={submitting}
                        className="w-full py-3 rounded-lg text-white font-semibold text-sm disabled:opacity-60"
                        style={{ backgroundColor: '#0C1282' }}>
                  {submitting ? 'Sending…' : 'Request Information'}
                </button>
                <p className="text-[11px] text-gray-400 text-center">
                  We respect your privacy. No spam — just admission help.
                </p>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Local styles for inputs so we don't depend on a shared form CSS. */}
      <style>{`
        .form-input {
          width: 100%; padding: 0.55rem 0.75rem; border: 1px solid #e2e8f0;
          border-radius: 0.5rem; font-size: 0.875rem; outline: none; color: #1e293b;
        }
        .form-input:focus { border-color: #0C1282; box-shadow: 0 0 0 2px rgba(12,18,130,0.12); }
      `}</style>
    </>
  );
}

function Field({ label, required, children }) {
  return (
    <label className="block">
      <span className="text-[12px] font-semibold text-gray-600">
        {label}{required && <span className="text-red-500"> *</span>}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
