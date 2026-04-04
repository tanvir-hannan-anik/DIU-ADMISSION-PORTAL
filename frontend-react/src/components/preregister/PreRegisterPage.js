import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navigation } from '../common/Navigation';
import { Footer } from '../common/Footer';
import { admissionService } from '../../services/admissionService';
import { toast } from 'react-toastify';

// ── Eligibility rules ──────────────────────────────────────────
const PROGRAMS = [
  {
    faculty: 'Science and Information Technology',
    icon: 'computer',
    list: [
      { name: 'Computer Science and Engineering (CSE)', group: 'Science', minGpa: 2.5, mathRequired: true, fee: 85000, demand: 'Very High', jobRate: '85%' },
      { name: 'Software Engineering (SWE)', group: 'Science', minGpa: 2.5, mathRequired: true, fee: 78000, demand: 'Very High', jobRate: '82%' },
      { name: 'SWE — Major in Cyber Security', group: 'Science', minGpa: 2.5, fee: 78000, demand: 'High', jobRate: '80%' },
      { name: 'SWE — Major in Data Science', group: 'Science', minGpa: 2.5, fee: 78000, demand: 'High', jobRate: '80%' },
      { name: 'SWE — Major in Robotics', group: 'Science', minGpa: 2.5, fee: 78000, demand: 'High', jobRate: '78%' },
      { name: 'Computing and Information System (CIS)', group: 'Any', minGpa: 2.5, fee: 70000, demand: 'High', jobRate: '80%' },
      { name: 'Multimedia & Creative Technology (MCT)', group: 'Any', minGpa: 2.5, fee: 68000, demand: 'Medium', jobRate: '70%' },
      { name: 'Information Technology & Management (ITM)', group: 'Any', minGpa: 2.5, fee: 65000, demand: 'Medium', jobRate: '72%' },
      { name: 'Robotics and Mechatronics Engineering', group: 'Science', minGpa: 2.5, fee: 80000, demand: 'High', jobRate: '78%' },
    ],
  },
  {
    faculty: 'Business & Entrepreneurship',
    icon: 'business_center',
    list: [
      { name: 'Bachelor of Business Administration (BBA)', group: 'Any', minGpa: 2.5, fee: 65000, demand: 'High', jobRate: '75%' },
      { name: 'BBA in Management', group: 'Any', minGpa: 2.5, fee: 65000, demand: 'High', jobRate: '74%' },
      { name: 'BBA in Finance & Banking', group: 'Any', minGpa: 2.5, fee: 66000, demand: 'High', jobRate: '76%' },
      { name: 'BBA in Marketing', group: 'Any', minGpa: 2.5, fee: 64000, demand: 'Medium', jobRate: '72%' },
      { name: 'BBA in Accounting', group: 'Any', minGpa: 2.5, fee: 64000, demand: 'Medium', jobRate: '73%' },
      { name: 'Financial Technology (FinTech)', group: 'Any', minGpa: 2.5, fee: 70000, demand: 'Very High', jobRate: '82%' },
      { name: 'Bachelor of Entrepreneurship (BE)', group: 'Any', minGpa: 2.5, fee: 65000, demand: 'Medium', jobRate: '70%' },
      { name: 'Bachelor of Tourism & Hospitality Management (BTHM)', group: 'Any', minGpa: 2.5, fee: 60000, demand: 'Medium', jobRate: '68%' },
      { name: 'Bachelor of Real Estate', group: 'Any', minGpa: 2.5, fee: 62000, demand: 'Medium', jobRate: '68%' },
    ],
  },
  {
    faculty: 'Engineering',
    icon: 'engineering',
    list: [
      { name: 'Electrical and Electronic Engineering (EEE)', group: 'Science', minGpa: 2.5, mathRequired: true, fee: 82000, demand: 'High', jobRate: '80%' },
      { name: 'Civil Engineering (CE)', group: 'Science', minGpa: 2.5, mathRequired: true, fee: 80000, demand: 'High', jobRate: '79%' },
      { name: 'Information & Communication Engineering (ICE)', group: 'Science', minGpa: 2.5, fee: 78000, demand: 'High', jobRate: '78%' },
      { name: 'Textile Engineering (TE)', group: 'Science', minGpa: 2.5, fee: 75000, demand: 'High', jobRate: '82%' },
      { name: 'Bachelor of Architecture (B.Arch.)', group: 'Science', minGpa: 2.5, fee: 85000, demand: 'Medium', jobRate: '74%' },
    ],
  },
  {
    faculty: 'Health and Life Sciences',
    icon: 'local_hospital',
    list: [
      { name: 'Bachelor of Pharmacy (B.Pharm)', group: 'Science', minGpa: 3.0, biologyRequired: true, fee: 135000, demand: 'High', jobRate: '85%' },
      { name: 'Bachelor of Public Health (BPH)', group: 'Science', minGpa: 2.5, fee: 60000, demand: 'Medium', jobRate: '72%' },
      { name: 'Bachelor of Nutrition and Food Engineering (NFE)', group: 'Science', minGpa: 2.5, fee: 62000, demand: 'Medium', jobRate: '70%' },
      { name: 'Environmental Science & Disaster Management (ESDM)', group: 'Science', minGpa: 2.5, fee: 58000, demand: 'Medium', jobRate: '68%' },
      { name: 'Physical Education and Sports Science (PESS)', group: 'Science', minGpa: 2.5, fee: 55000, demand: 'Medium', jobRate: '65%' },
      { name: 'Bachelor of Agricultural Science', group: 'Science', minGpa: 2.5, fee: 58000, demand: 'Medium', jobRate: '70%' },
      { name: 'Genetic Engineering and Biotechnology', group: 'Science', minGpa: 3.0, biologyRequired: true, fee: 70000, demand: 'High', jobRate: '75%' },
      { name: 'B.Sc. in Fisheries', group: 'Science', minGpa: 2.5, fee: 55000, demand: 'Medium', jobRate: '65%' },
    ],
  },
  {
    faculty: 'Humanities & Social Sciences',
    icon: 'menu_book',
    list: [
      { name: 'B.A. (Hons) in English', group: 'Any', minGpa: 2.0, fee: 50000, demand: 'Medium', jobRate: '65%' },
      { name: 'LL.B. (Hons.) — Law', group: 'Any', minGpa: 2.0, fee: 55000, demand: 'Medium', jobRate: '68%' },
      { name: 'Journalism, Media and Communication (JMC)', group: 'Any', minGpa: 2.0, fee: 52000, demand: 'Medium', jobRate: '66%' },
    ],
  },
];

