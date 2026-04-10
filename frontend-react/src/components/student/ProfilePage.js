import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navigation } from '../common/Navigation';
import { authService } from '../../services/authService';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'react-toastify';

// ── Department code → info map ────────────────────────────────────────────────
const DEPT_MAP = {
  '11': { name: 'Electrical & Electronic Engineering',   short: 'EEE' },
  '12': { name: 'Civil Engineering',                     short: 'CE'  },
  '13': { name: 'Robotics & Mechatronics',               short: 'RME' },
  '14': { name: 'Software Engineering',                  short: 'SWE' },
  '15': { name: 'Computer Science & Engineering',        short: 'CSE' },
  '16': { name: 'Computing & Information System',        short: 'CIS' },
  '17': { name: 'Multimedia & Creative Technology',      short: 'MCT' },
  '18': { name: 'Information Technology & Management',   short: 'ITM' },
  '19': { name: 'Information & Communication Engineering', short: 'ICE' },
  '20': { name: 'Textile Engineering',                   short: 'TEX' },
  '21': { name: 'Business Administration',               short: 'BBA' },
  '22': { name: 'Finance & Banking',                     short: 'F&B' },
  '23': { name: 'Marketing',                             short: 'MKT' },
  '24': { name: 'Accounting',                            short: 'ACC' },
  '25': { name: 'Architecture',                          short: 'ARC' },
  '28': { name: 'Financial Technology',                  short: 'FinTech' },
  '31': { name: 'Pharmacy',                              short: 'PHM' },
  '32': { name: 'Public Health',                         short: 'PH'  },
  '41': { name: 'English',                               short: 'ENG' },
  '42': { name: 'Law',                                   short: 'LAW' },
  '43': { name: 'Journalism & Mass Communication',       short: 'JMC' },
};

const INTAKE_NAMES = { '1': 'Spring', '2': 'Summer', '3': 'Fall' };

// Parse "251-16-021" → structured info
function parseStudentId(id) {
  if (!id) return null;
  const parts = id.trim().split('-');
  if (parts.length !== 3) return null;
  const [batchPart, deptCode, seq] = parts;
  if (batchPart.length < 3) return null;

  const yearShort = batchPart.slice(0, 2);
  const intakeNum  = batchPart.slice(2);
  const year       = '20' + yearShort;
  const intakeName = INTAKE_NAMES[intakeNum] || `Intake ${intakeNum}`;
  const dept       = DEPT_MAP[deptCode];

  // Estimate current semester (each ~6 months)
  const now        = new Date();
  const enrolled   = new Date(parseInt(year), intakeNum === '2' ? 4 : intakeNum === '3' ? 8 : 0);
  const months     = Math.max(0, (now.getFullYear() - enrolled.getFullYear()) * 12 + (now.getMonth() - enrolled.getMonth()));
  const semNumber  = Math.min(8, Math.floor(months / 6) + 1);

  return {
    year,
    intake: intakeName,
    batch: `${year} ${intakeName}`,
    deptCode,
    department: dept ? `${dept.name} (${dept.short})` : `Department ${deptCode}`,
    departmentShort: dept?.short || deptCode,
    sequence: seq,
    estimatedSemester: `Semester ${semNumber}`,
  };
}

// localStorage helpers
const PROFILE_KEY = (email) => `diu_profile_${email}`;
const PHOTO_KEY   = (email) => `diu_photo_${email}`;

const loadProfile  = (email) => { try { return JSON.parse(localStorage.getItem(PROFILE_KEY(email))) || {}; } catch { return {}; } };
const saveProfile  = (email, data) => localStorage.setItem(PROFILE_KEY(email), JSON.stringify(data));
const loadPhoto    = (email) => localStorage.getItem(PHOTO_KEY(email)) || null;
const savePhoto    = (email, b64) => localStorage.setItem(PHOTO_KEY(email), b64);

// ─────────────────────────────────────────────────────────────────────────────
export const ProfilePage = () => {
  const navigate  = useNavigate();
  const { logout } = useAuth();
  const user      = authService.getUser();

  useEffect(() => { if (!user) navigate('/login'); }, [user, navigate]);
  if (!user) return null;

  return <ProfileContent user={user} navigate={navigate} logout={logout} />;
};

