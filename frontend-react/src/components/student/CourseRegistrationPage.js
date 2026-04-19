import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { SmartAdvisorFullscreen } from './SmartAdvisorFullscreen';
import API_CONFIG from '../../config/apiConfig';
import axios from 'axios';
import { Navigation } from '../common/Navigation';

// ── Fee constants ─────────────────────────────────────────────────────────────
const FEE_PER_CREDIT = 30000 / 11;
const RETAKE_FEE     = 3000;
const DROP_FEE       = 1000;
const MAX_CREDITS    = 18;
const MIN_CREDITS    = 9;

// ── Semester data (theory = 3 cr, lab = 1.5 cr) ──────────────────────────────
const isLab = (code) => code.endsWith('L');
const cr    = (code) => isLab(code) ? 1 : 3;

const RAW_SEMESTER_DATA = {
  'Semester 1': [
    { course_code:'ENG101',  subject:'English Language I',                          faculty:'Ms. Tamanna Akter'                   },
    { course_code:'COF101',  subject:'Computer Fundamentals',                       faculty:'Mr. Md. Sarwar Hossain Mollah'       },
    { course_code:'CIS121',  subject:'Introduction to Industry 4.0',                faculty:'Mr. Md. Ashiqul Islam'               },
    { course_code:'CIS115',  subject:'Structured Programming',                      faculty:'Mr. Md. Faruk Hosen'                 },
    { course_code:'CIS115L', subject:'Structured Programming Lab',                  faculty:'Mr. Md. Faruk Hosen'                 },
  ],
  'Semester 2': [
    { course_code:'CIS122',  subject:'Data Structure',                              faculty:'Mr. Md. Mehedi Hassan'               },
    { course_code:'CIS122L', subject:'Data Structure Lab',                          faculty:'Mr. Md. Mehedi Hassan'               },
    { course_code:'CIS131',  subject:'Computer Architecture and Organization',      faculty:'Ms. Sonia Nasrin'                    },
    { course_code:'ENG102',  subject:'English Language II',                         faculty:'Ms. Tamanna Akter'                   },
    { course_code:'MAT101',  subject:'Mathematics-I',                               faculty:'Mathematics Department'              },
  ],
  'Semester 3': [
    { course_code:'CIS133',  subject:'Website Development Essentials',              faculty:'Mr. Israfil'                         },
    { course_code:'CIS133L', subject:'Website Development Essentials Lab',          faculty:'Mr. Israfil'                         },
    { course_code:'CIS132',  subject:'Algorithms',                                  faculty:'Mr. Md. Mehedi Hassan'               },
    { course_code:'CIS132L', subject:'Algorithms Lab',                              faculty:'Mr. Md. Mehedi Hassan'               },
    { course_code:'CIS123',  subject:'Discrete Mathematics',                        faculty:'Mr. Md. Biplob Hossain'              },
  ],
  'Semester 4': [
    { course_code:'CIS232',  subject:'Object Oriented Programming',                 faculty:'Mr. Md. Nasimul Kader'               },
    { course_code:'CIS232L', subject:'Object Oriented Programming Lab',             faculty:'Mr. Md. Nasimul Kader'               },
    { course_code:'CIS211',  subject:'Computer Networks',                           faculty:'Mr. Md. Sarwar Hossain Mollah'       },
    { course_code:'CIS211L', subject:'Computer Networks Lab',                       faculty:'Mr. Md. Sarwar Hossain Mollah'       },
    { course_code:'ACC101',  subject:'Accounting',                                  faculty:'Mr. Md. Arif Hassan'                 },
  ],
  'Semester 5': [
    { course_code:'CIS222',  subject:'Database Management System',                  faculty:'Mr. Md. Nasimul Kader'               },
    { course_code:'CIS222L', subject:'Database Management System Lab',              faculty:'Mr. Md. Nasimul Kader'               },
    { course_code:'FIN232',  subject:'Financial Management System',                 faculty:'Finance Department'                  },
    { course_code:'CIS241',  subject:'Operating Systems',                           faculty:'Mr. Md. Nasimul Kader'               },
    { course_code:'CIS241L', subject:'Operating Systems Lab',                       faculty:'Mr. Md. Nasimul Kader'               },
  ],
  'Semester 6': [
    { course_code:'CIS323',  subject:'Information System Architecture and Planning',faculty:'Mr. Md. Sarwar Hossain Mollah'       },
    { course_code:'CIS313',  subject:'Artificial Intelligence',                     faculty:'Mr. Md. Faruk Hosen'                 },
    { course_code:'MGT422',  subject:'Industrial Management',                       faculty:'Management Department'               },
    { course_code:'CIS323L', subject:'Information System Architecture Lab',         faculty:'Mr. Md. Sarwar Hossain Mollah'       },
    { course_code:'CIS313L', subject:'Artificial Intelligence Lab',                 faculty:'Mr. Md. Faruk Hosen'                 },
  ],
  'Semester 7': [
    { course_code:'ECO314',  subject:'Economics',                                   faculty:'Business & Entrepreneurship Dept'    },
    { course_code:'CIS324',  subject:'Web Engineering',                             faculty:'Mr. Israfil'                         },
    { course_code:'CIS324L', subject:'Web Engineering Lab',                         faculty:'Mr. Israfil'                         },
    { course_code:'IoT336',  subject:'IoT and Embedded Systems',                    faculty:'Mr. Md. Ashiqul Islam'               },
    { course_code:'IoT336L', subject:'IoT and Embedded Systems Lab',                faculty:'Mr. Md. Ashiqul Islam'               },
    { course_code:'BI334',   subject:'Data Analysis and Business Modeling',         faculty:'Mr. Md. Mehedi Hassan'               },
  ],
  'Semester 8': [
    { course_code:'CIS414',  subject:'Information System Management / MSS',        faculty:'Ms. Sonia Nasrin'                    },
    { course_code:'IoT429',  subject:'Machine Learning for IoT',                    faculty:'Mr. Md. Faruk Hosen'                 },
    { course_code:'CIS435',  subject:'Cloud Computing',                             faculty:'Mr. Md. Biplob Hossain'              },
    { course_code:'CIS435L', subject:'Cloud Computing Lab',                         faculty:'Mr. Md. Biplob Hossain'              },
  ],
};

// Attach credits automatically (lab = 1.5, theory = 3)
const SEMESTER_DATA = Object.fromEntries(
  Object.entries(RAW_SEMESTER_DATA).map(([sem, courses]) => [
    sem,
    courses.map(c => ({ ...c, credits: cr(c.course_code) })),
  ])
);

const ALL_COURSES = Object.values(SEMESTER_DATA).flat();

