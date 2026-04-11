import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom'; // Online Admission Portal
import { Navigation } from '../common/Navigation';
import { Footer } from '../common/Footer';
import { toast } from 'react-toastify';
import API_CONFIG from '../../config/apiConfig';

// ── Constants ──────────────────────────────────────────────────────
const DIVISIONS = ['Dhaka', 'Chittagong', 'Rajshahi', 'Sylhet', 'Barisal', 'Khulna', 'Rangpur', 'Mymensingh'];
const BOARDS = ['Dhaka', 'Chittagong', 'Rajshahi', 'Sylhet', 'Barisal', 'Comilla', 'Jessore', 'Dinajpur', 'Mymensingh'];
const GROUPS = ['Science', 'Business / Commerce', 'Humanities / Arts'];
const YEARS = Array.from({ length: 12 }, (_, i) => String(2025 - i));
const GENDERS = ['Male', 'Female', 'Other', 'Prefer not to say'];
const RELIGIONS = ['Islam', 'Hinduism', 'Christianity', 'Buddhism', 'Other'];
const NATIONALITIES = ['Bangladeshi', 'Indian', 'Pakistani', 'Other'];
const BLOOD_GROUPS = ['A+', 'A−', 'B+', 'B−', 'AB+', 'AB−', 'O+', 'O−'];
const SEMESTERS = ['Spring 2025', 'Summer 2025', 'Fall 2025'];
const ADMISSION_DOCS = [
  { id: 'ssc_cert', label: 'SSC Certificate / Marksheet', required: true },
  { id: 'hsc_cert', label: 'HSC Certificate / Marksheet', required: true },
  { id: 'nid', label: 'National ID / Birth Certificate', required: true },
  { id: 'photo', label: 'Passport-size Photograph (3 copies)', required: true },
  { id: 'migration', label: 'Migration Certificate (if transferred)', required: false },
  { id: 'tc', label: 'Transfer Certificate (if applicable)', required: false },
];

