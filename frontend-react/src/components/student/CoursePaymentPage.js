import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../../services/authService';
import { toast } from 'react-toastify';
import axios from 'axios';
import API_CONFIG from '../../config/apiConfig';
import { saveCourseRegistration, saveActiveEnrollment } from '../../services/studentDataService';

// ── Payment Gateways ──────────────────────────────────────────────────────────
const GATEWAYS = [
  {
    id: 'bkash', label: 'bKash', color: '#E2136E', bg: '#FFF0F7', tag: 'Mobile Banking',
    desc: 'Pay via bKash mobile banking',
    fields: [{ id: 'account', label: 'bKash Number', placeholder: '01XXXXXXXXX', type: 'tel' }],
    logo: (c) => <span style={{ color: c, fontWeight: 900, fontSize: '13px', letterSpacing: '-0.5px' }}>bKash</span>,
  },
  {
    id: 'nagad', label: 'Nagad', color: '#F7941D', bg: '#FFF8F0', tag: 'Mobile Banking',
    desc: 'Pay via Nagad digital wallet',
    fields: [{ id: 'account', label: 'Nagad Number', placeholder: '01XXXXXXXXX', type: 'tel' }],
    logo: (c) => <span style={{ color: c, fontWeight: 900, fontSize: '13px' }}>Nagad</span>,
  },
  {
    id: '1card', label: '1Card', color: '#0C1282', bg: '#F0F2FF', tag: 'DIU Card',
    desc: 'Pay using your DIU 1Card account',
    fields: [{ id: 'account', label: '1Card Number', placeholder: '1CARD-XXXXXXXXXX', type: 'text' }],
    logo: (c) => <span style={{ color: c, fontWeight: 900, fontSize: '11px' }}>1Card</span>,
  },
  {
    id: 'visa', label: 'Visa', color: '#1A1F71', bg: '#EEF2FF', tag: 'Debit / Credit',
    desc: 'Visa debit or credit card',
    fields: [
      { id: 'cardNumber', label: 'Card Number', placeholder: '4XXX XXXX XXXX XXXX', type: 'text' },
      { id: 'expiry',     label: 'Expiry (MM/YY)', placeholder: 'MM / YY',            type: 'text' },
      { id: 'cvv',        label: 'CVV',           placeholder: '•••',                  type: 'password' },
      { id: 'name',       label: 'Cardholder Name', placeholder: 'As on card',         type: 'text' },
    ],
    logo: () => <svg viewBox="0 0 48 16" className="w-10" fill="none"><text x="0" y="13" fontSize="15" fontWeight="900" fill="#1A1F71" fontFamily="Arial">VISA</text></svg>,
  },
  {
    id: 'mastercard', label: 'MasterCard', color: '#EB001B', bg: '#FFF5F5', tag: 'Debit / Credit',
    desc: 'MasterCard debit or credit card',
    fields: [
      { id: 'cardNumber', label: 'Card Number', placeholder: '5XXX XXXX XXXX XXXX', type: 'text' },
      { id: 'expiry',     label: 'Expiry (MM/YY)', placeholder: 'MM / YY',            type: 'text' },
      { id: 'cvv',        label: 'CVV',           placeholder: '•••',                  type: 'password' },
      { id: 'name',       label: 'Cardholder Name', placeholder: 'As on card',         type: 'text' },
    ],
    logo: () => (
      <div className="flex items-center">
        <div className="w-5 h-5 rounded-full" style={{ background: '#EB001B' }} />
        <div className="w-5 h-5 rounded-full -ml-2.5" style={{ background: '#F79E1B', opacity: 0.9 }} />
      </div>
    ),
  },
];

// Stages: amount → [partial-advisor → partial-apply → partial-waiting → partial-approved] → method → form → processing → receipt
// STAGE constants
const S = {
  AMOUNT:   'amount',
  PARTIAL_ADVISOR: 'partial-advisor',
  PARTIAL_APPLY:   'partial-apply',
  PARTIAL_WAITING: 'partial-waiting',
  PARTIAL_APPROVED:'partial-approved',
  METHOD:   'method',
  FORM:     'form',
  PROCESSING:'processing',
  RECEIPT:  'receipt',
};

// Advisor message renderer (bold + line breaks)
function renderMsg(text) {
  return text.split('\n').map((line, li) => (
    <span key={li}>
      {line.split(/\*\*(.*?)\*\*/g).map((p, pi) => pi % 2 === 1 ? <strong key={pi}>{p}</strong> : p)}
      {'\n'}
    </span>
  ));
}

function genReceiptId() {
  return 'RCP-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 5).toUpperCase();
}

// ── Main Component ────────────────────────────────────────────────────────────
export const CoursePaymentPage = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const user      = authService.getUser();

  // Guard: if no state passed, redirect back
  const payState  = location.state;
  useEffect(() => {
    if (!payState) navigate('/course-registration', { replace: true });
  }, [payState, navigate]);

  if (!payState) return null;

  const { type = 'course', semester, courses = [], totalCredits = 0, totalFee = 0, requestId } = payState;
  const isLate   = type === 'late';
  const pageTitle = isLate ? 'Late Registration Payment' : 'Course Registration Payment';

  return (
    <CoursePaymentInner
      user={user}
      type={type}
      isLate={isLate}
      pageTitle={pageTitle}
      semester={semester}
      courses={courses}
      totalCredits={totalCredits}
      totalFee={totalFee}
      requestId={requestId}
      navigate={navigate}
    />
  );
};

