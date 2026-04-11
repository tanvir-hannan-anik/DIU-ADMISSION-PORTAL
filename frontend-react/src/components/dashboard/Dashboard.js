import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navigation } from '../common/Navigation';
import { Footer } from '../common/Footer';
import { useAI } from '../../hooks/useAI';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'react-toastify';
import { admissionService } from '../../services/admissionService';

// ── Form Assistant Field Definitions ─────────────────────────────────────────

const BOARDS = ['Dhaka','Chittagong','Rajshahi','Sylhet','Barisal','Comilla','Jessore','Dinajpur','Mymensingh'];
const DIVISIONS = ['Dhaka','Chittagong','Rajshahi','Sylhet','Barisal','Khulna','Rangpur','Mymensingh'];

const normalizeGroup = v => {
  const l = v.toLowerCase();
  if (l.includes('science')) return 'Science';
  if (l.includes('business') || l.includes('commerce')) return 'Business / Commerce';
  return 'Humanities / Arts';
};
const normalizeBoard = v => BOARDS.find(b => v.toLowerCase().includes(b.toLowerCase())) || v.trim();
const normalizeDivision = v => DIVISIONS.find(d => v.toLowerCase().includes(d.toLowerCase())) || v.trim();
const validateBoard = v => BOARDS.some(b => v.toLowerCase().includes(b.toLowerCase()));
const validateGpa = v => !isNaN(parseFloat(v)) && parseFloat(v) >= 1.0 && parseFloat(v) <= 5.0;
const validateYear = v => /^20\d{2}$/.test(v.trim());
const validateGroup = v => ['science','business','commerce','humanities','arts'].some(k => v.toLowerCase().includes(k));