// ── Stepper ────────────────────────────────────────────────────────
const Stepper = ({ current, steps }) => (
  <div className="flex items-center mb-8 overflow-x-auto pb-2">
    {steps.map((s, i) => (
      <div key={i} className="flex items-center flex-shrink-0">
        <div className="flex flex-col items-center gap-1">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ring-4 transition-all ${
            current > i + 1 ? 'bg-primary text-white ring-primary/20' :
            current === i + 1 ? 'bg-primary text-white ring-primary/20 shadow-lg' :
            'bg-slate-100 text-slate-400 ring-transparent'
          }`}>
            {current > i + 1 ? <span className="material-symbols-outlined text-sm">check</span> : i + 1}
          </div>
          <span className={`text-[10px] font-bold uppercase tracking-widest whitespace-nowrap ${current >= i + 1 ? 'text-primary' : 'text-slate-400'}`}>{s}</span>
        </div>
        {i < steps.length - 1 && (
          <div className={`w-8 md:w-14 h-0.5 mx-1 mb-5 flex-shrink-0 transition-all ${current > i + 1 ? 'bg-primary' : 'bg-slate-200'}`} />
        )}
      </div>
    ))}
  </div>
);

// ── File Upload Row ────────────────────────────────────────────────
const DocUploadRow = ({ doc, uploaded, onUpload }) => {
  const ref = useRef();
  return (
    <div className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${uploaded ? 'bg-green-50 border-green-200' : 'border-dashed border-slate-300 hover:border-primary/40 bg-slate-50'}`}>
      <span className={`material-symbols-outlined flex-shrink-0 ${uploaded ? 'text-green-600' : 'text-slate-400'}`} style={{ fontVariationSettings: "'FILL' 1" }}>
        {uploaded ? 'check_circle' : 'upload_file'}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800">{doc.label} {doc.required && <span className="text-red-500">*</span>}</p>
        {uploaded && <p className="text-xs text-green-600 font-medium">{uploaded}</p>}
        {!uploaded && <p className="text-xs text-slate-400">PDF, JPG, PNG — max 5MB</p>}
      </div>
      <button onClick={() => ref.current.click()} className="text-xs font-bold text-primary hover:underline flex-shrink-0">
        {uploaded ? 'Change' : 'Upload'}
      </button>
      <input ref={ref} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
        onChange={e => {
          const f = e.target.files[0];
          if (f) { if (f.size > 5 * 1024 * 1024) { toast.error('Max 5MB'); } else { onUpload(doc.id, f.name); } }
          e.target.value = '';
        }} />
    </div>
  );
};

// ── Dashboard ──────────────────────────────────────────────────────
const DEFAULT_DASH_DOCS = [
  { id: 'transcript', name: 'Academic Transcripts (SSC & HSC)', status: 'pending', file: null, date: null },
  { id: 'passport', name: 'National ID / Birth Certificate', status: 'pending', file: null, date: null },
  { id: 'photo', name: 'Passport Size Photo', status: 'pending', file: null, date: null },
  { id: 'recommendation', name: 'Recommendation Letter', status: 'pending', file: null, date: null },
];

const ADMISSION_STEPS_INFO = [
  { id: 1, label: 'Pre-Registration', icon: 'how_to_reg', desc: 'Basic info & program selection' },
  { id: 2, label: 'Full Application', icon: 'description', desc: 'Complete admission form' },
  { id: 3, label: 'Fee Payment', icon: 'payments', desc: 'Pay admission fee' },
  { id: 4, label: 'Registration', icon: 'check_circle', desc: 'Confirm & get student ID' },
];

// ── Main Component ─────────────────────────────────────────────────
export const OnlineAdmitPage = () => {
  const navigate = useNavigate();
  useEffect(() => { window.scrollTo(0, 0); }, []);

  const savedDraft = JSON.parse(localStorage.getItem('preregisterDraft') || '{}');
  const fullFormSubmitted = localStorage.getItem('fullFormSubmitted') === 'yes';
  const paymentDone = localStorage.getItem('paymentStatus') === 'completed';
  const studentId = localStorage.getItem('studentId') || '';
  const registrationEmail = localStorage.getItem('registrationEmail') || '';
  const appId = localStorage.getItem('applicationId') || 'DIU-2025-' + Math.floor(Math.random() * 9000 + 1000);

  useEffect(() => { if (!localStorage.getItem('applicationId')) localStorage.setItem('applicationId', appId); }, [appId]);

  // ── Registration Form State ──
  const [step, setStep] = useState(1);

  // Step 1: Personal Info
  const [personal, setPersonal] = useState({
    fullName: savedDraft.fullName || '',
    fullNameBn: '',
    fatherName: '', fatherOccupation: '',
    motherName: '', motherOccupation: '',
    dob: '',
    gender: '',
    nationality: 'Bangladeshi',
    religion: '',
    bloodGroup: localStorage.getItem('bloodGroup') || '',
    nidNo: '',
    phone: savedDraft.contactNumber || '',
    email: savedDraft.email || '',
  });

  // Step 2: Address
  const [address, setAddress] = useState({
    presentHouse: '', presentRoad: '', presentThana: '', presentDistrict: '',
    presentDivision: '', presentPostCode: '',
    sameAsPermanent: false,
    permanentHouse: '', permanentRoad: '', permanentThana: '', permanentDistrict: '',
    permanentDivision: '', permanentPostCode: '',
  });

  // Step 3: Academic
  const [academic, setAcademic] = useState({
    sscInstitute: '', sscBoard: '', sscRoll: '', sscReg: '', sscYear: '', sscGroup: '', sscGpa: '',
    hscInstitute: '', hscBoard: '', hscRoll: '', hscReg: '', hscYear: '', hscGroup: '', hscGpa: '',
    otherQual: '',
  });

  // Step 4: Program & Docs
  const [program, setProgram] = useState({
    programName: savedDraft.selectedProgram || '',
    semester: SEMESTERS[0],
    waiverType: '',
  });
  const [uploadedDocs, setUploadedDocs] = useState({});
  const [profilePhoto, setProfilePhoto] = useState(localStorage.getItem('profilePhoto') || '');
  const [declaration, setDeclaration] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const photoRef = useRef(null);

  // ── Dashboard document vault state ──
  const [dashDocs, setDashDocs] = useState(() => {
    const saved = localStorage.getItem('uploadedDocs');
    return saved ? JSON.parse(saved) : DEFAULT_DASH_DOCS;
  });
  const [uploadingId, setUploadingId] = useState(null);
  const dashFileRef = useRef(null);
  const [dashTarget, setDashTarget] = useState(null);

  const inp = "w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all";
  const sel = inp + " cursor-pointer";
  const lbl = "text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5";

  const setP = (key, val) => setPersonal(p => ({ ...p, [key]: val }));
  const setA = (key, val) => setAddress(a => ({ ...a, [key]: val }));
  const setAc = (key, val) => setAcademic(a => ({ ...a, [key]: val }));

  const handleSameAddress = (checked) => {
    setAddress(a => ({
      ...a, sameAsPermanent: checked,
      permanentHouse: checked ? a.presentHouse : a.permanentHouse,
      permanentRoad: checked ? a.presentRoad : a.permanentRoad,
      permanentThana: checked ? a.presentThana : a.permanentThana,
      permanentDistrict: checked ? a.presentDistrict : a.permanentDistrict,
      permanentDivision: checked ? a.presentDivision : a.permanentDivision,
      permanentPostCode: checked ? a.presentPostCode : a.permanentPostCode,
    }));
  };

  const validate1 = () => {
    if (!personal.fullName.trim()) { toast.error('Full name required'); return false; }
    if (!personal.fatherName.trim()) { toast.error("Father's name required"); return false; }
    if (!personal.motherName.trim()) { toast.error("Mother's name required"); return false; }
    if (!personal.dob) { toast.error('Date of birth required'); return false; }
    if (!personal.gender) { toast.error('Gender required'); return false; }
    if (!personal.phone.trim()) { toast.error('Phone number required'); return false; }
    if (!personal.email.trim()) { toast.error('Email required'); return false; }
    return true;
  };

  const validate2 = () => {
    if (!address.presentDistrict.trim()) { toast.error('Present district required'); return false; }
    if (!address.presentDivision) { toast.error('Present division required'); return false; }
    return true;
  };

  const validate3 = () => {
    if (!academic.sscBoard || !academic.sscYear || !academic.sscGroup || !academic.sscGpa) { toast.error('Complete SSC information required'); return false; }
    if (!academic.hscBoard || !academic.hscYear || !academic.hscGroup || !academic.hscGpa) { toast.error('Complete HSC information required'); return false; }
    return true;
  };

  const validate4 = () => {
    if (!program.programName.trim()) { toast.error('Please specify a program'); return false; }
    const required = ADMISSION_DOCS.filter(d => d.required);
    const missing = required.filter(d => !uploadedDocs[d.id]);
    if (missing.length > 0) { toast.error(`Upload required: ${missing[0].label}`); return false; }
    if (!declaration) { toast.error('Please accept the declaration to proceed'); return false; }
    return true;
  };

  const handleFullFormSubmit = async () => {
    if (!validate4()) return;
    setSubmitting(true);
    try {
      // Build backend payload
      const payload = {
        fullName:      personal.fullName,
        email:         personal.email || savedDraft.email || '',
        dateOfBirth:   personal.dob,
        contactNumber: personal.phone,
        program:       program.programName,
        major:         program.major || '',
        sscResult:     academic.sscGpa,
        sscGroup:      academic.sscGroup,
        sscBoard:      academic.sscBoard,
        sscYear:       academic.sscYear,
        sscMarksheet:  uploadedDocs['ssc_marksheet'] ? 'uploaded' : '',
        hscResult:     academic.hscGpa,
        hscGroup:      academic.hscGroup,
        hscBoard:      academic.hscBoard,
        hscYear:       academic.hscYear,
        hscMarksheet:  uploadedDocs['hsc_marksheet'] ? 'uploaded' : '',
        essayOne:      program.essayOne || '',
        essayTwo:      program.essayTwo || '',
      };

      let backendAppId = null;
      try {
        const res = await fetch(`${API_CONFIG.BASE_URL}/v1/admission/submit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data?.data?.appId) {
          backendAppId = data.data.appId;
          localStorage.setItem('applicationId', backendAppId);
          if (data.data.admissionDate) localStorage.setItem('admissionDate', data.data.admissionDate);
          if (data.data.vivaDate)      localStorage.setItem('vivaDate',      data.data.vivaDate);
        }
      } catch {
        // Backend unavailable — continue with local ID
      }

      const formData = { personal, address, academic, program, uploadedDocs };
      localStorage.setItem('fullFormData', JSON.stringify(formData));
      localStorage.setItem('fullFormSubmitted', 'yes');
      localStorage.setItem('bloodGroup', personal.bloodGroup);
      localStorage.setItem('profilePhoto', profilePhoto);
      toast.success('Application submitted! Proceeding to payment…');
      setTimeout(() => navigate('/admission/payment'), 800);
    } catch (err) {
      toast.error('Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Load chatbot-collected data if available
  useEffect(() => {
    const chatbotData = JSON.parse(localStorage.getItem('chatbot_admit_data') || 'null');
    if (chatbotData) {
      setPersonal(prev => ({
        ...prev,
        fullName:    chatbotData.fullName    || prev.fullName,
        fatherName:  chatbotData.fatherName  || '',
        motherName:  chatbotData.motherName  || '',
        dob:         chatbotData.dob         || '',
        gender:      chatbotData.gender      || '',
        phone:       chatbotData.phone       || prev.phone,
        email:       chatbotData.email       || prev.email,
      }));
      setAddress(prev => ({
        ...prev,
        presentDistrict: chatbotData.presentDistrict || '',
        presentDivision: chatbotData.presentDivision || '',
      }));
      setAcademic(prev => ({
        ...prev,
        sscBoard: chatbotData.sscBoard || '',
        sscYear:  chatbotData.sscYear  || '',
        sscGroup: chatbotData.sscGroup || '',
        sscGpa:   chatbotData.sscGpa   || '',
        hscBoard: chatbotData.hscBoard || '',
        hscYear:  chatbotData.hscYear  || '',
        hscGroup: chatbotData.hscGroup || '',
        hscGpa:   chatbotData.hscGpa   || '',
      }));
      setProgram(prev => ({
        ...prev,
        programName: chatbotData.programName || prev.programName,
      }));
      localStorage.removeItem('chatbot_admit_data');
      toast.success('Form pre-filled by AI Assistant! Upload documents to complete.', { icon: '🤖' });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Dashboard handlers ──
  const triggerDashUpload = (docId) => { setDashTarget(docId); dashFileRef.current.click(); };
  const handleDashFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Max 5MB'); e.target.value = ''; return; }
    setUploadingId(dashTarget);
    setTimeout(() => {
      const today = new Date();
      const dateStr = `${today.toLocaleString('default', { month: 'short' })} ${today.getDate()}`;
      setDashDocs(prev => {
        const updated = prev.map(d => d.id === dashTarget ? { ...d, status: 'verified', file: file.name, date: dateStr } : d);
        localStorage.setItem('uploadedDocs', JSON.stringify(updated));
        return updated;
      });
      toast.success(`${file.name} uploaded!`);
      setUploadingId(null);
    }, 1200);
    e.target.value = '';
  };

  const verifiedCount = dashDocs.filter(d => d.status === 'verified').length;

  const handleDownloadOfferLetter = () => {
    const userName = personal.fullName || savedDraft.fullName || 'Student';
    const progName = program.programName || savedDraft.selectedProgram || 'Selected Program';
    const content = `DAFFODIL INTERNATIONAL UNIVERSITY\n=====================================\n         PROVISIONAL OFFER LETTER\n=====================================\n\nDear ${userName},\n\nYour application has been provisionally accepted.\n\n  App ID   : ${appId}\n  Program  : ${progName}\n  Email    : ${personal.email || savedDraft.email}\n  Status   : Provisionally Accepted\n  Semester : Spring 2025\n\nPlease complete payment to confirm enrollment.\n\nDIU Admission Office\nadmission@diu.edu.bd\n`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `DIU-OfferLetter-${appId}.txt`; a.click();
    URL.revokeObjectURL(url);
    toast.success('Offer letter downloaded!');
  };

  // ──────────────────────────────────────────────────────────────────
  // RENDER: Show Dashboard if full form submitted, otherwise show form
  // ──────────────────────────────────────────────────────────────────

  if (fullFormSubmitted) {
    // ── DASHBOARD ──
    const userName = JSON.parse(localStorage.getItem('fullFormData') || '{}')?.personal?.fullName || savedDraft.fullName || 'Student';
    const currentStep = studentId ? 4 : paymentDone ? 4 : 3;

    return (
      <div className="min-h-screen bg-surface">
        <Navigation />
        <input ref={dashFileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleDashFile} />
        <main className="pt-28 pb-20 px-4 md:px-8 max-w-7xl mx-auto">

          {/* Hero */}
          <section className="mb-10">
            <span className="text-primary font-extrabold tracking-widest text-xs uppercase mb-2 block">Online Admission Portal</span>
            <h1 className="font-headline text-4xl md:text-5xl font-extrabold text-on-surface leading-tight tracking-tighter">
              Welcome, <span className="text-primary">{userName}</span>
            </h1>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="text-xs font-mono bg-primary/10 text-primary px-3 py-1 rounded-full font-bold">{appId}</span>
              {registrationEmail && <span className="text-xs font-mono bg-green-100 text-green-700 px-3 py-1 rounded-full font-bold">{registrationEmail}</span>}
            </div>
          </section>

          {/* Admission Steps */}
          <section className="mb-10 bg-surface-container-low rounded-2xl p-6 border border-outline-variant/30">
            <h2 className="font-headline text-lg font-bold mb-5 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">route</span>Admission Progress
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {ADMISSION_STEPS_INFO.map(s => {
                const done = currentStep >= s.id;
                const active = currentStep === s.id;
                return (
                  <div key={s.id} className={`relative flex flex-col items-center text-center p-4 rounded-xl border transition-all ${done && !active ? 'bg-primary/10 border-primary/20' : active ? 'bg-primary text-white border-primary shadow-lg' : 'bg-surface-container border-outline-variant/20 opacity-50'}`}>
                    {done && !active && (
                      <div className="absolute -top-2 -right-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center shadow">
                        <span className="material-symbols-outlined text-white" style={{ fontSize: 11 }}>check</span>
                      </div>
                    )}
                    <span className={`material-symbols-outlined text-2xl mb-1.5 ${active ? 'text-white' : done ? 'text-primary' : 'text-on-surface-variant'}`} style={{ fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
                    <p className={`text-[11px] font-bold leading-tight ${active ? 'text-white' : done ? 'text-primary' : 'text-on-surface-variant'}`}>{s.label}</p>
                    <p className={`text-[9px] mt-0.5 hidden md:block ${active ? 'text-white/80' : 'text-on-surface-variant'}`}>{s.desc}</p>
                  </div>
                );
              })}
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left */}
            <div className="lg:col-span-8 space-y-8">

              {/* Payment CTA or Success */}
              {!paymentDone ? (
                <div className="bg-gradient-to-r from-primary to-blue-700 rounded-xl p-6 text-white relative overflow-hidden">
                  <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-white/10 rounded-full" />
                  <div className="relative z-10 flex items-start gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-headline font-bold text-xl mb-1">Admission Fee Payment Required</h3>
                      <p className="text-white/80 text-sm mb-3">Pay via bKash, Nagad, 1Card, Visa or MasterCard.</p>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {['bKash', 'Nagad', '1Card', 'Visa', 'MasterCard'].map(m => (
                          <span key={m} className="text-[11px] font-bold bg-white/20 px-2 py-0.5 rounded">{m}</span>
                        ))}
                      </div>
                      <button onClick={() => navigate('/admission/payment')}
                        className="bg-white text-primary font-extrabold px-6 py-2.5 rounded-xl hover:bg-white/90 transition-all flex items-center gap-2 shadow-lg">
                        <span className="material-symbols-outlined">credit_card</span>Pay Admission Fee Now
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-green-500 rounded-xl text-white flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    </div>
                    <div>
                      <h3 className="font-headline font-bold text-lg text-green-800">Payment Confirmed!</h3>
                      <p className="text-green-700 text-sm">Admission fee processed successfully.</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => navigate('/admission/confirmation')} className="bg-green-600 text-white font-bold px-4 py-2 rounded-xl text-sm flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">assignment_turned_in</span>View Registration
                    </button>
                    {studentId && (
                      <button onClick={() => navigate('/admission/id-card')} className="bg-primary text-white font-bold px-4 py-2 rounded-xl text-sm flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">badge</span>Student ID Card
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Download cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="bg-surface-container rounded-xl p-5 border border-outline-variant/20 hover:border-primary/40 transition-all">
                  <div className="flex justify-between items-start mb-3">
                    <div className="p-2.5 rounded-lg bg-primary/10 text-primary"><span className="material-symbols-outlined text-2xl">description</span></div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded">Available</span>
                  </div>
                  <h3 className="font-headline font-bold text-base mb-1">Provisional Offer Letter</h3>
                  <p className="text-on-surface-variant text-xs mb-3">Official conditional acceptance — Spring 2025.</p>
                  <button onClick={handleDownloadOfferLetter} className="w-full flex items-center justify-center gap-2 py-2 bg-on-surface text-surface rounded-lg font-bold text-sm hover:bg-primary transition-all">
                    <span className="material-symbols-outlined text-sm">download</span>Download
                  </button>
                </div>
                <div className="bg-surface-container rounded-xl p-5 border border-outline-variant/20">
                  <div className="flex justify-between items-start mb-3">
                    <div className={`p-2.5 rounded-lg ${studentId ? 'bg-primary/10 text-primary' : 'bg-surface-container-highest text-on-surface-variant'}`}>
                      <span className="material-symbols-outlined text-2xl">badge</span>
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${studentId ? 'text-primary bg-primary/10' : 'text-on-surface-variant bg-surface-container-highest'}`}>
                      {studentId ? 'Available' : 'Locked'}
                    </span>
                  </div>
                  <h3 className="font-headline font-bold text-base mb-1">Student ID Card</h3>
                  <p className="text-on-surface-variant text-xs mb-3">Smart student ID for campus access.</p>
                  <button onClick={() => studentId ? navigate('/admission/id-card') : toast.warn('Complete payment to unlock')}
                    className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg font-bold text-sm transition-all ${studentId ? 'bg-on-surface text-surface hover:bg-primary' : 'bg-surface-container-highest text-on-surface-variant/50 cursor-not-allowed'}`}>
                    <span className="material-symbols-outlined text-sm">{studentId ? 'open_in_new' : 'lock'}</span>
                    {studentId ? 'View ID Card' : 'Unlock After Payment'}
                  </button>
                </div>
              </div>
            </div>

            {/* Right */}
            <div className="lg:col-span-4 space-y-6">
              {/* Document Vault */}
              <div className="bg-surface-container-highest rounded-xl p-5 border border-outline-variant/40">
                <h3 className="font-headline text-base font-bold mb-1">Document Vault</h3>
                <p className="text-xs text-on-surface-variant mb-4">({verifiedCount}/{dashDocs.length} uploaded)</p>
                <div className="space-y-2.5">
                  {dashDocs.map(doc => (
                    <div key={doc.id} className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${doc.status === 'verified' ? 'bg-surface-container-lowest border-outline-variant/20' : 'bg-surface-container-lowest border-2 border-dashed border-primary/30'}`}>
                      {uploadingId === doc.id ? (
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin flex-shrink-0" />
                      ) : (
                        <span className={`material-symbols-outlined flex-shrink-0 text-lg ${doc.status === 'verified' ? 'text-green-500' : 'text-primary'}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                          {doc.status === 'verified' ? 'check_circle' : 'cloud_upload'}
                        </span>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate">{doc.name}</p>
                        <p className={`text-[10px] truncate ${doc.status === 'verified' ? 'text-green-600' : 'text-primary font-bold'}`}>
                          {doc.status === 'verified' ? `Uploaded ${doc.date}` : 'Required'}
                        </p>
                      </div>
                      <button onClick={() => doc.status === 'pending' ? triggerDashUpload(doc.id) : toast.info('Already verified')} disabled={uploadingId === doc.id} className="text-on-surface-variant hover:text-primary transition-colors">
                        <span className="material-symbols-outlined text-sm">{doc.status === 'pending' ? 'add' : 'visibility'}</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Profile */}
              <div className="bg-surface-container-low rounded-xl p-5 border border-outline-variant/30">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-base border-4 border-white shadow">
                    {userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">{userName}</h4>
                    {studentId ? <p className="text-xs font-mono text-primary font-bold">{studentId}</p> : <p className="text-xs text-on-surface-variant">{appId}</p>}
                    {registrationEmail && <p className="text-[10px] text-on-surface-variant truncate max-w-[160px]">{registrationEmail}</p>}
                  </div>
                </div>
                <div className="space-y-1.5">
                  {[
                    { label: 'Edit Form', icon: 'edit', action: () => { localStorage.removeItem('fullFormSubmitted'); window.location.reload(); } },
                    { label: 'Contact Admissions', icon: 'mail', action: () => { window.location.href = 'mailto:admission@diu.edu.bd'; } },
                    ...(studentId ? [{ label: 'View ID Card', icon: 'badge', action: () => navigate('/admission/id-card') }] : []),
                    { label: 'Withdraw Application', icon: 'cancel', danger: true, action: () => {
                      if (window.confirm('Withdraw your application?')) {
                        ['applicationId','uploadedDocs','preregisterDraft','paymentStatus','studentId','registrationEmail','bloodGroup','profilePhoto','idCardIssuedOn','idCardExpiresOn','fullFormSubmitted','fullFormData','appFeePaid'].forEach(k => localStorage.removeItem(k));
                        toast.success('Application withdrawn.'); setTimeout(() => navigate('/'), 1500);
                      }
                    }},
                  ].map((a, i) => (
                    <button key={i} onClick={a.action} className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between text-xs font-semibold group transition-all border border-transparent ${a.danger ? 'text-red-600 hover:bg-red-50 hover:border-red-200' : 'text-on-surface hover:bg-primary/5 hover:border-primary/20'}`}>
                      {a.label}
                      <span className="material-symbols-outlined text-xs group-hover:translate-x-0.5 transition-transform">{a.icon}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Help */}
              <div className="bg-primary/5 rounded-xl p-4 border border-primary/20 text-xs space-y-1">
                <p className="font-bold text-on-surface flex items-center gap-1.5"><span className="material-symbols-outlined text-primary text-sm">support_agent</span>Need Help?</p>
                <p className="text-on-surface-variant">📞 09617-000340</p>
                <p className="text-on-surface-variant">✉ admission@diu.edu.bd</p>
                <p className="text-on-surface-variant">🕒 Sun–Thu, 9 AM – 5 PM</p>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────
  // REGISTRATION FORM
  // ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      <main className="pt-28 pb-20 px-4 max-w-5xl mx-auto">

        {/* Header */}
        <header className="mb-10">
          <span className="text-primary font-extrabold tracking-widest text-xs uppercase mb-2 block">Online Admission Portal</span>
          <h1 className="text-4xl md:text-5xl font-headline font-extrabold tracking-tighter text-slate-900 leading-tight mb-2">
            Admission <span className="text-primary">Registration Form</span>
          </h1>
          <p className="text-slate-500 max-w-xl text-sm leading-relaxed">
            Complete all sections of this form accurately. Information must match your academic certificates.
          </p>
          {appId && (
            <div className="mt-3 inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-xs font-bold">
              <span className="material-symbols-outlined text-sm">badge</span>
              Application ID: {appId}
            </div>
          )}
        </header>

        <Stepper current={step} steps={['Personal Info', 'Address', 'Academic', 'Documents']} />

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">

          {/* ═══════════════════════════════════════
              STEP 1 — Personal Information
          ═══════════════════════════════════════ */}
          {step === 1 && (
            <div className="space-y-7">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <span className="material-symbols-outlined text-primary">person</span>
                <h2 className="text-xl font-headline font-bold text-slate-900">Applicant's Personal Information</h2>
              </div>

              {/* Photo Upload */}
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                <div>
                  <label className={lbl}>Passport Photo *</label>
                  <div onClick={() => photoRef.current.click()}
                    className="w-28 h-32 rounded-xl overflow-hidden border-2 border-dashed border-primary/40 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-all bg-slate-50">
                    {profilePhoto ? (
                      <img src={profilePhoto} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-slate-400 text-3xl">add_a_photo</span>
                        <span className="text-[10px] text-slate-400 mt-1 text-center px-2">Click to upload</span>
                      </>
                    )}
                  </div>
                  <input ref={photoRef} type="file" accept="image/*" className="hidden"
                    onChange={e => {
                      const f = e.target.files[0];
                      if (f) { const r = new FileReader(); r.onloadend = () => setProfilePhoto(r.result); r.readAsDataURL(f); }
                      e.target.value = '';
                    }} />
                  <p className="text-[10px] text-slate-400 mt-1 max-w-[112px]">White bg, clear face, JPG/PNG &lt;2MB</p>
                </div>

                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className={lbl}>Full Name (English) *</label>
                    <input className={inp} placeholder="As per SSC/HSC certificate" value={personal.fullName} onChange={e => setP('fullName', e.target.value)} />
                  </div>
                  <div className="md:col-span-2">
                    <label className={lbl}>Full Name (বাংলা)</label>
                    <input className={inp} placeholder="বাংলায় নাম লিখুন" value={personal.fullNameBn} onChange={e => setP('fullNameBn', e.target.value)} />
                  </div>
                </div>
              </div>

              {/* Parents */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={lbl}>Father's Name *</label>
                  <input className={inp} placeholder="Father's full name" value={personal.fatherName} onChange={e => setP('fatherName', e.target.value)} />
                </div>
                <div>
                  <label className={lbl}>Father's Occupation</label>
                  <input className={inp} placeholder="e.g. Business, Govt. Service" value={personal.fatherOccupation} onChange={e => setP('fatherOccupation', e.target.value)} />
                </div>
                <div>
                  <label className={lbl}>Mother's Name *</label>
                  <input className={inp} placeholder="Mother's full name" value={personal.motherName} onChange={e => setP('motherName', e.target.value)} />
                </div>
                <div>
                  <label className={lbl}>Mother's Occupation</label>
                  <input className={inp} placeholder="e.g. Housewife, Teacher" value={personal.motherOccupation} onChange={e => setP('motherOccupation', e.target.value)} />
                </div>
              </div>

              {/* Personal details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={lbl}>Date of Birth *</label>
                  <input type="date" className={inp} value={personal.dob} onChange={e => setP('dob', e.target.value)} />
                </div>
                <div>
                  <label className={lbl}>Gender *</label>
                  <select className={sel} value={personal.gender} onChange={e => setP('gender', e.target.value)}>
                    <option value="">Select</option>
                    {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className={lbl}>Blood Group</label>
                  <select className={sel} value={personal.bloodGroup} onChange={e => setP('bloodGroup', e.target.value)}>
                    <option value="">Select</option>
                    {BLOOD_GROUPS.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className={lbl}>Nationality *</label>
                  <select className={sel} value={personal.nationality} onChange={e => setP('nationality', e.target.value)}>
                    {NATIONALITIES.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div>
                  <label className={lbl}>Religion</label>
                  <select className={sel} value={personal.religion} onChange={e => setP('religion', e.target.value)}>
                    <option value="">Select</option>
                    {RELIGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className={lbl}>NID / Birth Certificate No.</label>
                  <input className={inp} placeholder="10 or 17 digit NID" value={personal.nidNo} onChange={e => setP('nidNo', e.target.value)} />
                </div>
              </div>

              {/* Contact */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={lbl}>Mobile Number *</label>
                  <div className="flex">
                    <span className="bg-slate-100 border border-slate-200 border-r-0 rounded-l-xl px-3 flex items-center text-slate-500 text-sm font-semibold">+880</span>
                    <input type="tel" placeholder="01XXXXXXXXX" className={inp + ' !rounded-l-none'} value={personal.phone} onChange={e => setP('phone', e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className={lbl}>Email Address *</label>
                  <input type="email" placeholder="example@email.com" className={inp} value={personal.email} onChange={e => setP('email', e.target.value)} />
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button onClick={() => { if (validate1()) { setStep(2); window.scrollTo(0, 0); } }}
                  className="bg-primary text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
                  Next: Address <span className="material-symbols-outlined">arrow_forward</span>
                </button>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════
              STEP 2 — Address
          ═══════════════════════════════════════ */}
          {step === 2 && (
            <div className="space-y-7">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <span className="material-symbols-outlined text-primary">location_on</span>
                <h2 className="text-xl font-headline font-bold text-slate-900">Address Information</h2>
              </div>

              {/* Present Address */}
              <div>
                <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">P</span>
                  Present Address
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={lbl}>House / Flat No. & Road</label>
                    <input className={inp} placeholder="House #12, Road #5" value={address.presentHouse} onChange={e => setA('presentHouse', e.target.value)} />
                  </div>
                  <div>
                    <label className={lbl}>Thana / Upazila</label>
                    <input className={inp} placeholder="e.g. Dhanmondi" value={address.presentThana} onChange={e => setA('presentThana', e.target.value)} />
                  </div>
                  <div>
                    <label className={lbl}>District *</label>
                    <input className={inp} placeholder="e.g. Dhaka" value={address.presentDistrict} onChange={e => setA('presentDistrict', e.target.value)} />
                  </div>
                  <div>
                    <label className={lbl}>Division *</label>
                    <select className={sel} value={address.presentDivision} onChange={e => setA('presentDivision', e.target.value)}>
                      <option value="">Select Division</option>
                      {DIVISIONS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={lbl}>Post / ZIP Code</label>
                    <input className={inp} placeholder="e.g. 1209" value={address.presentPostCode} onChange={e => setA('presentPostCode', e.target.value)} />
                  </div>
                </div>
              </div>

              {/* Same as present */}
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${address.sameAsPermanent ? 'bg-primary border-primary' : 'border-slate-300 group-hover:border-primary'}`}
                  onClick={() => handleSameAddress(!address.sameAsPermanent)}>
                  {address.sameAsPermanent && <span className="material-symbols-outlined text-white text-sm">check</span>}
                </div>
                <span className="text-sm font-semibold text-slate-700">Permanent address is same as present address</span>
              </label>

              {/* Permanent Address */}
              {!address.sameAsPermanent && (
                <div>
                  <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-bold">H</span>
                    Permanent / Home Address
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={lbl}>House / Flat No. & Road</label>
                      <input className={inp} placeholder="House #, Village" value={address.permanentHouse} onChange={e => setA('permanentHouse', e.target.value)} />
                    </div>
                    <div>
                      <label className={lbl}>Thana / Upazila</label>
                      <input className={inp} placeholder="Thana name" value={address.permanentThana} onChange={e => setA('permanentThana', e.target.value)} />
                    </div>
                    <div>
                      <label className={lbl}>District</label>
                      <input className={inp} placeholder="District" value={address.permanentDistrict} onChange={e => setA('permanentDistrict', e.target.value)} />
                    </div>
                    <div>
                      <label className={lbl}>Division</label>
                      <select className={sel} value={address.permanentDivision} onChange={e => setA('permanentDivision', e.target.value)}>
                        <option value="">Select Division</option>
                        {DIVISIONS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={lbl}>Post / ZIP Code</label>
                      <input className={inp} placeholder="Post code" value={address.permanentPostCode} onChange={e => setA('permanentPostCode', e.target.value)} />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-4 border-t border-slate-100">
                <button onClick={() => setStep(1)} className="text-slate-400 font-semibold hover:text-primary text-sm flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">arrow_back</span>Back
                </button>
                <button onClick={() => { if (validate2()) { setStep(3); window.scrollTo(0, 0); } }}
                  className="bg-primary text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
                  Next: Academic <span className="material-symbols-outlined">arrow_forward</span>
                </button>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════
              STEP 3 — Academic Information
          ═══════════════════════════════════════ */}
          {step === 3 && (
            <div className="space-y-7">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <span className="material-symbols-outlined text-primary">school</span>
                <h2 className="text-xl font-headline font-bold text-slate-900">Academic Qualifications</h2>
              </div>

              {/* SSC */}
              <div className="border border-slate-200 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                    <span className="text-[10px] font-black text-primary">SSC</span>
                  </div>
                  <h3 className="font-bold text-slate-800">S.S.C / O-Level Examination</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-3">
                  <div>
                    <label className={lbl}>Institute Name</label>
                    <input className={inp} placeholder="School name" value={academic.sscInstitute} onChange={e => setAc('sscInstitute', e.target.value)} />
                  </div>
                  <div>
                    <label className={lbl}>Board *</label>
                    <select className={sel} value={academic.sscBoard} onChange={e => setAc('sscBoard', e.target.value)}>
                      <option value="">Select Board</option>
                      {BOARDS.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={lbl}>Group *</label>
                    <select className={sel} value={academic.sscGroup} onChange={e => setAc('sscGroup', e.target.value)}>
                      <option value="">Select</option>
                      {GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={lbl}>Roll Number</label>
                    <input className={inp} placeholder="Roll No." value={academic.sscRoll} onChange={e => setAc('sscRoll', e.target.value)} />
                  </div>
                  <div>
                    <label className={lbl}>Registration No.</label>
                    <input className={inp} placeholder="Registration No." value={academic.sscReg} onChange={e => setAc('sscReg', e.target.value)} />
                  </div>
                  <div>
                    <label className={lbl}>Passing Year *</label>
                    <select className={sel} value={academic.sscYear} onChange={e => setAc('sscYear', e.target.value)}>
                      <option value="">Year</option>
                      {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={lbl}>GPA (out of 5.00) *</label>
                    <input type="number" min="1" max="5" step="0.01" placeholder="e.g. 4.50" className={inp} value={academic.sscGpa} onChange={e => setAc('sscGpa', e.target.value)} />
                  </div>
                </div>
              </div>

              {/* HSC */}
              <div className="border border-slate-200 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <span className="text-[10px] font-black text-indigo-700">HSC</span>
                  </div>
                  <h3 className="font-bold text-slate-800">H.S.C / A-Level Examination</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className={lbl}>Institute Name</label>
                    <input className={inp} placeholder="College name" value={academic.hscInstitute} onChange={e => setAc('hscInstitute', e.target.value)} />
                  </div>
                  <div>
                    <label className={lbl}>Board *</label>
                    <select className={sel} value={academic.hscBoard} onChange={e => setAc('hscBoard', e.target.value)}>
                      <option value="">Select Board</option>
                      {BOARDS.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={lbl}>Group *</label>
                    <select className={sel} value={academic.hscGroup} onChange={e => setAc('hscGroup', e.target.value)}>
                      <option value="">Select</option>
                      {GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={lbl}>Roll Number</label>
                    <input className={inp} placeholder="Roll No." value={academic.hscRoll} onChange={e => setAc('hscRoll', e.target.value)} />
                  </div>
                  <div>
                    <label className={lbl}>Registration No.</label>
                    <input className={inp} placeholder="Registration No." value={academic.hscReg} onChange={e => setAc('hscReg', e.target.value)} />
                  </div>
                  <div>
                    <label className={lbl}>Passing Year *</label>
                    <select className={sel} value={academic.hscYear} onChange={e => setAc('hscYear', e.target.value)}>
                      <option value="">Year</option>
                      {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={lbl}>GPA (out of 5.00) *</label>
                    <input type="number" min="1" max="5" step="0.01" placeholder="e.g. 4.50" className={inp} value={academic.hscGpa} onChange={e => setAc('hscGpa', e.target.value)} />
                  </div>
                </div>
              </div>

              {/* Other qualification */}
              <div>
                <label className={lbl}>Other Qualification / Diploma (if any)</label>
                <input className={inp} placeholder="e.g. Diploma in Textile, O-Level (2019)" value={academic.otherQual} onChange={e => setAc('otherQual', e.target.value)} />
              </div>

              <div className="flex justify-between pt-4 border-t border-slate-100">
                <button onClick={() => setStep(2)} className="text-slate-400 font-semibold hover:text-primary text-sm flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">arrow_back</span>Back
                </button>
                <button onClick={() => { if (validate3()) { setStep(4); window.scrollTo(0, 0); } }}
                  className="bg-primary text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
                  Next: Documents <span className="material-symbols-outlined">arrow_forward</span>
                </button>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════
              STEP 4 — Program, Documents & Submit
          ═══════════════════════════════════════ */}
          {step === 4 && (
            <div className="space-y-7">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <span className="material-symbols-outlined text-primary">folder_open</span>
                <h2 className="text-xl font-headline font-bold text-slate-900">Program Details & Documents</h2>
              </div>

              {/* Program */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className={lbl}>Applied Program *</label>
                  <input className={inp} placeholder="e.g. Computer Science and Engineering (CSE)" value={program.programName} onChange={e => setProgram(p => ({ ...p, programName: e.target.value }))} />
                </div>
                <div>
                  <label className={lbl}>Semester *</label>
                  <select className={sel} value={program.semester} onChange={e => setProgram(p => ({ ...p, semester: e.target.value }))}>
                    {SEMESTERS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className={lbl}>Waiver / Scholarship (if applicable)</label>
                  <select className={sel} value={program.waiverType} onChange={e => setProgram(p => ({ ...p, waiverType: e.target.value }))}>
                    <option value="">None / Not Applicable</option>
                    <option value="merit">Merit Waiver (GPA based)</option>
                    <option value="freedom_fighter">Freedom Fighter Quota</option>
                    <option value="sibling">Sibling Concession</option>
                    <option value="sports">Sports Quota</option>
                  </select>
                </div>
              </div>

              {/* Document uploads */}
              <div>
                <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider mb-3">Required Documents</h3>
                <div className="space-y-2.5">
                  {ADMISSION_DOCS.map(doc => (
                    <DocUploadRow key={doc.id} doc={doc} uploaded={uploadedDocs[doc.id] || null}
                      onUpload={(id, name) => setUploadedDocs(prev => ({ ...prev, [id]: name }))} />
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-2">* Mandatory documents. Other documents optional but recommended.</p>
              </div>

              {/* Declaration */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
                <h3 className="font-bold text-slate-800 mb-3 text-sm">Declaration / প্রত্যয়ন</h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  I, the undersigned, hereby declare that all the information furnished above is true and correct to the best of my knowledge. I understand that if any information provided is found to be false, my admission is liable to be cancelled. I agree to abide by all rules and regulations of Daffodil International University.
                </p>
                <p className="text-xs text-slate-500 italic mb-4">
                  আমি ঘোষণা করিতেছি যে, উপরে প্রদত্ত সকল তথ্য আমার জ্ঞান ও বিশ্বাস মতে সত্য ও সঠিক। কোনো তথ্য মিথ্যা প্রমাণিত হইলে আমার ভর্তি বাতিল হইতে পারে।
                </p>
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className={`w-5 h-5 rounded border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-all ${declaration ? 'bg-primary border-primary' : 'border-slate-300 group-hover:border-primary'}`}
                    onClick={() => setDeclaration(d => !d)}>
                    {declaration && <span className="material-symbols-outlined text-white text-sm">check</span>}
                  </div>
                  <span className="text-sm font-semibold text-slate-700">
                    I confirm that all information provided is accurate and I accept the terms and conditions of Daffodil International University. *
                  </span>
                </label>
              </div>

              {/* Summary preview */}
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-sm">
                <p className="font-bold text-primary mb-2 text-xs uppercase tracking-wider">Application Summary</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-slate-500">Name:</span> <span className="font-semibold">{personal.fullName}</span></div>
                  <div><span className="text-slate-500">Phone:</span> <span className="font-semibold">+880 {personal.phone}</span></div>
                  <div><span className="text-slate-500">Program:</span> <span className="font-semibold">{program.programName}</span></div>
                  <div><span className="text-slate-500">Semester:</span> <span className="font-semibold">{program.semester}</span></div>
                  <div><span className="text-slate-500">SSC GPA:</span> <span className="font-semibold">{academic.sscGpa}</span></div>
                  <div><span className="text-slate-500">HSC GPA:</span> <span className="font-semibold">{academic.hscGpa}</span></div>
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t border-slate-100">
                <button onClick={() => setStep(3)} className="text-slate-400 font-semibold hover:text-primary text-sm flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">arrow_back</span>Back
                </button>
                <button onClick={handleFullFormSubmit} disabled={submitting}
                  className="bg-primary text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50">
                  {submitting
                    ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Submitting…</>
                    : <><span className="material-symbols-outlined">send</span> Submit & Proceed to Payment</>
                  }
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Side help */}
        <div className="mt-6 bg-white border border-slate-200 rounded-2xl p-5 flex flex-col md:flex-row gap-4 text-sm">
          <div className="flex items-start gap-3 flex-1">
            <span className="material-symbols-outlined text-amber-500 flex-shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
            <div>
              <p className="font-bold text-slate-800 mb-1">Important Instructions</p>
              <ul className="text-slate-500 space-y-0.5 text-xs list-disc list-inside">
                <li>All fields marked with * are mandatory.</li>
                <li>Attach clear, legible copies of all certificates.</li>
                <li>Information must match your original documents.</li>
                <li>After submission, you will proceed to pay the admission fee.</li>
              </ul>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-primary flex-shrink-0">support_agent</span>
            <div>
              <p className="font-bold text-slate-800 mb-1">Help & Support</p>
              <p className="text-slate-500 text-xs">📞 09617-000340</p>
              <p className="text-slate-500 text-xs">✉ admission@diu.edu.bd</p>
              <p className="text-slate-500 text-xs">🕒 Sun–Thu 9 AM – 5 PM</p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};
