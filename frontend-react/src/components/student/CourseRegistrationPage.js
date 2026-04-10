import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import { toast } from 'react-toastify';
import { SmartAdvisorFullscreen } from './SmartAdvisorFullscreen';

// ── Smart Advisor backend proxy ───────────────────────────────────────────────
// Calls the Python backend which proxies to DeepSeek (avoids browser CORS block)
const SMART_ADVISOR_URL = 'http://localhost:8081/api/v1/ai/smart-advisor';

// ── Fee constants ─────────────────────────────────────────────────────────────
const FEE_PER_CREDIT = 30000 / 11;
const RETAKE_FEE     = 3000;
const DROP_FEE       = 1000;
const MAX_CREDITS    = 18;
const MIN_CREDITS    = 9;

// ── Semester data (theory = 3 cr, lab = 1.5 cr) ──────────────────────────────
const isLab = (code) => code.endsWith('L');
const cr    = (code) => isLab(code) ? 1.5 : 3;

const RAW_SEMESTER_DATA = {
  'Semester 1': [
    { course_code:'ENG101',  subject:'English Language I'                        },
    { course_code:'COF101',  subject:'Computer Fundamentals'                     },
    { course_code:'CIS121',  subject:'Introduction to Industry 4.0'              },
    { course_code:'CIS115',  subject:'Structured Programming'                    },
    { course_code:'CIS115L', subject:'Structured Programming Lab'                },
  ],
  'Semester 2': [
    { course_code:'CIS122',  subject:'Data Structure'                            },
    { course_code:'CIS122L', subject:'Data Structure Lab'                        },
    { course_code:'CIS131',  subject:'Computer Architecture and Organization'    },
    { course_code:'ENG102',  subject:'English Language II'                       },
    { course_code:'MAT101',  subject:'Mathematics-I'                             },
  ],
  'Semester 3': [
    { course_code:'CIS133',  subject:'Website Development Essentials'            },
    { course_code:'CIS133L', subject:'Website Development Essentials Lab'        },
    { course_code:'CIS132',  subject:'Algorithms'                                },
    { course_code:'CIS132L', subject:'Algorithms Lab'                            },
    { course_code:'CIS123',  subject:'Discrete Mathematics'                      },
  ],
  'Semester 4': [
    { course_code:'CIS232',  subject:'Object Oriented Programming'               },
    { course_code:'CIS232L', subject:'Object Oriented Programming Lab'           },
    { course_code:'CIS211',  subject:'Computer Networks'                         },
    { course_code:'CIS211L', subject:'Computer Networks Lab'                     },
    { course_code:'ACC101',  subject:'Accounting'                                },
  ],
  'Semester 5': [
    { course_code:'CIS222',  subject:'Database Management System'                },
    { course_code:'CIS222L', subject:'Database Management System Lab'            },
    { course_code:'FIN232',  subject:'Financial Management System'               },
    { course_code:'CIS241',  subject:'Operating Systems'                         },
    { course_code:'CIS241L', subject:'Operating Systems Lab'                     },
  ],
  'Semester 6': [
    { course_code:'CIS323',  subject:'Information System Architecture and Planning' },
    { course_code:'CIS313',  subject:'Artificial Intelligence'                      },
    { course_code:'MGT422',  subject:'Industrial Management'                        },
    { course_code:'CIS323L', subject:'Information System Architecture Lab'          },
    { course_code:'CIS313L', subject:'Artificial Intelligence Lab'                  },
  ],
  'Semester 7': [
    { course_code:'ECO314',  subject:'Economics'                                 },
    { course_code:'CIS324',  subject:'Web Engineering'                           },
    { course_code:'CIS324L', subject:'Web Engineering Lab'                       },
    { course_code:'IoT336',  subject:'IoT and Embedded Systems'                  },
    { course_code:'IoT336L', subject:'IoT and Embedded Systems Lab'              },
    { course_code:'BI334',   subject:'Data Analysis and Business Modeling'       },
  ],
  'Semester 8': [
    { course_code:'CIS414',  subject:'Information System Management / MSS'      },
    { course_code:'IoT429',  subject:'Machine Learning for IoT'                  },
    { course_code:'CIS435',  subject:'Cloud Computing'                           },
    { course_code:'CIS435L', subject:'Cloud Computing Lab'                       },
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
  return {
    regCr, totalCr,
    regFee:     Math.round(regCr * FEE_PER_CREDIT),
    retakeFee:  retake.length * RETAKE_FEE,
    dropFee:    drop.length   * DROP_FEE,
    total:      Math.round(regCr * FEE_PER_CREDIT) + retake.length*RETAKE_FEE + drop.length*DROP_FEE,
    retakeCount: retake.length,
    dropCount:   drop.length,
  };
}

async function callDeepSeek(msgs, sys) {
  const res = await fetch(SMART_ADVISOR_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: msgs, systemPrompt: sys, maxTokens: 512 }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'Backend error');
  return data.reply;
}

