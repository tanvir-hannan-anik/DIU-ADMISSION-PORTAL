import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navigation } from '../common/Navigation';
import { Footer } from '../common/Footer';
import { toast } from 'react-toastify';

// Department code mapping for student ID generation
const DEPT_MAP = [
  { keywords: ['Computer Science', 'CSE'], code: '15' },
  { keywords: ['Software Engineering', 'SWE'], code: '14' },
  { keywords: ['Computing and Information', 'CIS'], code: '16' },
  { keywords: ['Multimedia', 'MCT'], code: '17' },
  { keywords: ['Information Technology & Management', 'ITM'], code: '18' },
  { keywords: ['Robotics and Mechatronics'], code: '13' },
  { keywords: ['Business Administration', 'BBA'], code: '21' },
  { keywords: ['Finance & Banking'], code: '22' },
  { keywords: ['Marketing'], code: '23' },
  { keywords: ['Accounting'], code: '24' },
  { keywords: ['FinTech', 'Financial Technology'], code: '28' },
  { keywords: ['Electrical', 'EEE'], code: '11' },
  { keywords: ['Civil Engineering'], code: '12' },
  { keywords: ['Communication Engineering', 'ICE'], code: '19' },
  { keywords: ['Textile'], code: '20' },
  { keywords: ['Architecture'], code: '25' },
  { keywords: ['Pharmacy'], code: '31' },
  { keywords: ['Public Health'], code: '32' },
  { keywords: ['English'], code: '41' },
  { keywords: ['Law', 'LL.B'], code: '42' },
  { keywords: ['Journalism', 'JMC'], code: '43' },
];

function getDeptCode(program) {
  for (const entry of DEPT_MAP) {
    if (entry.keywords.some(k => program.includes(k))) return entry.code;
  }
  return '15';
}

function generateStudentId(program) {
  const now = new Date();
  const yr = now.getFullYear().toString().slice(2);
  const month = now.getMonth();
  const sem = month < 4 ? '1' : month < 8 ? '2' : '3';
  const prefix = yr + sem;
  const code = getDeptCode(program);
  const seq = String(Math.floor(Math.random() * 900) + 100);
  return `${prefix}-${code}-${seq}`;
}

const PAYMENT_METHODS = [
  {
    id: 'bkash', label: 'bKash', color: '#E2136E', bg: '#FFF0F7',
    logo: '💳', tag: 'Mobile Banking',
    description: 'Pay via bKash mobile banking',
    fields: [{ id: 'account', label: 'bKash Account Number', placeholder: '01XXXXXXXXX', type: 'tel' }],
  },
  {
    id: 'nagad', label: 'Nagad', color: '#F7941D', bg: '#FFF8F0',
    logo: '📱', tag: 'Mobile Banking',
    description: 'Pay via Nagad digital financial service',
    fields: [{ id: 'account', label: 'Nagad Account Number', placeholder: '01XXXXXXXXX', type: 'tel' }],
  },
  {
    id: '1card', label: '1Card', color: '#0C1282', bg: '#F0F2FF',
    logo: '🎓', tag: 'DIU Card',
    description: 'Pay using DIU 1Card student account',
    fields: [{ id: 'account', label: '1Card Account Number', placeholder: '1CARD-XXXXXXXXXX', type: 'text' }],
  },
  {
    id: 'visa', label: 'Visa', color: '#1A1F71', bg: '#F0F2FF',
    logo: '💳', tag: 'Credit / Debit',
    description: 'Pay with Visa credit or debit card',
    fields: [
      { id: 'cardNumber', label: 'Card Number', placeholder: '4XXX XXXX XXXX XXXX', type: 'text' },
      { id: 'expiry', label: 'Expiry Date', placeholder: 'MM / YY', type: 'text' },
      { id: 'cvv', label: 'CVV', placeholder: '•••', type: 'password' },
      { id: 'name', label: 'Cardholder Name', placeholder: 'As on card', type: 'text' },
    ],
  },
  {
    id: 'mastercard', label: 'MasterCard', color: '#EB001B', bg: '#FFF5F5',
    logo: '💳', tag: 'Credit / Debit',
    description: 'Pay with MasterCard credit or debit card',
    fields: [
      { id: 'cardNumber', label: 'Card Number', placeholder: '5XXX XXXX XXXX XXXX', type: 'text' },
      { id: 'expiry', label: 'Expiry Date', placeholder: 'MM / YY', type: 'text' },
      { id: 'cvv', label: 'CVV', placeholder: '•••', type: 'password' },
      { id: 'name', label: 'Cardholder Name', placeholder: 'As on card', type: 'text' },
    ],
  },
];

