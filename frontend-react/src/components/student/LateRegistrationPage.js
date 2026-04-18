import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../../services/authService';
import { toast } from 'react-toastify';
import { SmartAdvisorFullscreen } from './SmartAdvisorFullscreen';
import api from '../../services/api';
import API_CONFIG from '../../config/apiConfig';
import axios from 'axios';
import { saveLateRegistration } from '../../services/studentDataService';

const DIU_NOTIFICATIONS = [
  { id:1, icon:'warning',       title:'Late Registration Open',    body:'Submit your late registration before the deadline', time:'Just now', unread:true,  color:'#ba1a1a' },
  { id:2, icon:'payments',      title:'Late Fee Applied',          body:'Additional late fee of ৳5,000 has been applied',   time:'1h ago',  unread:true,  color:'#b45309' },
  { id:3, icon:'event',         title:'Registration Closes Soon',  body:'Late registration window closes in 3 days',         time:'2d ago',  unread:false, color:'#0c1282' },
  { id:4, icon:'menu_book',     title:'Course Material Available', body:'CIS222 lecture notes uploaded by faculty',          time:'3d ago',  unread:false, color:'#166534' },
  { id:5, icon:'campaign',      title:'Academic Calendar Update',  body:'Mid-term exams scheduled: June 10–20, 2026',        time:'4d ago',  unread:false, color:'#7c3aed' },
];
const FEE_PER_CREDIT    = 30000 / 11;
const RETAKE_FEE        = 3000;
const DROP_FEE          = 1000;
const MAX_CREDITS       = 18;
const MIN_CREDITS       = 9;

const isLab = (code) => code.endsWith('L');
const cr    = (code) => isLab(code) ? 1 : 3;