// ── Prerequisite Map ──────────────────────────────────────────────────────────
// Maps course_code → array of course_codes that MUST be completed before enrollment
const PREREQUISITES = {
  // Semester 2
  'CIS122':  ['CIS115'],           // Data Structure ← Structured Programming
  'CIS122L': ['CIS115L'],          // Data Structure Lab ← SP Lab
  'ENG102':  ['ENG101'],           // English II ← English I

  // Semester 3
  'CIS132':  ['CIS122'],           // Algorithms ← Data Structure
  'CIS132L': ['CIS122L'],          // Algorithms Lab ← DS Lab
  'CIS133':  ['CIS115'],           // Website Development ← Structured Programming
  'CIS133L': ['CIS115L'],          // Website Dev Lab ← SP Lab
  'CIS123':  ['CIS115', 'MAT101'], // Discrete Mathematics ← SP + Mathematics-I

  // Semester 4
  'CIS232':  ['CIS122'],           // OOP ← Data Structure
  'CIS232L': ['CIS122L'],          // OOP Lab ← DS Lab
  'CIS211':  ['CIS131'],           // Computer Networks ← Computer Architecture
  'CIS211L': ['CIS131'],           // Networks Lab ← Architecture

  // Semester 5
  'CIS222':  ['CIS232'],           // DBMS ← OOP
  'CIS222L': ['CIS232L'],          // DBMS Lab ← OOP Lab
  'CIS241':  ['CIS131'],           // Operating Systems ← Architecture
  'CIS241L': ['CIS131'],           // OS Lab ← Architecture
  'FIN232':  ['ACC101'],           // Financial Management ← Accounting

  // Semester 6
  'CIS323':  ['CIS222'],           // IS Architecture ← DBMS
  'CIS323L': ['CIS222L'],          // IS Architecture Lab ← DBMS Lab
  'CIS313':  ['CIS132'],           // Artificial Intelligence ← Algorithms
  'CIS313L': ['CIS132L'],          // AI Lab ← Algorithms Lab

  // Semester 7
  'CIS324':  ['CIS133', 'CIS232'], // Web Engineering ← Website Dev + OOP
  'CIS324L': ['CIS133L','CIS232L'],// Web Engineering Lab
  'IoT336':  ['CIS211'],           // IoT & Embedded Systems ← Computer Networks
  'IoT336L': ['CIS211L'],          // IoT Lab ← Networks Lab
  'BI334':   ['CIS222'],           // Data Analysis ← DBMS

  // Semester 8
  'CIS414':  ['CIS323'],           // IS Management ← IS Architecture
  'IoT429':  ['IoT336','CIS313'],  // ML for IoT ← IoT + AI
  'CIS435':  ['CIS241','CIS211'],  // Cloud Computing ← OS + Computer Networks
  'CIS435L': ['CIS241L','CIS211L'],// Cloud Computing Lab
};

const SEMESTER_ORDER = [
  'Semester 1','Semester 2','Semester 3','Semester 4',
  'Semester 5','Semester 6','Semester 7','Semester 8',
];

// Returns set of course codes "completed" — all courses in semesters BEFORE selSem
const getCompletedCourseCodes = (currentSemester) => {
  const idx = SEMESTER_ORDER.indexOf(currentSemester);
  if (idx <= 0) return new Set();
  const completed = new Set();
  for (let i = 0; i < idx; i++) {
    (SEMESTER_DATA[SEMESTER_ORDER[i]] || []).forEach(c => completed.add(c.course_code));
  }
  return completed;
};

// Returns array of missing prerequisite codes for a given course
const getMissingPrereqs = (courseCode, completedCodes) =>
  (PREREQUISITES[courseCode] || []).filter(p => !completedCodes.has(p));

// Lookup a course's name from its code
const findCourse = (code) => ALL_COURSES.find(c => c.course_code === code);

// ── Prerequisite Error Modal ──────────────────────────────────────────────────
const PrereqErrorModal = ({ error, onClose }) => {
  if (!error) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4"
         style={{ background:'rgba(0,0,0,0.55)', backdropFilter:'blur(4px)' }}
         onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl animate-fade-in" style={{ background:'white' }}>
        {/* Header */}
        <div className="px-6 py-5 flex items-start gap-4" style={{ background:'#fef2f2', borderBottom:'1px solid #fecaca' }}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background:'#fee2e2' }}>
            <span className="material-symbols-outlined text-2xl" style={{ color:'#dc2626', fontVariationSettings:"'FILL' 1" }}>lock</span>
          </div>
          <div>
            <h3 className="font-extrabold text-lg leading-tight" style={{ color:'#991b1b' }}>
              Prerequisites Not Met
            </h3>
            <p className="text-sm mt-1" style={{ color:'#b91c1c' }}>
              You cannot enroll in <strong>{error.course.course_code}</strong> yet.
            </p>
          </div>
          <button onClick={onClose} className="ml-auto p-1 rounded-lg flex-shrink-0"
            style={{ color:'#9ca3af' }}
            onMouseEnter={e => e.currentTarget.style.background='#f3f4f6'}
            onMouseLeave={e => e.currentTarget.style.background='transparent'}>
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Course being blocked */}
        <div className="px-6 py-4" style={{ borderBottom:'1px solid #f3f4f6' }}>
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color:'#6b7280' }}>Attempted Course</p>
          <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background:'#fef2f2', border:'1px solid #fecaca' }}>
            <span className="material-symbols-outlined" style={{ color:'#dc2626', fontVariationSettings:"'FILL' 1" }}>block</span>
            <div>
              <span className="font-mono font-bold text-sm" style={{ color:'#dc2626' }}>{error.course.course_code}</span>
              <p className="text-sm font-semibold" style={{ color:'#374151' }}>{error.course.subject}</p>
            </div>
          </div>
        </div>

        {/* Missing prerequisites */}
        <div className="px-6 py-4">
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color:'#6b7280' }}>
            Missing Prerequisites ({error.missing.length})
          </p>
          <div className="space-y-2">
            {error.missing.map(code => {
              const c = findCourse(code);
              const inSem = Object.entries(SEMESTER_DATA).find(([, cs]) => cs.some(x => x.course_code === code));
              return (
                <div key={code} className="flex items-center gap-3 p-3 rounded-xl" style={{ background:'#fefce8', border:'1px solid #fde68a' }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background:'#fef08a' }}>
                    <span className="material-symbols-outlined text-base" style={{ color:'#b45309' }}>assignment_late</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm" style={{ color:'#b45309' }}>{code}</span>
                      {inSem && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                              style={{ background:'#fde68a', color:'#78350f' }}>{inSem[0]}</span>
                      )}
                    </div>
                    {c && <p className="text-xs truncate" style={{ color:'#374151' }}>{c.subject}</p>}
                  </div>
                  <span className="material-symbols-outlined text-base flex-shrink-0" style={{ color:'#d97706' }}>warning</span>
                </div>
              );
            })}
          </div>
          <p className="text-xs mt-4 leading-relaxed" style={{ color:'#6b7280' }}>
            Complete the prerequisite course(s) listed above before registering for <strong>{error.course.course_code}</strong>.
            If you have already passed these via transfer or waiver, contact the registrar's office.
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 py-4" style={{ background:'#f9fafb', borderTop:'1px solid #f3f4f6' }}>
          <button onClick={onClose}
            className="w-full py-3 font-bold rounded-xl transition-all active:scale-95"
            style={{ background:'#0c1282', color:'white' }}>
            Understood
          </button>
        </div>
      </div>
    </div>
  );
};

const STEPS = [
  { id:1, label:'Course Selection' },
  { id:2, label:'Payment'          },
  { id:3, label:'Advisor Approval' },
  { id:4, label:'Complete'         },
];