const BOARDS = ['Dhaka', 'Chittagong', 'Rajshahi', 'Sylhet', 'Barisal', 'Comilla', 'Jessore', 'Dinajpur', 'Mymensingh'];
const GROUPS = ['Science', 'Business / Commerce', 'Humanities / Arts'];
const YEARS = Array.from({ length: 12 }, (_, i) => String(2025 - i));

const SCHEDULE = {
  science:     { admission: 'April 15, 2024 | 10:00 AM – 1:00 PM', viva: 'April 22, 2024 | 9:00 AM – 12:00 PM' },
  business:    { admission: 'April 16, 2024 | 10:00 AM – 1:00 PM', viva: 'April 23, 2024 | 9:00 AM – 12:00 PM' },
  engineering: { admission: 'April 17, 2024 | 10:00 AM – 1:00 PM', viva: 'April 24, 2024 | 9:00 AM – 12:00 PM' },
  health:      { admission: 'April 18, 2024 | 10:00 AM – 1:00 PM', viva: 'April 25, 2024 | 9:00 AM – 12:00 PM' },
  humanities:  { admission: 'April 19, 2024 | 10:00 AM – 1:00 PM', viva: 'April 26, 2024 | 9:00 AM – 12:00 PM' },
};

function getFacultyKey(facultyName) {
  const f = facultyName.toLowerCase();
  if (f.includes('science') || f.includes('information')) return 'science';
  if (f.includes('business')) return 'business';
  if (f.includes('engineering')) return 'engineering';
  if (f.includes('health')) return 'health';
  return 'humanities';
}

function checkEligibility(program, sscGpa, hscGpa, sscGroup) {
  if (!sscGpa || !hscGpa) return null;
  const ssc = parseFloat(sscGpa);
  const hsc = parseFloat(hscGpa);
  if (isNaN(ssc) || isNaN(hsc)) return null;

  const reasons = [];
  const groupNorm = (sscGroup || '').toLowerCase();
  const isScience = groupNorm.includes('science');

  if (program.group === 'Science' && !isScience) {
    reasons.push('Science group required');
  }
  if (ssc < program.minGpa) reasons.push(`SSC GPA must be ≥ ${program.minGpa} (yours: ${ssc})`);
  if (hsc < program.minGpa) reasons.push(`HSC GPA must be ≥ ${program.minGpa} (yours: ${hsc})`);

  return { eligible: reasons.length === 0, reasons };
}

// ── File Upload Button ─────────────────────────────────────────
const FileUpload = ({ label, value, onChange }) => {
  const ref = useRef();
  return (
    <div>
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">{label}</label>
      <div
        onClick={() => ref.current.click()}
        className="flex items-center gap-3 border-2 border-dashed border-slate-200 rounded-xl p-3 cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all"
      >
        <span className="material-symbols-outlined text-slate-400">upload_file</span>
        <span className="text-sm text-slate-500 flex-1 truncate">
          {value ? value.name : 'Click to upload PDF / JPG / PNG (max 5MB)'}
        </span>
        {value && <span className="material-symbols-outlined text-green-500 text-lg">check_circle</span>}
      </div>
      <input
        ref={ref} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
        onChange={e => { if (e.target.files[0]) onChange(e.target.files[0]); }}
      />
    </div>
  );
};