// ── Main component ────────────────────────────────────────────────────────────
export const CourseRegistrationPage = () => {
  const navigate = useNavigate();
  const user     = authService.getUser();
  const photo    = user ? localStorage.getItem(`diu_photo_${user.email}`) : null;
  const initials = user?.name ? user.name.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2) : 'ST';

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

  // picker modal
  const [showPicker,   setShowPicker]   = useState(false);
  const [pickerType,   setPickerType]   = useState('regular');
  const [pickerSearch, setPickerSearch] = useState('');

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior:'smooth' }); }, [chatMsgs]);

  useEffect(() => {
    if (chatOpen && !greeted) {
      setChatMsgs([{ role:'assistant', content:"Hello! I'm Smart Advisor, your AI-powered academic assistant.\n\nI can help you:\n• Guide course registration\n• Verify payment status\n• Check teaching evaluations\n• Approve your registration\n\nHow can I assist you today?" }]);
      setGreeted(true);
    }
  }, [chatOpen, greeted]);

  const fees    = calcFees(cart);
  const cartCodes = cart.map(c => c.course.course_code);
  const available = SEMESTER_DATA[selSem] ?? [];

  const addCourse = (course, type='regular') => {
    if (cartCodes.includes(course.course_code)) { toast.warning(`${course.course_code} already added`); return; }
    if (fees.totalCr + course.credits > MAX_CREDITS) { toast.error(`Cannot exceed ${MAX_CREDITS} credits`); return; }
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

  const handlePayment = async () => {
    if (!cart.length)                 { toast.error('Select at least one course');          return; }
    if (fees.totalCr < MIN_CREDITS)   { toast.error(`Minimum ${MIN_CREDITS} credits required`); return; }
    setPayLoading(true);
    await new Promise(r => setTimeout(r, 2000));
    setPaymentDone(true); setStep(2); setPayLoading(false);
    toast.success('Payment confirmed by Accounts Department!');
    setTimeout(() => {
      setChatOpen(true);
      setChatMsgs(p => [...p, { role:'assistant', content:'✅ Payment confirmed!\n\nChecking your teaching evaluations...\n\n📋 Teaching Evaluation Status: All evaluations submitted.\n\nProceeding to approval...' }]);
      setEvalDone(true); setStep(3);
      setTimeout(() => {
        setChatMsgs(p => [...p, { role:'assistant', content:`🎓 All checks passed!\n\n✅ Payment: Confirmed\n✅ Teaching Evaluations: Completed\n✅ Smart Advisor Approval: GRANTED\n\nYou are now enrolled in ${cart.length} course(s). Congratulations!` }]);
        setApproved(true); setStep(4);
        toast.success('Registration complete! Smart Advisor approved.');
      }, 3000);
    }, 1500);
  };

  const buildSys = () => {
    const reg = cart.filter(c=>c.type==='regular');
    const ret = cart.filter(c=>c.type==='retake');
    const drp = cart.filter(c=>c.type==='drop');
    return `You are Smart Advisor at Daffodil International University (DIU), Bangladesh.
CONTEXT:
- Semester: ${selSem}
- Regular courses (${reg.length}): ${reg.map(c=>`${c.course.course_code} ${c.course.subject}`).join('; ')||'None'}
- Retake (${ret.length}): ${ret.map(c=>c.course.course_code).join(', ')||'None'}
- Drop (${drp.length}): ${drp.map(c=>c.course.course_code).join(', ')||'None'}
- Credits: ${fees.totalCr} | Fee: ৳${fees.total.toLocaleString()}
- Payment: ${paymentDone?'CONFIRMED':'PENDING'} | Teaching Eval: ${evalDone?'DONE':'PENDING'} | Approved: ${approved?'YES':'NO'}
- Step: ${step}/4
FEE: ৳30,000/11cr regular | ৳3,000 retake | ৳1,000 drop | Max ${MAX_CREDITS}cr
Respond concisely (<120 words). Be friendly and professional.`;
  };

  const sendChat = async () => {
    const text = chatInput.trim(); if (!text || chatLoading) return;
    const updated = [...chatMsgs, {role:'user',content:text}];
    setChatMsgs(updated); setChatInput(''); setChatLoading(true);
    try {
      const reply = await callDeepSeek(updated.slice(-12), buildSys());
      setChatMsgs(p => [...p, {role:'assistant',content:reply}]);
      if (!approved && paymentDone && evalDone && reply.toLowerCase().includes('approv')) { setApproved(true); setStep(4); }
    } catch { setChatMsgs(p => [...p, {role:'assistant',content:"I'm temporarily unavailable. Please try again."}]); }
    finally { setChatLoading(false); }
  };

  const pickerList = ALL_COURSES.filter(c =>
    !cartCodes.includes(c.course_code) &&
    (c.course_code.toLowerCase().includes(pickerSearch.toLowerCase()) || c.subject.toLowerCase().includes(pickerSearch.toLowerCase()))
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen font-headline" style={{ background:'#f7f9fb', color:'#191c1e', fontFamily:'Manrope, sans-serif' }}>

      {/* ── Top App Bar ──────────────────────────────────────────── */}
      <header className="fixed top-0 w-full z-40 flex justify-between items-center px-6 h-16"
              style={{ background:'rgba(247,249,251,0.85)', backdropFilter:'blur(12px)', boxShadow:'0 1px 3px rgba(0,0,0,0.08)' }}>
        <div className="flex items-center gap-6">
          <span className="text-xl font-extrabold tracking-tight" style={{ color:'#1e3a5f' }}>Academic Portal</span>
          <div className="hidden md:flex items-center px-3 py-1.5 rounded-full gap-1" style={{ background:'#e6e8ea' }}>
            <span className="material-symbols-outlined text-sm" style={{ color:'#464652' }}>search</span>
            <input
              placeholder="Search courses..."
              className="bg-transparent border-none outline-none text-sm w-44"
              style={{ color:'#191c1e' }}
              value={pickerSearch}
              onChange={e => setPickerSearch(e.target.value)}
              onFocus={() => { setShowPicker(true); setPickerType('regular'); }}
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold" style={{ background:'#d5e3fc', color:'#0d1c2e' }}>
            <span className="material-symbols-outlined text-sm">event_note</span>
            FALL SEMESTER 2024
          </div>
          <button className="p-2 rounded-full relative hover:bg-slate-100 transition-colors" style={{ color:'#464652' }}>
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full" style={{ background:'#ba1a1a' }}></span>
          </button>
          <button className="p-2 rounded-full hover:bg-slate-100 transition-colors" style={{ color:'#464652' }}
                  onClick={() => navigate('/profile')}>
            <span className="material-symbols-outlined">apps</span>
          </button>
          <div onClick={() => navigate('/profile')}
               className="w-8 h-8 rounded-full overflow-hidden border-2 cursor-pointer"
               style={{ borderColor:'#0c1282' }}>
            {photo
              ? <img src={photo} alt="Profile" className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-xs font-black text-white" style={{ background:'#0c1282' }}>{initials}</div>
            }
          </div>
        </div>
      </header>

      {/* ── Side Nav ─────────────────────────────────────────────── */}
      <aside className="fixed left-0 top-0 h-full w-64 z-30 flex flex-col py-4 pt-20 hidden lg:flex"
             style={{ background:'#f8fafc', borderRight:'1px solid #e2e8f0' }}>
        <div className="px-6 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background:'#0c1282' }}>
              <span className="material-symbols-outlined text-white text-xl" style={{ fontVariationSettings:"'FILL' 1" }}>school</span>
            </div>
            <div>
              <h2 className="text-base font-extrabold tracking-tight" style={{ color:'#1e3a5f' }}>DIU Portal</h2>
              <p className="text-[10px] uppercase tracking-widest" style={{ color:'#464652' }}>Academic Archives</p>
            </div>
          </div>
        </div>

        <nav className="flex-grow space-y-0.5 px-2">
          {[
            { icon:'dashboard',       label:'Dashboard',         action:() => navigate('/')                      },
            { icon:'school',          label:'Course Registration',action:() => {},                  active:true  },
            { icon:'pending_actions', label:'Late Registration',  action:() => navigate('/late-registration')    },
            { icon:'military_tech',   label:'Grades',             action:() => {}                                },
            { icon:'calendar_month',  label:'Schedule',           action:() => {}                                },
            { icon:'menu_book',       label:'Library',            action:() => {}                                },
          ].map(({ icon, label, action, active }) => (
            <button key={label} onClick={action}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium transition-all"
              style={active
                ? { background:'#eff6ff', color:'#1e3a5f' }
                : { color:'#475569' }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.background='#f1f5f9'; e.currentTarget.style.color='#1e3a5f'; } }}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='#475569'; } }}
            >
              <span className="material-symbols-outlined text-xl"
                    style={active ? { fontVariationSettings:"'FILL' 1" } : {}}>{icon}</span>
              {label}
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-4 px-2 space-y-0.5" style={{ borderTop:'1px solid #e2e8f0' }}>
          {[
            { icon:'person', label:'My Profile', action:() => navigate('/profile') },
            { icon:'contact_support', label:'Support', action:() => {} },
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

      {/* ── Main Canvas ──────────────────────────────────────────── */}
      <main className="pt-16 min-h-screen" style={{ marginLeft:'0', paddingLeft:'0' }}>
        <div className="lg:ml-64 p-6 lg:p-8">

          {/* Late Registration Alert */}
          <div className="mb-8 p-4 rounded-xl flex items-center justify-between border-l-4"
               style={{ background:'#ffdad6', borderLeftColor:'#ba1a1a', color:'#410002' }}>
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined" style={{ color:'#ba1a1a' }}>warning</span>
              <div>
                <span className="font-bold">REGISTRATION NOTICE:</span>
                <span className="text-sm ml-1">
                  {approved
                    ? 'Your registration is complete. Courses are confirmed for Fall 2024.'
                    : 'Registration portal closes in 48 hours. Complete your course selection and payment before the deadline.'}
                </span>
              </div>
            </div>
            <button className="text-xs font-bold uppercase tracking-widest underline whitespace-nowrap ml-4"
                    onClick={() => toast.info('Registration deadline: October 31, 2024')}>
              View Deadlines
            </button>
          </div>

          {/* Section Header */}
          <div className="mb-10">
            <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tighter mb-2" style={{ color:'#000155' }}>
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
                  <span className="text-xs font-bold text-center"
                        style={{ color: step >= s.id ? '#000155' : '#767684' }}>
                    {s.label}
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
                <div className="p-4 flex justify-center" style={{ background:'#f2f4f6' }}>
                  {available.filter(c => !cartCodes.includes(c.course_code)).length > 0 ? (
                    available.filter(c => !cartCodes.includes(c.course_code)).slice(0, 4).map(course => (
                      <button key={course.course_code}
                        disabled={step > 1}
                        onClick={() => addCourse(course)}
                        className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg mr-2 transition-all disabled:opacity-40"
                        style={{ color:'#0c1282', background:'#eff6ff' }}
                        onMouseEnter={e => e.currentTarget.style.background='#dbeafe'}
                        onMouseLeave={e => e.currentTarget.style.background='#eff6ff'}>
                        <span className="material-symbols-outlined text-sm">add_circle</span>
                        {course.course_code}
                      </button>
                    ))
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
                    <span className="text-xs font-bold px-2 py-0.5 rounded shrink-0" style={{ background:'#f2f4f6', color:'#464652' }}>
                      {course.credits} cr
                    </span>
                  </button>
                ))
              }
            </div>
          </div>
        </div>
      )}

      {/* ── Smart Advisor Chat Panel ─────────────────────────────── */}
      {chatOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-96 max-w-[calc(100vw-1.5rem)]">
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
                    {m.content}
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
          quickChips={['Check payment', 'Check evaluations', 'Approve registration', 'My courses']}
        />
      )}

    </div>
  );
};