// Separate component so hooks can safely run after the null-guard
function ProfileContent({ user, navigate, logout }) {
  const fileRef   = useRef(null);
  const [editing,  setEditing]  = useState(false);
  const [photo,    setPhoto]    = useState(() => loadPhoto(user.email));

  const [form, setForm] = useState(() => {
    const saved = loadProfile(user.email);
    return {
      name:            saved.name            || user.name || '',
      phone:           saved.phone           || '',
      address:         saved.address         || '',
      bloodGroup:      saved.bloodGroup      || '',
      studentId:       saved.studentId       || '',
      currentSemester: saved.currentSemester || '',
    };
  });

  // Parsed info derived from studentId
  const parsed = parseStudentId(form.studentId);

  // Auto-fill semester from parsed ID if not manually set
  const displaySemester = form.currentSemester || parsed?.estimatedSemester || '—';
  const displayDept     = parsed?.department || '—';
  const displayBatch    = parsed?.batch      || '—';

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) { toast.error('Image must be under 3 MB'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const b64 = ev.target.result;
      setPhoto(b64);
      savePhoto(user.email, b64);
      toast.success('Profile photo updated');
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    saveProfile(user.email, form);
    setEditing(false);
    toast.success('Profile saved successfully');
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  const initials = form.name
    ? form.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'ST';

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="antialiased min-h-screen" style={{ background: '#f7f9fb', color: '#191c1e' }}>
      <Navigation />

      <div className="flex min-h-screen pt-20">

        {/* ── Sidebar ─────────────────────────────────────────────── */}
        <aside className="hidden lg:flex flex-col h-[calc(100vh-80px)] sticky top-20 p-4 w-64 shrink-0 bg-white border-r border-slate-200">
          <div className="mb-8 px-3">
            <h2 className="text-lg font-bold text-blue-900 tracking-tight">Student Portal</h2>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              {parsed?.batch || 'Academic 2024'}
            </p>
          </div>

          <nav className="flex-grow space-y-1">
            {[
              { label: 'Overview',        icon: 'dashboard',            action: () => navigate('/') },
              { label: 'Academic Record', icon: 'school',               action: () => {}, active: true },
              { label: 'Financials',      icon: 'account_balance',      action: () => {} },
              { label: 'Enrollment',      icon: 'assignment_turned_in', action: () => navigate('/course-registration') },
              { label: 'Support',         icon: 'help_outline',         action: () => {} },
            ].map(({ label, icon, action, active }) => (
              <button key={label} onClick={action}
                className={`flex items-center gap-3 w-full text-left p-3 rounded-lg text-sm font-semibold uppercase tracking-wider transition-all duration-200
                  ${active ? 'bg-blue-50 text-blue-900 translate-x-1' : 'text-slate-600 hover:bg-slate-100 hover:text-blue-800'}`}>
                <span className="material-symbols-outlined"
                      style={active ? { fontVariationSettings: "'FILL' 1" } : {}}>{icon}</span>
                {label}
              </button>
            ))}
          </nav>

          <div className="mt-auto border-t border-slate-200 pt-4">
            <button onClick={handleLogout}
              className="flex items-center gap-3 w-full text-left p-3 rounded-lg transition-colors text-sm font-semibold uppercase tracking-wider text-slate-500 hover:text-red-500 hover:bg-red-50">
              <span className="material-symbols-outlined">logout</span>
              Logout
            </button>
          </div>
        </aside>

        {/* ── Main ────────────────────────────────────────────────── */}
        <main className="flex-grow p-6 lg:p-12 overflow-y-auto">

          {/* Profile Header */}
          <section className="mb-14 flex flex-col md:flex-row gap-8 items-start">

            {/* Avatar with upload */}
            <div className="relative shrink-0">
              <div className="h-32 w-32 md:h-40 md:w-40 rounded-xl overflow-hidden shadow-sm bg-slate-200 cursor-pointer"
                   onClick={() => fileRef.current.click()}>
                {photo
                  ? <img src={photo} alt="Profile" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center bg-[#0c1282]">
                      <span className="text-white font-black text-5xl">{initials}</span>
                    </div>
                }
              </div>
              <button
                onClick={() => fileRef.current.click()}
                className="absolute -bottom-2 -right-2 w-9 h-9 bg-[#0c1282] text-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
                title="Upload photo"
              >
                <span className="material-symbols-outlined text-sm">photo_camera</span>
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
            </div>

            {/* Name + badges */}
            <div className="flex-grow">
              <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-3 text-[#000155]">
                {form.name || 'Your Name'}
              </h1>
              <div className="flex flex-wrap gap-3 items-center text-sm">
                <span className="bg-[#d5e3fc] text-[#0d1c2e] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
                  {displaySemester} · {parsed?.intake || 'Student'}
                </span>
                <span className="text-slate-500 font-medium">{displayDept}</span>
                {form.studentId && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-500 font-medium">ID: {form.studentId}</span>
                  </>
                )}
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={() => setEditing(v => !v)}
                  className="flex items-center gap-2 px-6 py-2 rounded-lg font-semibold text-sm text-white hover:opacity-90 transition-all shadow-sm"
                  style={{ backgroundColor: '#0c1282' }}
                >
                  <span className="material-symbols-outlined text-base">{editing ? 'close' : 'edit'}</span>
                  {editing ? 'Cancel Edit' : 'Edit Profile'}
                </button>
                <button
                  onClick={() => navigate('/course-registration')}
                  className="flex items-center gap-2 font-bold text-sm px-6 py-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 transition-all"
                >
                  <span className="material-symbols-outlined text-base">menu_book</span>
                  Course Registration
                </button>
              </div>
            </div>
          </section>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

            {/* ── Left column (8) ──────────────────────────────────── */}
            <div className="lg:col-span-8 space-y-8">

              {/* Personal Information card */}
              <div className="bg-white rounded-xl p-8 border border-slate-200/70 shadow-sm">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-2xl font-bold text-[#000155] tracking-tight">Personal Information</h3>
                  {editing ? (
                    <button
                      onClick={handleSave}
                      className="flex items-center gap-2 text-sm font-bold text-white bg-[#0c1282] px-4 py-2 rounded-lg hover:opacity-90 transition-all"
                    >
                      <span className="material-symbols-outlined text-base">save</span>
                      Save Changes
                    </button>
                  ) : (
                    <span className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full flex items-center gap-1 text-slate-500 bg-slate-100">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block animate-pulse"></span>
                      Active Student
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">

                  {/* Full Name */}
                  <Field label="Full Name" editing={editing}>
                    {editing
                      ? <Input name="name" value={form.name} onChange={handleChange} placeholder="Your full name" />
                      : <Value>{form.name || '—'}</Value>}
                  </Field>

                  {/* Email — read-only */}
                  <Field label="University Email" editing={false}>
                    <Value>{user.email}</Value>
                  </Field>

                  {/* Student ID with auto-parse */}
                  <Field label="Student ID" editing={editing}
                         hint={parsed ? `Dept: ${parsed.departmentShort} · ${parsed.batch}` : editing ? 'e.g. 251-16-021' : null}>
                    {editing
                      ? <Input name="studentId" value={form.studentId} onChange={handleChange} placeholder="251-16-021" />
                      : <Value>{form.studentId || '—'}</Value>}
                  </Field>

                  {/* Phone */}
                  <Field label="Phone Number" editing={editing}>
                    {editing
                      ? <Input name="phone" value={form.phone} onChange={handleChange} placeholder="01XXXXXXXXX" />
                      : <Value>{form.phone || '—'}</Value>}
                  </Field>

                  {/* Department — auto from ID */}
                  <Field label="Department">
                    <Value>{displayDept}</Value>
                  </Field>

                  {/* Batch — auto from ID */}
                  <Field label="Batch / Intake">
                    <Value>{displayBatch}</Value>
                  </Field>

                  {/* Current Semester */}
                  <Field label="Current Semester" editing={editing}
                         hint={editing && parsed ? `Auto-estimated: ${parsed.estimatedSemester}` : null}>
                    {editing
                      ? <select name="currentSemester" value={form.currentSemester} onChange={handleChange}
                            className="w-full text-base font-semibold text-slate-800 border-b-2 border-slate-300 focus:border-[#0c1282] bg-slate-50 rounded-t px-2 py-2 outline-none transition-colors">
                          <option value="">Auto-detect</option>
                          {[1,2,3,4,5,6,7,8].map(n => (
                            <option key={n} value={`Semester ${n}`}>Semester {n}</option>
                          ))}
                        </select>
                      : <Value>{displaySemester}</Value>}
                  </Field>

                  {/* Blood Group */}
                  <Field label="Blood Group" editing={editing}>
                    {editing
                      ? <select name="bloodGroup" value={form.bloodGroup} onChange={handleChange}
                            className="w-full text-base font-semibold text-slate-800 border-b-2 border-slate-300 focus:border-[#0c1282] bg-slate-50 rounded-t px-2 py-2 outline-none transition-colors">
                          <option value="">Select</option>
                          {['A+','A−','B+','B−','AB+','AB−','O+','O−'].map(g => (
                            <option key={g} value={g}>{g}</option>
                          ))}
                        </select>
                      : <Value>{form.bloodGroup || '—'}</Value>}
                  </Field>

                  {/* Address — full width */}
                  <div className="md:col-span-2">
                    <Field label="Present Address" editing={editing}>
                      {editing
                        ? <Input name="address" value={form.address} onChange={handleChange} placeholder="Your current address" />
                        : <Value>{form.address || '—'}</Value>}
                    </Field>
                  </div>
                </div>
              </div>

              {/* Stats bento */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="bg-[#0c1282] rounded-xl p-6 flex flex-col justify-between text-white shadow-lg shadow-[#0c1282]/20">
                  <span className="material-symbols-outlined text-3xl opacity-40">school</span>
                  <div className="mt-8">
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Status</p>
                    <p className="text-3xl font-black">Active</p>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-6 flex flex-col justify-between border border-slate-200 shadow-sm">
                  <span className="material-symbols-outlined text-3xl text-[#0c1282]/30">badge</span>
                  <div className="mt-8">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Student ID</p>
                    <p className="text-xl font-black text-[#000155] break-all">{form.studentId || '—'}</p>
                  </div>
                </div>
                <div className="bg-slate-50 rounded-xl p-6 flex flex-col justify-between border border-slate-200">
                  <span className="material-symbols-outlined text-3xl text-[#0c1282]/30">calendar_today</span>
                  <div className="mt-8">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Enrolled</p>
                    <p className="text-2xl font-black text-[#000155]">{parsed?.year || '—'}</p>
                  </div>
                </div>
              </div>

              {/* Info callout */}
              <div className="rounded-xl p-8 border-l-4 border-[#0c1282]"
                   style={{ backgroundColor: '#d8e3fb' }}>
                <p className="italic font-medium leading-relaxed text-[#111c2d]">
                  "Welcome to Daffodil International University. Your profile information is stored locally for demo purposes.
                  In production, all data syncs with the DIU academic database. Keep your contact information up to date for important notifications."
                </p>
                <div className="mt-4 flex items-center gap-2">
                  <span className="h-6 w-6 rounded-full bg-[#0c1282]/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-xs text-[#0c1282]">verified</span>
                  </span>
                  <span className="text-xs font-bold text-[#0c1282] uppercase tracking-tighter">DIU Academic Office</span>
                </div>
              </div>
            </div>

            {/* ── Right column (4) ─────────────────────────────────── */}
            <div className="lg:col-span-4 space-y-8">

              {/* ID Card preview */}
              <div className="bg-[#0c1282] rounded-xl overflow-hidden shadow-lg">
                <div className="p-5 flex items-center gap-3 border-b border-white/10">
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/10 shrink-0">
                    {photo
                      ? <img src={photo} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center">
                          <span className="text-white font-black text-sm">{initials}</span>
                        </div>
                    }
                  </div>
                  <div className="min-w-0">
                    <p className="text-white font-black truncate">{form.name || 'Student Name'}</p>
                    <p className="text-white/50 text-xs truncate">{user.email}</p>
                  </div>
                </div>
                <div className="p-5 space-y-3">
                  <InfoRow icon="badge"            label="Student ID"   value={form.studentId || '—'} />
                  <InfoRow icon="apartment"        label="Department"   value={parsed?.departmentShort || '—'} />
                  <InfoRow icon="calendar_today"   label="Batch"        value={displayBatch} />
                  <InfoRow icon="school"           label="Semester"     value={displaySemester} />
                  {form.bloodGroup && <InfoRow icon="favorite" label="Blood Group" value={form.bloodGroup} />}
                </div>
                <div className="px-5 pb-5">
                  <div className="border-t border-white/10 pt-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-white/30 text-sm">location_city</span>
                    <span className="text-white/40 text-xs font-bold uppercase tracking-wider">Daffodil International University</span>
                  </div>
                </div>
              </div>

              {/* Security */}
              <div className="bg-white rounded-xl p-8 border border-slate-200 shadow-sm">
                <h3 className="text-xl font-bold text-[#000155] tracking-tight mb-6">Security &amp; Access</h3>
                <div className="space-y-5">
                  {[
                    { label: 'Account Status',  sub: 'Active & Verified',   ok: true,  icon: 'check_circle' },
                    { label: 'Session',         sub: 'localStorage (Demo)',  ok: false, icon: 'lock'         },
                    { label: 'Password',        sub: 'Set on registration',  ok: false, icon: 'shield'       },
                  ].map(({ label, sub, ok, icon }) => (
                    <div key={label} className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-sm text-slate-800">{label}</p>
                        <p className={`text-xs font-bold ${ok ? 'text-emerald-600' : 'text-slate-400'}`}>{sub}</p>
                      </div>
                      <span className={`material-symbols-outlined ${ok ? 'text-emerald-500' : 'text-slate-300'}`}>{icon}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick links */}
              <div className="bg-slate-50 rounded-xl p-8 border border-slate-200">
                <h3 className="text-xl font-bold text-[#000155] tracking-tight mb-5">Quick Access</h3>
                <div className="space-y-1">
                  {[
                    { label: 'Course Registration', icon: 'menu_book',   action: () => navigate('/course-registration') },
                    { label: 'Dashboard',           icon: 'home',        action: () => navigate('/') },
                    {
                      label: 'Student Portal (DIU)',
                      icon: 'open_in_new',
                      action: () => window.open('https://studentportal.diu.edu.bd/', '_blank'),
                    },
                  ].map(({ label, icon, action }) => (
                    <button key={label} onClick={action}
                      className="w-full flex items-center justify-between p-3 rounded-lg transition-colors group hover:bg-white">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-slate-400">{icon}</span>
                        <span className="text-sm font-semibold text-slate-600 group-hover:text-blue-900 transition-colors">{label}</span>
                      </div>
                      <span className="material-symbols-outlined text-slate-300 group-hover:translate-x-1 transition-transform">chevron_right</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Department info card */}
              {parsed && (
                <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Detected from Student ID</p>
                  <div className="space-y-3">
                    <DetectedRow label="Department" value={`${parsed.departmentShort} — ${DEPT_MAP[parsed.deptCode]?.name || 'Unknown'}`} />
                    <DetectedRow label="Enrollment Year" value={parsed.year} />
                    <DetectedRow label="Intake"          value={parsed.intake} />
                    <DetectedRow label="Est. Semester"   value={parsed.estimatedSemester} />
                    <DetectedRow label="Roll / Seq."     value={parsed.sequence} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// ── Small sub-components ──────────────────────────────────────────────────────
function Field({ label, children, hint }) {
  return (
    <div className="space-y-1">
      <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</label>
      {children}
      {hint && <p className="text-[10px] text-blue-600 font-semibold mt-1">{hint}</p>}
    </div>
  );
}

function Value({ children }) {
  return <p className="font-semibold text-lg text-slate-800">{children}</p>;
}

function Input({ name, value, onChange, placeholder }) {
  return (
    <input
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full text-base font-semibold text-slate-800 border-b-2 border-slate-300 focus:border-[#0c1282] bg-slate-50 rounded-t px-2 py-2 outline-none transition-colors"
    />
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-center gap-3">
      <span className="material-symbols-outlined text-white/30 text-sm w-4 shrink-0">{icon}</span>
      <span className="text-white/40 text-xs uppercase tracking-wider w-24 shrink-0">{label}</span>
      <span className="text-white text-sm font-bold truncate">{value}</span>
    </div>
  );
}

function DetectedRow({ label, value }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-400 font-medium">{label}</span>
      <span className="text-[#0c1282] font-bold">{value}</span>
    </div>
  );
}