function calcFees(cart) {
  const reg     = cart.filter(c => c.type === 'regular');
  const retake  = cart.filter(c => c.type === 'retake');
  const drop    = cart.filter(c => c.type === 'drop');
  const regCr   = reg.reduce((s,c) => s + c.course.credits, 0);
  const totalCr = cart.reduce((s,c) => s + c.course.credits, 0);
  const regFee    = Math.round(regCr * FEE_PER_CREDIT);
  const retakeFee = retake.length * RETAKE_FEE;
  const dropFee   = drop.length   * DROP_FEE;
  return {
    regCr, totalCr,
    regFee,
    retakeFee,
    dropFee,
    total:       regFee + retakeFee + dropFee,
    retakeCount: retake.length,
    dropCount:   drop.length,
  };
}

// Renders **bold** markers as <strong> and preserves line breaks
function renderAdvisorContent(text) {
  return text.split('\n').map((line, li) => {
    const parts = line.split(/\*\*(.*?)\*\*/g);
    return (
      <span key={li}>
        {parts.map((part, pi) => pi % 2 === 1 ? <strong key={pi}>{part}</strong> : part)}
        {'\n'}
      </span>
    );
  });
}

async function callDeepSeek(msgs, sys) {
  const url = `${API_CONFIG.AI_BASE_URL}/api/v1/ai/smart-advisor`;
  const res = await axios.post(url, { messages: msgs, systemPrompt: sys, maxTokens: 1024 });
  const data = res.data;
  if (!data.success) throw new Error(data.message || 'Backend error');
  return data.reply || '';
}