const DEFAULT_SEMESTERS = {
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

function getSemesterData() {
  try {
    const s = localStorage.getItem('diu_admin_semester_courses');
    if (s) {
      const p = JSON.parse(s);
      return Object.fromEntries(
        Object.entries(p).map(([k, v]) => [k, v.map(c => ({ ...c, credits: cr(c.course_code) }))])
      );
    }
  } catch {}
  return Object.fromEntries(
    Object.entries(DEFAULT_SEMESTERS).map(([k, v]) => [k, v.map(c => ({ ...c, credits: cr(c.course_code) }))])
  );
}

function getAdminConfig() {
  try {
    const s = localStorage.getItem('diu_admin_config');
    if (s) return JSON.parse(s);
  } catch {}
  return { lateFee: 5000, lateRegistrationEnabled: true, currentSemester: 'Spring 2026', lateRegistrationEnd: '' };
}

function calcFees(cart, lateFee) {
  const reg    = cart.filter(c => c.type === 'regular');
  const retake = cart.filter(c => c.type === 'retake');
  const drop   = cart.filter(c => c.type === 'drop');
  const regCr  = reg.reduce((s, c) => s + c.course.credits, 0);
  const totalCr = cart.reduce((s, c) => s + c.course.credits, 0);
  const tuition = Math.round(regCr * FEE_PER_CREDIT);
  return {
    regCr, totalCr, tuition,
    retakeFee:   retake.length * RETAKE_FEE,
    dropFee:     drop.length   * DROP_FEE,
    lateFee,
    total:       tuition + retake.length * RETAKE_FEE + drop.length * DROP_FEE + lateFee,
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

async function callAdvisor(msgs, sys) {
  const res = await axios.post(
    `${API_CONFIG.AI_BASE_URL}/api/v1/ai/smart-advisor`,
    { messages: msgs, systemPrompt: sys, maxTokens: 1024 }
  );
  const data = res.data;
  if (!data.success) throw new Error(data.message || 'Backend error');
  return data.reply || '';
}

function useCountdown(target) {
  const [t, setT] = useState({ d:'00', h:'00', m:'00' });
  useEffect(() => {
    if (!target) return;
    const tick = () => {
      const diff = new Date(target) - Date.now();
      if (diff <= 0) { setT({ d:'00', h:'00', m:'00' }); return; }
      setT({
        d: String(Math.floor(diff / 86400000)).padStart(2,'0'),
        h: String(Math.floor((diff % 86400000) / 3600000)).padStart(2,'0'),
        m: String(Math.floor((diff % 3600000) / 60000)).padStart(2,'0'),
      });
    };
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, [target]);
  return t;
}

// ── 6-step visual workflow ────────────────────────────────────────────────────
const VSTEPS = [
  { id:1, label:'Submit Request'   },
  { id:2, label:'Dept Head'        },
  { id:3, label:'Registrar Office' },
  { id:4, label:'Accounts Audit'   },
  { id:5, label:'Smart Advisor'    },
  { id:6, label:'Complete'         },
];

// internal step (1-10) → visual step (1-6)
const toVisual = (s) => s <= 2 ? 1 : s === 3 ? 2 : s === 4 ? 3 : s <= 6 ? 4 : s <= 9 ? 5 : 6;

// ── Component ─────────────────────────────────────────────────────────────────
export const LateRegistrationPage = () => {
  const navigate    = useNavigate();
  const location    = useLocation();
  const user        = authService.getUser();
  const photo       = user ? localStorage.getItem(`diu_photo_${user.email}`) : null;
  const initials    = user?.name ? user.name.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2) : 'ST';
  const adminConfig = getAdminConfig();
  const LATE_FEE    = adminConfig.lateFee || 5000;
  const SEMESTER_DATA = getSemesterData();
  const countdown   = useCountdown(adminConfig.lateRegistrationEnd || '2026-04-30T23:59:59');

  // course state
  const [selSem,   setSelSem]   = useState('Semester 5');
  const [cart,     setCart]     = useState([]);
  const [checked,  setChecked]  = useState({});
  const [allChk,   setAllChk]   = useState(false);
  const [showPicker,    setShowPicker]    = useState(false);
  const [pickerType,    setPickerType]    = useState('regular');
  const [pickerSearch,  setPickerSearch]  = useState('');
  const [showSearchDrop, setShowSearchDrop] = useState(false);
  const [showNotifs,     setShowNotifs]     = useState(false);
  const notifsRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (notifsRef.current && !notifsRef.current.contains(e.target)) setShowNotifs(false);
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowSearchDrop(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // workflow
  const [step,      setStep]      = useState(1);
  const [reason,    setReason]    = useState('');
  const [reasonErr, setReasonErr] = useState('');
  const [autoLabel, setAutoLabel] = useState('');
  const [payLoading,setPayLoading]= useState(false);
  const [requestId] = useState(() => `LR-${Date.now().toString(36).toUpperCase()}`);

  // evidence upload
  const [evidenceFiles, setEvidenceFiles] = useState([]);  // [{name, size, type, dataUrl}]
  const [dragOver,      setDragOver]      = useState(false);
  const [evidenceErr,   setEvidenceErr]   = useState('');
  const fileInputRef = useRef(null);

  const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
  const MAX_FILES     = 5;

  const processFiles = useCallback((files) => {
    setEvidenceErr('');
    const incoming = Array.from(files);
    const valid = [];
    for (const f of incoming) {
      if (!ALLOWED_TYPES.includes(f.type)) { setEvidenceErr(`"${f.name}" is not allowed. Use PDF or image.`); continue; }
      if (f.size > MAX_FILE_SIZE)           { setEvidenceErr(`"${f.name}" exceeds 5 MB limit.`); continue; }
      if (evidenceFiles.length + valid.length >= MAX_FILES) { setEvidenceErr(`Max ${MAX_FILES} files allowed.`); break; }
      valid.push(f);
    }
    valid.forEach(f => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setEvidenceFiles(prev => {
          if (prev.find(x => x.name === f.name && x.size === f.size)) return prev;
          return [...prev, { name: f.name, size: f.size, type: f.type, dataUrl: e.target.result }];
        });
      };
      reader.readAsDataURL(f);
    });
  }, [evidenceFiles]);

  const handleFileDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    processFiles(e.dataTransfer.files);
  };
  const handleFileInput = (e) => { processFiles(e.target.files); e.target.value = ''; };
  const removeFile = (name) => setEvidenceFiles(prev => prev.filter(f => f.name !== name));

  const formatSize = (bytes) => bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(1)} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

  const fileIcon = (type) => type === 'application/pdf' ? 'picture_as_pdf' : 'image';

  // approval states
  const [deptSt,      setDeptSt]      = useState('pending');  // pending|approved
  const [registrarSt, setRegistrarSt] = useState('locked');   // locked|pending|approved
  const [accountsSt,  setAccountsSt]  = useState('locked');   // locked|enabled
  const [advisorSt,   setAdvisorSt]   = useState('locked');   // locked|checking|approved

  // chat
  const [chatOpen,    setChatOpen]    = useState(false);
  const [chatFull,    setChatFull]    = useState(false);
  const [chatMsgs,    setChatMsgs]    = useState([]);
  const [chatInput,   setChatInput]   = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [greeted,     setGreeted]     = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior:'smooth' }); }, [chatMsgs]);

  useEffect(() => {
    if (chatOpen && !greeted) {
      setChatMsgs([{ role:'assistant', content:"Hello! I'm Smart Advisor for Late Registration.\n\nI'll guide you through the approval chain:\n• Dept Head → Registrar → Accounts → Payment → My review\n\nAsk me anything about courses, eligibility, or fee breakdown." }]);
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
    // Mark prior approvals as done and set step to payment-verified stage
    setDeptSt('approved');
    setRegistrarSt('approved');
    setAccountsSt('enabled');
    setStep(7);
    setGreeted(true);
    setChatOpen(true);
    setChatMsgs([{
      role: 'assistant',
      content: `✅ **Payment Confirmed!**\n\nReceipt ID: **${st.receiptId || '—'}**\nAmount Paid: **৳${Number(st.totalFee || 0).toLocaleString()}**\n\nNow checking your **Teaching Evaluations**...`,
    }]);
    const t1 = setTimeout(() => {
      setStep(8);
      setChatMsgs(p => [...p, {
        role: 'assistant',
        content: `📋 **Teaching Evaluation Check**\n\n✅ All course surveys submitted.\n✅ No pending evaluations found.\n\nFinalising Smart Advisor approval...`,
      }]);
    }, 2500);
    const t2 = setTimeout(() => {
      setStep(9);
      setAdvisorSt('approved');
      setChatMsgs(p => [...p, {
        role: 'assistant',
        content: `🎓 **Late Registration Approved!**\n\n✅ Dept Head: Approved\n✅ Registrar: Approved\n✅ Payment: Confirmed\n✅ Teaching Evaluations: Completed\n✅ Smart Advisor: **GRANTED**\n\nEnrolled in **${st.courses?.length || 0} course(s)** for **${st.semester}**.\nRequest ID: **${st.requestId || '—'}**\n\nCongratulations! 🎉`,
      }]);
      upd(st.requestId, 'completed');
      toast.success('🎉 Late Registration Complete!');
      setTimeout(() => setStep(10), 2000);
    }, 5500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // derived
  const fees      = calcFees(cart, LATE_FEE);
  const cartCodes = cart.map(c => c.course.course_code);
  const available = SEMESTER_DATA[selSem] ?? [];
  const allCourses = Object.values(SEMESTER_DATA).flat();

  const paymentEnabled = step === 6;
  const paymentDone    = step >= 7;
  const complete       = step === 10;
  const vStep          = toVisual(step);

  // ── Course actions ─────────────────────────────────────────────────────────
  const addCourse = (course, type = 'regular') => {
    if (cartCodes.includes(course.course_code)) { toast.warning(`${course.course_code} already in cart`); return; }
    if (fees.totalCr + course.credits > MAX_CREDITS) { toast.error(`Max ${MAX_CREDITS} credits`); return; }
    setCart(p => [...p, { course, type }]);
    toast.success(`${course.course_code} added`);
  };
  const removeCourse = (code) => {
    setCart(p => p.filter(c => c.course.course_code !== code));
    setChecked(p => { const n={...p}; delete n[code]; return n; });
  };
  const changeType = (code, t) => setCart(p => p.map(c => c.course.course_code===code ? {...c,type:t} : c));
  const toggleCheck = (code) => setChecked(p => ({...p,[code]:!p[code]}));
  const toggleAll   = () => {
    const next = !allChk; setAllChk(next);
    const obj={}; cart.forEach(c=>{obj[c.course.course_code]=next;}); setChecked(obj);
  };
  const dropSelected = () => {
    const toDrop = Object.keys(checked).filter(k=>checked[k]);
    if (!toDrop.length) { toast.info('Select courses first'); return; }
    setCart(p => p.map(c => toDrop.includes(c.course.course_code) ? {...c,type:'drop'} : c));
    setChecked({}); setAllChk(false);
    toast.info(`${toDrop.length} course(s) marked as Drop`);
  };

  // ── Submit late request ────────────────────────────────────────────────────
  const handleSubmit = () => {
    if (!cart.length)               { toast.error('Select at least one course'); return; }
    if (fees.totalCr < MIN_CREDITS) { toast.error(`Min ${MIN_CREDITS} credits required`); return; }
    if (reason.trim().length < 20)  { setReasonErr('Please provide at least 20 characters.'); return; }
    setReasonErr('');

    const reqs = JSON.parse(localStorage.getItem('diu_late_requests') || '[]');
    localStorage.setItem('diu_late_requests', JSON.stringify([...reqs, {
      id: requestId, studentEmail: user?.email, studentName: user?.name,
      semester: selSem, courses: cart, reason: reason.trim(),
      evidenceFiles: evidenceFiles.map(f => ({ name: f.name, size: f.size, type: f.type })),
      status: 'dept_pending', fees, createdAt: new Date().toISOString(),
    }]));
    saveLateRegistration(user?.email, {
      semester: selSem,
      courses: cart.map(c => ({ ...c.course, type: c.type })),
      reason: reason.trim(),
      evidenceCount: evidenceFiles.length,
      status: 'SUBMITTED',
    });

    setStep(3); setAutoLabel('Forwarded to Department Head...');
    toast.success('Request submitted! Routing to Department Head.');

    // Demo: Dept Head → 3s
    setTimeout(() => {
      setAutoLabel('Department Head reviewing...');
      setTimeout(() => {
        setDeptSt('approved'); setRegistrarSt('pending');
        setAutoLabel('Dept Head approved ✓');
        toast.success('Department Head approved!');
        upd(requestId, 'registrar_pending');

        // Demo: Registrar → 3s
        setTimeout(() => {
          setAutoLabel('Registrar Office reviewing...');
          setTimeout(() => {
            setRegistrarSt('approved'); setAccountsSt('enabled');
            setStep(5); setAutoLabel('Registrar approved ✓ — Payment enabled');
            toast.success('Registrar approved! Payment is now enabled.');
            upd(requestId, 'payment_enabled');
            setTimeout(() => setStep(6), 1500);
          }, 3000);
        }, 1500);
      }, 3000);
    }, 1500);
  };

  function upd(id, status) {
    const reqs = JSON.parse(localStorage.getItem('diu_late_requests') || '[]');
    localStorage.setItem('diu_late_requests', JSON.stringify(
      reqs.map(r => r.id===id ? {...r, status, updatedAt:new Date().toISOString()} : r)
    ));
  }

  // ── Payment ────────────────────────────────────────────────────────────────
  const handlePayment = () => {
    navigate('/course-payment', {
      state: {
        type: 'late',
        semester: selSem,
        courses: cart.map(c => ({ ...c.course, type: c.type })),
        totalCredits: fees.totalCr,
        totalFee: fees.total,
        requestId,
      },
    });
  };

  // ── Chat ──────────────────────────────────────────────────────────────────
  const buildSys = () => {
    const allSemesterInfo = Object.entries(DEFAULT_SEMESTERS).map(([sem, courses]) =>
      `${sem}:\n` + courses.map(c=>`  - ${c.course_code} | ${c.subject} | ${cr(c.course_code)} cr | Faculty: ${c.faculty}`).join('\n')
    ).join('\n');
    const reg = cart.filter(c=>c.type==='regular');
    const ret = cart.filter(c=>c.type==='retake');
    const drp = cart.filter(c=>c.type==='drop');
    return `You are Smart Advisor for DIU Late Registration Portal — a Late Registration expert.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STUDENT CURRENT SESSION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Student: ${user?.name||'Student'} | Semester: ${selSem}
- Internal Step: ${step}/10 | Visual Step: ${toVisual(step)}/6
- Regular courses (${reg.length}): ${reg.map(c=>`${c.course.course_code} - ${c.course.subject}`).join('; ')||'None'}
- Retake (${ret.length}): ${ret.map(c=>`${c.course.course_code} - ${c.course.subject}`).join('; ')||'None'}
- Drop (${drp.length}): ${drp.map(c=>`${c.course.course_code} - ${c.course.subject}`).join('; ')||'None'}
- Credits: ${fees.totalCr}/${MAX_CREDITS} | Total Fee: ৳${fees.total.toLocaleString()} (includes late fee: ৳${LATE_FEE.toLocaleString()})
- Dept Head: ${deptSt} | Registrar: ${registrarSt} | Accounts: ${accountsSt} | Advisor: ${advisorSt}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LATE REGISTRATION PROCESS (6 Visual Steps)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Step 1 → Submit Request: Select courses + submit late registration request with reason
Step 2 → Dept Head Approval: Department Head reviews and approves the request
Step 3 → Registrar Office: Registrar verifies eligibility and unlocks payment
Step 4 → Accounts Audit: Payment confirmed — ৳${LATE_FEE.toLocaleString()} late fee + regular course fees
Step 5 → Smart Advisor: Complete teaching evaluation + Smart Advisor final approval
Step 6 → Complete: Registration finalized, confirmation issued

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FEE RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Late Registration Fee: ৳${LATE_FEE.toLocaleString()} (one-time, mandatory)
- Regular course: ৳30,000 per 11 credits (≈৳2,727/credit)
- Retake: ৳3,000 per course | Drop: ৳1,000 per course
- Min credits: ${MIN_CREDITS} | Max credits: ${MAX_CREDITS}
- Lab courses: 1 credit | Theory courses: 3 credits

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FULL COURSE CATALOG (CIS Department, DIU)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${allSemesterInfo}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
YOUR ROLE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Answer questions about any course: name, code, credits, faculty/sir name
- Explain the late registration process step by step
- Help calculate total fees including the late registration penalty
- Guide student through approval stages
- Be warm, friendly, and concise (<150 words unless detailed calculation needed)`;
  };

  const sendChatText = async (text) => {
    if (!text || chatLoading) return;
    const updated = [...chatMsgs, { role:'user', content:text }];
    setChatMsgs(updated); setChatInput(''); setChatLoading(true);
    try {
      const reply = await callAdvisor(updated.slice(-12), buildSys());
      setChatMsgs(p => [...p, { role:'assistant', content:reply }]);
    } catch (err) {
      console.error('[SmartAdvisor] sendChat error:', err);
      setChatMsgs(p => [...p, { role:'assistant', content:"I'm temporarily unavailable. Please try again." }]);
    }
    setChatLoading(false);
  };
  const sendChat = () => sendChatText(chatInput.trim());

  const pickerList = allCourses.filter(c =>
    !cartCodes.includes(c.course_code) &&
    (c.course_code.toLowerCase().includes(pickerSearch.toLowerCase()) || c.subject.toLowerCase().includes(pickerSearch.toLowerCase()))
  );

  // ── Complete screen ────────────────────────────────────────────────────────
  if (complete) return (
    <div className="min-h-screen flex items-center justify-center font-headline" style={{ background:'#f7f9fb', fontFamily:'Manrope,sans-serif' }}>
      <div className="text-center space-y-8 max-w-md p-8">
        <div className="w-24 h-24 rounded-full mx-auto flex items-center justify-center animate-bounce" style={{ background:'#d5e3fc' }}>
          <span className="material-symbols-outlined text-5xl" style={{ color:'#0c1282', fontVariationSettings:"'FILL' 1" }}>task_alt</span>
        </div>
        <div>
          <h1 className="text-4xl font-extrabold tracking-tighter" style={{ color:'#000155' }}>Registration Complete!</h1>
          <p className="text-base mt-2" style={{ color:'#464652' }}>Late registration fully approved.</p>
        </div>
        <div className="rounded-xl p-6 text-left space-y-3" style={{ background:'white', border:'1px solid #e6e8ea' }}>
          {[['Request ID', requestId],['Semester', selSem],['Courses', `${cart.length}`],['Credits', fees.totalCr],['Evidence', `${evidenceFiles.length} file(s)`],['Total Paid', `৳${fees.total.toLocaleString()}`]].map(([k,v]) => (
            <div key={k} className="flex justify-between text-sm">
              <span style={{ color:'#464652' }}>{k}</span>
              <span className="font-bold" style={{ color:'#000155' }}>{v}</span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-3">
          {['Dept Head','Registrar','Smart Advisor'].map(a => (
            <div key={a} className="rounded-xl p-3 text-center" style={{ background:'#d5e3fc' }}>
              <span className="material-symbols-outlined text-xl block mb-1" style={{ color:'#0c1282', fontVariationSettings:"'FILL' 1" }}>check_circle</span>
              <span className="text-xs font-bold" style={{ color:'#0d1c2e' }}>{a}</span>
            </div>
          ))}
        </div>
        <button onClick={() => navigate('/course-registration')}
          className="w-full py-4 rounded-xl font-bold text-white" style={{ background:'#0c1282' }}>
          Back to Course Registration
        </button>
      </div>
    </div>
  );

  // ── Main layout (same structure as CourseRegistrationPage) ─────────────────
  return (
    <div className="min-h-screen font-headline" style={{ background:'#f7f9fb', color:'#191c1e', fontFamily:'Manrope,sans-serif' }}>

      {/* ── Top App Bar ─────────────────────────────────────────────────────── */}
      <header className="fixed top-0 w-full z-40 flex justify-between items-center px-6 h-16"
        style={{ background:'rgba(247,249,251,0.85)', backdropFilter:'blur(12px)', boxShadow:'0 1px 3px rgba(0,0,0,0.08)' }}>
        <div className="flex items-center gap-4">
          <img src="/diulogo.png" alt="Daffodil International University"
               className="h-9 w-auto cursor-pointer" onClick={() => navigate('/')} />
          {/* ── Inline search with dropdown ───────────────────────── */}
          <div className="hidden md:flex relative" ref={searchRef}>
            <div className="flex items-center px-3 py-1.5 rounded-full gap-1" style={{ background:'#e6e8ea' }}>
              <span className="material-symbols-outlined text-sm" style={{ color:'#464652' }}>search</span>
              <input placeholder="Search courses..." className="bg-transparent border-none outline-none text-sm w-40"
                style={{ color:'#191c1e' }} value={pickerSearch}
                onChange={e => { setPickerSearch(e.target.value); setShowSearchDrop(e.target.value.length > 0); }}
                onFocus={() => { if (pickerSearch.length > 0) setShowSearchDrop(true); }} />
              {pickerSearch && (
                <button onClick={() => { setPickerSearch(''); setShowSearchDrop(false); }} style={{ color:'#464652' }}>
                  <span className="material-symbols-outlined text-sm leading-none">close</span>
                </button>
              )}
            </div>
            {showSearchDrop && pickerSearch.length > 0 && (
              <div className="absolute top-full left-0 mt-2 w-80 rounded-2xl shadow-2xl overflow-hidden z-50"
                   style={{ background:'white', border:'1px solid #e2e8f0' }}>
                <div className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom:'1px solid #f1f5f9' }}>
                  <span className="text-xs font-bold uppercase tracking-wide" style={{ color:'#94a3b8' }}>Course Results</span>
                  <span className="text-xs" style={{ color:'#94a3b8' }}>{pickerList.length} found</span>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {pickerList.length === 0
                    ? <p className="text-center py-6 text-sm" style={{ color:'#94a3b8' }}>No courses match "{pickerSearch}"</p>
                    : pickerList.slice(0, 8).map(course => (
                      <button key={course.course_code}
                        onClick={() => { addCourse(course, 'regular'); setPickerSearch(''); setShowSearchDrop(false); }}
                        className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors"
                        style={{ borderBottom:'1px solid #f8fafc' }}
                        onMouseEnter={e => e.currentTarget.style.background='#f8fafc'}
                        onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                        <div className="min-w-0 flex-1 mr-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-bold" style={{ color:'#0c1282' }}>{course.course_code}</span>
                            <span className="text-xs px-1.5 py-0.5 rounded font-bold" style={{ background:'#ffdad6', color:'#ba1a1a' }}>{course.credits} cr</span>
                          </div>
                          <p className="text-xs truncate mt-0.5" style={{ color:'#64748b' }}>{course.subject}</p>
                        </div>
                        <span className="material-symbols-outlined text-sm flex-shrink-0" style={{ color:'#94a3b8' }}>add_circle</span>
                      </button>
                    ))
                  }
                </div>
                {pickerList.length > 8 && (
                  <div className="px-4 py-2.5" style={{ borderTop:'1px solid #f1f5f9' }}>
                    <button className="text-xs font-bold w-full text-center" style={{ color:'#ba1a1a' }}
                      onClick={() => { setShowPicker(true); setPickerType('regular'); setShowSearchDrop(false); }}>
                      View all {pickerList.length} results →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold" style={{ background:'#ffdad6', color:'#ba1a1a' }}>
            <span className="material-symbols-outlined text-sm">schedule</span>
            LATE REGISTRATION
          </div>
          {/* ── Notification bell with dropdown ───────────────────── */}
          <div className="relative" ref={notifsRef}>
            <button className="p-2 rounded-full relative hover:bg-slate-100 transition-colors"
                    style={{ color:'#464652' }}
                    onClick={() => setShowNotifs(v => !v)}>
              <span className="material-symbols-outlined">notifications</span>
              {DIU_NOTIFICATIONS.some(n => n.unread) && (
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full" style={{ background:'#ba1a1a' }}></span>
              )}
            </button>
            {showNotifs && (
              <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl shadow-2xl z-50 overflow-hidden"
                   style={{ background:'white', border:'1px solid #e2e8f0' }}>
                <div className="flex items-center justify-between px-4 py-3.5" style={{ borderBottom:'1px solid #f1f5f9' }}>
                  <span className="font-bold text-sm" style={{ color:'#1e293b' }}>Notifications</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background:'#ffdad6', color:'#ba1a1a' }}>
                    {DIU_NOTIFICATIONS.filter(n => n.unread).length} new
                  </span>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {DIU_NOTIFICATIONS.map(n => (
                    <div key={n.id}
                         className="flex items-start gap-3 px-4 py-3.5 cursor-pointer transition-colors"
                         style={{ borderBottom:'1px solid #f8fafc', background: n.unread ? '#fff5f5' : 'transparent' }}
                         onMouseEnter={e => e.currentTarget.style.background='#f8fafc'}
                         onMouseLeave={e => e.currentTarget.style.background= n.unread ? '#fff5f5' : 'transparent'}>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                           style={{ background: n.color + '18' }}>
                        <span className="material-symbols-outlined text-sm" style={{ color: n.color, fontVariationSettings:"'FILL' 1" }}>{n.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-bold truncate" style={{ color:'#1e293b' }}>{n.title}</p>
                          {n.unread && <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background:'#ba1a1a' }}></span>}
                        </div>
                        <p className="text-xs mt-0.5" style={{ color:'#64748b' }}>{n.body}</p>
                        <p className="text-[10px] mt-1" style={{ color:'#94a3b8' }}>{n.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-3 text-center" style={{ borderTop:'1px solid #f1f5f9' }}>
                  <button className="text-xs font-bold" style={{ color:'#ba1a1a' }}>Mark all as read</button>
                </div>
              </div>
            )}
          </div>
          <button className="p-2 rounded-full hover:bg-slate-100 transition-colors" style={{ color:'#464652' }} onClick={() => navigate('/profile')}>
            <span className="material-symbols-outlined">apps</span>
          </button>
          <div onClick={() => navigate('/profile')} className="w-8 h-8 rounded-full overflow-hidden border-2 cursor-pointer" style={{ borderColor:'#ba1a1a' }}>
            {photo
              ? <img src={photo} alt="Profile" className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-xs font-black text-white" style={{ background:'#0c1282' }}>{initials}</div>}
          </div>
        </div>
      </header>

      {/* ── Side Nav ────────────────────────────────────────────────────────── */}
      <aside className="fixed left-0 top-0 h-full w-64 z-30 flex-col py-4 pt-20 hidden lg:flex"
        style={{ background:'#f8fafc', borderRight:'1px solid #e2e8f0' }}>
        <div className="px-6 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background:'#0c1282' }}>
              <span className="material-symbols-outlined text-white text-xl" style={{ fontVariationSettings:"'FILL' 1" }}>school</span>
            </div>
            <div>
              <h2 className="text-base font-extrabold tracking-tight" style={{ color:'#1e3a5f' }}>DIU Portal</h2>
              <p className="text-[10px] uppercase tracking-widest" style={{ color:'#464652' }}>Late Registration</p>
            </div>
          </div>
        </div>

        <nav className="flex-grow space-y-0.5 px-2">
          {[
            { icon:'dashboard',       label:'Dashboard',          action:() => navigate('/')                      },
            { icon:'school',          label:'Course Registration', action:() => navigate('/course-registration')  },
            { icon:'pending_actions', label:'Late Registration',  action:() => {},                  active:true   },
            { icon:'military_tech',   label:'Grades',             action:() => {}                                 },
            { icon:'calendar_month',  label:'Schedule',           action:() => {}                                 },
            { icon:'menu_book',       label:'Library',            action:() => {}                                 },
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

        <div className="mt-auto pt-4 px-2 space-y-0.5" style={{ borderTop:'1px solid #e2e8f0' }}>
          {[
            { icon:'person',          label:'My Profile', action:() => navigate('/profile') },
            { icon:'contact_support', label:'Support',    action:() => {}                   },
          ].map(({ icon, label, action }) => (
            <button key={label} onClick={action}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium transition-all"
              style={{ color:'#475569' }}
              onMouseEnter={e => { e.currentTarget.style.background='#f1f5f9'; e.currentTarget.style.color='#1e3a5f'; }}
              onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='#475569'; }}>
              <span className="material-symbols-outlined text-xl">{icon}</span>
              {label}
            </button>
          ))}
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────────────────────── */}
      <main className="pt-16 min-h-screen pb-20 lg:pb-0">
        <div className="lg:ml-64 p-4 md:p-6 lg:p-8">

          {/* Late reg banner */}
          <div className="mb-8 p-4 rounded-xl flex items-center justify-between border-l-4 flex-wrap gap-3"
            style={{ background:'#ffdad6', borderLeftColor:'#ba1a1a', color:'#410002' }}>
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined" style={{ color:'#ba1a1a' }}>warning</span>
              <div>
                <span className="font-bold">LATE REGISTRATION:</span>
                <span className="text-sm ml-1">
                  {complete
                    ? 'Your late registration is complete and approved.'
                    : `Regular registration closed. An additional late fee of ৳${LATE_FEE.toLocaleString()} applies.`}
                </span>
              </div>
            </div>
            {/* Countdown */}
            <div className="flex items-center gap-3 text-sm font-bold" style={{ color:'#ba1a1a' }}>
              <span className="material-symbols-outlined text-base">timer</span>
              Closes in: {countdown.d}d {countdown.h}h {countdown.m}m
            </div>
          </div>

          {/* Page header */}
          <div className="mb-10">
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tighter mb-2" style={{ color:'#000155' }}>
              Late Course Registration
            </h1>
            <p className="text-lg max-w-2xl" style={{ color:'#464652' }}>
              Approval required before payment. Complete the institutional approval chain below.
            </p>
          </div>

          {/* ── 6-step Visual Stepper ────────────────────────────────────────── */}
          <div className="mb-12">
            <div className="grid grid-cols-6 gap-2 relative">
              {VSTEPS.map((s, i) => (
                <div key={s.id} className="flex flex-col items-center gap-2 relative">
                  {i < VSTEPS.length - 1 && (
                    <div className="absolute top-5 left-1/2 w-full h-0.5 z-0"
                      style={{ background: vStep > s.id ? '#ba1a1a' : '#c6c5d4' }} />
                  )}
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm z-10 transition-all"
                    style={vStep > s.id
                      ? { background:'#4ade80', color:'white' }
                      : vStep === s.id
                      ? { background:'#ba1a1a', color:'white', boxShadow:'0 0 0 4px rgba(186,26,26,0.15)' }
                      : { background:'#e0e3e5', color:'#464652', border:'2px solid #c6c5d4' }}>
                    {vStep > s.id ? <span className="material-symbols-outlined text-base">check</span> : s.id}
                  </div>
                  <span className="text-[10px] font-bold text-center leading-tight hidden sm:block"
                    style={{ color: vStep >= s.id ? '#ba1a1a' : '#767684' }}>
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-12 gap-6">

            {/* ── LEFT col (8) ────────────────────────────────────────────── */}
            <div className="col-span-12 lg:col-span-8 space-y-6">

              {/* Status summary */}
              <div className="p-6 rounded-xl border-l-4" style={{ background:'#f2f4f6', borderLeftColor:'#ba1a1a' }}>
                <div className="flex justify-between items-start flex-wrap gap-4">
                  <div>
                    <h3 className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color:'#464652' }}>Current Status</h3>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-2xl lg:text-3xl font-extrabold" style={{ color:'#191c1e' }}>
                        {complete ? 'Registered' : paymentDone ? 'Advisor Review' : paymentEnabled ? 'Payment Due' : step >= 3 ? 'In Approval' : cart.length ? 'Courses Selected' : 'Not Started'}
                      </span>
                      <span className="px-3 py-1 rounded-full text-xs font-bold" style={{ background:'rgba(186,26,26,0.08)', color:'#ba1a1a' }}>
                        {fees.totalCr} / {MAX_CREDITS} Credits
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs" style={{ color:'#464652' }}>Request ID</p>
                    <p className="font-bold font-mono text-sm" style={{ color:'#191c1e' }}>{requestId}</p>
                  </div>
                </div>
              </div>

              {/* Semester selector + action buttons */}
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <label className="text-sm font-bold" style={{ color:'#464652' }}>Semester:</label>
                  <select value={selSem} onChange={e => setSelSem(e.target.value)} disabled={step > 1}
                    className="border rounded-lg px-3 py-1.5 text-sm font-semibold outline-none"
                    style={{ background:'white', borderColor:'#c6c5d4', color:'#191c1e' }}>
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

              {/* Course cart table */}
              <div className="rounded-xl overflow-hidden shadow-sm" style={{ background:'white' }}>
                <div className="p-5 flex justify-between items-center" style={{ borderBottom:'1px solid #e6e8ea' }}>
                  <h3 className="font-bold" style={{ color:'#000155' }}>
                    Selected Courses
                    <span className="ml-2 text-xs font-bold px-2 py-0.5 rounded-full" style={{ background:'#ffdad6', color:'#ba1a1a' }}>
                      {cart.length}
                    </span>
                  </h3>
                  <span className="text-xs font-bold" style={{ color:'#464652' }}>{fees.totalCr} credits</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead style={{ background:'#f2f4f6' }}>
                      <tr>
                        <th className="p-4 w-12">
                          <input type="checkbox" checked={allChk} onChange={toggleAll}
                            className="rounded" style={{ accentColor:'#ba1a1a' }} />
                        </th>
                        {['Code','Course Name','Credits','Type','Status',''].map(h => (
                          <th key={h} className="p-4 text-[11px] font-bold uppercase tracking-wider" style={{ color:'#464652' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {cart.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-14 text-center text-sm" style={{ color:'#767684' }}>
                            <span className="material-symbols-outlined text-4xl block mb-2" style={{ color:'#c6c5d4' }}>playlist_add</span>
                            No courses selected. Use the semester selector above or browse all courses.
                          </td>
                        </tr>
                      ) : cart.map(({ course, type }) => (
                        <tr key={course.course_code} className="transition-colors" style={{ borderBottom:'1px solid #e6e8ea' }}
                          onMouseEnter={e => e.currentTarget.style.background='#f7f9fb'}
                          onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                          <td className="p-4">
                            <input type="checkbox" checked={!!checked[course.course_code]} onChange={() => toggleCheck(course.course_code)}
                              className="rounded" style={{ accentColor:'#ba1a1a' }} />
                          </td>
                          <td className="p-4 font-mono text-sm font-bold" style={{ color:'#0c1282' }}>{course.course_code}</td>
                          <td className="p-4 font-bold text-sm max-w-xs truncate" style={{ color:'#191c1e' }}>{course.subject}</td>
                          <td className="p-4 text-center text-sm" style={{ color:'#191c1e' }}>{course.credits}</td>
                          <td className="p-4">
                            <select value={type} onChange={e => changeType(course.course_code, e.target.value)}
                              disabled={step > 1}
                              className="text-xs font-semibold border rounded px-2 py-1 outline-none"
                              style={{ borderColor:'#c6c5d4', background:'#f7f9fb', color: type==='retake'?'#b45309': type==='drop'?'#ba1a1a':'#191c1e' }}>
                              <option value="regular">Regular</option>
                              <option value="retake">Retake</option>
                              <option value="drop">Drop</option>
                            </select>
                          </td>
                          <td className="p-4">
                            {complete
                              ? <span className="px-2 py-1 rounded-md text-[10px] font-bold uppercase" style={{ background:'#d5e3fc', color:'#0d1c2e' }}>Approved</span>
                              : paymentDone
                              ? <span className="px-2 py-1 rounded-md text-[10px] font-bold uppercase" style={{ background:'#fef3c7', color:'#92400e' }}>Processing</span>
                              : <span className="px-2 py-1 rounded-md text-[10px] font-bold uppercase" style={{ background:'#ffdad6', color:'#ba1a1a' }}>Late Reg</span>}
                          </td>
                          <td className="p-4">
                            {step === 1 && (
                              <button onClick={() => removeCourse(course.course_code)} style={{ color:'#767684' }}
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

                {/* Quick-add row */}
                <div className="p-4 flex flex-wrap gap-2" style={{ background:'#f2f4f6' }}>
                  {available.filter(c => !cartCodes.includes(c.course_code)).slice(0, 4).map(course => (
                    <button key={course.course_code} disabled={step > 1}
                      onClick={() => addCourse(course)}
                      className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg transition-all disabled:opacity-40"
                      style={{ color:'#ba1a1a', background:'#ffdad6' }}
                      onMouseEnter={e => { e.currentTarget.style.background='#ffc4c4'; }}
                      onMouseLeave={e => { e.currentTarget.style.background='#ffdad6'; }}>
                      <span className="material-symbols-outlined text-sm">add_circle</span>
                      {course.course_code}
                    </button>
                  ))}
                  <button onClick={() => { setPickerType('regular'); setPickerSearch(''); setShowPicker(true); }}
                    disabled={step > 1}
                    className="flex items-center gap-2 text-sm font-bold hover:underline disabled:opacity-40"
                    style={{ color:'#0c1282' }}>
                    <span className="material-symbols-outlined text-sm">add_circle</span>
                    Browse all courses
                  </button>
                </div>
              </div>

              {/* ── Justification form (step 1) ──────────────────────────────── */}
              {step === 1 && (
                <div className="rounded-xl overflow-hidden shadow-sm" style={{ background:'white' }}>
                  <div className="p-5" style={{ borderBottom:'1px solid #e6e8ea' }}>
                    <h3 className="font-bold" style={{ color:'#000155' }}>Late Registration Justification</h3>
                    <p className="text-xs mt-1" style={{ color:'#464652' }}>Required before submission. Explain why you missed the regular deadline.</p>
                  </div>
                  <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="block text-xs font-bold uppercase tracking-widest" style={{ color:'#464652' }}>
                        Reason for Late Registration <span style={{ color:'#ba1a1a' }}>*</span>
                      </label>
                      <textarea value={reason} onChange={e => { setReason(e.target.value); setReasonErr(''); }}
                        rows={5} placeholder="Please detail the circumstances that led to this late request..."
                        className="w-full rounded-xl p-4 text-sm resize-none outline-none focus:ring-2"
                        style={{ background:'#f2f4f6', border:'none', color:'#191c1e' }} />
                      {reasonErr && <p className="text-xs flex items-center gap-1" style={{ color:'#ba1a1a' }}><span className="material-symbols-outlined text-xs">error</span>{reasonErr}</p>}
                      <p className="text-[10px]" style={{ color:'#767684' }}>{reason.length} chars (min 20)</p>
                    </div>
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold uppercase tracking-widest" style={{ color:'#464652' }}>
                          Evidence Upload
                          <span className="ml-1 font-normal normal-case" style={{ color:'#767684' }}>(optional)</span>
                        </label>
                        <span className="text-[10px]" style={{ color:'#767684' }}>{evidenceFiles.length}/{MAX_FILES} files</span>
                      </div>

                      {/* Drop zone */}
                      <input ref={fileInputRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.webp"
                        className="hidden" onChange={handleFileInput} />
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleFileDrop}
                        className="border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 p-5 cursor-pointer transition-all"
                        style={{
                          borderColor: dragOver ? '#ba1a1a' : 'rgba(198,197,212,0.6)',
                          background: dragOver ? '#ffdad6' : '#f7f9fb',
                        }}>
                        <span className="material-symbols-outlined text-3xl" style={{ color: dragOver ? '#ba1a1a' : '#464652' }}>upload_file</span>
                        <p className="text-xs font-bold text-center" style={{ color:'#464652' }}>
                          {dragOver ? 'Drop files here' : 'Click to browse or drag & drop'}
                        </p>
                        <p className="text-[10px] text-center" style={{ color:'#767684' }}>PDF, JPG, PNG · max 5 MB each · up to {MAX_FILES} files</p>
                        <p className="text-[10px] italic text-center" style={{ color:'#767684' }}>(Medical, travel, or admin proofs)</p>
                      </div>

                      {/* Error */}
                      {evidenceErr && (
                        <p className="text-xs flex items-center gap-1" style={{ color:'#ba1a1a' }}>
                          <span className="material-symbols-outlined text-sm">error</span>{evidenceErr}
                        </p>
                      )}

                      {/* File list */}
                      {evidenceFiles.length > 0 && (
                        <div className="space-y-2">
                          {evidenceFiles.map(f => (
                            <div key={f.name} className="flex items-center gap-3 px-3 py-2 rounded-lg"
                              style={{ background:'white', border:'1px solid #e6e8ea' }}>
                              <span className="material-symbols-outlined text-lg shrink-0"
                                style={{ color: f.type === 'application/pdf' ? '#ba1a1a' : '#0c1282', fontVariationSettings:"'FILL' 1" }}>
                                {fileIcon(f.type)}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold truncate" style={{ color:'#191c1e' }}>{f.name}</p>
                                <p className="text-[10px]" style={{ color:'#767684' }}>{formatSize(f.size)}</p>
                              </div>
                              {/* Preview for images */}
                              {f.type.startsWith('image/') && (
                                <img src={f.dataUrl} alt={f.name}
                                  className="w-8 h-8 rounded object-cover shrink-0 border" style={{ borderColor:'#e6e8ea' }} />
                              )}
                              <button onClick={() => removeFile(f.name)}
                                className="shrink-0 transition-colors"
                                style={{ color:'#767684' }}
                                onMouseEnter={e => e.currentTarget.style.color='#ba1a1a'}
                                onMouseLeave={e => e.currentTarget.style.color='#767684'}>
                                <span className="material-symbols-outlined text-lg">close</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <button onClick={handleSubmit}
                        disabled={!cart.length || fees.totalCr < MIN_CREDITS}
                        className="w-full py-4 rounded-xl font-bold text-white transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{ background:'#ba1a1a' }}>
                        Send Registration Request
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Approval progress (steps 3-5) ──────────────────────────── */}
              {step >= 3 && step <= 5 && (
                <div className="rounded-xl p-6" style={{ background:'white', border:'1px solid #e6e8ea' }}>
                  <h3 className="font-bold mb-5 text-sm uppercase tracking-widest" style={{ color:'#000155' }}>Institutional Approval Chain</h3>
                  <div className="space-y-3">
                    {[
                      { label:'Department Head',   status: deptSt,      icon:'supervisor_account' },
                      { label:'Registrar Office',  status: registrarSt, icon:'admin_panel_settings' },
                      { label:'Accounts Office',   status: accountsSt === 'enabled' ? 'approved' : accountsSt, icon:'account_balance' },
                    ].map(({ label, status, icon }) => (
                      <div key={label} className="flex items-center gap-4 p-4 rounded-xl transition-all"
                        style={{
                          background: status==='approved' ? '#d5e3fc' : status==='pending' ? '#ffdad6' : '#f2f4f6',
                          opacity: status==='locked' ? 0.5 : 1,
                        }}>
                        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                          style={{ background: status==='approved'?'#0c1282': status==='pending'?'#ba1a1a':'#e0e3e5' }}>
                          <span className="material-symbols-outlined text-lg text-white">{status==='approved'?'check': status==='pending'? icon:'lock'}</span>
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-sm" style={{ color:'#191c1e' }}>{label}</p>
                          <p className="text-xs" style={{ color:'#464652' }}>
                            {status==='approved'?'Approved ✓': status==='pending'? (autoLabel || 'Reviewing...'):'Waiting for previous step'}
                          </p>
                        </div>
                        {status==='pending' && <div className="w-5 h-5 border-2 rounded-full border-t-transparent animate-spin" style={{ borderColor:'#ba1a1a' }} />}
                        {status==='approved' && <span className="material-symbols-outlined" style={{ color:'#0c1282', fontVariationSettings:"'FILL' 1" }}>check_circle</span>}
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-center mt-4" style={{ color:'#767684' }}>Demo mode — approvals are automated</p>
                </div>
              )}

              {/* ── Payment (step 6) ──────────────────────────────────────── */}
              {paymentEnabled && !paymentDone && (
                <div className="rounded-xl overflow-hidden shadow-sm" style={{ background:'white', border:'1px solid #e6e8ea' }}>
                  <div className="p-5" style={{ borderBottom:'1px solid #e6e8ea', background:'#ffdad6' }}>
                    <h3 className="font-bold flex items-center gap-2" style={{ color:'#ba1a1a' }}>
                      <span className="material-symbols-outlined text-base">payments</span>
                      Payment Enabled — Complete to Proceed
                    </h3>
                  </div>
                  <div className="p-5 space-y-3 text-sm">
                    <div className="flex justify-between"><span style={{ color:'#464652' }}>Tuition ({fees.regCr} cr)</span><span className="font-bold">৳{fees.tuition.toLocaleString()}</span></div>
                    {fees.retakeCount > 0 && <div className="flex justify-between"><span style={{ color:'#b45309' }}>Retake ({fees.retakeCount} × ৳{RETAKE_FEE.toLocaleString()})</span><span className="font-bold" style={{ color:'#b45309' }}>৳{fees.retakeFee.toLocaleString()}</span></div>}
                    {fees.dropCount > 0 && <div className="flex justify-between"><span style={{ color:'#ba1a1a' }}>Drop ({fees.dropCount} × ৳{DROP_FEE.toLocaleString()})</span><span className="font-bold" style={{ color:'#ba1a1a' }}>৳{fees.dropFee.toLocaleString()}</span></div>}
                    <div className="flex justify-between py-2 rounded-lg px-3" style={{ background:'#ffdad6', color:'#ba1a1a' }}>
                      <span className="font-bold flex items-center gap-2">
                        <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-red-600 text-white">LATE FEE</span>
                        Late Filing Surcharge
                      </span>
                      <span className="font-bold">৳{LATE_FEE.toLocaleString()}</span>
                    </div>
                    <div className="h-px" style={{ background:'#e6e8ea' }} />
                    <div className="flex justify-between text-base">
                      <span className="font-extrabold" style={{ color:'#000155' }}>Balance Due</span>
                      <span className="font-extrabold" style={{ color:'#000155' }}>৳{fees.total.toLocaleString()}</span>
                    </div>
                    <button onClick={handlePayment} disabled={payLoading}
                      className="w-full py-4 font-bold rounded-lg transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-white mt-2"
                      style={{ background:'#ba1a1a' }}>
                      {payLoading
                        ? <span className="flex items-center justify-center gap-2"><span className="material-symbols-outlined animate-spin text-base">refresh</span>Processing...</span>
                        : `Pay ৳${fees.total.toLocaleString()} Now`}
                    </button>
                  </div>
                </div>
              )}

              {/* ── Advisor verification (steps 7-9) ─────────────────────── */}
              {paymentDone && step <= 9 && (
                <div className="p-6 rounded-xl" style={{ background:'white', border:'1px solid #e6e8ea' }}>
                  <h3 className="font-bold mb-5" style={{ color:'#191c1e' }}>Smart Advisor Verification</h3>
                  <div className="space-y-4">
                    {[
                      { s:7, done: step>7, icon:'receipt_long', label:'Payment Verified',           sub:'Confirming payment with accounts' },
                      { s:8, done: step>8, icon:'rate_review',  label:'Teaching Evaluation Checked', sub:'All surveys must be submitted'   },
                      { s:9, done: step>9, icon:'verified',     label:'Smart Advisor Approved',      sub:'Final registration clearance'    },
                    ].map(({ s, done, icon, label, sub }) => (
                      <div key={s} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all"
                          style={{ background: done?'#d5e3fc': step===s?'#ffdad6':'#e0e3e5', color: done?'#0d1c2e': step===s?'#ba1a1a':'#464652' }}>
                          <span className="material-symbols-outlined text-sm" style={done?{fontVariationSettings:"'FILL' 1"}:{}}>{done?'check':icon}</span>
                        </div>
                        <div>
                          <p className="text-sm font-bold" style={{ color: done?'#191c1e':'#767684' }}>{label}</p>
                          <p className="text-xs" style={{ color:'#464652' }}>{done?'✓ Passed':step===s?'Checking...':sub}</p>
                        </div>
                        {step===s && <div className="ml-auto w-4 h-4 border-2 rounded-full border-t-transparent animate-spin" style={{ borderColor:'#ba1a1a' }} />}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Policy citation */}
              <div className="p-6 rounded-xl border-l-4" style={{ background:'#d8e3fb', borderLeftColor:'#000155' }}>
                <p className="italic leading-relaxed" style={{ color:'#3c475a' }}>
                  "Late registrations are granted only in exceptional circumstances. Ensure your justification is detailed and your evidence is officially documented to avoid rejection."
                </p>
                <p className="mt-3 text-xs font-bold uppercase" style={{ color:'#000155' }}>— University Registrar, DIU</p>
              </div>
            </div>

            {/* ── RIGHT col (4) ───────────────────────────────────────────── */}
            <div className="col-span-12 lg:col-span-4 space-y-6">

              {/* Credit Load */}
              <div className="p-6 rounded-xl text-white" style={{ background:'#0c1282' }}>
                <h3 className="text-[10px] font-bold uppercase tracking-widest opacity-70 mb-4">Credit Load</h3>
                <div className="flex items-end gap-2 mb-4">
                  <span className="text-5xl font-extrabold leading-none">{fees.totalCr}</span>
                  <span className="text-xl font-medium opacity-60">/ {MAX_CREDITS} max</span>
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden mb-5" style={{ background:'rgba(255,255,255,0.2)' }}>
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{ width:`${Math.min((fees.totalCr/MAX_CREDITS)*100,100)}%`, background: fees.totalCr < MIN_CREDITS ? '#fb923c' : '#e0e0ff' }} />
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

              {/* Fee breakdown */}
              <div className="p-6 rounded-xl shadow-sm" style={{ background:'white', border:'1px solid rgba(198,197,212,0.3)' }}>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-bold" style={{ color:'#191c1e' }}>Tuition &amp; Fees</h3>
                  <span className="material-symbols-outlined" style={{ color:'#464652' }}>payments</span>
                </div>
                <div className="space-y-3 mb-6 text-sm">
                  <div className="flex justify-between">
                    <span style={{ color:'#464652' }}>Tuition ({fees.regCr} cr)</span>
                    <span className="font-bold" style={{ color:'#191c1e' }}>৳{fees.tuition.toLocaleString()}</span>
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
                  <div className="flex justify-between py-2 px-3 rounded-lg text-xs" style={{ background:'#ffdad6', color:'#ba1a1a' }}>
                    <span className="font-bold">Late Filing Surcharge</span>
                    <span className="font-bold">৳{LATE_FEE.toLocaleString()}</span>
                  </div>
                  <div className="h-px" style={{ background:'#e6e8ea' }} />
                  <div className="flex justify-between text-base">
                    <span className="font-extrabold" style={{ color:'#000155' }}>Balance Due</span>
                    <span className="font-extrabold" style={{ color:'#000155' }}>৳{fees.total.toLocaleString()}</span>
                  </div>
                </div>
                <p className="text-[10px] text-center font-medium uppercase tracking-tight" style={{ color:'#767684' }}>
                  {paymentDone ? 'Payment Confirmed ✓' : 'Payment unlocks after Registrar approval'}
                </p>
              </div>

              {/* Approval Monitor */}
              <div className="p-6 rounded-xl" style={{ background:'#f2f4f6' }}>
                <h3 className="font-bold mb-5" style={{ color:'#191c1e' }}>Approval Monitor</h3>
                <div className="space-y-3">
                  {[
                    { label:'Dept. Head',    status: deptSt,      activeIcon:'supervisor_account',   locked: false },
                    { label:'Registrar',     status: registrarSt, activeIcon:'admin_panel_settings',  locked: registrarSt==='locked' },
                    { label:'Accounts',      status: accountsSt==='enabled'?'approved':accountsSt, activeIcon:'account_balance', locked: accountsSt==='locked' },
                    { label:'Smart Advisor', status: advisorSt==='approved'?'approved': advisorSt==='checking'?'pending':'locked', activeIcon:'smart_toy', locked: advisorSt==='locked' },
                  ].map(({ label, status, activeIcon, locked }) => (
                    <div key={label} className="flex items-center gap-3 p-3 rounded-xl transition-all"
                      style={{ background: status==='approved'?'#d5e3fc': locked?'#e0e3e5':'white', opacity: locked?0.55:1 }}>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: status==='approved'?'#0c1282': locked?'#c6c5d4':'#ffdad6' }}>
                        <span className="material-symbols-outlined text-sm"
                          style={{ color: status==='approved'?'white': locked?'#767684':'#ba1a1a' }}>
                          {status==='approved' ? 'check' : locked ? 'lock' : activeIcon}
                        </span>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-wider" style={{ color:'#464652' }}>{label}</p>
                        <p className="text-sm font-bold" style={{ color:'#191c1e' }}>
                          {status==='approved' ? 'Approved ✓' : locked ? 'Awaiting Previous' : status==='pending'?'Under Review...':'Pending'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── Course Picker Modal ──────────────────────────────────────────────── */}
      {showPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background:'rgba(0,0,0,0.5)', backdropFilter:'blur(4px)' }}
          onClick={e => e.target===e.currentTarget && setShowPicker(false)}>
          <div className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl" style={{ background:'white' }}>
            <div className="flex items-center justify-between p-5" style={{ borderBottom:'1px solid #e6e8ea' }}>
              <div>
                <h3 className="font-bold text-lg" style={{ color:'#000155' }}>
                  {pickerType==='retake'?'Retake Request': pickerType==='drop'?'Drop Request':'Add Course'}
                </h3>
                <p className="text-xs font-semibold mt-0.5"
                  style={{ color: pickerType==='retake'?'#b45309': pickerType==='drop'?'#ba1a1a':'#464652' }}>
                  {pickerType==='retake'?`৳${RETAKE_FEE.toLocaleString()} per course`: pickerType==='drop'?`৳${DROP_FEE.toLocaleString()} per course`:'Select a course to add'}
                </p>
              </div>
              <button onClick={() => setShowPicker(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center" style={{ color:'#464652' }}
                onMouseEnter={e => e.currentTarget.style.background='#f2f4f6'}
                onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
            <div className="p-4" style={{ borderBottom:'1px solid #e6e8ea' }}>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background:'#f2f4f6' }}>
                <span className="material-symbols-outlined text-sm" style={{ color:'#464652' }}>search</span>
                <input type="text" value={pickerSearch} onChange={e => setPickerSearch(e.target.value)}
                  placeholder="Search course code or name..." autoFocus
                  className="flex-1 bg-transparent border-none outline-none text-sm" style={{ color:'#191c1e' }} />
              </div>
            </div>
            <div className="max-h-72 overflow-y-auto">
              {pickerList.length === 0
                ? <p className="text-center py-10 text-sm" style={{ color:'#767684' }}>No courses found</p>
                : pickerList.map(course => (
                  <button key={course.course_code}
                    onClick={() => { addCourse(course, pickerType); setShowPicker(false); }}
                    className="w-full flex items-center justify-between px-5 py-3.5 text-left transition-colors"
                    style={{ borderBottom:'1px solid #f2f4f6' }}
                    onMouseEnter={e => e.currentTarget.style.background='#f7f9fb'}
                    onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                    <div className="min-w-0 mr-3">
                      <span className="font-mono text-sm font-bold" style={{ color:'#0c1282' }}>{course.course_code}</span>
                      <p className="text-sm truncate" style={{ color:'#191c1e' }}>{course.subject}</p>
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded shrink-0" style={{ background:'#f2f4f6', color:'#464652' }}>{course.credits} cr</span>
                  </button>
                ))
              }
            </div>
          </div>
        </div>
      )}

      {/* ── Smart Advisor Chat Panel (floating, no layout space) ─────────────── */}
      {chatOpen && (
        <div className="fixed bottom-32 lg:bottom-24 right-4 lg:right-6 z-50 w-[92vw] sm:w-96 max-w-[calc(100vw-2rem)]">
          <div className="rounded-2xl shadow-2xl flex flex-col overflow-hidden" style={{ background:'white', border:'1px solid #e6e8ea', height:'500px' }}>
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
                <button onClick={() => { setChatFull(true); setChatOpen(false); }} style={{ color:'rgba(255,255,255,0.5)' }}
                  title="Open fullscreen"
                  onMouseEnter={e => e.currentTarget.style.color='white'} onMouseLeave={e => e.currentTarget.style.color='rgba(255,255,255,0.5)'}>
                  <span className="material-symbols-outlined text-sm">open_in_full</span>
                </button>
                <button onClick={() => setChatOpen(false)} style={{ color:'rgba(255,255,255,0.5)' }}
                  onMouseEnter={e => e.currentTarget.style.color='white'} onMouseLeave={e => e.currentTarget.style.color='rgba(255,255,255,0.5)'}>
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0" style={{ background:'#f7f9fb' }}>
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
                      {[0,150,300].map(d => <span key={d} className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background:'#0c1282', animationDelay:`${d}ms` }} />)}
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="px-4 py-2 flex gap-2 overflow-x-auto shrink-0" style={{ borderTop:'1px solid #e6e8ea', scrollbarWidth:'none' }}>
              {['Can I register?','Late fee?','Approval status?','My credits?'].map(a => (
                <button key={a} onClick={() => setChatInput(a)}
                  className="whitespace-nowrap text-xs font-bold px-3 py-1.5 rounded-full shrink-0 transition-colors"
                  style={{ background:'#f2f4f6', color:'#464652' }}
                  onMouseEnter={e => e.currentTarget.style.background='#e6e8ea'}
                  onMouseLeave={e => e.currentTarget.style.background='#f2f4f6'}>
                  {a}
                </button>
              ))}
            </div>

            <div className="p-3 flex gap-2 shrink-0" style={{ borderTop:'1px solid #e6e8ea' }}>
              <input value={chatInput} onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => { if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendChat();} }}
                placeholder="Ask Smart Advisor..."
                className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none min-w-0"
                style={{ background:'#f2f4f6', border:'1px solid #e6e8ea', color:'#191c1e' }} />
              <button onClick={sendChat} disabled={chatLoading||!chatInput.trim()}
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all active:scale-90 disabled:opacity-40"
                style={{ background:'#0c1282' }}>
                <span className="material-symbols-outlined text-white text-sm">send</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Mobile Bottom Nav ────────────────────────────────────────────────── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around px-2 py-2 border-t border-slate-200"
           style={{ background: 'white', boxShadow: '0 -2px 12px rgba(0,0,0,0.06)' }}>
        {[
          { icon: 'home',            label: 'Home',      action: () => navigate('/') },
          { icon: 'school',          label: 'Courses',   action: () => navigate('/course-registration') },
          { icon: 'pending_actions', label: 'Late Reg',  action: () => {}, active: true },
          { icon: 'account_circle',  label: 'Profile',   action: () => navigate('/profile') },
        ].map(({ icon, label, action, active }) => (
          <button key={label} onClick={action}
            className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors"
            style={{ color: active ? '#ba1a1a' : '#94a3b8' }}>
            <span className="material-symbols-outlined text-xl"
                  style={active ? { fontVariationSettings: "'FILL' 1" } : {}}>{icon}</span>
            <span className="text-[9px] font-bold uppercase tracking-wide">{label}</span>
          </button>
        ))}
      </nav>

      {/* ── Floating Smart Advisor Button ────────────────────────────────────── */}
      <div className="fixed bottom-16 lg:bottom-8 right-6 z-50">
        <button onClick={() => setChatOpen(v => !v)}
          className="w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 active:scale-90 relative group"
          style={{ background:'#0c1282', boxShadow:'0 4px 20px rgba(12,18,130,0.4)' }}>
          <span className="material-symbols-outlined text-white text-3xl group-hover:rotate-12 transition-transform"
            style={{ fontVariationSettings: chatOpen ? "'FILL' 0" : "'FILL' 1" }}>
            {chatOpen ? 'close' : 'smart_toy'}
          </span>
          {!chatOpen && <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white" style={{ background:'#ba1a1a' }} />}
        </button>
      </div>

      {/* ── Smart Advisor Fullscreen Overlay ─────────────────────────────────── */}
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
          quickChips={['Can I register?', 'Late fee?', 'Approval status?', 'My credits?']}
        />
      )}

    </div>
  );
};