// ── Step indicator ─────────────────────────────────────────────
const Stepper = ({ current, steps }) => (
  <div className="flex items-center max-w-2xl mb-12">
    {steps.map((s, i) => (
      <React.Fragment key={i}>
        <div className="flex flex-col items-center gap-1.5">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ring-4 transition-all ${
            current > i + 1 ? 'bg-primary text-white ring-primary/20' :
            current === i + 1 ? 'bg-primary text-white ring-primary/20' :
            'bg-slate-100 text-slate-400 ring-transparent'
          }`}>
            {current > i + 1 ? <span className="material-symbols-outlined text-sm">check</span> : i + 1}
          </div>
          <span className={`text-[10px] font-bold uppercase tracking-widest whitespace-nowrap ${current >= i + 1 ? 'text-primary' : 'text-slate-400'}`}>{s}</span>
        </div>
        {i < steps.length - 1 && (
          <div className={`flex-1 h-0.5 mx-3 mb-5 transition-all ${current > i + 1 ? 'bg-primary' : 'bg-slate-200'}`} />
        )}
      </React.Fragment>
    ))}
  </div>
);

// ── Main Page ──────────────────────────────────────────────────
export const PreRegisterPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submittedApp, setSubmittedApp] = useState(null);

  const [feeMethod, setFeeMethod] = useState('');
  const [feeInput, setFeeInput] = useState('');
  const [feePayingLoader, setFeePayingLoader] = useState(false);

  const [personal, setPersonal] = useState({ fullName: '', email: '', dateOfBirth: '', contactNumber: '' });
  const [academic, setAcademic] = useState({
    sscResult: '', sscGroup: '', sscBoard: '', sscYear: '',
    hscResult: '', hscGroup: '', hscBoard: '', hscYear: '',
  });
  const [sscFile, setSscFile] = useState(null);
  const [hscFile, setHscFile] = useState(null);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [selectedFaculty, setSelectedFaculty] = useState(null);

  // Load chatbot-collected data if available
  useEffect(() => {
    const chatbotData = JSON.parse(localStorage.getItem('chatbot_preregister_data') || 'null');
    if (chatbotData) {
      setPersonal({
        fullName: chatbotData.fullName || '',
        email: chatbotData.email || '',
        dateOfBirth: chatbotData.dateOfBirth || '',
        contactNumber: chatbotData.contactNumber || '',
      });
      setAcademic({
        sscResult: chatbotData.sscResult || '',
        sscGroup: chatbotData.sscGroup || '',
        sscBoard: chatbotData.sscBoard || '',
        sscYear: chatbotData.sscYear || '',
        hscResult: chatbotData.hscResult || '',
        hscGroup: chatbotData.hscGroup || '',
        hscBoard: chatbotData.hscBoard || '',
        hscYear: chatbotData.hscYear || '',
      });
      localStorage.removeItem('chatbot_preregister_data');
      toast.success('Form pre-filled by AI Assistant! Review and select your program.', { icon: '🤖' });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const eligibilityResult = selectedProgram
    ? checkEligibility(selectedProgram, academic.sscResult, academic.hscResult, academic.sscGroup)
    : null;

  const schedule = selectedFaculty ? SCHEDULE[getFacultyKey(selectedFaculty)] : null;

  // Validate step 1
  const validateStep1 = () => {
    if (!personal.fullName.trim()) { toast.error('Full name is required'); return false; }
    if (!personal.email.trim() || !/\S+@\S+\.\S+/.test(personal.email)) { toast.error('Valid email is required'); return false; }
    if (!personal.dateOfBirth) { toast.error('Date of birth is required'); return false; }
    if (!personal.contactNumber.trim()) { toast.error('Contact number is required'); return false; }
    return true;
  };

  // Validate step 2
  const validateStep2 = () => {
    if (!academic.sscResult || isNaN(parseFloat(academic.sscResult))) { toast.error('Valid SSC GPA is required'); return false; }
    if (!academic.sscGroup) { toast.error('SSC group is required'); return false; }
    if (!academic.sscBoard) { toast.error('SSC board is required'); return false; }
    if (!academic.sscYear) { toast.error('SSC passing year is required'); return false; }
    if (!academic.hscResult || isNaN(parseFloat(academic.hscResult))) { toast.error('Valid HSC GPA is required'); return false; }
    if (!academic.hscGroup) { toast.error('HSC group is required'); return false; }
    if (!academic.hscBoard) { toast.error('HSC board is required'); return false; }
    if (!academic.hscYear) { toast.error('HSC passing year is required'); return false; }
    return true;
  };

  const handleSubmit = async () => {
    if (!selectedProgram) { toast.error('Please select a program'); return; }
    setSubmitting(true);
    try {
      const result = await admissionService.submitApplication({
        ...personal,
        ...academic,
        sscMarksheet: sscFile ? sscFile.name : '',
        hscMarksheet: hscFile ? hscFile.name : '',
        program: selectedProgram.name,
        major: '',
      });
      if (result.success) {
        setSubmittedApp(result.data);
        localStorage.setItem('preregisterDraft', JSON.stringify({
          fullName: personal.fullName, email: personal.email,
          contactNumber: personal.contactNumber, selectedProgram: selectedProgram?.name,
        }));
        localStorage.setItem('applicationId', result.data?.appId || result.data?.data?.appId || '');
        setStep(5);
        window.scrollTo(0, 0);
      } else {
        toast.error(result.error || 'Submission failed. Please try again.');
      }
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = "w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all";
  const selectCls = inputCls + " cursor-pointer";
  const labelCls = "text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5";

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      <main className="pt-28 pb-20 px-4 max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-12">
          <h1 className="text-5xl md:text-6xl font-headline font-extrabold tracking-tighter text-primary leading-none mb-3">
            Your Future <br /><span className="text-slate-400">Starts Here.</span>
          </h1>
          <p className="text-slate-500 max-w-xl text-base leading-relaxed">
            Complete your pre-registration to begin your admission journey at Bangladesh's #1 ranked private university.
          </p>
        </header>

        {step < 5 && (
          <Stepper current={step} steps={['Personal', 'Academic', 'Program', 'Review', 'Pay ৳1k']} />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className={`${step === 3 ? 'lg:col-span-12' : 'lg:col-span-8'} bg-white rounded-2xl shadow-sm border border-slate-200 p-8`}>

            {/* ── STEP 1: Personal ── */}
            {step === 1 && (
              <div className="space-y-8">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary">person</span>
                  <h2 className="text-2xl font-headline font-bold text-slate-900">Personal Identity</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className={labelCls}>Full Legal Name *</label>
                    <input type="text" placeholder="As per certificate" className={inputCls}
                      value={personal.fullName} onChange={e => setPersonal(p => ({ ...p, fullName: e.target.value }))} />
                  </div>
                  <div>
                    <label className={labelCls}>Email Address *</label>
                    <input type="email" placeholder="example@mail.com" className={inputCls}
                      value={personal.email} onChange={e => setPersonal(p => ({ ...p, email: e.target.value }))} />
                  </div>
                  <div>
                    <label className={labelCls}>Date of Birth *</label>
                    <input type="date" className={inputCls}
                      value={personal.dateOfBirth} onChange={e => setPersonal(p => ({ ...p, dateOfBirth: e.target.value }))} />
                  </div>
                  <div>
                    <label className={labelCls}>Contact Number *</label>
                    <div className="flex">
                      <span className="bg-slate-100 border border-slate-200 border-r-0 rounded-l-xl px-3 flex items-center text-slate-500 text-sm font-semibold">+880</span>
                      <input type="tel" placeholder="01XXX XXXXXX" className={inputCls + ' !rounded-l-none'}
                        value={personal.contactNumber} onChange={e => setPersonal(p => ({ ...p, contactNumber: e.target.value }))} />
                    </div>
                  </div>
                </div>

                <div className="flex justify-between pt-4 border-t border-slate-100">
                  <button onClick={() => { localStorage.setItem('preregDraft', JSON.stringify(personal)); toast.success('Draft saved!'); }}
                    className="text-slate-400 font-semibold hover:text-primary transition-colors flex items-center gap-2 text-sm">
                    <span className="material-symbols-outlined text-sm">save</span> Save Draft
                  </button>
                  <button onClick={() => { if (validateStep1()) { setStep(2); window.scrollTo(0,0); } }}
                    className="bg-primary text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
                    Next: Academic Details <span className="material-symbols-outlined">arrow_forward</span>
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 2: Academic ── */}
            {step === 2 && (
              <div className="space-y-8">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary">school</span>
                  <h2 className="text-2xl font-headline font-bold text-slate-900">Academic Records</h2>
                </div>

                {/* SSC */}
                <div className="border border-slate-200 rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-5">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                      <span className="text-[11px] font-black text-primary">SSC</span>
                    </div>
                    <h3 className="font-bold text-slate-800">SSC / O-Level Result</h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <label className={labelCls}>GPA (out of 5) *</label>
                      <input type="number" min="1" max="5" step="0.01" placeholder="e.g. 4.50" className={inputCls}
                        value={academic.sscResult} onChange={e => setAcademic(a => ({ ...a, sscResult: e.target.value }))} />
                    </div>
                    <div>
                      <label className={labelCls}>Group *</label>
                      <select className={selectCls}
                        value={academic.sscGroup} onChange={e => setAcademic(a => ({ ...a, sscGroup: e.target.value }))}>
                        <option value="">Select</option>
                        {GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Board *</label>
                      <select className={selectCls}
                        value={academic.sscBoard} onChange={e => setAcademic(a => ({ ...a, sscBoard: e.target.value }))}>
                        <option value="">Select</option>
                        {BOARDS.map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Year *</label>
                      <select className={selectCls}
                        value={academic.sscYear} onChange={e => setAcademic(a => ({ ...a, sscYear: e.target.value }))}>
                        <option value="">Select</option>
                        {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                    </div>
                  </div>
                  <FileUpload label="Upload SSC Marksheet" value={sscFile} onChange={setSscFile} />
                </div>

                {/* HSC */}
                <div className="border border-slate-200 rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-5">
                    <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center">
                      <span className="text-[11px] font-black text-indigo-600">HSC</span>
                    </div>
                    <h3 className="font-bold text-slate-800">HSC / A-Level Result</h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <label className={labelCls}>GPA (out of 5) *</label>
                      <input type="number" min="1" max="5" step="0.01" placeholder="e.g. 4.50" className={inputCls}
                        value={academic.hscResult} onChange={e => setAcademic(a => ({ ...a, hscResult: e.target.value }))} />
                    </div>
                    <div>
                      <label className={labelCls}>Group *</label>
                      <select className={selectCls}
                        value={academic.hscGroup} onChange={e => setAcademic(a => ({ ...a, hscGroup: e.target.value }))}>
                        <option value="">Select</option>
                        {GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Board *</label>
                      <select className={selectCls}
                        value={academic.hscBoard} onChange={e => setAcademic(a => ({ ...a, hscBoard: e.target.value }))}>
                        <option value="">Select</option>
                        {BOARDS.map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Year *</label>
                      <select className={selectCls}
                        value={academic.hscYear} onChange={e => setAcademic(a => ({ ...a, hscYear: e.target.value }))}>
                        <option value="">Select</option>
                        {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                    </div>
                  </div>
                  <FileUpload label="Upload HSC Marksheet" value={hscFile} onChange={setHscFile} />
                </div>

                {/* Quick eligibility preview */}
                {academic.sscResult && academic.hscResult && academic.sscGroup && (
                  <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                    <p className="text-sm font-bold text-slate-700 mb-2">Quick Eligibility Preview</p>
                    <div className="flex items-center gap-3">
                      <div className={`text-2xl font-black ${parseFloat(academic.sscResult) >= 2.5 && parseFloat(academic.hscResult) >= 2.5 ? 'text-green-600' : 'text-red-500'}`}>
                        {parseFloat(academic.sscResult) >= 2.5 && parseFloat(academic.hscResult) >= 2.5 ? '✅' : '❌'}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          Combined GPA: {(parseFloat(academic.sscResult || 0) + parseFloat(academic.hscResult || 0)).toFixed(2)} / 10
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {parseFloat(academic.sscResult) >= 2.5 && parseFloat(academic.hscResult) >= 2.5
                            ? 'Meets minimum GPA requirement for most programs'
                            : 'GPA below 2.5 — limited program eligibility'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-between pt-4 border-t border-slate-100">
                  <button onClick={() => setStep(1)} className="text-slate-400 font-semibold hover:text-primary transition-colors flex items-center gap-2 text-sm">
                    <span className="material-symbols-outlined text-sm">arrow_back</span> Back
                  </button>
                  <button onClick={() => { if (validateStep2()) { setStep(3); window.scrollTo(0,0); } }}
                    className="bg-primary text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
                    Next: Select Program <span className="material-symbols-outlined">arrow_forward</span>
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 3: Program Selection ── */}
            {step === 3 && (
              <div className="space-y-8">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary">school</span>
                  <div>
                    <h2 className="text-2xl font-headline font-bold text-slate-900">Select Your Program</h2>
                    <p className="text-sm text-slate-500 mt-0.5">Programs marked ✅ match your GPA and group. Click to select.</p>
                  </div>
                </div>

                {PROGRAMS.map(faculty => (
                  <div key={faculty.faculty}>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="material-symbols-outlined text-primary text-lg">{faculty.icon}</span>
                      <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider">{faculty.faculty}</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 mb-6">
                      {faculty.list.map(prog => {
                        const eli = checkEligibility(prog, academic.sscResult, academic.hscResult, academic.sscGroup);
                        const isSelected = selectedProgram?.name === prog.name;
                        const eligible = eli?.eligible;
                        return (
                          <button
                            key={prog.name}
                            onClick={() => { setSelectedProgram(prog); setSelectedFaculty(faculty.faculty); }}
                            className={`text-left p-4 rounded-xl border-2 transition-all ${
                              isSelected
                                ? 'border-primary bg-primary/5 shadow-md'
                                : eligible === false
                                ? 'border-slate-100 bg-slate-50 opacity-60'
                                : 'border-slate-200 bg-white hover:border-primary/40 hover:bg-primary/5'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <span className="text-sm font-semibold text-slate-800 leading-tight">{prog.name}</span>
                              <span className="flex-shrink-0 text-base">
                                {eli === null ? '—' : eligible ? '✅' : '❌'}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-[11px] text-slate-500">
                              <span>BDT {prog.fee.toLocaleString()}/sem</span>
                              <span className={`font-bold ${prog.demand === 'Very High' ? 'text-red-500' : prog.demand === 'High' ? 'text-amber-600' : 'text-slate-400'}`}>
                                {prog.demand}
                              </span>
                              <span>{prog.jobRate} jobs</span>
                            </div>
                            {eli && !eligible && (
                              <p className="text-[11px] text-red-400 mt-1.5">{eli.reasons[0]}</p>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* Selected program + schedule */}
                {selectedProgram && eligibilityResult && (
                  <div className={`rounded-2xl border-2 p-6 ${eligibilityResult.eligible ? 'border-green-300 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-2xl">{eligibilityResult.eligible ? '✅' : '❌'}</span>
                      <div>
                        <p className="font-bold text-slate-800">{selectedProgram.name}</p>
                        <p className={`text-sm font-semibold ${eligibilityResult.eligible ? 'text-green-700' : 'text-red-600'}`}>
                          {eligibilityResult.eligible ? 'You are ELIGIBLE for this program' : 'You are NOT ELIGIBLE — ' + eligibilityResult.reasons.join(', ')}
                        </p>
                      </div>
                    </div>

                    {eligibilityResult.eligible && schedule && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div className="bg-white rounded-xl p-4 border border-green-200">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="material-symbols-outlined text-primary text-lg">event</span>
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Admission Interview</span>
                          </div>
                          <p className="font-bold text-slate-800 text-sm">{schedule.admission}</p>
                          <p className="text-xs text-slate-500 mt-1">DIU Permanent Campus, Savar, Dhaka</p>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-green-200">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="material-symbols-outlined text-green-600 text-lg">record_voice_over</span>
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Viva / Oral Interview</span>
                          </div>
                          <p className="font-bold text-slate-800 text-sm">{schedule.viva}</p>
                          <p className="text-xs text-slate-500 mt-1">DIU Permanent Campus, Savar, Dhaka</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-between pt-4 border-t border-slate-100">
                  <button onClick={() => setStep(2)} className="text-slate-400 font-semibold hover:text-primary transition-colors flex items-center gap-2 text-sm">
                    <span className="material-symbols-outlined text-sm">arrow_back</span> Back
                  </button>
                  <button
                    onClick={() => { if (!selectedProgram) { toast.error('Please select a program'); return; } setStep(4); window.scrollTo(0,0); }}
                    disabled={!selectedProgram}
                    className="bg-primary text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-40"
                  >
                    Review & Submit <span className="material-symbols-outlined">arrow_forward</span>
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 4: Review & Submit ── */}
            {step === 4 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary">fact_check</span>
                  <h2 className="text-2xl font-headline font-bold text-slate-900">Review & Submit</h2>
                </div>

                {/* Personal summary */}
                <div className="border border-slate-200 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider">Personal Info</h3>
                    <button onClick={() => setStep(1)} className="text-xs text-primary font-bold hover:underline">Edit</button>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {[['Name', personal.fullName], ['Email', personal.email], ['DOB', personal.dateOfBirth], ['Phone', '+880 ' + personal.contactNumber]].map(([k,v]) => (
                      <div key={k}><span className="text-slate-400 text-xs">{k}</span><p className="font-semibold text-slate-800">{v || '—'}</p></div>
                    ))}
                  </div>
                </div>

                {/* Academic summary */}
                <div className="border border-slate-200 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider">Academic Records</h3>
                    <button onClick={() => setStep(2)} className="text-xs text-primary font-bold hover:underline">Edit</button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    {[
                      ['SSC GPA', academic.sscResult], ['SSC Group', academic.sscGroup],
                      ['SSC Board', academic.sscBoard], ['SSC Year', academic.sscYear],
                      ['HSC GPA', academic.hscResult], ['HSC Group', academic.hscGroup],
                      ['HSC Board', academic.hscBoard], ['HSC Year', academic.hscYear],
                    ].map(([k,v]) => (
                      <div key={k}><span className="text-slate-400 text-xs">{k}</span><p className="font-semibold text-slate-800">{v || '—'}</p></div>
                    ))}
                  </div>
                  <div className="flex gap-4 mt-3">
                    {sscFile && <span className="text-xs text-green-600 flex items-center gap-1"><span className="material-symbols-outlined text-sm">attach_file</span>SSC: {sscFile.name}</span>}
                    {hscFile && <span className="text-xs text-green-600 flex items-center gap-1"><span className="material-symbols-outlined text-sm">attach_file</span>HSC: {hscFile.name}</span>}
                  </div>
                </div>

                {/* Program & schedule */}
                {selectedProgram && (
                  <div className="border border-primary/30 bg-primary/5 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider">Selected Program</h3>
                      <button onClick={() => setStep(3)} className="text-xs text-primary font-bold hover:underline">Change</button>
                    </div>
                    <p className="font-bold text-primary text-base mb-1">{selectedProgram.name}</p>
                    <p className="text-xs text-slate-500 mb-4">BDT {selectedProgram.fee.toLocaleString()}/semester · {selectedProgram.demand} demand · {selectedProgram.jobRate} job rate</p>

                    {eligibilityResult?.eligible && schedule && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="bg-white rounded-lg p-3 border border-slate-200 text-sm">
                          <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Admission Interview</span>
                          <span className="font-bold text-slate-800">{schedule.admission}</span>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-slate-200 text-sm">
                          <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Viva</span>
                          <span className="font-bold text-slate-800">{schedule.viva}</span>
                        </div>
                      </div>
                    )}
                    {eligibilityResult && !eligibilityResult.eligible && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">
                        ❌ Not eligible: {eligibilityResult.reasons.join(', ')}
                      </div>
                    )}
                  </div>
                )}

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                  <span className="font-bold">📧 Email notification:</span> A confirmation email will be sent to <strong>{personal.email}</strong> after submission. If selected by the admission team, you will receive another email with final admission details.
                </div>

                <div className="flex justify-between pt-4 border-t border-slate-100">
                  <button onClick={() => setStep(3)} className="text-slate-400 font-semibold hover:text-primary transition-colors flex items-center gap-2 text-sm">
                    <span className="material-symbols-outlined text-sm">arrow_back</span> Back
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="bg-primary text-white px-10 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                  >
                    {submitting ? (
                      <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Submitting...</>
                    ) : (
                      <><span className="material-symbols-outlined">send</span> Submit Application</>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 5: Application Fee Payment ── */}
            {step === 5 && submittedApp && !feePayingLoader && localStorage.getItem('appFeePaid') !== 'yes' && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings:"'FILL' 1" }}>payments</span>
                  </div>
                  <h2 className="text-2xl font-headline font-bold text-slate-900">Application Fee Payment</h2>
                  <p className="text-slate-500 text-sm mt-1">Pay the one-time non-refundable application processing fee to confirm your pre-registration.</p>
                </div>

                <div className="bg-gradient-to-r from-primary to-blue-700 rounded-2xl p-6 text-white text-center">
                  <p className="text-white/70 text-xs font-bold uppercase tracking-widest mb-1">Application Processing Fee (Non-refundable)</p>
                  <p className="text-5xl font-black mb-2">৳ 1,000</p>
                  <p className="text-white/70 text-sm">Application ID: <span className="font-mono font-bold text-white">{submittedApp?.appId || submittedApp?.data?.appId || '—'}</span></p>
                  <p className="text-white/60 text-xs mt-1">{selectedProgram?.name}</p>
                </div>

                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Select Payment Method</p>
                  <div className="grid grid-cols-5 gap-2">
                    {[
                      { id: 'bkash', label: 'bKash', color: '#E2136E' },
                      { id: 'nagad', label: 'Nagad', color: '#F7941D' },
                      { id: '1card', label: '1Card', color: '#0C1282' },
                      { id: 'visa',  label: 'VISA',  color: '#1A1F71' },
                      { id: 'mc',    label: 'MCard', color: '#EB001B' },
                    ].map(m => (
                      <button key={m.id} onClick={() => { setFeeMethod(m.id); setFeeInput(''); }}
                        className={`py-2.5 rounded-xl text-xs font-extrabold border-2 transition-all ${feeMethod === m.id ? 'border-transparent text-white shadow-md' : 'border-slate-200 text-slate-600 bg-white hover:border-primary/30'}`}
                        style={feeMethod === m.id ? { background: m.color } : {}}>
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                {feeMethod && (
                  <div>
                    <label className={labelCls}>
                      {feeMethod === 'visa' || feeMethod === 'mc' ? 'Card Number' : feeMethod === '1card' ? '1Card Account Number' : 'Mobile Number (bKash/Nagad)'}
                    </label>
                    <input
                      type={feeMethod === 'visa' || feeMethod === 'mc' ? 'text' : 'tel'}
                      placeholder={feeMethod === 'visa' || feeMethod === 'mc' ? 'XXXX XXXX XXXX XXXX' : '01XXXXXXXXX'}
                      className={inputCls}
                      value={feeInput}
                      onChange={e => setFeeInput(e.target.value)}
                    />
                    {(feeMethod === 'visa' || feeMethod === 'mc') && (
                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <div>
                          <label className={labelCls}>Expiry (MM/YY)</label>
                          <input type="text" placeholder="MM / YY" className={inputCls} />
                        </div>
                        <div>
                          <label className={labelCls}>CVV</label>
                          <input type="password" placeholder="•••" className={inputCls} />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2">
                  <span className="material-symbols-outlined text-amber-500 text-base flex-shrink-0" style={{ fontVariationSettings:"'FILL' 1" }}>info</span>
                  <p className="text-amber-700 text-xs">This is a <strong>demo payment</strong> for testing purposes. No real transaction will occur.</p>
                </div>

                <button
                  onClick={() => {
                    if (!feeMethod) { toast.error('Please select a payment method'); return; }
                    if (!feeInput.trim()) { toast.error('Please enter your account/card number'); return; }
                    setFeePayingLoader(true);
                    setTimeout(() => {
                      localStorage.setItem('appFeePaid', 'yes');
                      localStorage.setItem('appFeeMethod', feeMethod);
                      setFeePayingLoader(false);
                      toast.success('Payment of ৳1,000 confirmed!');
                      setStep(6);
                      window.scrollTo(0, 0);
                    }, 2500);
                  }}
                  className="w-full bg-primary text-white font-extrabold py-4 rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                >
                  <span className="material-symbols-outlined">lock</span> Pay ৳1,000 Securely
                </button>
              </div>
            )}

            {/* Step 5: Processing loader */}
            {step === 5 && feePayingLoader && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="relative mb-6">
                  <div className="w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings:"'FILL' 1" }}>payments</span>
                  </div>
                </div>
                <h2 className="font-headline text-2xl font-bold mb-2">Processing Payment…</h2>
                <p className="text-slate-500 text-sm">Please wait. Do not close this window.</p>
              </div>
            )}

            {/* ── STEP 6: Success ── */}
            {step === 6 && submittedApp && (
              <div className="text-center py-8 space-y-6">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <span className="material-symbols-outlined text-green-600 text-4xl">check_circle</span>
                </div>
                {/* Payment confirmed badge */}
                <div className="bg-green-50 border border-green-200 rounded-2xl p-4 max-w-md mx-auto flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-white text-xl" style={{ fontVariationSettings:"'FILL' 1" }}>check_circle</span>
                  </div>
                  <div>
                    <p className="font-bold text-green-800 text-sm">Application Fee Paid — ৳1,000</p>
                    <p className="text-green-600 text-xs">Payment confirmed via {localStorage.getItem('appFeeMethod')?.toUpperCase()}</p>
                  </div>
                </div>

                <div>
                  <h2 className="text-3xl font-headline font-extrabold text-slate-900 mb-2">Registration Confirmed!</h2>
                  <p className="text-slate-500">Congratulations, <strong>{personal.fullName}</strong>! Your application has been successfully submitted.</p>
                </div>

                {/* Exam & Viva dates — prominent */}
                {eligibilityResult?.eligible && schedule && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg mx-auto">
                    <div className="bg-primary text-white rounded-2xl p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings:"'FILL' 1" }}>event</span>
                        <span className="text-white/80 text-xs font-bold uppercase tracking-wider">Written Exam / Interview</span>
                      </div>
                      <p className="font-black text-base leading-tight">{schedule.admission}</p>
                      <p className="text-white/60 text-xs mt-1">DIU Campus, Ashulia, Savar</p>
                    </div>
                    <div className="bg-indigo-700 text-white rounded-2xl p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings:"'FILL' 1" }}>record_voice_over</span>
                        <span className="text-white/80 text-xs font-bold uppercase tracking-wider">Viva / Oral Interview</span>
                      </div>
                      <p className="font-black text-base leading-tight">{schedule.viva}</p>
                      <p className="text-white/60 text-xs mt-1">DIU Campus, Ashulia, Savar</p>
                    </div>
                  </div>
                )}

                <div className="bg-slate-50 rounded-2xl p-5 text-left max-w-md mx-auto">
                  <div className="space-y-2.5 text-sm">
                    {[
                      ['Application ID', submittedApp?.appId || submittedApp?.data?.appId || '—', true],
                      ['Program', selectedProgram?.name, false],
                      ['Status', 'PENDING REVIEW', false],
                    ].map(([k, v, mono]) => (
                      <div key={k} className="flex justify-between items-center">
                        <span className="text-slate-500">{k}</span>
                        <span className={`font-semibold text-slate-800 text-right text-xs max-w-xs ${mono ? 'font-mono text-primary font-black' : ''}`}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700 max-w-md mx-auto">
                  📧 Confirmation sent to <strong>{personal.email}</strong>. Bring your admit card on exam day.
                </div>

                <div className="flex gap-3 justify-center flex-wrap">
                  <button onClick={() => navigate('/admit-card')}
                    className="bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-primary/90 transition-all text-sm flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">assignment_ind</span> Complete Full Registration
                  </button>
                  <button onClick={() => navigate('/')}
                    className="bg-slate-100 text-slate-700 px-6 py-3 rounded-xl font-bold hover:bg-slate-200 transition-all text-sm">
                    Back to Home
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar (only on steps 1-4) */}
          {step < 5 && (
            <div className="lg:col-span-4 space-y-5">
              <div className="bg-primary text-white p-6 rounded-2xl">
                <h3 className="text-lg font-headline font-bold mb-4">Why DIU?</h3>
                <ul className="space-y-3">
                  {['Ranked #1 Private University in Bangladesh', '55,000+ Alumni in 19 Countries', '60+ Student Clubs & Activities', 'Merit Scholarships up to 100%', '25+ AC Buses covering Dhaka'].map((item, i) => (
                    <li key={i} className="flex gap-2 text-sm text-indigo-100/90">
                      <span className="material-symbols-outlined text-indigo-400 text-sm mt-0.5">check_circle</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-6">
                <h3 className="font-bold text-slate-900 mb-1">Need Help?</h3>
                <p className="text-sm text-slate-500 mb-4">Counselors available 10 AM – 6 PM</p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-primary">
                    <span className="material-symbols-outlined text-lg">call</span>
                    <span className="font-bold">+880 1844 536 000</span>
                  </div>
                  <div className="flex items-center gap-2 text-primary">
                    <span className="material-symbols-outlined text-lg">mail</span>
                    <span className="font-bold text-xs">admission@daffodilvarsity.edu.bd</span>
                  </div>
                </div>
              </div>

              {step === 2 && academic.sscResult && academic.hscResult && (
                <div className="bg-white border border-slate-200 rounded-2xl p-6">
                  <h3 className="font-bold text-slate-900 mb-3">Waiver Calculator</h3>
                  {(() => {
                    const combined = parseFloat(academic.sscResult || 0) + parseFloat(academic.hscResult || 0);
                    const waiver = combined >= 9 ? 100 : combined >= 8.5 ? 75 : combined >= 8 ? 50 : combined >= 7 ? 25 : 0;
                    return (
                      <>
                        <div className="text-4xl font-black text-primary mb-1">{waiver}%</div>
                        <p className="text-sm text-slate-500">Estimated tuition waiver</p>
                        <p className="text-xs text-slate-400 mt-1">Combined GPA: {combined.toFixed(2)}/10</p>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};