const PRE_REGISTER_FIELDS = [
  { key: 'fullName',       label: 'Full Name',          question: 'What is your full legal name? (as on your certificate)',          validate: v => v.trim().length >= 3,                             error: 'Please enter your full name (min 3 characters)',             normalize: v => v.trim() },
  { key: 'email',          label: 'Email',               question: 'What is your email address?',                                    validate: v => /\S+@\S+\.\S+/.test(v.trim()),                    error: 'Please enter a valid email (e.g. name@gmail.com)',           normalize: v => v.trim().toLowerCase() },
  { key: 'dateOfBirth',    label: 'Date of Birth',       question: 'Date of birth? (format: YYYY-MM-DD, e.g. 2003-05-15)',          validate: v => /^\d{4}-\d{2}-\d{2}$/.test(v.trim().replace(/\//g,'-')), error: 'Use YYYY-MM-DD format (e.g. 2003-05-15)',               normalize: v => v.trim().replace(/\//g,'-') },
  { key: 'contactNumber',  label: 'Contact Number',      question: 'Your contact number? (e.g. 01712345678)',                       validate: v => /^0[0-9]{9,10}$/.test(v.trim().replace(/[\s-]/g,'')), error: 'Enter a valid BD number (11 digits, starts with 0)',       normalize: v => v.trim().replace(/[\s-]/g,'') },
  { key: 'sscResult',      label: 'SSC GPA',             question: 'Your SSC GPA? (e.g. 4.50)',                                     validate: validateGpa,                                           error: 'Enter a valid GPA between 1.0 and 5.0',                      normalize: v => v.trim() },
  { key: 'sscGroup',       label: 'SSC Group',           question: 'SSC group?\n• Science\n• Business / Commerce\n• Humanities / Arts', validate: validateGroup,                                      error: 'Type: Science, Business, or Humanities',                     normalize: normalizeGroup },
  { key: 'sscBoard',       label: 'SSC Board',           question: 'SSC board? (Dhaka / Chittagong / Rajshahi / Sylhet / Barisal / Comilla / Jessore / Dinajpur / Mymensingh)', validate: validateBoard, error: 'Enter a valid board name',                              normalize: normalizeBoard },
  { key: 'sscYear',        label: 'SSC Passing Year',    question: 'Year you passed SSC? (e.g. 2021)',                              validate: validateYear,                                          error: 'Enter a valid year (e.g. 2021)',                              normalize: v => v.trim() },
  { key: 'hscResult',      label: 'HSC GPA',             question: 'Your HSC GPA? (e.g. 4.75)',                                     validate: validateGpa,                                           error: 'Enter a valid GPA between 1.0 and 5.0',                      normalize: v => v.trim() },
  { key: 'hscGroup',       label: 'HSC Group',           question: 'HSC group?\n• Science\n• Business / Commerce\n• Humanities / Arts', validate: validateGroup,                                      error: 'Type: Science, Business, or Humanities',                     normalize: normalizeGroup },
  { key: 'hscBoard',       label: 'HSC Board',           question: 'HSC board?',                                                    validate: validateBoard,                                         error: 'Enter a valid board name',                                   normalize: normalizeBoard },
  { key: 'hscYear',        label: 'HSC Passing Year',    question: 'Year you passed HSC? (e.g. 2023)',                              validate: validateYear,                                          error: 'Enter a valid year (e.g. 2023)',                              normalize: v => v.trim() },
  { key: 'programHint',    label: 'Program Interest',    question: 'Which program are you interested in?\n(e.g. CSE, BBA, EEE, Law, Pharmacy...)\n\nType "skip" to choose on the form.', validate: v => v.trim().length >= 2, error: 'Enter a program name or type "skip"', normalize: v => v.trim() },
];

const ONLINE_ADMIT_FIELDS = [
  { key: 'fullName',         label: 'Full Name',          question: 'Your full name?',                                                validate: v => v.trim().length >= 3,                           error: 'Please enter your full name',                                normalize: v => v.trim() },
  { key: 'fatherName',       label: "Father's Name",      question: "Your father's full name?",                                      validate: v => v.trim().length >= 3,                           error: "Please enter your father's name",                            normalize: v => v.trim() },
  { key: 'motherName',       label: "Mother's Name",      question: "Your mother's full name?",                                      validate: v => v.trim().length >= 3,                           error: "Please enter your mother's name",                            normalize: v => v.trim() },
  { key: 'dob',              label: 'Date of Birth',      question: 'Date of birth? (YYYY-MM-DD, e.g. 2003-05-15)',                  validate: v => /^\d{4}-\d{2}-\d{2}$/.test(v.trim().replace(/\//g,'-')), error: 'Use YYYY-MM-DD format',                                normalize: v => v.trim().replace(/\//g,'-') },
  { key: 'gender',           label: 'Gender',             question: 'Gender?\n• Male\n• Female\n• Other',                            validate: v => ['male','female','other'].some(g => v.toLowerCase().includes(g)), error: 'Type: Male, Female, or Other',                   normalize: v => { const l=v.toLowerCase(); if(l.includes('female')) return 'Female'; if(l.includes('male')) return 'Male'; return 'Other'; } },
  { key: 'phone',            label: 'Phone',              question: 'Your phone number?',                                            validate: v => /^0[0-9]{9,10}$/.test(v.trim().replace(/[\s-]/g,'')), error: 'Enter a valid BD phone number',                        normalize: v => v.trim().replace(/[\s-]/g,'') },
  { key: 'email',            label: 'Email',              question: 'Your email address?',                                           validate: v => /\S+@\S+\.\S+/.test(v.trim()),                  error: 'Enter a valid email',                                        normalize: v => v.trim().toLowerCase() },
  { key: 'presentDistrict',  label: 'Present District',   question: 'Your present district? (e.g. Dhaka, Chittagong)',              validate: v => v.trim().length >= 2,                           error: 'Please enter your district',                                 normalize: v => v.trim() },
  { key: 'presentDivision',  label: 'Present Division',   question: 'Present division?\n(Dhaka / Chittagong / Rajshahi / Sylhet / Barisal / Khulna / Rangpur / Mymensingh)', validate: v => DIVISIONS.some(d => v.toLowerCase().includes(d.toLowerCase())), error: 'Enter a valid division name', normalize: normalizeDivision },
  { key: 'sscBoard',         label: 'SSC Board',          question: 'Which board did you pass SSC from?',                           validate: validateBoard,                                       error: 'Enter a valid board name',                                   normalize: normalizeBoard },
  { key: 'sscYear',          label: 'SSC Year',           question: 'Year you passed SSC?',                                         validate: validateYear,                                        error: 'Enter a valid year',                                         normalize: v => v.trim() },
  { key: 'sscGroup',         label: 'SSC Group',          question: 'SSC group? (Science / Business / Humanities)',                 validate: validateGroup,                                       error: 'Type: Science, Business, or Humanities',                     normalize: normalizeGroup },
  { key: 'sscGpa',           label: 'SSC GPA',            question: 'SSC GPA?',                                                     validate: validateGpa,                                         error: 'Enter a valid GPA (1.0 - 5.0)',                              normalize: v => v.trim() },
  { key: 'hscBoard',         label: 'HSC Board',          question: 'Which board did you pass HSC from?',                           validate: validateBoard,                                       error: 'Enter a valid board name',                                   normalize: normalizeBoard },
  { key: 'hscYear',          label: 'HSC Year',           question: 'Year you passed HSC?',                                         validate: validateYear,                                        error: 'Enter a valid year',                                         normalize: v => v.trim() },
  { key: 'hscGroup',         label: 'HSC Group',          question: 'HSC group? (Science / Business / Humanities)',                 validate: validateGroup,                                       error: 'Type: Science, Business, or Humanities',                     normalize: normalizeGroup },
  { key: 'hscGpa',           label: 'HSC GPA',            question: 'HSC GPA?',                                                     validate: validateGpa,                                         error: 'Enter a valid GPA (1.0 - 5.0)',                              normalize: v => v.trim() },
  { key: 'programName',      label: 'Program',            question: 'Which program do you want to apply for?\n(e.g. CSE, BBA, EEE, Law, Architecture, Pharmacy...)', validate: v => v.trim().length >= 2, error: 'Enter a program name',           normalize: v => v.trim() },
];

// Hero Section Component
const HeroSection = () => {
  const navigate = useNavigate();

  const stats = [
    { number: '35,000+', label: 'Students' },
    { number: '#1', label: 'Private University' },
    { number: '200+', label: 'Partner Universities' },
    { number: '40+', label: 'Academic Programs' },
  ];

  return (
    <section className="relative min-h-[600px] md:h-[870px] flex items-center overflow-hidden bg-primary pt-16 md:pt-20 pb-16 md:pb-0">
      <div className="absolute inset-0 z-0">
        <img
          className="w-full h-full object-cover opacity-30"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuBe985m5ycQ9ji45fPuPa_I_58o06SgBPbfv5CYrOIm_iEv1FLdMvM7lVxrq8XQrlmv1c42P-qrw58ZPOGvIVgvTWWVcA8a-s_zgdawwvLinTRYRm5Dy4u5ZdhVipVV2mcmMoOVRpopMT_OLrq1A68dnbs55e8S31UeOk44XpzuKgfOXTog9c2UG2KiBX2ESgqnnoB8nL-iBGBVVpjgViZ6McxjQXHqk2LIqCa-thKIFDqVtLpgDsukpd_JxN12mIL-P3PWRwxjfVk"
          alt="University campus"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/80 to-transparent"></div>
      </div>

      <div className="container mx-auto px-4 md:px-8 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="max-w-2xl">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary-fixed/20 text-primary-fixed text-xs font-bold uppercase tracking-widest mb-6">
            Spring 2026 Admissions Open
          </span>

          <h1 className="font-headline text-3xl sm:text-5xl md:text-7xl font-extrabold text-white leading-tight mb-6 tracking-tighter">
            Empowering Your <br />
            <span className="text-primary-fixed">Academic Journey</span>
          </h1>

          <p className="text-lg text-slate-100/80 mb-8 max-w-lg leading-relaxed">
            Join a global community of innovators, leaders, and thinkers at DIU. Experience world-class facilities and a curriculum designed for the future.
          </p>

          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => navigate('/pre-register')}
              className="px-8 py-4 bg-primary-fixed text-on-primary-fixed rounded-xl font-bold flex items-center gap-2 hover:bg-primary-fixed-dim transition-all shadow-lg shadow-[#0c1282]/40"
            >
              Start Application
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>

            <button
              onClick={() => toast.info('Virtual tour coming soon!')}
              className="px-8 py-4 bg-white/10 backdrop-blur-md text-white border border-white/20 rounded-xl font-bold hover:bg-white/20 transition-all"
            >
              Virtual Tour
            </button>
          </div>
        </div>

        <div className="hidden lg:grid grid-cols-2 gap-4">
          {stats.map((stat, index) => (
            <div
              key={index}
              className={`p-6 bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl ${
                index === 0 || index === 2 ? 'transform translate-y-8' : ''
              }`}
            >
              <div className="text-3xl font-headline font-extrabold text-primary-fixed">
                {stat.number}
              </div>
              <div className="text-sm text-slate-100/60 uppercase tracking-widest font-semibold mt-1">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Quick Access Cards Component
const QuickAccessCards = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const studentCards = [
    {
      id: 'student-portal',
      title: 'Student Portal',
      description: 'Access your student dashboard, academic records, results, and university services.',
      icon: 'school',
      buttonText: 'Open Portal',
      action: () => window.open('https://auth1.diu.edu.bd/realms/diu-student/protocol/openid-connect/auth?client_id=student-portal-ui&redirect_uri=https%3A%2F%2Fstudentportal.diu.edu.bd%2F&state=21f9f678-4c18-4451-b490-f5e2ff6cc0f5&response_mode=fragment&response_type=code&scope=openid&nonce=ab738521-dd74-4ef1-8139-7b95bc1fc8b7', '_blank'),
      accentColor: 'text-primary',
      darkText: false,
    },
    {
      id: 'course-registration',
      title: 'Course Registration',
      description: 'Register for your upcoming semester courses, manage your academic schedule and credit hours.',
      icon: 'menu_book',
      buttonText: 'Register Courses',
      action: () => navigate('/course-registration'),
      accentColor: 'text-slate-700',
      darkText: false,
    },
  ];

  const cards = [
    {
      id: 'preregistration',
      title: 'Pre-registration',
      description: 'Secure your spot early. Submit your preliminary details to start the evaluation process.',
      icon: 'how_to_reg',
      buttonText: 'Enroll Now',
      action: () => navigate('/pre-register'),
      accentColor: 'text-primary',
      darkText: false,
    },
    {
      id: 'online-admit',
      title: 'Online Admit',
      description: 'Download your admission test admit card or view your final selection letter.',
      icon: 'assignment_ind',
      buttonText: 'Download Card',
      action: () => navigate('/admit-card'),
      accentColor: 'text-slate-700',
      darkText: false,
    },
    {
      id: 'dashboard',
      title: 'Departmental Lead Tracking',
      description: 'Authorized admission officers can track departmental leads and application analytics.',
      icon: 'leaderboard',
      buttonText: 'Access Dashboard',
      action: () => navigate('/admin/dashboard'),
      accentColor: 'text-primary-fixed',
      darkText: true,
    },
  ];

  const renderCard = (card) => (
    <div
      key={card.id}
      className={`group p-8 rounded-xl ${
        card.darkText ? 'text-white bg-primary' : 'text-on-surface bg-surface-container-low'
      } hover:${card.darkText ? 'shadow-2xl shadow-primary/20' : 'bg-surface-container'} transition-all duration-300 relative overflow-hidden flex flex-col justify-between min-h-[220px] md:min-h-[280px]`}
    >
      <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all">
        <span
          className="material-symbols-outlined text-8xl"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          {card.icon}
        </span>
      </div>

      <div>
        <div className={`w-14 h-14 ${
          card.darkText ? 'bg-white/10' : 'bg-primary/10'
        } rounded-lg flex items-center justify-center ${
          card.darkText ? 'text-primary-fixed' : 'text-primary'
        } mb-6`}>
          <span className="material-symbols-outlined">{card.icon}</span>
        </div>

        <h3 className="text-2xl font-bold font-headline mb-2">
          {card.title}
        </h3>
        <p className={`${
          card.darkText ? 'text-slate-200/70' : 'text-outline'
        } text-sm leading-relaxed mb-6`}>
          {card.description}
        </p>
      </div>

      <button
        onClick={card.action}
        className={`${card.accentColor} font-bold flex items-center gap-2 group/link hover:gap-4 transition-all`}
      >
        {card.buttonText}
        <span className="material-symbols-outlined group-hover/link:translate-x-1 transition-transform">
          chevron_right
        </span>
      </button>
    </div>
  );

  return (
    <section className="py-14 md:py-24 bg-surface px-4 md:px-8">
      <div className="max-w-screen-2xl mx-auto">

        {/* Student Portal & Course Registration — only for logged-in students */}
        {isAuthenticated && (
          <div className="mb-20">
            <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
              <div>
                <h2 className="font-headline text-3xl font-bold tracking-tight text-on-surface mb-2">
                  Student Services
                </h2>
                <p className="text-outline max-w-md">
                  Quick access to your student portal and course management tools.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {studentCards.map(renderCard)}
            </div>
          </div>
        )}

        {/* Admission Hub */}
        <div>
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div>
              <h2 className="font-headline text-3xl font-bold tracking-tight text-on-surface mb-2">
                Admission Hub
              </h2>
              <p className="text-outline max-w-md">
                Access vital tools and portals to manage your admission process.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {cards.map(renderCard)}
          </div>
        </div>

      </div>
    </section>
  );
};

// Static fallback department data (shown when backend has no applications yet)
const STATIC_DEPARTMENTS = [
  { name: 'Computer Science & Engineering', short: 'CSE', visits: 4832, trend: '+12%', color: 'bg-blue-500', trendColor: 'text-blue-600' },
  { name: 'Computer & Information Systems', short: 'CIS', visits: 4105, trend: '+19%', color: 'bg-cyan-500', trendColor: 'text-cyan-600' },
  { name: 'Business Administration', short: 'BBA', visits: 3621, trend: '+8%', color: 'bg-indigo-500', trendColor: 'text-indigo-600' },
  { name: 'Electrical & Electronic Eng.', short: 'EEE', visits: 2847, trend: '+15%', color: 'bg-violet-500', trendColor: 'text-violet-600' },
  { name: 'Software Engineering', short: 'SWE', visits: 2234, trend: '+22%', color: 'bg-purple-500', trendColor: 'text-purple-600' },
  { name: 'Civil Engineering', short: 'CE', visits: 1876, trend: '+5%', color: 'bg-sky-500', trendColor: 'text-sky-600' },
  { name: 'Law & Justice', short: 'LAW', visits: 1423, trend: '+3%', color: 'bg-teal-500', trendColor: 'text-teal-600' },
  { name: 'English Language & Literature', short: 'ENG', visits: 1187, trend: '+7%', color: 'bg-emerald-500', trendColor: 'text-emerald-600' },
  { name: 'Architecture', short: 'ARCH', visits: 987, trend: '+11%', color: 'bg-green-500', trendColor: 'text-green-600' },
  { name: 'Pharmacy', short: 'PHM', visits: 834, trend: '+9%', color: 'bg-amber-500', trendColor: 'text-amber-600' },
  { name: 'Textile Engineering', short: 'TE', visits: 712, trend: '+4%', color: 'bg-orange-500', trendColor: 'text-orange-600' },
];

const DEPT_COLORS = ['bg-blue-500','bg-cyan-500','bg-indigo-500','bg-violet-500','bg-purple-500','bg-sky-500','bg-teal-500','bg-emerald-500','bg-green-500','bg-amber-500','bg-orange-500'];
const TREND_COLORS = ['text-blue-600','text-cyan-600','text-indigo-600','text-violet-600','text-purple-600','text-sky-600','text-teal-600','text-emerald-600','text-green-600','text-amber-600','text-orange-600'];

// Department Breakdown Component
const DepartmentBreakdown = () => {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [departments, setDepartments]   = useState(STATIC_DEPARTMENTS);
  const [totalApplications, setTotalApplications] = useState(null); // null = using static data

  useEffect(() => {
    admissionService.getStats().then(res => {
      if (res.success && res.data?.departmentBreakdown) {
        const breakdown = res.data.departmentBreakdown;
        const entries = Object.entries(breakdown).sort((a, b) => b[1] - a[1]);
        if (entries.length > 0) {
          setDepartments(entries.map(([name, count], i) => ({
            name,
            short: name.length > 10 ? name.slice(0, 3).toUpperCase() : name,
            visits: count,
            trend: '',
            color: DEPT_COLORS[i % DEPT_COLORS.length],
            trendColor: TREND_COLORS[i % TREND_COLORS.length],
          })));
          setTotalApplications(res.data.total || 0);
        }
      }
    }).catch(() => {});
  }, []);

  const maxVisits = departments.length > 0 ? Math.max(...departments.map(d => d.visits)) : 1;
  const totalVisits = departments.reduce((sum, d) => sum + d.visits, 0);

  return (
    <section className="py-14 md:py-24 bg-surface-container-low px-4 md:px-8">
      <div className="max-w-screen-2xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-8 md:mb-12 gap-6">
          <div>
            <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest mb-3">
              Live Insights
            </span>
            <h2 className="font-headline text-3xl font-bold tracking-tight text-on-surface mb-2">
              Department Breakdown
            </h2>
            <p className="text-outline max-w-md">
              Prospective student interest across all academic departments — updated daily based on portal visits.
            </p>
          </div>
          <div className="flex items-center gap-8">
            <div className="text-center">
              <div className="text-2xl font-black text-primary font-headline">{totalVisits.toLocaleString()}</div>
              <div className="text-xs text-outline uppercase tracking-wider font-semibold mt-0.5">Total Visitors</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-black text-primary font-headline">{departments.length}</div>
              <div className="text-xs text-outline uppercase tracking-wider font-semibold mt-0.5">Departments</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-black text-green-600 font-headline">+11%</div>
              <div className="text-xs text-outline uppercase tracking-wider font-semibold mt-0.5">Avg Growth</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Bar Chart — left 2/3 */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-4 md:p-8 shadow-sm border border-outline-variant/20">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-on-surface font-headline">Student Interest by Department</h3>
              <div className="flex items-center gap-1.5 text-xs text-outline">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Live data
              </div>
            </div>
            <div className="space-y-5">
              {departments.map((dept, index) => (
                <div
                  key={dept.short}
                  className="cursor-default"
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black text-outline w-5 text-right">{index + 1}</span>
                      <span className={`text-xs sm:text-sm font-semibold transition-colors truncate max-w-[120px] sm:max-w-none ${hoveredIndex === index ? 'text-primary' : 'text-on-surface'}`}>
                        <span className="sm:hidden">{dept.short}</span>
                        <span className="hidden sm:inline">{dept.name}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-bold ${dept.trendColor} flex items-center gap-0.5`}>
                        <span className="material-symbols-outlined text-xs" style={{ fontSize: '14px' }}>trending_up</span>
                        {dept.trend}
                      </span>
                      <span className="text-sm font-bold text-on-surface w-14 text-right">
                        {dept.visits.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-surface-container h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-2.5 rounded-full transition-all duration-700 ${dept.color} ${hoveredIndex === index ? 'opacity-100' : 'opacity-75'}`}
                      style={{ width: `${Math.round((dept.visits / maxVisits) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-5 border-t border-outline-variant/20 flex items-center justify-between text-xs text-outline">
              <span>Source: DIU Admission Portal · Spring 2026{totalApplications !== null ? ` · ${totalApplications} applications` : ' · Illustrative data'}</span>
              <span className="font-semibold">Total: {totalVisits.toLocaleString()} visits</span>
            </div>
          </div>

          {/* Right column — top dept + summary */}
          <div className="space-y-5">
            {/* Top Department Card */}
            <div className="bg-primary rounded-2xl p-6 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 opacity-10">
                <span className="material-symbols-outlined" style={{ fontSize: '120px', fontVariationSettings: "'FILL' 1" }}>emoji_events</span>
              </div>
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-primary-fixed text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>emoji_events</span>
                <span className="text-xs font-bold text-primary-fixed uppercase tracking-widest">Most Visited</span>
              </div>
              <div className="text-4xl font-black font-headline mb-1">{departments[0].short}</div>
              <div className="text-sm text-white/70 mb-4">{departments[0].name}</div>
              <div className="flex items-end gap-2">
                <div className="text-3xl font-black">{departments[0].visits.toLocaleString()}</div>
                <div className="text-xs text-white/60 mb-1 uppercase tracking-wider">visitors</div>
              </div>
              <div className="mt-3 text-xs text-white/60">
                {Math.round((departments[0].visits / totalVisits) * 100)}% of all prospective students
              </div>
            </div>

            {/* Top 5 Share */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-outline-variant/20">
              <div className="text-xs font-bold text-outline uppercase tracking-wider mb-4">Interest Share</div>
              {departments.slice(0, 5).map((dept) => (
                <div key={dept.short} className="flex items-center justify-between py-2 border-b border-outline-variant/20 last:border-0">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${dept.color}`} />
                    <span className="text-sm font-semibold text-on-surface">{dept.short}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-surface-container h-1.5 rounded-full overflow-hidden">
                      <div className={`h-1.5 rounded-full ${dept.color}`} style={{ width: `${Math.round((dept.visits / totalVisits) * 100) * 5}%` }} />
                    </div>
                    <span className="text-xs font-bold text-outline w-7 text-right">
                      {Math.round((dept.visits / totalVisits) * 100)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Market Trend */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-outline-variant/20">
              <div className="text-xs font-bold text-outline uppercase tracking-wider mb-4">Market Trends</div>
              {[
                { icon: 'computer', label: 'Tech & Engineering', sub: '+18% this semester', iconBg: 'bg-blue-50', iconColor: 'text-blue-600' },
                { icon: 'business_center', label: 'Business Programs', sub: '+8% this semester', iconBg: 'bg-indigo-50', iconColor: 'text-indigo-600' },
                { icon: 'gavel', label: 'Law & Social Science', sub: '+5% this semester', iconBg: 'bg-teal-50', iconColor: 'text-teal-600' },
              ].map((t) => (
                <div key={t.label} className="flex items-center gap-3 py-2.5 border-b border-outline-variant/20 last:border-0">
                  <div className={`w-9 h-9 rounded-xl ${t.iconBg} flex items-center justify-center flex-shrink-0`}>
                    <span className={`material-symbols-outlined text-lg ${t.iconColor}`}>{t.icon}</span>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-on-surface">{t.label}</div>
                    <div className="text-xs text-green-600 font-semibold">{t.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// Admission Steps Component
const AdmissionSteps = () => {
  const [activeStep, setActiveStep] = useState(null);

  const steps = [
    {
      number: '01',
      title: 'Pick Your Program',
      description: 'Choose from over 40 diverse undergraduate and graduate programs.',
    },
    {
      number: '02',
      title: 'Submit Application',
      description: 'Complete the online application form with your academic transcripts.',
    },
    {
      number: '03',
      title: 'Entrance & Interview',
      description: 'Participate in the admission assessment and interview session.',
    },
    {
      number: '04',
      title: 'Final Enrollment',
      description: 'Confirm your admission by completing fee payment and document verification.',
    },
  ];

  return (
    <section className="py-14 md:py-24 bg-surface-container-low px-4 md:px-8">
      <div className="max-w-screen-2xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 items-center">
        <div className="lg:col-span-5 relative">
          <div className="rounded-2xl overflow-hidden shadow-2xl shadow-[#0c1282]/20">
            <img
              className="w-full aspect-[4/5] object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuC1BopZKQja7HiwRyxlnfvtsqhHBrUHKfnFmEFAVIhLzFHe7jXYaKBxeRVEB_3x8k2jqWqCTbBzVGnNqfBzJk8686rgpZRMe3MKRNfyDb2lg8QWMjvDHt9vAdnbCy52XmAwZ4yk5J2b2F6qtLxCWkjMYZkSigkLO_MES79GbCUrHJtH9RvFQ4imAyKvQArDpcFCz8Cs2HRPiND6PNC84MBjY1WdLMunyVA71N8oPcrFPF-srVZWH25iGxiqW0pDE5cftxJPTBVIjzM"
              alt="University students"
            />
          </div>

          <div className="absolute -bottom-8 -right-8 bg-white p-8 rounded-2xl shadow-xl hidden md:block">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-fixed rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-primary">verified</span>
              </div>
              <div>
                <div className="text-sm font-bold text-on-surface">QS Ranked University</div>
                <div className="text-xs text-outline">Top in South Asia 2024</div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7">
          <h2 className="font-headline text-4xl font-extrabold text-on-surface mb-8 tracking-tight">
            Your Path to <span className="text-primary">Excellence</span>
          </h2>

          <div className="space-y-8">
            {steps.map((step, index) => (
              <div
                key={index}
                className="flex gap-6 group cursor-pointer"
                onMouseEnter={() => setActiveStep(index)}
                onMouseLeave={() => setActiveStep(null)}
              >
                <div className={`flex-shrink-0 w-12 h-12 rounded-full border-2 border-primary/20 flex items-center justify-center text-primary font-bold transition-all ${
                  activeStep === index
                    ? 'bg-primary text-white border-primary'
                    : 'group-hover:bg-primary group-hover:text-white'
                }`}>
                  {step.number}
                </div>

                <div>
                  <h4 className="text-xl font-bold font-headline mb-1 text-on-surface">
                    {step.title}
                  </h4>
                  <p className="text-outline text-sm leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

// Shared hook for chat logic — used by both widget and fullscreen
const useChatMessages = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      text: "👋 Hi! I'm your DIU Admission Advisor. I can help you:\n\n• 🎓 Find the right department for you\n• 💰 Calculate tuition fees & waivers\n• ✅ Check your eligibility\n• 📝 Fill your Pre-Registration form\n• 📋 Fill your Online Admit form\n\nNeed help filling a form? Just click one of the form buttons below, or ask me anything!",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [formMode, setFormMode] = useState(null); // 'pre-register' | 'online-admit' | null
  const [formFieldIndex, setFormFieldIndex] = useState(0);
  const [formData, setFormData] = useState({});
  const { processPrompt } = useAI();

  const addBotMessage = (text) => {
    setMessages(prev => [...prev, { id: Date.now() + Math.random(), type: 'bot', text, timestamp: new Date() }]);
  };

  const startFormMode = (type) => {
    const fields = type === 'pre-register' ? PRE_REGISTER_FIELDS : ONLINE_ADMIT_FIELDS;
    setFormMode(type);
    setFormFieldIndex(0);
    setFormData({});
    const label = type === 'pre-register' ? 'Pre-Registration' : 'Online Admit';
    addBotMessage(
      `📋 Let's fill your ${label} form together!\n\nI'll ask you ${fields.length} questions one by one and then automatically open the form with everything pre-filled. You can type "cancel" at any time to stop.\n\n` +
      `━━━━━━━━━━━━━━━━━━━━\nQuestion 1 of ${fields.length}\n\n${fields[0].question}`
    );
  };

  const handleFormInput = (text, currentFormMode, currentFieldIndex, currentFormData) => {
    if (text.trim().toLowerCase() === 'cancel' || text.trim().toLowerCase() === 'quit') {
      setFormMode(null);
      setFormFieldIndex(0);
      setFormData({});
      addBotMessage('❌ Form filling cancelled. You can restart anytime by clicking the form buttons. How else can I help?');
      return;
    }

    const fields = currentFormMode === 'pre-register' ? PRE_REGISTER_FIELDS : ONLINE_ADMIT_FIELDS;
    const field = fields[currentFieldIndex];

    if (!field.validate(text)) {
      addBotMessage(`⚠️ ${field.error}\n\nPlease try again:\n${field.question}`);
      return;
    }

    const normalized = field.normalize(text);
    const newFormData = { ...currentFormData, [field.key]: normalized };
    setFormData(newFormData);

    const nextIndex = currentFieldIndex + 1;

    if (nextIndex >= fields.length) {
      // All fields collected — save & navigate
      setFormMode(null);
      setFormFieldIndex(0);

      if (currentFormMode === 'pre-register') {
        localStorage.setItem('chatbot_preregister_data', JSON.stringify(newFormData));
        const summary = `✅ All done! Here's a summary:\n\n• Name: ${newFormData.fullName}\n• Email: ${newFormData.email}\n• Contact: ${newFormData.contactNumber}\n• SSC: ${newFormData.sscResult} GPA — ${newFormData.sscGroup} (${newFormData.sscBoard}, ${newFormData.sscYear})\n• HSC: ${newFormData.hscResult} GPA — ${newFormData.hscGroup} (${newFormData.hscBoard}, ${newFormData.hscYear})\n• Program: ${newFormData.programHint}\n\n🚀 Opening the Pre-Registration form now with all details pre-filled!`;
        addBotMessage(summary);
        setTimeout(() => navigate('/pre-register'), 1800);
      } else {
        localStorage.setItem('chatbot_admit_data', JSON.stringify(newFormData));
        const summary = `✅ All done! Here's a summary:\n\n• Name: ${newFormData.fullName}\n• Father: ${newFormData.fatherName}\n• Mother: ${newFormData.motherName}\n• Gender: ${newFormData.gender}\n• SSC: ${newFormData.sscGpa} GPA (${newFormData.sscBoard}, ${newFormData.sscYear})\n• HSC: ${newFormData.hscGpa} GPA (${newFormData.hscBoard}, ${newFormData.hscYear})\n• Program: ${newFormData.programName}\n\n🚀 Opening the Online Admit form! You'll still need to upload documents on the form page.`;
        addBotMessage(summary);
        setTimeout(() => navigate('/admit-card'), 1800);
      }
      return;
    }

    setFormFieldIndex(nextIndex);
    addBotMessage(`✓ ${field.label}: ${normalized}\n\n━━━━━━━━━━━━━━━━━━━━\nQuestion ${nextIndex + 1} of ${fields.length}\n\n${fields[nextIndex].question}`);
  };

  const sendMessage = async (text, currentMessages) => {
    if (!text.trim()) return;
    const updatedMessages = [...(currentMessages || messages), { id: Date.now(), type: 'user', text, timestamp: new Date() }];
    setMessages(updatedMessages);
    setInputValue('');

    // Form filling mode — intercept and handle locally
    if (formMode) {
      handleFormInput(text, formMode, formFieldIndex, formData);
      return;
    }

    // Detect intent to fill a form in normal chat
    const lower = text.toLowerCase();
    const wantsFill = lower.includes('fill') || lower.includes('help me') || lower.includes('form') || lower.includes('register') || lower.includes('admission form');
    const wantsPreReg = wantsFill && (lower.includes('pre') || lower.includes('pre-reg') || lower.includes('preregist'));
    const wantsAdmit = wantsFill && (lower.includes('admit') || lower.includes('online admit') || lower.includes('full form') || lower.includes('online form'));

    if (wantsPreReg) {
      setMessages(updatedMessages);
      addBotMessage("I can fill that form for you! Starting the Pre-Registration form assistant now...");
      setTimeout(() => startFormMode('pre-register'), 600);
      return;
    }
    if (wantsAdmit) {
      setMessages(updatedMessages);
      addBotMessage("I can fill that form for you! Starting the Online Admit form assistant now...");
      setTimeout(() => startFormMode('online-admit'), 600);
      return;
    }

    setIsLoading(true);
    const historyForApi = updatedMessages.slice(0, -1).map(m => ({ type: m.type, text: m.text }));

    try {
      const result = await processPrompt({
        prompt: text,
        context: 'DIU University admission advising. You can also help students fill forms — Pre-Registration and Online Admit forms are available.',
        moduleType: 'admission',
        history: historyForApi,
      });
      if (result && result.success && result.data) {
        setMessages(prev => [...prev, { id: Date.now() + 1, type: 'bot', text: result.data.response || 'Sorry, I could not generate a response.', timestamp: new Date() }]);
      } else {
        setMessages(prev => [...prev, { id: Date.now() + 1, type: 'bot', text: `Sorry, I encountered an issue: ${result?.error || 'Failed to get response'}`, timestamp: new Date() }]);
      }
    } catch {
      setMessages(prev => [...prev, { id: Date.now() + 1, type: 'bot', text: 'Sorry, something went wrong. Please try again.', timestamp: new Date() }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(inputValue, messages);
  };

  const currentFormFields = formMode === 'pre-register' ? PRE_REGISTER_FIELDS : formMode === 'online-admit' ? ONLINE_ADMIT_FIELDS : [];
  const formProgress = currentFormFields.length > 0 ? Math.round((formFieldIndex / currentFormFields.length) * 100) : 0;

  return { messages, inputValue, setInputValue, isLoading, sendMessage: (text) => sendMessage(text, messages), handleSubmit, formMode, formProgress, formFieldIndex, totalFormFields: currentFormFields.length, startFormMode };
};

// Render inline text: **bold** → <strong>
function renderInline(text, key) {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return (
    <React.Fragment key={key}>
      {parts.map((part, i) => i % 2 === 1 ? <strong key={i}>{part}</strong> : part)}
    </React.Fragment>
  );
}

// Parse markdown table lines into a <table>
function renderTable(lines, key) {
  const rows = lines
    .filter(l => !/^\s*\|?\s*[-:]+[-| :]*\s*\|?\s*$/.test(l)) // drop separator rows
    .map(l => l.replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim()));

  if (!rows.length) return null;
  const [head, ...body] = rows;
  return (
    <div key={key} className="overflow-x-auto my-2 rounded-lg border border-outline-variant/30">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-primary text-white">
            {head.map((cell, i) => (
              <th key={i} className="px-3 py-2 text-left font-semibold border-r border-white/20 last:border-r-0 whitespace-nowrap">
                {renderInline(cell, i)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((row, ri) => (
            <tr key={ri} className={ri % 2 === 0 ? 'bg-white' : 'bg-surface-container-low'}>
              {row.map((cell, ci) => (
                <td key={ci} className="px-3 py-2 border-t border-outline-variant/20 border-r border-outline-variant/20 last:border-r-0">
                  {renderInline(cell, ci)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Parse message text into blocks: tables, and normal lines
function renderMessageContent(text) {
  const lines = text.split('\n');
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    // Detect start of a markdown table (line with | pipe chars)
    if (/^\|.+\|/.test(lines[i].trim())) {
      const tableLines = [];
      while (i < lines.length && /\|/.test(lines[i])) {
        tableLines.push(lines[i]);
        i++;
      }
      blocks.push({ type: 'table', lines: tableLines });
    } else {
      blocks.push({ type: 'line', text: lines[i] });
      i++;
    }
  }

  return blocks.map((block, bi) => {
    if (block.type === 'table') {
      return renderTable(block.lines, `table-${bi}`);
    }
    // Normal line with inline bold
    return (
      <React.Fragment key={`line-${bi}`}>
        {renderInline(block.text, bi)}
        {bi < blocks.length - 1 && block.type === 'line' && <br />}
      </React.Fragment>
    );
  });
}

// Message list renderer
const MessageList = ({ messages, isLoading, messagesEndRef }) => (
  <div className="flex-1 overflow-y-auto p-4 space-y-4">
    {messages.map((message) => (
      <div key={message.id} className={`flex gap-2 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
        {message.type === 'bot' && (
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-1">
            <span className="material-symbols-outlined text-white text-sm">smart_toy</span>
          </div>
        )}
        <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
          message.type === 'user'
            ? 'bg-primary text-white rounded-br-sm'
            : 'bg-surface-container-low text-on-surface rounded-bl-sm border border-outline-variant/20'
        }`}>
          {message.type === 'bot' ? renderMessageContent(message.text) : message.text}
          <div className={`text-[10px] mt-1 ${message.type === 'user' ? 'text-white/60' : 'text-outline'}`}>
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
        {message.type === 'user' && (
          <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center flex-shrink-0 mt-1">
            <span className="material-symbols-outlined text-on-surface text-sm">person</span>
          </div>
        )}
      </div>
    ))}
    {isLoading && (
      <div className="flex gap-2 justify-start">
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
          <span className="material-symbols-outlined text-white text-sm">smart_toy</span>
        </div>
        <div className="bg-surface-container-low border border-outline-variant/20 px-4 py-3 rounded-2xl rounded-bl-sm">
          <div className="flex gap-1.5 items-center">
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
          </div>
        </div>
      </div>
    )}
    <div ref={messagesEndRef} />
  </div>
);

// Chat input bar
const ChatInput = ({ inputValue, setInputValue, isLoading, handleSubmit, autoFocus, placeholder }) => (
  <form onSubmit={handleSubmit} className="p-4 border-t border-outline-variant/20 flex gap-2 bg-white">
    <input
      type="text"
      value={inputValue}
      onChange={(e) => setInputValue(e.target.value)}
      placeholder={placeholder || "Ask about admissions, programs, scholarships..."}
      disabled={isLoading}
      autoFocus={autoFocus}
      className="flex-1 px-4 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
    />
    <button
      type="submit"
      disabled={isLoading || !inputValue.trim()}
      className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center hover:bg-primary/90 disabled:opacity-40 transition-all flex-shrink-0"
    >
      <span className="material-symbols-outlined text-base">send</span>
    </button>
  </form>
);

// Fullscreen Chat UI
const FullscreenChat = ({ onMinimize, onClose, messages, inputValue, setInputValue, isLoading, handleSubmit, sendMessage, formMode, formProgress, formFieldIndex, totalFormFields, startFormMode }) => {
  const messagesEndRef = React.useRef(null);
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const suggestions = [
    { icon: 'school', text: 'What programs are available?' },
    { icon: 'payments', text: 'How do I apply for a scholarship?' },
    { icon: 'event', text: 'What are the admission deadlines?' },
    { icon: 'description', text: 'What documents do I need?' },
    { icon: 'quiz', text: 'Is there an entrance test?' },
    { icon: 'location_on', text: 'Where is the campus located?' },
  ];

  return (
    <div className="fixed inset-0 z-[70] bg-surface flex flex-col" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Fullscreen Header */}
      <div className="bg-primary text-white px-6 py-4 flex items-center gap-4 shadow-lg flex-shrink-0">
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
        </div>
        <div className="flex-1">
          <div className="font-bold text-base leading-tight">DIU Admission Assistant</div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-white/70">Online — Powered by AI</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onMinimize}
            title="Minimize"
            className="p-2 rounded-lg hover:bg-white/20 transition-all text-white"
          >
            <span className="material-symbols-outlined">remove</span>
          </button>
          <button
            onClick={onClose}
            title="Close"
            className="p-2 rounded-lg hover:bg-white/20 transition-all text-white"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 min-h-0">
        {/* Left Sidebar */}
        <div className="hidden lg:flex flex-col w-72 xl:w-80 bg-surface-container-low border-r border-outline-variant/20 flex-shrink-0">
          {/* Bot Info */}
          <div className="p-6 border-b border-outline-variant/20">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
            </div>
            <div className="font-bold text-on-surface text-lg font-headline">DIU Admission Bot</div>
            <div className="text-sm text-outline mt-1 leading-relaxed">
              Your 24/7 AI guide for everything about Daffodil International University admissions.
            </div>
          </div>

          {/* Form Assistant Buttons */}
          <div className="p-4 border-b border-outline-variant/20">
            <div className="text-xs font-semibold text-outline uppercase tracking-wider mb-3">Form Assistant</div>
            <div className="space-y-2">
              <button
                onClick={() => startFormMode('pre-register')}
                disabled={isLoading || !!formMode}
                className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl bg-primary/10 hover:bg-primary/20 border border-primary/20 hover:border-primary/40 transition-all group disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-primary text-base" style={{ fontVariationSettings: "'FILL' 1" }}>how_to_reg</span>
                <div className="min-w-0">
                  <div className="text-sm text-primary font-bold">Fill Pre-Registration</div>
                  <div className="text-[10px] text-outline">AI guides you step by step</div>
                </div>
              </button>
              <button
                onClick={() => startFormMode('online-admit')}
                disabled={isLoading || !!formMode}
                className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 hover:border-indigo-300 transition-all group disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-indigo-600 text-base" style={{ fontVariationSettings: "'FILL' 1" }}>assignment_ind</span>
                <div className="min-w-0">
                  <div className="text-sm text-indigo-700 font-bold">Fill Online Admit Form</div>
                  <div className="text-[10px] text-outline">Full registration with pre-fill</div>
                </div>
              </button>
            </div>
            {formMode && (
              <div className="mt-3 bg-green-50 border border-green-200 rounded-xl p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-green-700">
                    {formMode === 'pre-register' ? 'Pre-Registration' : 'Online Admit'} in progress
                  </span>
                  <span className="text-xs text-green-600 font-semibold">{formFieldIndex}/{totalFormFields}</span>
                </div>
                <div className="w-full bg-green-200 rounded-full h-1.5">
                  <div className="bg-green-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${formProgress}%` }} />
                </div>
              </div>
            )}
          </div>

          {/* Quick Suggestions */}
          <div className="p-4 flex-1 overflow-y-auto">
            <div className="text-xs font-semibold text-outline uppercase tracking-wider mb-3">Quick Questions</div>
            <div className="space-y-2">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(s.text)}
                  disabled={isLoading || !!formMode}
                  className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white hover:bg-primary/5 border border-outline-variant/20 hover:border-primary/30 transition-all group disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-primary text-base group-hover:scale-110 transition-transform">{s.icon}</span>
                  <span className="text-sm text-on-surface font-medium">{s.text}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Footer note */}
          <div className="p-4 border-t border-outline-variant/20">
            <div className="flex items-start gap-2 text-xs text-outline">
              <span className="material-symbols-outlined text-sm flex-shrink-0 mt-0.5">info</span>
              <span>Responses are AI-generated. For official decisions, contact the admissions office.</span>
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex flex-col flex-1 min-w-0 bg-white">
          {formMode && (
            <div className="px-4 py-3 bg-green-50 border-b border-green-200 flex items-center justify-between gap-3 flex-shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="material-symbols-outlined text-green-600 text-sm flex-shrink-0">edit_note</span>
                <span className="text-xs font-bold text-green-700 truncate">
                  Filling {formMode === 'pre-register' ? 'Pre-Registration' : 'Online Admit'} — Step {formFieldIndex + 1} of {totalFormFields}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="w-24 bg-green-200 rounded-full h-1.5">
                  <div className="bg-green-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${formProgress}%` }} />
                </div>
                <button onClick={() => sendMessage('cancel')} className="text-[10px] text-red-500 font-bold hover:underline">Cancel</button>
              </div>
            </div>
          )}
          {messages.length === 1 && !formMode && (
            <div className="px-6 pt-6 pb-2">
              <div className="max-w-2xl mx-auto text-center">
                <div className="text-2xl font-bold font-headline text-on-surface mb-1">How can I help you today?</div>
                <div className="text-sm text-outline">Ask anything, or let me fill a form for you.</div>
              </div>
              <div className="flex flex-wrap gap-2 justify-center mt-4">
                <button onClick={() => startFormMode('pre-register')} disabled={isLoading}
                  className="flex items-center gap-1.5 px-3 py-2 bg-primary/10 border border-primary/20 rounded-xl text-xs text-primary font-bold hover:bg-primary/20 transition-all disabled:opacity-50">
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>how_to_reg</span>
                  Fill Pre-Registration
                </button>
                <button onClick={() => startFormMode('online-admit')} disabled={isLoading}
                  className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-700 font-bold hover:bg-indigo-100 transition-all disabled:opacity-50">
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>assignment_ind</span>
                  Fill Online Admit Form
                </button>
                {suggestions.slice(0, 3).map((s, i) => (
                  <button key={i} onClick={() => sendMessage(s.text)} disabled={isLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-container-low border border-outline-variant/20 rounded-full text-xs text-on-surface hover:border-primary/40 transition-all disabled:opacity-50">
                    <span className="material-symbols-outlined text-primary text-sm">{s.icon}</span>
                    {s.text}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="flex-1 min-h-0 max-w-3xl w-full mx-auto flex flex-col">
            <MessageList messages={messages} isLoading={isLoading} messagesEndRef={messagesEndRef} />
          </div>
          <div className="max-w-3xl w-full mx-auto">
            <ChatInput inputValue={inputValue} setInputValue={setInputValue} isLoading={isLoading} handleSubmit={handleSubmit} autoFocus
              placeholder={formMode ? 'Type your answer... (or "cancel" to stop)' : 'Ask about admissions, programs, scholarships...'} />
          </div>
        </div>
      </div>
    </div>
  );
};

// Chatbot Widget Component
const ChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const messagesEndRef = React.useRef(null);
  const chat = useChatMessages();

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat.messages, chat.isLoading]);

  if (isFullscreen) {
    return (
      <FullscreenChat
        onMinimize={() => setIsFullscreen(false)}
        onClose={() => { setIsFullscreen(false); setIsOpen(false); }}
        messages={chat.messages}
        inputValue={chat.inputValue}
        setInputValue={chat.setInputValue}
        isLoading={chat.isLoading}
        handleSubmit={chat.handleSubmit}
        sendMessage={chat.sendMessage}
        formMode={chat.formMode}
        formProgress={chat.formProgress}
        formFieldIndex={chat.formFieldIndex}
        totalFormFields={chat.totalFormFields}
        startFormMode={chat.startFormMode}
      />
    );
  }

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 z-[60] flex flex-col items-end gap-4">
      {isOpen && (
        <div className="bg-white rounded-2xl shadow-2xl w-[calc(100vw-2rem)] sm:w-96 border border-outline-variant/20 flex flex-col h-[480px] sm:h-[520px]">
          {/* Widget Header */}
          <div className="bg-primary text-white px-4 py-3 rounded-t-2xl flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold leading-tight">DIU Admission Bot</div>
              <div className="flex items-center gap-1 mt-0.5">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                <span className="text-[11px] text-white/70">Online</span>
              </div>
            </div>
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => setIsFullscreen(true)}
                title="Full screen"
                className="p-1.5 rounded-lg hover:bg-white/20 transition-all"
              >
                <span className="material-symbols-outlined text-base">open_in_full</span>
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Minimize"
                className="p-1.5 rounded-lg hover:bg-white/20 transition-all"
              >
                <span className="material-symbols-outlined text-base">remove</span>
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Close"
                className="p-1.5 rounded-lg hover:bg-white/20 transition-all"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>
          </div>

          {chat.formMode && (
            <div className="px-3 py-2 bg-green-50 border-b border-green-200 flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-green-700 truncate">
                {chat.formMode === 'pre-register' ? 'Pre-Reg' : 'Online Admit'} — {chat.formFieldIndex + 1}/{chat.totalFormFields}
              </span>
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="w-20 bg-green-200 rounded-full h-1.5">
                  <div className="bg-green-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${chat.formProgress}%` }} />
                </div>
                <button onClick={() => chat.sendMessage('cancel')} className="text-[10px] text-red-500 font-bold hover:underline">Cancel</button>
              </div>
            </div>
          )}
          {!chat.formMode && chat.messages.length === 1 && (
            <div className="px-3 py-2 border-b border-outline-variant/20 flex gap-2">
              <button onClick={() => chat.startFormMode('pre-register')} disabled={chat.isLoading}
                className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-primary/10 border border-primary/20 rounded-lg text-[11px] text-primary font-bold hover:bg-primary/20 transition-all disabled:opacity-50">
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>how_to_reg</span>
                Pre-Registration
              </button>
              <button onClick={() => chat.startFormMode('online-admit')} disabled={chat.isLoading}
                className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-indigo-50 border border-indigo-200 rounded-lg text-[11px] text-indigo-700 font-bold hover:bg-indigo-100 transition-all disabled:opacity-50">
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>assignment_ind</span>
                Online Admit
              </button>
            </div>
          )}
          <MessageList messages={chat.messages} isLoading={chat.isLoading} messagesEndRef={messagesEndRef} />
          <ChatInput
            inputValue={chat.inputValue}
            setInputValue={chat.setInputValue}
            isLoading={chat.isLoading}
            handleSubmit={chat.handleSubmit}
            placeholder={chat.formMode ? 'Type your answer... (or "cancel" to stop)' : undefined}
          />
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all relative"
      >
        <span className="material-symbols-outlined text-3xl">
          {isOpen ? 'close' : 'chat'}
        </span>
        {!isOpen && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#0c1282] rounded-full border-2 border-surface flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
          </div>
        )}
      </button>
    </div>
  );
};

// Main Dashboard Component
export const Dashboard = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-surface">
      <Navigation />

      <main className="pt-0">
        <HeroSection />
        <QuickAccessCards />
        <DepartmentBreakdown />
        <AdmissionSteps />
      </main>

      <ChatbotWidget />
      <Footer />
    </div>
  );
};