const BLOOD_GROUPS = ['A+', 'A−', 'B+', 'B−', 'AB+', 'AB−', 'O+', 'O−'];

const FEE_MAP = [
  { keywords: ['CSE', 'Computer Science'], fee: 85000 },
  { keywords: ['SWE', 'Software Engineering'], fee: 78000 },
  { keywords: ['EEE', 'Electrical'], fee: 82000 },
  { keywords: ['Pharmacy'], fee: 135000 },
  { keywords: ['Architecture'], fee: 85000 },
  { keywords: ['Civil'], fee: 80000 },
  { keywords: ['BBA', 'Business'], fee: 65000 },
  { keywords: ['English'], fee: 50000 },
  { keywords: ['Law'], fee: 55000 },
];

function getAdmissionFee(program) {
  for (const entry of FEE_MAP) {
    if (entry.keywords.some(k => program.includes(k))) return entry.fee;
  }
  return 60000;
}

export const PaymentPage = () => {
  const navigate = useNavigate();
  useEffect(() => { window.scrollTo(0, 0); }, []);

  const savedDraft = JSON.parse(localStorage.getItem('preregisterDraft') || '{}');
  const userName = savedDraft.fullName || 'Student';
  const userPhone = savedDraft.contactNumber || '';
  const selectedProgram = savedDraft.selectedProgram || 'Computer Science and Engineering (CSE)';
  const appId = localStorage.getItem('applicationId') || '';
  const admissionFee = getAdmissionFee(selectedProgram);

  const [step, setStep] = useState(1); // 1=Profile, 2=Method, 3=Form, 4=Processing, 5=Done
  const [bloodGroup, setBloodGroup] = useState(localStorage.getItem('bloodGroup') || '');
  const [photoPreview, setPhotoPreview] = useState(localStorage.getItem('profilePhoto') || '');
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [formValues, setFormValues] = useState({});
  const [, setProcessing] = useState(false);
  const photoRef = useRef(null);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please upload an image file'); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error('Photo must be under 2MB'); return; }
    const reader = new FileReader();
    reader.onloadend = () => { setPhotoPreview(reader.result); };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleProfileNext = () => {
    if (!bloodGroup) { toast.error('Please select your blood group'); return; }
    if (!photoPreview) { toast.error('Please upload your profile photo'); return; }
    localStorage.setItem('bloodGroup', bloodGroup);
    localStorage.setItem('profilePhoto', photoPreview);
    setStep(2);
  };

  const handleMethodSelect = (method) => {
    setSelectedMethod(method);
    setFormValues({});
    setStep(3);
  };

  const handlePay = () => {
    const method = PAYMENT_METHODS.find(m => m.id === selectedMethod);
    if (!method) return;
    for (const field of method.fields) {
      if (!formValues[field.id] || !formValues[field.id].trim()) {
        toast.error(`Please enter ${field.label}`);
        return;
      }
    }
    setProcessing(true);
    setStep(4);
    // Simulate payment processing
    setTimeout(() => {
      const studentId = generateStudentId(selectedProgram);
      const email = `${studentId}@diu.edu.bd`;
      const now = new Date();
      const issued = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      const expires = new Date(now.setFullYear(now.getFullYear() + 4)).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

      localStorage.setItem('paymentStatus', 'completed');
      localStorage.setItem('paymentMethod', selectedMethod);
      localStorage.setItem('studentId', studentId);
      localStorage.setItem('registrationEmail', email);
      localStorage.setItem('idCardIssuedOn', issued);
      localStorage.setItem('idCardExpiresOn', expires);

      setProcessing(false);
      setStep(5);
      setTimeout(() => navigate('/admission/confirmation'), 1500);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-surface">
      <Navigation />
      <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />

      <main className="pt-28 pb-20 px-4 md:px-8 max-w-2xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <button onClick={() => step > 1 && step < 4 ? setStep(s => s - 1) : navigate('/admit-card')}
            className="flex items-center gap-1 text-on-surface-variant hover:text-primary transition-colors text-sm font-medium mb-4">
            <span className="material-symbols-outlined text-base">arrow_back</span>
            {step > 1 && step < 4 ? 'Back' : 'Back to Dashboard'}
          </button>
          <h1 className="font-headline text-3xl font-extrabold text-on-surface">Admission Fee Payment</h1>
          <p className="text-on-surface-variant mt-1 text-sm">Application: <span className="font-mono font-bold text-primary">{appId}</span></p>
        </div>

        {/* Fee Summary */}
        <div className="bg-primary rounded-2xl p-5 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/70 text-xs font-bold uppercase tracking-wider mb-1">Admission Fee</p>
              <p className="font-headline text-3xl font-extrabold">৳ {admissionFee.toLocaleString()}</p>
              <p className="text-white/70 text-sm mt-1 max-w-xs truncate">{selectedProgram}</p>
            </div>
            <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center mb-8">
          {['Profile', 'Method', 'Payment'].map((label, i) => (
            <React.Fragment key={i}>
              <div className="flex flex-col items-center gap-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  step > i + 1 ? 'bg-green-500 text-white' :
                  step === i + 1 ? 'bg-primary text-white' :
                  'bg-surface-container-high text-on-surface-variant'
                }`}>
                  {step > i + 1 ? <span className="material-symbols-outlined text-sm">check</span> : i + 1}
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-widest ${step >= i + 1 ? 'text-primary' : 'text-on-surface-variant'}`}>{label}</span>
              </div>
              {i < 2 && <div className={`flex-1 h-0.5 mx-2 mb-4 ${step > i + 1 ? 'bg-green-500' : 'bg-surface-variant'}`} />}
            </React.Fragment>
          ))}
        </div>

        {/* ── Step 1: Profile Completion ── */}
        {step === 1 && (
          <div className="bg-surface-container-low rounded-2xl p-6 border border-outline-variant/30 space-y-6">
            <div>
              <h2 className="font-headline text-xl font-bold mb-1">Complete Your Profile</h2>
              <p className="text-on-surface-variant text-sm">We need a few more details to issue your student ID card.</p>
            </div>

            {/* Photo Upload */}
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant block mb-2">Profile Photo *</label>
              <div className="flex items-center gap-4">
                <div
                  onClick={() => photoRef.current.click()}
                  className="w-24 h-28 rounded-xl overflow-hidden bg-surface-container-high border-2 border-dashed border-primary/40 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-all flex-shrink-0"
                >
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-2xl text-on-surface-variant">add_a_photo</span>
                      <span className="text-[10px] text-on-surface-variant mt-1">Click to upload</span>
                    </>
                  )}
                </div>
                <div className="text-sm text-on-surface-variant">
                  <p className="font-semibold text-on-surface mb-1">Upload passport-size photo</p>
                  <p>• Clear face, white background</p>
                  <p>• JPG or PNG format</p>
                  <p>• Max 2MB</p>
                  {photoPreview && (
                    <button onClick={() => photoRef.current.click()} className="mt-2 text-primary font-semibold underline text-xs">Change Photo</button>
                  )}
                </div>
              </div>
            </div>

            {/* Blood Group */}
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant block mb-2">Blood Group *</label>
              <div className="grid grid-cols-4 gap-2">
                {BLOOD_GROUPS.map(bg => (
                  <button key={bg} onClick={() => setBloodGroup(bg)}
                    className={`py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
                      bloodGroup === bg ? 'bg-primary text-white border-primary shadow-md' : 'bg-surface-container border-outline-variant/30 text-on-surface hover:border-primary/40'
                    }`}>
                    {bg}
                  </button>
                ))}
              </div>
            </div>

            {/* Student info summary */}
            <div className="bg-surface-container-high rounded-xl p-4 text-sm space-y-1.5">
              <p><span className="text-on-surface-variant">Name:</span> <span className="font-semibold">{userName}</span></p>
              <p><span className="text-on-surface-variant">Phone:</span> <span className="font-semibold">{userPhone || 'Not provided'}</span></p>
              <p><span className="text-on-surface-variant">Program:</span> <span className="font-semibold text-xs">{selectedProgram}</span></p>
            </div>

            <button onClick={handleProfileNext}
              className="w-full bg-primary text-white font-bold py-3.5 rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2">
              Continue to Payment Method
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </div>
        )}

        {/* ── Step 2: Payment Method Selection ── */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="mb-2">
              <h2 className="font-headline text-xl font-bold mb-1">Select Payment Method</h2>
              <p className="text-on-surface-variant text-sm">Choose how you want to pay your admission fee.</p>
            </div>
            {PAYMENT_METHODS.map(method => (
              <button key={method.id} onClick={() => handleMethodSelect(method.id)}
                className="w-full text-left bg-surface-container-low rounded-2xl p-5 border-2 border-outline-variant/30 hover:border-primary/50 hover:shadow-md transition-all flex items-center gap-4 group">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ background: method.bg }}>
                  {method.id === 'bkash' && <span style={{ color: method.color, fontWeight: 900, fontSize: '11px', letterSpacing: '-0.5px' }}>bKash</span>}
                  {method.id === 'nagad' && <span style={{ color: method.color, fontWeight: 900, fontSize: '11px' }}>Nagad</span>}
                  {method.id === '1card' && <span style={{ color: method.color, fontWeight: 900, fontSize: '11px' }}>1Card</span>}
                  {method.id === 'visa' && (
                    <svg viewBox="0 0 48 16" className="w-10" fill="none">
                      <text x="0" y="14" fontSize="16" fontWeight="800" fill="#1A1F71" fontFamily="Arial">VISA</text>
                    </svg>
                  )}
                  {method.id === 'mastercard' && (
                    <div className="flex">
                      <div className="w-5 h-5 rounded-full bg-red-500 opacity-90" />
                      <div className="w-5 h-5 rounded-full bg-yellow-400 -ml-2.5" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-on-surface">{method.label}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                      style={{ background: method.bg, color: method.color }}>
                      {method.tag}
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant mt-0.5">{method.description}</p>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary group-hover:translate-x-1 transition-all">arrow_forward_ios</span>
              </button>
            ))}
          </div>
        )}

        {/* ── Step 3: Payment Form ── */}
        {step === 3 && (() => {
          const method = PAYMENT_METHODS.find(m => m.id === selectedMethod);
          if (!method) return null;
          return (
            <div className="bg-surface-container-low rounded-2xl p-6 border border-outline-variant/30 space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: method.bg }}>
                  {selectedMethod === 'bkash' && <span style={{ color: method.color, fontWeight: 900, fontSize: '10px' }}>bKash</span>}
                  {selectedMethod === 'nagad' && <span style={{ color: method.color, fontWeight: 900, fontSize: '10px' }}>Nagad</span>}
                  {selectedMethod === '1card' && <span style={{ color: method.color, fontWeight: 900, fontSize: '10px' }}>1Card</span>}
                  {selectedMethod === 'visa' && <span style={{ color: method.color, fontWeight: 900, fontSize: '11px' }}>VISA</span>}
                  {selectedMethod === 'mastercard' && (
                    <div className="flex">
                      <div className="w-4 h-4 rounded-full bg-red-500" />
                      <div className="w-4 h-4 rounded-full bg-yellow-400 -ml-2" />
                    </div>
                  )}
                </div>
                <div>
                  <h2 className="font-headline text-lg font-bold">{method.label} Payment</h2>
                  <p className="text-on-surface-variant text-xs">{method.description}</p>
                </div>
              </div>

              {/* Demo disclaimer */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2">
                <span className="material-symbols-outlined text-amber-600 flex-shrink-0 text-base" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
                <p className="text-amber-700 text-xs font-medium">
                  This is a <strong>demo payment</strong> for testing purposes. No real transaction will occur.
                </p>
              </div>

              {method.fields.map(field => (
                <div key={field.id}>
                  <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant block mb-1.5">{field.label}</label>
                  <input
                    type={field.type}
                    placeholder={field.placeholder}
                    value={formValues[field.id] || ''}
                    onChange={e => setFormValues(prev => ({ ...prev, [field.id]: e.target.value }))}
                    className="w-full border-2 border-outline-variant/40 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-primary transition-all bg-surface"
                  />
                </div>
              ))}

              <div className="border-t border-outline-variant/30 pt-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-on-surface-variant text-sm">Admission Fee</span>
                  <span className="font-bold text-lg">৳ {admissionFee.toLocaleString()}</span>
                </div>
                <button onClick={handlePay}
                  className="w-full font-extrabold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 text-white"
                  style={{ background: method.color }}>
                  <span className="material-symbols-outlined">lock</span>
                  Pay ৳ {admissionFee.toLocaleString()} Securely
                </button>
              </div>
            </div>
          );
        })()}

        {/* ── Step 4: Processing ── */}
        {step === 4 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="relative mb-6">
              <div className="w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>
              </div>
            </div>
            <h2 className="font-headline text-2xl font-bold mb-2">Processing Payment</h2>
            <p className="text-on-surface-variant text-sm">Please wait while we confirm your transaction…</p>
            <p className="text-on-surface-variant text-xs mt-4 bg-surface-container-low px-4 py-2 rounded-full">Do not close this window</p>
          </div>
        )}

        {/* ── Step 5: Success redirect ── */}
        {step === 5 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-green-500/30">
              <span className="material-symbols-outlined text-white text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            </div>
            <h2 className="font-headline text-2xl font-bold text-green-700 mb-2">Payment Successful!</h2>
            <p className="text-on-surface-variant text-sm">Redirecting to your registration confirmation…</p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};