// Split into inner to avoid hooks-in-condition issue
const CoursePaymentInner = ({ user, type, isLate, pageTitle, semester, courses, totalCredits, totalFee, requestId, navigate }) => {
  const [stage,         setStage]         = useState(S.AMOUNT);
  const [enteredAmt,    setEnteredAmt]     = useState('');
  const [payAmt,        setPayAmt]         = useState(0);   // confirmed pay amount
  const [selectedGW,    setSelectedGW]     = useState(null);
  const [gwFields,      setGwFields]       = useState({});
  const [receiptId,     setReceiptId]      = useState('');
  const [paidAt,        setPaidAt]         = useState('');

  // Partial payment advisor chat
  const [chatMsgs,      setChatMsgs]       = useState([]);
  const [chatInput,     setChatInput]      = useState('');
  const [chatLoading,   setChatLoading]    = useState(false);
  const [advisorDone,   setAdvisorDone]    = useState(false); // advisor said user can proceed

  // Application form
  const [appReason,     setAppReason]      = useState('');
  const [appType,       setAppType]        = useState('dept'); // 'dept' | 'registrar' | 'both'

  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMsgs, chatLoading]);

  // ── Smart Advisor call ──────────────────────────────────────────────────────
  const callAdvisor = useCallback(async (msgs) => {
    const sys = `You are Smart Advisor at Daffodil International University (DIU) — a financial assistance specialist.
A student is trying to pay their ${type === 'late' ? 'late ' : ''}course registration fee.
Total due: ৳${totalFee.toLocaleString()} | Amount student wants to pay: ৳${payAmt.toLocaleString()}
Semester: ${semester} | Courses: ${courses.length}

Your job:
1. Warmly acknowledge the situation
2. Ask if they're facing a financial difficulty
3. If yes → explain the partial payment application process
4. Guide them to submit an application to the Department Head and/or Registrar Office
5. Tell them that once approved, they can proceed with their partial payment
6. Be brief (under 100 words), warm, and helpful
7. Use **bold** for key terms`;
    try {
      const res = await axios.post(
        `${API_CONFIG.AI_BASE_URL}/api/v1/ai/smart-advisor`,
        { messages: msgs.slice(-8), systemPrompt: sys, maxTokens: 300 }
      );
      return res.data?.reply || '';
    } catch {
      return "I'm temporarily unavailable. Please submit your application below and we'll process it quickly.";
    }
  }, [type, totalFee, payAmt, semester, courses.length]);

  // ── Initiate partial payment advisor ───────────────────────────────────────
  const startPartialAdvisor = useCallback(async (amt) => {
    setStage(S.PARTIAL_ADVISOR);
    const greeting = { role: 'assistant', content: `Hello! 👋 I noticed you'd like to pay **৳${Number(amt).toLocaleString()}** out of the total **৳${totalFee.toLocaleString()}** due.\n\nThis is a partial payment. No worries — we can help!\n\nAre you facing a financial difficulty that prevents full payment right now?` };
    setChatMsgs([greeting]);
  }, [totalFee]);

  // ── Handle advisor chat send ────────────────────────────────────────────────
  const sendAdvisorMsg = async () => {
    const text = chatInput.trim();
    if (!text || chatLoading) return;
    const updated = [...chatMsgs, { role: 'user', content: text }];
    setChatMsgs(updated);
    setChatInput('');
    setChatLoading(true);
    try {
      const reply = await callAdvisor(updated);
      setChatMsgs(p => [...p, { role: 'assistant', content: reply }]);
      // Check if we should show application form
      const combined = (reply + text).toLowerCase();
      const wantsHelp = ['yes', 'help', 'problem', 'can\'t', 'cannot', 'afford', 'financial', 'difficulty', 'support', 'assist']
        .some(k => combined.includes(k));
      if (wantsHelp && !advisorDone) {
        setTimeout(() => {
          setChatMsgs(p => [...p, {
            role: 'assistant',
            content: `I understand. Let me guide you through the **Partial Payment Application**.\n\n📋 You'll need to:\n1. Briefly explain your situation\n2. Choose who to send it to (Department Head / Registrar)\n3. Submit — our team reviews within 24 hours\n\n**In demo mode, approval is instant!** Click the button below to fill your application.`,
          }]);
          setAdvisorDone(true);
        }, 600);
      }
    } catch {
      setChatMsgs(p => [...p, { role: 'assistant', content: "I'm temporarily unavailable. Please submit your application using the button below." }]);
      setAdvisorDone(true);
    } finally {
      setChatLoading(false);
    }
  };

  // ── Submit partial payment application ─────────────────────────────────────
  const submitApplication = () => {
    if (appReason.trim().length < 20) { toast.error('Please provide a detailed reason (min 20 characters)'); return; }
    setStage(S.PARTIAL_WAITING);
    // Demo: auto-approve after 3.5 seconds
    setTimeout(() => setStage(S.PARTIAL_APPROVED), 3500);
  };

  // ── Handle amount continue ──────────────────────────────────────────────────
  const handleAmountContinue = () => {
    const amt = parseFloat(enteredAmt.replace(/[,৳\s]/g, ''));
    if (!amt || amt <= 0) { toast.error('Please enter a valid payment amount'); return; }
    if (amt > totalFee) { toast.error(`Amount cannot exceed total due of ৳${totalFee.toLocaleString()}`); return; }
    const minFull = totalFee * 0.99; // 99% considered "full" (rounding)
    setPayAmt(amt);
    if (amt >= minFull) {
      setStage(S.METHOD);
    } else {
      startPartialAdvisor(amt);
    }
  };

  // ── Process payment ─────────────────────────────────────────────────────────
  const handlePay = () => {
    const gw = GATEWAYS.find(g => g.id === selectedGW);
    if (!gw) return;
    for (const f of gw.fields) {
      if (!gwFields[f.id]?.trim()) { toast.error(`Please enter ${f.label}`); return; }
    }
    setStage(S.PROCESSING);
    setTimeout(() => {
      const rid = genReceiptId();
      const now = new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
      setReceiptId(rid);
      setPaidAt(now);
      // Save enrollment
      const enrolledCourses = courses.map(c => ({ ...c }));
      saveCourseRegistration(user?.email, {
        semester, courses: enrolledCourses, totalCredits,
        totalFee: payAmt, status: 'APPROVED',
      });
      saveActiveEnrollment(user?.email, {
        semester, courses: enrolledCourses, totalCredits,
        totalFee: payAmt, registeredAt: new Date().toISOString(),
      });
      setStage(S.RECEIPT);
      toast.success('Payment successful! Registration confirmed.');
    }, 3000);
  };

  const balance = totalFee - payAmt;
  const isPartialApproved = stage === S.PARTIAL_APPROVED;

  // ── RENDER ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen" style={{ background: '#f7f9fb', fontFamily: 'Manrope, sans-serif' }}>

      {/* ── Top Bar ───────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 flex items-center gap-4 px-6 h-16"
              style={{ background: 'rgba(247,249,251,0.92)', backdropFilter: 'blur(12px)', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
        <button onClick={() => navigate(isLate ? '/late-registration' : '/course-registration')}
          className="flex items-center gap-1.5 text-sm font-semibold transition-colors"
          style={{ color: '#464652' }}
          onMouseEnter={e => e.currentTarget.style.color = '#0c1282'}
          onMouseLeave={e => e.currentTarget.style.color = '#464652'}>
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Back
        </button>
        <div className="h-5 w-px" style={{ background: '#e2e8f0' }} />
        <img src="/diulogo.png" alt="DIU" className="h-8 w-auto" />
        <span className="font-extrabold text-sm" style={{ color: '#0c1282' }}>{pageTitle}</span>
        <div className="ml-auto flex items-center gap-2 text-xs font-bold px-3 py-1 rounded-full"
             style={{ background: '#e0f2fe', color: '#0369a1' }}>
          <span className="material-symbols-outlined text-sm">lock</span>
          Secure Payment
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 pb-16">

        {/* ── Fee Summary Card ───────────────────────────────────── */}
        {stage !== S.RECEIPT && (
          <div className="rounded-2xl p-6 mb-6 text-white relative overflow-hidden"
               style={{ background: 'linear-gradient(135deg, #0c1282 0%, #1e3a8a 100%)' }}>
            <div className="absolute top-0 right-0 opacity-10">
              <span className="material-symbols-outlined" style={{ fontSize: '120px', fontVariationSettings: "'FILL' 1" }}>payments</span>
            </div>
            <p className="text-xs font-bold uppercase tracking-widest opacity-70 mb-1">
              {isLate ? 'Late Registration Fee' : 'Course Registration Fee'}
            </p>
            <div className="flex items-end gap-3 mb-3">
              <span className="text-4xl font-extrabold">৳{totalFee.toLocaleString()}</span>
              <span className="text-sm opacity-60 mb-1">total due</span>
            </div>
            <div className="flex flex-wrap gap-3 text-xs">
              <span className="px-2 py-1 rounded-full font-semibold" style={{ background: 'rgba(255,255,255,0.15)' }}>
                {semester}
              </span>
              <span className="px-2 py-1 rounded-full font-semibold" style={{ background: 'rgba(255,255,255,0.15)' }}>
                {totalCredits} credits
              </span>
              <span className="px-2 py-1 rounded-full font-semibold" style={{ background: 'rgba(255,255,255,0.15)' }}>
                {courses.length} courses
              </span>
            </div>
            {payAmt > 0 && stage !== S.AMOUNT && (
              <div className="mt-4 pt-4 border-t border-white/20 flex items-center justify-between">
                <div>
                  <p className="text-[11px] opacity-60 uppercase tracking-wider">Paying Now</p>
                  <p className="text-xl font-extrabold text-green-300">৳{payAmt.toLocaleString()}</p>
                </div>
                {balance > 50 && (
                  <div className="text-right">
                    <p className="text-[11px] opacity-60 uppercase tracking-wider">Balance</p>
                    <p className="text-xl font-extrabold text-amber-300">৳{balance.toLocaleString()}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Stage: AMOUNT ─────────────────────────────────────────── */}
        {stage === S.AMOUNT && (
          <div className="rounded-2xl p-6 space-y-6" style={{ background: 'white', border: '1px solid #e2e8f0' }}>
            <div>
              <h2 className="text-xl font-extrabold mb-1" style={{ color: '#0c1282' }}>Enter Payment Amount</h2>
              <p className="text-sm" style={{ color: '#64748b' }}>
                Pay full or a custom amount. Partial payments require approval.
              </p>
            </div>

            {/* Course breakdown */}
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #e2e8f0' }}>
              <div className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider"
                   style={{ background: '#f8fafc', color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>
                Registered Courses
              </div>
              <div className="divide-y" style={{ borderColor: '#f1f5f9' }}>
                {courses.map((c, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold" style={{ color: '#0c1282' }}>
                        {c.course_code || c.code}
                      </span>
                      <span className="text-xs" style={{ color: '#374151' }}>
                        {c.subject || c.name}
                      </span>
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                          style={{ background: '#f0f4ff', color: '#3730a3' }}>
                      {c.credits} cr
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Amount input */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#64748b' }}>
                Payment Amount (BDT ৳)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold" style={{ color: '#94a3b8' }}>৳</span>
                <input
                  type="number"
                  min="1"
                  max={totalFee}
                  value={enteredAmt}
                  onChange={e => setEnteredAmt(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAmountContinue()}
                  placeholder={`Max ৳${totalFee.toLocaleString()}`}
                  className="w-full pl-10 pr-4 py-4 text-xl font-extrabold rounded-xl outline-none transition-all"
                  style={{
                    border: '2px solid #e2e8f0',
                    color: '#0c1282',
                    fontSize: '22px',
                  }}
                  onFocus={e => e.target.style.borderColor = '#0c1282'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>

              {/* Quick amount chips */}
              <div className="flex flex-wrap gap-2 mt-3">
                {[
                  { label: 'Full', val: totalFee },
                  { label: '75%', val: Math.round(totalFee * 0.75) },
                  { label: '50%', val: Math.round(totalFee * 0.5) },
                  { label: '25%', val: Math.round(totalFee * 0.25) },
                ].map(({ label, val }) => (
                  <button key={label}
                    onClick={() => setEnteredAmt(String(val))}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                    style={{
                      background: String(val) === enteredAmt ? '#0c1282' : '#f0f4ff',
                      color: String(val) === enteredAmt ? 'white' : '#3730a3',
                    }}
                    onMouseEnter={e => { if (String(val) !== enteredAmt) e.currentTarget.style.background = '#e0e7ff'; }}
                    onMouseLeave={e => { if (String(val) !== enteredAmt) e.currentTarget.style.background = '#f0f4ff'; }}>
                    {label} — ৳{val.toLocaleString()}
                  </button>
                ))}
              </div>

              {/* Partial payment notice */}
              {enteredAmt && parseFloat(enteredAmt) > 0 && parseFloat(enteredAmt) < totalFee * 0.99 && (
                <div className="mt-3 flex items-start gap-2 p-3 rounded-xl"
                     style={{ background: '#fef9c3', border: '1px solid #fde047' }}>
                  <span className="material-symbols-outlined text-sm mt-0.5 flex-shrink-0" style={{ color: '#a16207' }}>info</span>
                  <p className="text-xs font-medium" style={{ color: '#713f12' }}>
                    This is a <strong>partial payment</strong>. Our Smart Advisor will guide you through the financial support application process.
                    Approval is required before completing registration.
                  </p>
                </div>
              )}
            </div>

            <button onClick={handleAmountContinue}
              className="w-full py-4 font-extrabold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 text-white"
              style={{ background: '#0c1282' }}
              onMouseEnter={e => e.currentTarget.style.background = '#1e3a8a'}
              onMouseLeave={e => e.currentTarget.style.background = '#0c1282'}>
              Continue
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </div>
        )}

        {/* ── Stage: PARTIAL ADVISOR ─────────────────────────────── */}
        {stage === S.PARTIAL_ADVISOR && (
          <div className="space-y-4">
            {/* Partial payment banner */}
            <div className="rounded-xl p-4 flex items-start gap-3"
                 style={{ background: '#fef9c3', border: '1px solid #fde047' }}>
              <span className="material-symbols-outlined text-xl flex-shrink-0" style={{ color: '#a16207', fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
              <div>
                <p className="font-bold text-sm" style={{ color: '#713f12' }}>Partial Payment Detected</p>
                <p className="text-xs mt-0.5" style={{ color: '#92400e' }}>
                  You're paying <strong>৳{payAmt.toLocaleString()}</strong> of <strong>৳{totalFee.toLocaleString()}</strong>.
                  Chat with Smart Advisor below to get financial support.
                </p>
              </div>
            </div>

            {/* Chat window */}
            <div className="rounded-2xl overflow-hidden shadow-sm" style={{ background: 'white', border: '1px solid #e2e8f0' }}>
              {/* Chat header */}
              <div className="flex items-center gap-3 px-5 py-4" style={{ background: '#0c1282' }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.15)' }}>
                  <span className="material-symbols-outlined text-white text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
                </div>
                <div>
                  <p className="text-white font-bold text-sm">Smart Advisor</p>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#4ade80' }} />
                    <span className="text-[11px] font-bold" style={{ color: '#4ade80' }}>Financial Support Specialist</span>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="p-4 space-y-3 max-h-64 overflow-y-auto" style={{ background: '#f8fafc' }}>
                {chatMsgs.map((m, i) => (
                  <div key={i} className={`flex items-start gap-2 ${m.role === 'user' ? 'justify-end' : ''}`}>
                    {m.role === 'assistant' && (
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: '#0c1282' }}>
                        <span className="material-symbols-outlined text-white text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
                      </div>
                    )}
                    <div className="max-w-[80%] px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap leading-relaxed"
                         style={m.role === 'user'
                           ? { background: '#0c1282', color: 'white', borderBottomRightRadius: '4px' }
                           : { background: 'white', color: '#1e293b', border: '1px solid #e2e8f0', borderBottomLeftRadius: '4px' }}>
                      {m.role === 'assistant' ? renderMsg(m.content) : m.content}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#0c1282' }}>
                      <span className="material-symbols-outlined text-white text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
                    </div>
                    <div className="px-4 py-3 rounded-2xl" style={{ background: 'white', border: '1px solid #e2e8f0' }}>
                      <div className="flex gap-1.5">
                        {[0, 150, 300].map(d => (
                          <span key={d} className="w-1.5 h-1.5 rounded-full animate-bounce"
                                style={{ background: '#0c1282', animationDelay: `${d}ms` }} />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Quick chips */}
              <div className="px-4 py-2 flex gap-2 overflow-x-auto" style={{ borderTop: '1px solid #f1f5f9', scrollbarWidth: 'none' }}>
                {["Yes, I need help", "Financial difficulty", "Apply for support", "Contact registrar"].map(t => (
                  <button key={t} onClick={() => { setChatInput(t); }}
                    className="whitespace-nowrap text-xs font-bold px-3 py-1.5 rounded-full flex-shrink-0 transition-colors"
                    style={{ background: '#f1f5f9', color: '#475569' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
                    onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}>
                    {t}
                  </button>
                ))}
              </div>

              {/* Input */}
              <div className="p-3 flex gap-2" style={{ borderTop: '1px solid #e2e8f0' }}>
                <input
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAdvisorMsg(); } }}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#1e293b' }}
                />
                <button onClick={sendAdvisorMsg} disabled={chatLoading || !chatInput.trim()}
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-90 disabled:opacity-40"
                  style={{ background: '#0c1282' }}>
                  <span className="material-symbols-outlined text-white text-sm">send</span>
                </button>
              </div>
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-1 gap-3">
              {advisorDone && (
                <button onClick={() => setStage(S.PARTIAL_APPLY)}
                  className="py-4 font-extrabold rounded-xl flex items-center justify-center gap-2 text-white transition-all active:scale-95"
                  style={{ background: '#0c1282' }}>
                  <span className="material-symbols-outlined">description</span>
                  Submit Financial Support Application
                </button>
              )}
              <button onClick={() => { setEnteredAmt(String(totalFee)); setPayAmt(totalFee); setStage(S.METHOD); }}
                className="py-3 font-bold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95"
                style={{ background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' }}>
                <span className="material-symbols-outlined text-base">payments</span>
                Pay Full Amount Instead (৳{totalFee.toLocaleString()})
              </button>
            </div>
          </div>
        )}

        {/* ── Stage: PARTIAL APPLY ──────────────────────────────── */}
        {stage === S.PARTIAL_APPLY && (
          <div className="rounded-2xl p-6 space-y-5" style={{ background: 'white', border: '1px solid #e2e8f0' }}>
            <div>
              <h2 className="text-xl font-extrabold mb-1" style={{ color: '#0c1282' }}>Financial Support Application</h2>
              <p className="text-sm" style={{ color: '#64748b' }}>
                Submit your request for partial payment approval. Our team reviews within 24 hours.
              </p>
            </div>

            {/* Amount summary */}
            <div className="rounded-xl p-4 flex items-center justify-between"
                 style={{ background: '#f0f4ff', border: '1px solid #c7d2fe' }}>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#6366f1' }}>Partial Payment Request</p>
                <p className="text-2xl font-extrabold mt-0.5" style={{ color: '#0c1282' }}>৳{payAmt.toLocaleString()}</p>
                <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>Balance due later: ৳{balance.toLocaleString()}</p>
              </div>
              <span className="material-symbols-outlined text-3xl" style={{ color: '#818cf8', fontVariationSettings: "'FILL' 1" }}>request_quote</span>
            </div>

            {/* Send to */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#64748b' }}>Send Application To</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { val: 'dept', label: 'Department Head', icon: 'person' },
                  { val: 'registrar', label: 'Registrar Office', icon: 'business' },
                  { val: 'both', label: 'Both Offices', icon: 'groups' },
                ].map(opt => (
                  <button key={opt.val} onClick={() => setAppType(opt.val)}
                    className="p-3 rounded-xl text-center transition-all border-2"
                    style={{
                      borderColor: appType === opt.val ? '#0c1282' : '#e2e8f0',
                      background: appType === opt.val ? '#e0f2fe' : 'white',
                    }}>
                    <span className="material-symbols-outlined block text-xl mb-1"
                          style={{ color: appType === opt.val ? '#0c1282' : '#94a3b8', fontVariationSettings: appType === opt.val ? "'FILL' 1" : "'FILL' 0" }}>
                      {opt.icon}
                    </span>
                    <p className="text-[10px] font-bold" style={{ color: appType === opt.val ? '#0c1282' : '#64748b' }}>{opt.label}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Student info (read-only) */}
            <div className="rounded-xl p-4 space-y-2 text-sm" style={{ background: '#f8fafc', border: '1px solid #f1f5f9' }}>
              <div className="flex justify-between">
                <span style={{ color: '#64748b' }}>Student Name</span>
                <span className="font-semibold" style={{ color: '#1e293b' }}>{authService.getUser()?.name || 'Student'}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: '#64748b' }}>Student Email</span>
                <span className="font-semibold text-xs" style={{ color: '#1e293b' }}>{authService.getUser()?.email || ''}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: '#64748b' }}>Semester</span>
                <span className="font-semibold" style={{ color: '#1e293b' }}>{semester}</span>
              </div>
            </div>

            {/* Reason */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#64748b' }}>Reason for Partial Payment *</label>
              <textarea
                value={appReason}
                onChange={e => setAppReason(e.target.value)}
                rows={4}
                placeholder="Explain your financial situation briefly (e.g., family hardship, delayed scholarship disbursement, temporary income loss...)"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all resize-none"
                style={{ border: '2px solid #e2e8f0', color: '#1e293b', lineHeight: '1.6' }}
                onFocus={e => e.target.style.borderColor = '#0c1282'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
              />
              <p className="text-xs mt-1 text-right" style={{ color: appReason.length < 20 ? '#dc2626' : '#64748b' }}>
                {appReason.length} / 20 min characters
              </p>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStage(S.PARTIAL_ADVISOR)}
                className="flex-1 py-3 font-bold rounded-xl transition-all"
                style={{ background: '#f1f5f9', color: '#475569' }}>
                Back
              </button>
              <button onClick={submitApplication}
                className="flex-[2] py-3 font-extrabold rounded-xl flex items-center justify-center gap-2 text-white transition-all active:scale-95"
                style={{ background: '#0c1282' }}>
                <span className="material-symbols-outlined text-base">send</span>
                Submit Application
              </button>
            </div>
          </div>
        )}

        {/* ── Stage: PARTIAL WAITING ────────────────────────────── */}
        {stage === S.PARTIAL_WAITING && (
          <div className="rounded-2xl p-10 text-center space-y-6" style={{ background: 'white', border: '1px solid #e2e8f0' }}>
            <div className="relative mx-auto w-20 h-20">
              <div className="absolute inset-0 rounded-full border-4 animate-spin"
                   style={{ borderColor: '#e2e8f0', borderTopColor: '#0c1282' }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl" style={{ color: '#0c1282', fontVariationSettings: "'FILL' 1" }}>hourglass_top</span>
              </div>
            </div>
            <div>
              <h2 className="text-xl font-extrabold mb-2" style={{ color: '#0c1282' }}>Application Under Review</h2>
              <p className="text-sm mb-1" style={{ color: '#64748b' }}>Your request is being processed by the university.</p>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold"
                   style={{ background: '#fef9c3', color: '#a16207' }}>
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>pending</span>
                Your request is under review. Please wait for approval.
              </div>
            </div>
            <div className="space-y-2 text-left rounded-xl p-4" style={{ background: '#f8fafc', border: '1px solid #f1f5f9' }}>
              <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#94a3b8' }}>Application Summary</p>
              <div className="flex justify-between text-sm">
                <span style={{ color: '#64748b' }}>Amount Requested</span>
                <span className="font-bold" style={{ color: '#0c1282' }}>৳{payAmt.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: '#64748b' }}>Sent To</span>
                <span className="font-bold" style={{ color: '#0c1282' }}>
                  {appType === 'both' ? 'Dept Head + Registrar' : appType === 'dept' ? 'Department Head' : 'Registrar Office'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ── Stage: PARTIAL APPROVED ───────────────────────────── */}
        {isPartialApproved && (
          <div className="space-y-4">
            <div className="rounded-2xl p-6 text-center space-y-4" style={{ background: '#f0fdf4', border: '2px solid #bbf7d0' }}>
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
                   style={{ background: '#dcfce7' }}>
                <span className="material-symbols-outlined text-3xl" style={{ color: '#16a34a', fontVariationSettings: "'FILL' 1" }}>verified</span>
              </div>
              <div>
                <h2 className="text-xl font-extrabold" style={{ color: '#15803d' }}>Application Approved!</h2>
                <p className="text-sm mt-1" style={{ color: '#166534' }}>
                  Your partial payment has been approved. You can now complete your course registration.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold"
                   style={{ background: '#dcfce7', color: '#15803d' }}>
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                Approved by Department Head & Registrar Office
              </div>
            </div>

            <div className="rounded-xl p-4 flex items-center justify-between"
                 style={{ background: 'white', border: '1px solid #e2e8f0' }}>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-0.5" style={{ color: '#64748b' }}>Approved Payment</p>
                <p className="text-2xl font-extrabold" style={{ color: '#0c1282' }}>৳{payAmt.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold uppercase tracking-wider mb-0.5" style={{ color: '#64748b' }}>Balance (later)</p>
                <p className="text-lg font-bold" style={{ color: '#94a3b8' }}>৳{balance.toLocaleString()}</p>
              </div>
            </div>

            <button onClick={() => setStage(S.METHOD)}
              className="w-full py-4 font-extrabold rounded-xl flex items-center justify-center gap-2 text-white transition-all active:scale-95"
              style={{ background: '#0c1282' }}>
              <span className="material-symbols-outlined">payments</span>
              Proceed to Payment Gateway
            </button>
          </div>
        )}

        {/* ── Stage: METHOD ─────────────────────────────────────── */}
        {stage === S.METHOD && (
          <div className="space-y-4">
            <div className="mb-2">
              <h2 className="text-xl font-extrabold mb-1" style={{ color: '#0c1282' }}>Select Payment Method</h2>
              <p className="text-sm" style={{ color: '#64748b' }}>Choose how you want to pay ৳{payAmt.toLocaleString()}.</p>
            </div>
            {GATEWAYS.map(gw => (
              <button key={gw.id} onClick={() => { setSelectedGW(gw.id); setGwFields({}); setStage(S.FORM); }}
                className="w-full text-left rounded-2xl p-5 flex items-center gap-4 group transition-all"
                style={{ background: 'white', border: '2px solid #e2e8f0' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = gw.color; e.currentTarget.style.boxShadow = `0 4px 16px ${gw.color}22`; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none'; }}>
                <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: gw.bg }}>
                  {gw.logo(gw.color)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-bold text-sm" style={{ color: '#1e293b' }}>{gw.label}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: gw.bg, color: gw.color }}>{gw.tag}</span>
                  </div>
                  <p className="text-xs" style={{ color: '#64748b' }}>{gw.desc}</p>
                </div>
                <span className="material-symbols-outlined transition-transform group-hover:translate-x-1"
                      style={{ color: '#94a3b8' }}>arrow_forward_ios</span>
              </button>
            ))}
          </div>
        )}

        {/* ── Stage: FORM ───────────────────────────────────────── */}
        {stage === S.FORM && (() => {
          const gw = GATEWAYS.find(g => g.id === selectedGW);
          if (!gw) return null;
          return (
            <div className="rounded-2xl p-6 space-y-5" style={{ background: 'white', border: '1px solid #e2e8f0' }}>
              {/* Gateway header */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: gw.bg }}>
                  {gw.logo(gw.color)}
                </div>
                <div>
                  <h2 className="font-extrabold text-lg" style={{ color: '#0c1282' }}>{gw.label} Payment</h2>
                  <p className="text-xs" style={{ color: '#64748b' }}>{gw.desc}</p>
                </div>
                <button onClick={() => setStage(S.METHOD)}
                  className="ml-auto text-xs font-bold px-3 py-1.5 rounded-lg"
                  style={{ background: '#f1f5f9', color: '#64748b' }}>
                  Change
                </button>
              </div>

              {/* Demo notice */}
              <div className="flex items-start gap-2 p-3 rounded-xl" style={{ background: '#fefce8', border: '1px solid #fde047' }}>
                <span className="material-symbols-outlined text-sm flex-shrink-0" style={{ color: '#a16207', fontVariationSettings: "'FILL' 1" }}>info</span>
                <p className="text-xs font-medium" style={{ color: '#713f12' }}>
                  <strong>Demo mode</strong> — No real transaction will occur. Any values will be accepted.
                </p>
              </div>

              {/* Fields */}
              {gw.fields.map(f => (
                <div key={f.id}>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: '#64748b' }}>{f.label}</label>
                  <input
                    type={f.type}
                    placeholder={f.placeholder}
                    value={gwFields[f.id] || ''}
                    onChange={e => setGwFields(p => ({ ...p, [f.id]: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl text-sm font-medium outline-none transition-all"
                    style={{ border: '2px solid #e2e8f0', color: '#1e293b' }}
                    onFocus={e => e.target.style.borderColor = gw.color}
                    onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                  />
                </div>
              ))}

              {/* Pay summary */}
              <div className="rounded-xl p-4 space-y-2" style={{ background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                <div className="flex justify-between text-sm">
                  <span style={{ color: '#64748b' }}>Courses ({courses.length})</span>
                  <span className="font-semibold" style={{ color: '#1e293b' }}>{totalCredits} credits</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: '#64748b' }}>Total Due</span>
                  <span className="font-semibold" style={{ color: '#1e293b' }}>৳{totalFee.toLocaleString()}</span>
                </div>
                {balance > 50 && (
                  <div className="flex justify-between text-sm">
                    <span style={{ color: '#b45309' }}>Balance (deferred)</span>
                    <span className="font-semibold" style={{ color: '#b45309' }}>৳{balance.toLocaleString()}</span>
                  </div>
                )}
                <div className="border-t pt-2 flex justify-between text-base" style={{ borderColor: '#e2e8f0' }}>
                  <span className="font-extrabold" style={{ color: '#0c1282' }}>Paying Now</span>
                  <span className="font-extrabold text-lg" style={{ color: '#0c1282' }}>৳{payAmt.toLocaleString()}</span>
                </div>
              </div>

              <button onClick={handlePay}
                className="w-full py-4 font-extrabold rounded-xl flex items-center justify-center gap-2 text-white transition-all active:scale-95"
                style={{ background: gw.color }}>
                <span className="material-symbols-outlined">lock</span>
                Pay ৳{payAmt.toLocaleString()} Securely
              </button>
            </div>
          );
        })()}

        {/* ── Stage: PROCESSING ─────────────────────────────────── */}
        {stage === S.PROCESSING && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="relative mb-6">
              <div className="w-20 h-20 rounded-full border-4 animate-spin"
                   style={{ borderColor: '#e2e8f0', borderTopColor: '#0c1282' }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl" style={{ color: '#0c1282', fontVariationSettings: "'FILL' 1" }}>payments</span>
              </div>
            </div>
            <h2 className="text-xl font-extrabold mb-2" style={{ color: '#0c1282' }}>Processing Payment</h2>
            <p className="text-sm mb-3" style={{ color: '#64748b' }}>Please wait while we confirm your transaction…</p>
            <p className="text-xs px-4 py-2 rounded-full font-medium"
               style={{ background: '#f1f5f9', color: '#64748b' }}>
              Do not close this window
            </p>
          </div>
        )}

        {/* ── Stage: RECEIPT ────────────────────────────────────── */}
        {stage === S.RECEIPT && (
          <div className="space-y-5">
            {/* Success banner */}
            <div className="rounded-2xl p-6 text-center" style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', border: '2px solid #86efac' }}>
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                   style={{ background: '#dcfce7', boxShadow: '0 0 0 6px #f0fdf4' }}>
                <span className="material-symbols-outlined text-4xl" style={{ color: '#16a34a', fontVariationSettings: "'FILL' 1" }}>task_alt</span>
              </div>
              <h2 className="text-2xl font-extrabold mb-1" style={{ color: '#15803d' }}>Registration Complete!</h2>
              <p className="text-sm" style={{ color: '#166534' }}>
                Payment confirmed and courses registered for {semester}.
              </p>
            </div>

            {/* Receipt card */}
            <div className="rounded-2xl overflow-hidden shadow-sm" style={{ background: 'white', border: '1px solid #e2e8f0' }} id="receipt-card">
              {/* Receipt header */}
              <div className="px-6 py-5 flex items-center justify-between" style={{ background: '#0c1282' }}>
                <div>
                  <p className="text-white font-extrabold text-lg">Payment Receipt</p>
                  <p className="text-white/60 text-xs font-mono mt-0.5">{receiptId}</p>
                </div>
                <img src="/diulogo.png" alt="DIU" className="h-10 w-auto brightness-200 invert" />
              </div>

              {/* Receipt body */}
              <div className="p-6 space-y-4">
                {/* Status */}
                <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-base" style={{ color: '#16a34a', fontVariationSettings: "'FILL' 1" }}>verified</span>
                    <span className="font-bold text-sm" style={{ color: '#15803d' }}>
                      {balance > 50 ? 'Partial Payment Approved' : 'Full Payment Confirmed'}
                    </span>
                  </div>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase"
                        style={{ background: '#dcfce7', color: '#15803d' }}>SUCCESS</span>
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Student', val: user?.name || 'Student' },
                    { label: 'Student ID', val: user?.studentId || user?.email?.split('@')[0] || '—' },
                    { label: 'Semester', val: semester },
                    { label: 'Date & Time', val: paidAt },
                    { label: 'Payment Method', val: GATEWAYS.find(g => g.id === selectedGW)?.label || '—' },
                    { label: 'Transaction ID', val: receiptId.split('-').slice(-1)[0] },
                  ].map(({ label, val }) => (
                    <div key={label} className="p-3 rounded-xl" style={{ background: '#f8fafc' }}>
                      <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: '#94a3b8' }}>{label}</p>
                      <p className="text-sm font-semibold truncate" style={{ color: '#1e293b' }}>{val}</p>
                    </div>
                  ))}
                </div>

                {/* Fee breakdown */}
                <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #e2e8f0' }}>
                  <div className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider"
                       style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                    Registered Courses
                  </div>
                  {courses.map((c, i) => (
                    <div key={i} className="flex items-center justify-between px-4 py-2.5"
                         style={{ borderBottom: i < courses.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                      <span className="text-xs font-mono font-bold" style={{ color: '#0c1282' }}>{c.course_code || c.code}</span>
                      <span className="text-xs text-center flex-1 px-2" style={{ color: '#374151' }}>{c.subject || c.name}</span>
                      <span className="text-xs font-bold" style={{ color: '#6366f1' }}>{c.credits} cr</span>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="rounded-xl p-4 space-y-2" style={{ background: '#f0f4ff', border: '1px solid #c7d2fe' }}>
                  {balance > 50 && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span style={{ color: '#6366f1' }}>Total Due</span>
                        <span className="font-semibold" style={{ color: '#3730a3' }}>৳{totalFee.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span style={{ color: '#b45309' }}>Balance Remaining</span>
                        <span className="font-semibold" style={{ color: '#b45309' }}>৳{balance.toLocaleString()}</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between text-base font-extrabold border-t pt-2" style={{ borderColor: '#c7d2fe' }}>
                    <span style={{ color: '#0c1282' }}>Amount Paid</span>
                    <span style={{ color: '#0c1282' }}>৳{payAmt.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => window.print()}
                className="py-3 font-bold rounded-xl flex items-center justify-center gap-2 transition-all"
                style={{ background: '#f1f5f9', color: '#475569' }}>
                <span className="material-symbols-outlined text-base">print</span>
                Print Receipt
              </button>
              <button
                onClick={() => {
                  navigate(isLate ? '/late-registration' : '/course-registration', {
                    state: {
                      paymentCompleted: true,
                      semester,
                      courses,
                      totalCredits,
                      totalFee: payAmt,
                      receiptId,
                      requestId,
                    },
                  });
                }}
                className="py-3 font-extrabold rounded-xl flex items-center justify-center gap-2 text-white transition-all active:scale-95"
                style={{ background: '#0c1282' }}>
                <span className="material-symbols-outlined text-base">home</span>
                Back to Portal
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