// ── Main component ────────────────────────────────────────────────────────────
export const CourseRegistrationPage = () => {
  const navigate  = useNavigate();
  const location  = useLocation();

  // course state
  const [selSem,    setSelSem]    = useState('Semester 5');
  const [cart,      setCart]      = useState([]);
  const [allChecked, setAllChecked] = useState(false);
  const [checked,   setChecked]   = useState({});

  // workflow
  const [step,          setStep]          = useState(1);
  const [paymentDone,   setPaymentDone]   = useState(false);
  const [evalDone,      setEvalDone]      = useState(false);
  const [approved,      setApproved]      = useState(false);
  const [payLoading,    setPayLoading]    = useState(false);

  // chat
  const [chatOpen,  setChatOpen]  = useState(false);
  const [chatFull,  setChatFull]  = useState(false);
  const [chatMsgs,  setChatMsgs]  = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [greeted,   setGreeted]   = useState(false);
  const chatEndRef = useRef(null);

  // prerequisite error modal
  const [prereqError,   setPrereqError]   = useState(null); // { course, missing[] }

  // picker modal
  const [showPicker,    setShowPicker]    = useState(false);
  const [pickerType,    setPickerType]    = useState('regular');
  const [pickerSearch,  setPickerSearch]  = useState('');


  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior:'smooth' }); }, [chatMsgs]);

  useEffect(() => {
    if (chatOpen && !greeted) {
      setChatMsgs([{ role:'assistant', content:"Hello! I'm Smart Advisor, your AI-powered academic assistant.\n\nI can help you:\n• Guide course registration\n• Verify payment status\n• Check teaching evaluations\n• Approve your registration\n\nHow can I assist you today?" }]);
      setGreeted(true);
    }
  }, [chatOpen, greeted]);

  // ── Detect return from payment page and trigger advisor sequence ─────────────
  useEffect(() => {
    const st = location.state;
    if (!st?.paymentCompleted) return;
    // Restore semester + cart
    if (st.semester) setSelSem(st.semester);
    if (st.courses?.length) {
      setCart(st.courses.map(c => ({ course: c, type: c.type || 'regular' })));
    }
    // Kick off post-payment advisor flow
    setPaymentDone(true);
    setStep(2);
    setGreeted(true);
    setChatOpen(true);
    setChatMsgs([{
      role: 'assistant',
      content: `✅ **Payment Confirmed!**\n\nReceipt ID: **${st.receiptId || '—'}**\nAmount Paid: **৳${Number(st.totalFee || 0).toLocaleString()}**\n\nNow checking your **Teaching Evaluations**...`,
    }]);
    const t1 = setTimeout(() => {
      setEvalDone(true);
      setStep(3);
      setChatMsgs(p => [...p, {
        role: 'assistant',
        content: `📋 **Teaching Evaluation Check**\n\n✅ All course surveys submitted.\n✅ No pending evaluations found.\n\nFinalising Smart Advisor approval...`,
      }]);
    }, 2500);
    const t2 = setTimeout(() => {
      setApproved(true);
      setStep(4);
      setChatMsgs(p => [...p, {
        role: 'assistant',
        content: `🎓 **All Checks Passed — Registration Complete!**\n\n✅ Payment: Confirmed\n✅ Teaching Evaluations: Completed\n✅ Smart Advisor Approval: **GRANTED**\n\nYou are now enrolled in **${st.courses?.length || 0} course(s)** for **${st.semester}**.\n\nCongratulations! 🎉`,
      }]);
      toast.success('Registration complete! Smart Advisor approved.');
    }, 5500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fees      = calcFees(cart);
  const cartCodes = cart.map(c => c.course.course_code);
  const available = SEMESTER_DATA[selSem] ?? [];

  // Completed courses = all courses from semesters BEFORE selSem
  const completedCodes = getCompletedCourseCodes(selSem);

  const addCourse = (course, type='regular') => {
    if (cartCodes.includes(course.course_code)) { toast.warning(`${course.course_code} already added`); return; }
    if (fees.totalCr + course.credits > MAX_CREDITS) { toast.error(`Cannot exceed ${MAX_CREDITS} credits`); return; }

    // Skip prereq check for retake/drop requests (student has taken the course before)
    if (type === 'regular') {
      const missing = getMissingPrereqs(course.course_code, completedCodes);
      if (missing.length > 0) {
        setPrereqError({ course, missing });
        return;
      }
    }

    setCart(p => [...p, { course, type }]);
    toast.success(`${course.course_code} added`);
  };

  const removeCourse = (code) => {
    setCart(p => p.filter(c => c.course.course_code !== code));
    setChecked(p => { const n={...p}; delete n[code]; return n; });
  };

  const dropSelected = () => {
    const toDrop = Object.keys(checked).filter(k => checked[k]);
    if (!toDrop.length) { toast.info('Select courses to drop first'); return; }
    setCart(p => p.map(c => toDrop.includes(c.course.course_code) ? {...c, type:'drop'} : c));
    setChecked({});
    setAllChecked(false);
    toast.info(`${toDrop.length} course(s) marked as Drop Request`);
  };

  const changeType = (code, t) => setCart(p => p.map(c => c.course.course_code===code ? {...c,type:t} : c));

  const toggleCheck = (code) => setChecked(p => ({...p, [code]: !p[code]}));
  const toggleAll   = () => {
    const next = !allChecked;
    setAllChecked(next);
    const obj={};
    cart.forEach(c => { obj[c.course.course_code]=next; });
    setChecked(obj);
  };

  // step labels
  const statusLabel = approved ? 'Fully Registered' : paymentDone ? 'Awaiting Approval' : cart.length ? 'Partially Registered' : 'Not Started';

  const handlePayment = () => {
    if (!cart.length)               { toast.error('Select at least one course');              return; }
    if (fees.totalCr < MIN_CREDITS) { toast.error(`Minimum ${MIN_CREDITS} credits required`); return; }
    setPayLoading(true);
    navigate('/course-payment', {
      state: {
        type: 'course',
        semester: selSem,
        courses: cart.map(c => ({ ...c.course, type: c.type })),
        totalCredits: fees.totalCr,
        totalFee: fees.total,
      },
    });
  };

  const buildSys = () => {
    const reg = cart.filter(c=>c.type==='regular');
    const ret = cart.filter(c=>c.type==='retake');
    const drp = cart.filter(c=>c.type==='drop');
    const allSemesterInfo = Object.entries(RAW_SEMESTER_DATA).map(([sem, courses]) =>
      `${sem}:\n` + courses.map(c=>`  - ${c.course_code} | ${c.subject} | ${c.credits||cr(c.course_code)} cr | Faculty: ${c.faculty}`).join('\n')
    ).join('\n');
    return `You are Smart Advisor at Daffodil International University (DIU), Bangladesh — a Course Registration expert.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STUDENT CURRENT SESSION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Selected Semester: ${selSem}
- Step: ${step}/4 (1=Course Selection, 2=Payment, 3=Advisor Approval, 4=Complete)
- Regular courses (${reg.length}): ${reg.map(c=>`${c.course.course_code} - ${c.course.subject}`).join('; ')||'None selected'}
- Retake courses (${ret.length}): ${ret.map(c=>`${c.course.course_code} - ${c.course.subject}`).join('; ')||'None'}
- Drop courses (${drp.length}): ${drp.map(c=>`${c.course.course_code} - ${c.course.subject}`).join('; ')||'None'}
- Total Credits: ${fees.totalCr} | Total Fee: ৳${fees.total.toLocaleString()}
- Payment: ${paymentDone?'✅ CONFIRMED':'⏳ PENDING'} | Teaching Eval: ${evalDone?'✅ DONE':'⏳ PENDING'} | Advisor Approved: ${approved?'✅ YES':'⏳ NO'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FEE RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Regular: ৳30,000 per 11 credits (≈৳2,727/credit)
- Retake: ৳3,000 per course (flat)
- Drop: ৳1,000 per course (flat)
- Min credits: ${MIN_CREDITS} | Max credits: ${MAX_CREDITS}
- Lab courses: 1 credit | Theory courses: 3 credits

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REGISTRATION STEPS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Step 1 → Select courses (regular/retake/drop), stay within ${MIN_CREDITS}–${MAX_CREDITS} credits
Step 2 → Pay fees online (bKash/card/bank)
Step 3 → Complete Teaching Evaluation + get Smart Advisor approval
Step 4 → Registration complete — receive confirmation

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FULL COURSE CATALOG (CIS Department, DIU)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${allSemesterInfo}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PREREQUISITE RULES (STRICTLY ENFORCED)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
A student cannot register for an advanced course without completing its prerequisite(s).
Key chains:
  • CIS115 (SP) → CIS122 (DS) → CIS132 (Algorithms) → CIS313 (AI)
  • CIS115 (SP) → CIS133 (Website Dev) → CIS324 (Web Engineering)
  • CIS122 (DS) → CIS232 (OOP) → CIS222 (DBMS) → CIS323 (IS Architecture) → CIS414 (IS Mgmt)
  • CIS131 (Arch) → CIS211 (Networks) → IoT336 (IoT) → IoT429 (ML for IoT)
  • CIS131 (Arch) → CIS241 (OS) → CIS435 (Cloud Computing)
  • ENG101 → ENG102 | ACC101 → FIN232
  • IoT429 requires BOTH IoT336 AND CIS313
  • CIS435 requires BOTH CIS241 AND CIS211
Currently completed semesters (assumed for ${selSem}): ${
  SEMESTER_ORDER.slice(0, SEMESTER_ORDER.indexOf(selSem)).join(', ') || 'None'
}
Locked courses in ${selSem}: ${
  (SEMESTER_DATA[selSem] || [])
    .filter(c => getMissingPrereqs(c.course_code, getCompletedCourseCodes(selSem)).length > 0)
    .map(c => `${c.course_code} (needs ${getMissingPrereqs(c.course_code, getCompletedCourseCodes(selSem)).join(', ')})`)
    .join('; ') || 'None — all available!'
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
YOUR ROLE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Answer questions about any course: name, code, credits, faculty/sir name
- Help calculate fees for any combination of courses
- Guide the student through the 4-step registration process
- Enforce prerequisite rules — if a student asks to add a locked course, explain clearly what they need to complete first
- Be warm, friendly, and concise (<150 words unless detailed calculation needed)`;
  };

  const sendChatText = async (text) => {
    if (!text || chatLoading) return;
    const updated = [...chatMsgs, {role:'user',content:text}];
    setChatMsgs(updated); setChatInput(''); setChatLoading(true);
    try {
      const reply = await callDeepSeek(updated.slice(-12), buildSys());
      setChatMsgs(p => [...p, {role:'assistant',content:reply}]);
      if (!approved && paymentDone && evalDone && reply.toLowerCase().includes('approv')) { setApproved(true); setStep(4); }
    } catch (err) { setChatMsgs(p => [...p, {role:'assistant',content:"I'm temporarily unavailable. Please try again."}]); }
    finally { setChatLoading(false); }
  };
  const sendChat = () => sendChatText(chatInput.trim());

  const pickerList = ALL_COURSES.filter(c =>
    !cartCodes.includes(c.course_code) &&
    (c.course_code.toLowerCase().includes(pickerSearch.toLowerCase()) || c.subject.toLowerCase().includes(pickerSearch.toLowerCase()))
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen font-headline" style={{ background:'#f7f9fb', color:'#191c1e', fontFamily:'Manrope, sans-serif' }}>

      <Navigation />

      {/* ── Side Nav ──────────────────────────────────────────────── */}
      <aside className="fixed left-0 top-0 h-full w-64 z-30 flex-col py-4 pt-20 hidden lg:flex"
        style={{ background:'#f8fafc', borderRight:'1px solid #e2e8f0' }}>
        <div className="px-6 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background:'#0c1282' }}>
              <span className="material-symbols-outlined text-white text-xl" style={{ fontVariationSettings:"'FILL' 1" }}>school</span>
            </div>
            <div>
              <h2 className="text-base font-extrabold tracking-tight" style={{ color:'#1e3a5f' }}>DIU Portal</h2>
              <p className="text-[10px] uppercase tracking-widest" style={{ color:'#464652' }}>Student</p>
            </div>
          </div>
        </div>
        <nav className="flex-grow space-y-0.5 px-2">
          {[
            { icon:'dashboard',       label:'Dashboard',          action:() => navigate('/'),                       active:false },
            { icon:'school',          label:'Course Registration', action:() => navigate('/course-registration'),   active:true  },
            { icon:'pending_actions', label:'Late Registration',   action:() => navigate('/late-registration'),     active:false },
          ].map(({ icon, label, action, active }) => (
            <button key={label} onClick={action}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium transition-all"
              style={active ? { background:'#ffdad6', color:'#ba1a1a' } : { color:'#475569' }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.background='#f1f5f9'; e.currentTarget.style.color='#1e3a5f'; } }}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='#475569'; } }}>
              <span className="material-symbols-outlined text-xl" style={active ? { fontVariationSettings:"'FILL' 1" } : {}}>{icon}</span>
              {label}
            </button>
          ))}
        </nav>
      </aside>

      {/* ── Main Canvas ──────────────────────────────────────────── */}
      <main className="pt-16 min-h-screen pb-4 lg:ml-64">
        <div className="p-4 md:p-6 lg:p-8">

          {/* Late Registration Alert */}
          <div className="mb-8 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-l-4"
               style={{ background:'#ffdad6', borderLeftColor:'#ba1a1a', color:'#410002' }}>
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined shrink-0" style={{ color:'#ba1a1a' }}>warning</span>
              <div>
                <span className="font-bold">REGISTRATION NOTICE:</span>
                <span className="text-sm ml-1">
                  {approved
                    ? 'Your registration is complete. Courses are confirmed for Spring 2026.'
                    : 'Registration portal closes in 48 hours. Complete your course selection and payment before the deadline.'}
                </span>
              </div>
            </div>
            <button className="text-xs font-bold uppercase tracking-widest underline whitespace-nowrap self-start sm:self-auto"
                    onClick={() => toast.info('Registration deadline: October 31, 2024')}>
              View Deadlines
            </button>
          </div>

          {/* Section Header */}
          <div className="mb-10">
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tighter mb-2" style={{ color:'#000155' }}>
              Course Registration
            </h1>
            <p className="text-lg max-w-2xl" style={{ color:'#464652' }}>
              Finalize your curriculum for the upcoming semester. Ensure advisor approval before the deadline.
            </p>
          </div>

          {/* Progress Stepper */}
          <div className="mb-12 relative">
            <div className="grid grid-cols-4 gap-4">
              {STEPS.map((s, i) => (
                <div key={s.id} className="flex flex-col items-center gap-2 relative">
                  {i < STEPS.length - 1 && (
                    <div className="absolute top-5 left-1/2 w-full h-0.5 z-0"
                         style={{ background: step > s.id ? '#0c1282' : '#c6c5d4' }} />
                  )}
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm z-10 transition-all"
                       style={step > s.id
                         ? { background:'#4ade80', color:'white' }
                         : step === s.id
                         ? { background:'#0c1282', color:'white', boxShadow:'0 0 0 4px rgba(12,18,130,0.15)' }
                         : { background:'#e0e3e5', color:'#464652', border:'2px solid #c6c5d4' }}>
                    {step > s.id ? <span className="material-symbols-outlined text-base">check</span> : s.id}
                  </div>
                  <span className="text-[10px] sm:text-xs font-bold text-center hidden xs:block sm:block"
                        style={{ color: step >= s.id ? '#000155' : '#767684' }}>
                    <span className="hidden sm:inline">{s.label}</span>
                    <span className="sm:hidden">{s.id}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-12 gap-6">

            {/* ── LEFT col (8) ─────────────────────────────────── */}
            <div className="col-span-12 lg:col-span-8 space-y-6">

              {/* Status Summary */}
              <div className="p-6 rounded-xl border-l-4" style={{ background:'#f2f4f6', borderLeftColor:'#0c1282' }}>
                <div className="flex justify-between items-start flex-wrap gap-4">
                  <div>
                    <h3 className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color:'#464652' }}>Current Status</h3>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-2xl lg:text-3xl font-extrabold" style={{ color:'#191c1e' }}>{statusLabel}</span>
                      <span className="px-3 py-1 rounded-full text-xs font-bold"
                            style={{ background:'rgba(0,1,85,0.08)', color:'#000155' }}>
                        {fees.totalCr} / {MAX_CREDITS} Credits
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs" style={{ color:'#464652' }}>Advisor Assigned</p>
                    <p className="font-bold" style={{ color:'#191c1e' }}>Smart Advisor (AI)</p>
                  </div>
                </div>
              </div>

              {/* Semester Picker Row */}
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <label className="text-sm font-bold" style={{ color:'#464652' }}>Add from:</label>
                  <select value={selSem} onChange={e => setSelSem(e.target.value)}
                    className="border rounded-lg px-3 py-1.5 text-sm font-semibold outline-none focus:ring-2"
                    style={{ background:'white', borderColor:'#c6c5d4', color:'#191c1e', focusRingColor:'#0c1282' }}>
                    {Object.keys(SEMESTER_DATA).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                {step === 1 && (
                  <div className="flex gap-2">
                    <button onClick={() => { setPickerType('retake'); setPickerSearch(''); setShowPicker(true); }}
                      className="text-xs font-bold px-4 py-2 rounded-lg border transition-colors"
                      style={{ color:'#0c1282', borderColor:'#0c1282', background:'transparent' }}
                      onMouseEnter={e => e.currentTarget.style.background='#eff6ff'}
                      onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                      Retake Request
                    </button>
                    <button onClick={dropSelected}
                      className="text-xs font-bold px-4 py-2 rounded-lg border transition-colors"
                      style={{ color:'#ba1a1a', borderColor:'#ba1a1a', background:'transparent' }}
                      onMouseEnter={e => e.currentTarget.style.background='#ffdad6'}
                      onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                      Drop Selected
                    </button>
                  </div>
                )}
              </div>

              {/* Course Table */}
              <div className="rounded-xl overflow-hidden shadow-sm" style={{ background:'white' }}>
                <div className="p-5 flex justify-between items-center" style={{ borderBottom:'1px solid #e6e8ea' }}>
                  <h3 className="font-bold" style={{ color:'#000155' }}>
                    Selected Courses
                    <span className="ml-2 text-xs font-bold px-2 py-0.5 rounded-full" style={{ background:'#eff6ff', color:'#0c1282' }}>
                      {cart.length}
                    </span>
                  </h3>
                  <div className="text-xs font-bold" style={{ color:'#464652' }}>
                    {fees.totalCr} credits selected
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead style={{ background:'#f2f4f6' }}>
                      <tr>
                        <th className="p-4 w-12">
                          <input type="checkbox" checked={allChecked} onChange={toggleAll}
                            className="rounded" style={{ accentColor:'#0c1282' }} />
                        </th>
                        <th className="p-4 text-[11px] font-bold uppercase tracking-wider" style={{ color:'#464652' }}>Code</th>
                        <th className="p-4 text-[11px] font-bold uppercase tracking-wider" style={{ color:'#464652' }}>Course Name</th>
                        <th className="p-4 text-[11px] font-bold uppercase tracking-wider text-center" style={{ color:'#464652' }}>Credits</th>
                        <th className="p-4 text-[11px] font-bold uppercase tracking-wider" style={{ color:'#464652' }}>Type</th>
                        <th className="p-4 text-[11px] font-bold uppercase tracking-wider" style={{ color:'#464652' }}>Status</th>
                        <th className="p-4 w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {cart.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-14 text-center text-sm" style={{ color:'#767684' }}>
                            <span className="material-symbols-outlined text-4xl block mb-2" style={{ color:'#c6c5d4' }}>playlist_add</span>
                            No courses selected. Use the semester selector above to add courses.
                          </td>
                        </tr>
                      ) : cart.map(({ course, type }) => (
                        <tr key={course.course_code} className="transition-colors"
                            style={{ borderBottom:'1px solid #e6e8ea' }}
                            onMouseEnter={e => e.currentTarget.style.background='#f7f9fb'}
                            onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                          <td className="p-4">
                            <input type="checkbox" checked={!!checked[course.course_code]} onChange={() => toggleCheck(course.course_code)}
                              className="rounded" style={{ accentColor:'#0c1282' }} />
                          </td>
                          <td className="p-4 font-mono text-sm font-bold" style={{ color:'#0c1282' }}>{course.course_code}</td>
                          <td className="p-4 font-bold text-sm max-w-xs truncate" style={{ color:'#191c1e' }}>{course.subject}</td>
                          <td className="p-4 text-center text-sm" style={{ color:'#191c1e' }}>{course.credits}.0</td>
                          <td className="p-4">
                            <select value={type} onChange={e => changeType(course.course_code, e.target.value)}
                              disabled={step > 1}
                              className="text-xs font-semibold border rounded px-2 py-1 outline-none"
                              style={{ borderColor:'#c6c5d4', background:'#f7f9fb', color: type==='retake' ? '#b45309' : type==='drop' ? '#ba1a1a' : '#191c1e' }}>
                              <option value="regular">Regular</option>
                              <option value="retake">Retake</option>
                              <option value="drop">Drop</option>
                            </select>
                          </td>
                          <td className="p-4">
                            {approved ? (
                              <span className="px-2 py-1 rounded-md text-[10px] font-bold uppercase" style={{ background:'#d5e3fc', color:'#0d1c2e' }}>Approved</span>
                            ) : paymentDone ? (
                              <span className="px-2 py-1 rounded-md text-[10px] font-bold uppercase" style={{ background:'#fef3c7', color:'#92400e' }}>Processing</span>
                            ) : (
                              <span className="px-2 py-1 rounded-md text-[10px] font-bold uppercase" style={{ background:'#e6e8ea', color:'#464652' }}>Pending</span>
                            )}
                          </td>
                          <td className="p-4">
                            {step === 1 && (
                              <button onClick={() => removeCourse(course.course_code)}
                                className="transition-colors" style={{ color:'#767684' }}
                                onMouseEnter={e => e.currentTarget.style.color='#ba1a1a'}
                                onMouseLeave={e => e.currentTarget.style.color='#767684'}>
                                <span className="material-symbols-outlined text-xl">delete_outline</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Add more courses row */}
                <div className="p-4 flex flex-wrap justify-center gap-2" style={{ background:'#f2f4f6' }}>
                  {available.filter(c => !cartCodes.includes(c.course_code)).length > 0 ? (
                    available.filter(c => !cartCodes.includes(c.course_code)).slice(0, 4).map(course => {
                      const missing = getMissingPrereqs(course.course_code, completedCodes);
                      const isLocked = missing.length > 0;
                      return (
                        <button key={course.course_code}
                          disabled={step > 1}
                          onClick={() => addCourse(course)}
                          title={isLocked ? `Requires: ${missing.join(', ')}` : `Add ${course.course_code}`}
                          className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg transition-all disabled:opacity-40"
                          style={{
                            color: isLocked ? '#dc2626' : '#0c1282',
                            background: isLocked ? '#fee2e2' : '#eff6ff',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background= isLocked ? '#fecaca' : '#dbeafe'}
                          onMouseLeave={e => e.currentTarget.style.background= isLocked ? '#fee2e2' : '#eff6ff'}>
                          <span className="material-symbols-outlined text-sm"
                                style={{ fontVariationSettings:"'FILL' 1" }}>
                            {isLocked ? 'lock' : 'add_circle'}
                          </span>
                          {course.course_code}
                        </button>
                      );
                    })
                  ) : null}
                  <button onClick={() => { setPickerType('regular'); setPickerSearch(''); setShowPicker(true); }}
                    disabled={step > 1}
                    className="flex items-center gap-2 text-sm font-bold hover:underline disabled:opacity-40"
                    style={{ color:'#0c1282' }}>
                    <span className="material-symbols-outlined text-sm">add_circle</span>
                    Browse all courses
                  </button>
                </div>
              </div>

              {/* Citation block */}
              <div className="p-6 rounded-xl border-l-4" style={{ background:'#d8e3fb', borderLeftColor:'#000155' }}>
                <p className="italic leading-relaxed" style={{ color:'#3c475a' }}>
                  "Academic progress is governed by the university charter. Students are required to maintain a minimum of {MIN_CREDITS} credits to be considered full-time.
                  Dropping below this limit may affect scholarship eligibility and student status."
                </p>
                <p className="mt-3 text-xs font-bold uppercase" style={{ color:'#000155' }}>— University Registrar, DIU</p>
              </div>
            </div>

            {/* ── RIGHT col (4) ────────────────────────────────── */}
            <div className="col-span-12 lg:col-span-4 space-y-6">

              {/* Credit Load */}
              <div className="p-6 rounded-xl text-white" style={{ background:'#0c1282' }}>
                <h3 className="text-[10px] font-bold uppercase tracking-widest opacity-70 mb-4">Credit Load Analysis</h3>
                <div className="flex items-end gap-2 mb-4">
                  <span className="text-5xl font-extrabold leading-none">{fees.totalCr}</span>
                  <span className="text-xl font-medium opacity-60">/ {MAX_CREDITS} max</span>
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden mb-5" style={{ background:'rgba(255,255,255,0.2)' }}>
                  <div className="h-full rounded-full transition-all duration-500"
                       style={{
                         width:`${Math.min((fees.totalCr/MAX_CREDITS)*100,100)}%`,
                         background: fees.totalCr < MIN_CREDITS ? '#fb923c' : '#e0e0ff'
                       }} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg" style={{ background:'rgba(255,255,255,0.1)' }}>
                    <p className="text-[10px] uppercase opacity-70 mb-1">Regular</p>
                    <p className="text-lg font-bold">{cart.filter(c=>c.type==='regular').length} courses</p>
                  </div>
                  <div className="p-3 rounded-lg" style={{ background:'rgba(255,255,255,0.1)' }}>
                    <p className="text-[10px] uppercase opacity-70 mb-1">Retake / Drop</p>
                    <p className="text-lg font-bold">{fees.retakeCount + fees.dropCount}</p>
                  </div>
                </div>
              </div>

              {/* Tuition & Fees */}
              <div className="p-6 rounded-xl shadow-sm" style={{ background:'white', border:'1px solid rgba(198,197,212,0.3)' }}>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-bold" style={{ color:'#191c1e' }}>Tuition &amp; Fees</h3>
                  <span className="material-symbols-outlined" style={{ color:'#464652' }}>payments</span>
                </div>
                <div className="space-y-3 mb-6 text-sm">
                  <div className="flex justify-between">
                    <span style={{ color:'#464652' }}>Regular ({fees.regCr} cr)</span>
                    <span className="font-bold" style={{ color:'#191c1e' }}>৳{fees.regFee.toLocaleString()}</span>
                  </div>
                  {fees.retakeFee > 0 && (
                    <div className="flex justify-between">
                      <span style={{ color:'#b45309' }}>Retake ({fees.retakeCount} × ৳{RETAKE_FEE.toLocaleString()})</span>
                      <span className="font-bold" style={{ color:'#b45309' }}>৳{fees.retakeFee.toLocaleString()}</span>
                    </div>
                  )}
                  {fees.dropFee > 0 && (
                    <div className="flex justify-between">
                      <span style={{ color:'#ba1a1a' }}>Drop ({fees.dropCount} × ৳{DROP_FEE.toLocaleString()})</span>
                      <span className="font-bold" style={{ color:'#ba1a1a' }}>৳{fees.dropFee.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="h-px" style={{ background:'#e6e8ea' }} />
                  <div className="flex justify-between text-base">
                    <span className="font-extrabold" style={{ color:'#000155' }}>Balance Due</span>
                    <span className="font-extrabold" style={{ color:'#000155' }}>৳{fees.total.toLocaleString()}</span>
                  </div>
                </div>

                {step === 1 ? (
                  <button onClick={handlePayment} disabled={payLoading || !cart.length}
                    className="w-full py-4 font-bold rounded-lg transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-white"
                    style={{ background: cart.length ? '#000155' : '#767684' }}>
                    {payLoading
                      ? <span className="flex items-center justify-center gap-2">
                          <span className="material-symbols-outlined animate-spin text-base">refresh</span>
                          Processing...
                        </span>
                      : 'Pay Tuition Now'}
                  </button>
                ) : (
                  <div className="w-full py-3 rounded-lg text-center font-bold flex items-center justify-center gap-2"
                       style={{ background:'#d5e3fc', color:'#0d1c2e' }}>
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                    Payment Confirmed
                  </div>
                )}
                <p className="text-[10px] text-center mt-3 font-medium uppercase tracking-tight" style={{ color:'#767684' }}>
                  Secure checkout · DIU Finance Office
                </p>
              </div>

              {/* Academic Clearance */}
              <div className="p-6 rounded-xl" style={{ background:'#f2f4f6' }}>
                <h3 className="font-bold mb-5" style={{ color:'#191c1e' }}>Academic Clearance</h3>
                <div className="space-y-4">
                  {[
                    {
                      done: evalDone,
                      icon: evalDone ? 'check' : 'rate_review',
                      label: 'Teaching Evaluations',
                      sub:   evalDone ? 'All surveys submitted' : 'Verified by Smart Advisor',
                      color: '#d5e3fc', iconColor:'#0d1c2e',
                    },
                    {
                      done: paymentDone,
                      icon: paymentDone ? 'check' : 'hourglass_empty',
                      label: 'Payment Confirmed',
                      sub:   paymentDone ? 'Accounts confirmed' : step < 2 ? 'Complete payment first' : 'Processing...',
                      color: paymentDone ? '#d5e3fc' : '#e0e3e5', iconColor: paymentDone ? '#0d1c2e' : '#464652',
                    },
                    {
                      done: approved,
                      icon: approved ? 'check' : 'lock',
                      label: 'Final Enrollment',
                      sub:   approved ? `${cart.length} courses registered!` : 'Locked until clearance',
                      color: approved ? '#d5e3fc' : '#e0e3e5', iconColor: approved ? '#0d1c2e' : '#464652',
                    },
                  ].map(({ done, icon, label, sub, color, iconColor }) => (
                    <div key={label} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all"
                           style={{ background:color, color:iconColor }}>
                        <span className="material-symbols-outlined text-sm"
                              style={done ? { fontVariationSettings:"'FILL' 1" } : {}}>{icon}</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold" style={{ color: done ? '#191c1e' : '#767684' }}>{label}</p>
                        <p className="text-xs" style={{ color:'#464652' }}>{sub}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {approved && (
                  <div className="mt-5 p-4 rounded-xl text-center" style={{ background:'#d5e3fc', border:'1px solid #b9c7df' }}>
                    <span className="material-symbols-outlined text-3xl block mb-1" style={{ color:'#0c1282', fontVariationSettings:"'FILL' 1" }}>task_alt</span>
                    <p className="font-bold" style={{ color:'#0c1282' }}>Registration Complete!</p>
                    <p className="text-xs mt-1" style={{ color:'#464652' }}>You may download your registration card</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── Prerequisite Error Modal ──────────────────────────────── */}
      <PrereqErrorModal error={prereqError} onClose={() => setPrereqError(null)} />

      {/* ── Course Picker Modal ───────────────────────────────────── */}
      {showPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
             style={{ background:'rgba(0,0,0,0.5)', backdropFilter:'blur(4px)' }}
             onClick={e => e.target === e.currentTarget && setShowPicker(false)}>
          <div className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl" style={{ background:'white' }}>
            <div className="flex items-center justify-between p-5" style={{ borderBottom:'1px solid #e6e8ea' }}>
              <div>
                <h3 className="font-bold text-lg" style={{ color:'#000155' }}>
                  {pickerType === 'regular' ? 'Add Course' : pickerType === 'retake' ? 'Retake Request' : 'Drop Request'}
                </h3>
                <p className="text-xs font-semibold mt-0.5"
                   style={{ color: pickerType==='retake'?'#b45309': pickerType==='drop'?'#ba1a1a':'#464652' }}>
                  {pickerType==='retake'?`৳${RETAKE_FEE.toLocaleString()} per course`:pickerType==='drop'?`৳${DROP_FEE.toLocaleString()} per course`:'3 credits per course'}
                </p>
              </div>
              <button onClick={() => setShowPicker(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                style={{ color:'#464652' }}
                onMouseEnter={e => e.currentTarget.style.background='#f2f4f6'}
                onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
            {/* Prerequisite legend */}
            {pickerType === 'regular' && (
              <div className="px-5 py-2 flex items-center gap-4 text-xs" style={{ background:'#f8fafc', borderBottom:'1px solid #e6e8ea' }}>
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm" style={{ color:'#16a34a', fontVariationSettings:"'FILL' 1" }}>lock_open</span>
                  <span style={{ color:'#374151' }}>Available</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm" style={{ color:'#dc2626', fontVariationSettings:"'FILL' 1" }}>lock</span>
                  <span style={{ color:'#374151' }}>Prerequisites missing</span>
                </div>
              </div>
            )}
            <div className="p-4" style={{ borderBottom:'1px solid #e6e8ea' }}>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background:'#f2f4f6' }}>
                <span className="material-symbols-outlined text-sm" style={{ color:'#464652' }}>search</span>
                <input type="text" value={pickerSearch} onChange={e => setPickerSearch(e.target.value)}
                  placeholder="Search course code or name..."
                  className="flex-1 bg-transparent border-none outline-none text-sm" style={{ color:'#191c1e' }} autoFocus />
              </div>
            </div>
            <div className="max-h-72 overflow-y-auto custom-scrollbar">
              {pickerList.length === 0
                ? <p className="text-center py-10 text-sm" style={{ color:'#767684' }}>No courses found</p>
                : pickerList.map(course => {
                  const missing = pickerType === 'regular' ? getMissingPrereqs(course.course_code, completedCodes) : [];
                  const isLocked = missing.length > 0;
                  return (
                    <button key={course.course_code}
                      onClick={() => { addCourse(course, pickerType); if (!isLocked) setShowPicker(false); }}
                      className="w-full flex items-center justify-between px-5 py-3.5 text-left transition-colors"
                      style={{ borderBottom:'1px solid #f2f4f6', opacity: isLocked ? 0.75 : 1 }}
                      onMouseEnter={e => e.currentTarget.style.background= isLocked ? '#fff7ed' : '#f7f9fb'}
                      onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                      <div className="min-w-0 mr-3 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-sm font-bold" style={{ color: isLocked ? '#dc2626' : '#0c1282' }}>{course.course_code}</span>
                          <span className="text-xs font-bold px-2 py-0.5 rounded shrink-0" style={{ background:'#f2f4f6', color:'#464652' }}>
                            {course.credits} cr
                          </span>
                        </div>
                        <p className="text-sm truncate" style={{ color:'#191c1e' }}>{course.subject}</p>
                        {isLocked && (
                          <p className="text-[11px] mt-0.5 font-semibold" style={{ color:'#b45309' }}>
                            Requires: {missing.join(', ')}
                          </p>
                        )}
                      </div>
                      <span className="material-symbols-outlined text-base flex-shrink-0 ml-2"
                            style={{ color: isLocked ? '#dc2626' : '#16a34a', fontVariationSettings:"'FILL' 1" }}>
                        {isLocked ? 'lock' : 'lock_open'}
                      </span>
                    </button>
                  );
                })
              }
            </div>
          </div>
        </div>
      )}

      {/* ── Smart Advisor Chat Panel ─────────────────────────────── */}
      {chatOpen && (
        <div className="fixed bottom-32 lg:bottom-24 right-4 lg:right-6 z-50 w-[92vw] sm:w-96 max-w-[calc(100vw-2rem)]">
          <div className="rounded-2xl shadow-2xl flex flex-col overflow-hidden" style={{ background:'white', border:'1px solid #e6e8ea', height:'500px' }}>
            {/* header */}
            <div className="flex items-center justify-between px-4 py-3 shrink-0" style={{ background:'#0c1282', borderBottom:'1px solid rgba(255,255,255,0.1)' }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background:'rgba(255,255,255,0.15)' }}>
                  <span className="material-symbols-outlined text-white text-xl" style={{ fontVariationSettings:"'FILL' 1" }}>smart_toy</span>
                </div>
                <div>
                  <p className="text-white font-bold text-sm">Smart Advisor</p>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background:'#4ade80' }} />
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color:'#4ade80' }}>AI Online</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => { setChatFull(true); setChatOpen(false); }} className="p-1 transition-colors" style={{ color:'rgba(255,255,255,0.5)' }}
                  title="Open fullscreen"
                  onMouseEnter={e => e.currentTarget.style.color='white'} onMouseLeave={e => e.currentTarget.style.color='rgba(255,255,255,0.5)'}>
                  <span className="material-symbols-outlined text-sm">open_in_full</span>
                </button>
                <button onClick={() => setChatOpen(false)} className="p-1 transition-colors" style={{ color:'rgba(255,255,255,0.5)' }}
                  onMouseEnter={e => e.currentTarget.style.color='white'} onMouseLeave={e => e.currentTarget.style.color='rgba(255,255,255,0.5)'}>
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>
            </div>
            {/* messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar min-h-0" style={{ background:'#f7f9fb' }}>
              {chatMsgs.map((m, i) => (
                <div key={i} className={`flex items-start gap-2 ${m.role==='user'?'justify-end':''}`}>
                  {m.role==='assistant' && (
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background:'#0c1282' }}>
                      <span className="material-symbols-outlined text-white text-xs" style={{ fontVariationSettings:"'FILL' 1" }}>smart_toy</span>
                    </div>
                  )}
                  <div className="max-w-[82%] px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap leading-relaxed"
                       style={m.role==='user'
                         ? { background:'#0c1282', color:'white', borderBottomRightRadius:'4px' }
                         : { background:'white', color:'#191c1e', borderBottomLeftRadius:'4px', border:'1px solid #e6e8ea' }}>
                    {m.role === 'assistant' ? renderAdvisorContent(m.content) : m.content}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0" style={{ background:'#0c1282' }}>
                    <span className="material-symbols-outlined text-white text-xs" style={{ fontVariationSettings:"'FILL' 1" }}>smart_toy</span>
                  </div>
                  <div className="px-4 py-3 rounded-2xl" style={{ background:'white', border:'1px solid #e6e8ea' }}>
                    <div className="flex gap-1.5">
                      {[0,150,300].map(d => (
                        <span key={d} className="w-1.5 h-1.5 rounded-full animate-bounce"
                              style={{ background:'#0c1282', animationDelay:`${d}ms` }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            {/* quick chips */}
            <div className="px-4 py-2 flex gap-2 overflow-x-auto shrink-0" style={{ borderTop:'1px solid #e6e8ea', scrollbarWidth:'none' }}>
              {['Check payment','Check evaluations','Approve registration','My courses'].map(a => (
                <button key={a} onClick={() => setChatInput(a)}
                  className="whitespace-nowrap text-xs font-bold px-3 py-1.5 rounded-full shrink-0 transition-colors"
                  style={{ background:'#f2f4f6', color:'#464652' }}
                  onMouseEnter={e => e.currentTarget.style.background='#e6e8ea'}
                  onMouseLeave={e => e.currentTarget.style.background='#f2f4f6'}>
                  {a}
                </button>
              ))}
            </div>
            {/* input */}
            <div className="p-3 flex gap-2 shrink-0" style={{ borderTop:'1px solid #e6e8ea' }}>
              <input value={chatInput} onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => { if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendChat();} }}
                placeholder="Ask Smart Advisor..."
                className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none min-w-0"
                style={{ background:'#f2f4f6', border:'1px solid #e6e8ea', color:'#191c1e' }} />
              <button onClick={sendChat} disabled={chatLoading || !chatInput.trim()}
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all active:scale-90 disabled:opacity-40"
                style={{ background:'#0c1282' }}>
                <span className="material-symbols-outlined text-white text-sm">send</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Floating Smart Advisor Button ─────────────────────────── */}
      <div className="fixed bottom-8 right-6 z-50">
        <button onClick={() => setChatOpen(v => !v)}
          className="w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 active:scale-90 relative group"
          style={{ background:'#0c1282', boxShadow:'0 4px 20px rgba(12,18,130,0.4)' }}>
          <span className="material-symbols-outlined text-white text-3xl group-hover:rotate-12 transition-transform"
                style={{ fontVariationSettings: chatOpen ? "'FILL' 0" : "'FILL' 1" }}>
            {chatOpen ? 'close' : 'smart_toy'}
          </span>
          {!chatOpen && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white" style={{ background:'#ba1a1a' }} />
          )}
        </button>
      </div>

      {/* ── Smart Advisor Fullscreen Overlay ──────────────────────── */}
      {chatFull && (
        <SmartAdvisorFullscreen
          onClose={() => { setChatFull(false); setChatOpen(true); }}
          onClearChat={() => { setChatMsgs([]); setGreeted(false); }}
          chatMsgs={chatMsgs}
          chatInput={chatInput}
          setChatInput={setChatInput}
          chatLoading={chatLoading}
          sendChat={sendChat}
          sendMessage={sendChatText}
          quickChips={['Check payment', 'Check evaluations', 'Approve registration', 'My courses']}
        />
      )}

    </div>
  );
};
