import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navigation } from '../common/Navigation';
import { ChatbotWidget } from '../common/ChatbotWidget';
import { useAI } from '../../hooks/useAI';
import { authService } from '../../services/authService';
import { loadCareerProfile } from '../student/ProfilePage';
import { toast } from 'react-toastify';
import { jobService } from '../../services/jobService';

// ── Helpers ────────────────────────────────────────────────────────
const PHOTO_KEY = (email) => `diu_photo_${email}`;
const PROFILE_KEY = (email) => `diu_profile_${email}`;

const loadLocalProfile = (email) => {
  try { return JSON.parse(localStorage.getItem(PROFILE_KEY(email))) || {}; } catch { return {}; }
};

// Fallback jobs shown when the backend is unreachable
const FALLBACK_JOBS = [
  { id:'1',  title:'Junior Software Engineer',      company:'Brain Station 23',        location:'Dhaka, Bangladesh', type:'Full-time', salary:'৳30,000–45,000/mo', url:'https://brainstation-23.com/career',       description:'Python Django React Node.js SQL Git REST API JavaScript software development agile',                                   posted:'2 days ago',  logo:'https://logo.clearbit.com/brainstation-23.com' },
  { id:'2',  title:'Frontend Developer (React)',    company:'SELISE Digital Platforms', location:'Dhaka, Bangladesh', type:'Full-time', salary:'৳35,000–55,000/mo', url:'https://selisegroup.com/careers',          description:'React JavaScript TypeScript HTML CSS Redux Tailwind REST API Git frontend',                                           posted:'3 days ago',  logo:'https://logo.clearbit.com/selisegroup.com' },
  { id:'3',  title:'Python Developer',              company:'Kaz Software',            location:'Dhaka, Bangladesh', type:'Full-time', salary:'৳40,000–60,000/mo', url:'https://kaz.com.bd/careers',              description:'Python Django Flask REST API PostgreSQL Docker Git Machine Learning backend',                                         posted:'1 week ago',  logo:'https://logo.clearbit.com/kaz.com.bd' },
  { id:'4',  title:'Machine Learning Engineer',     company:'Intelligent Machines',    location:'Dhaka, Bangladesh', type:'Full-time', salary:'৳60,000–90,000/mo', url:'https://im.ai/careers',                   description:'Python TensorFlow Machine Learning Deep Learning NLP Data Analysis SQL scikit-learn Docker',                           posted:'4 days ago',  logo:'https://logo.clearbit.com/im.ai' },
  { id:'5',  title:'Mobile App Developer (Flutter)',company:'SSL Wireless',            location:'Dhaka, Bangladesh', type:'Full-time', salary:'৳35,000–55,000/mo', url:'https://sslwireless.com/career',          description:'Flutter Dart Android iOS Firebase REST API Git mobile development',                                                   posted:'5 days ago',  logo:'https://logo.clearbit.com/sslwireless.com' },
  { id:'6',  title:'DevOps Engineer',               company:'Shohoz',                  location:'Dhaka, Bangladesh', type:'Full-time', salary:'৳55,000–80,000/mo', url:'https://shohoz.com/careers',              description:'Docker Kubernetes AWS DevOps CI/CD Linux Bash Git Jenkins cloud infrastructure',                                       posted:'1 week ago',  logo:'https://logo.clearbit.com/shohoz.com' },
  { id:'7',  title:'Data Analyst',                  company:'Pathao',                  location:'Dhaka, Bangladesh', type:'Full-time', salary:'৳40,000–65,000/mo', url:'https://pathao.com/careers',              description:'SQL Python Data Analysis Excel Power BI statistics dashboard reporting analytics',                                     posted:'2 days ago',  logo:'https://logo.clearbit.com/pathao.com' },
  { id:'8',  title:'Backend Developer (Node.js)',   company:'Chaldal',                 location:'Dhaka, Bangladesh', type:'Full-time', salary:'৳38,000–58,000/mo', url:'https://chaldal.com/careers',             description:'Node.js JavaScript MongoDB REST API Express Git Docker backend microservices',                                         posted:'3 days ago',  logo:'https://logo.clearbit.com/chaldal.com' },
  { id:'9',  title:'UI/UX Designer',                company:'Therap Services',         location:'Sylhet, Bangladesh', type:'Full-time', salary:'৳30,000–50,000/mo', url:'https://therapbd.com/careers',            description:'Figma UI UX design Adobe XD wireframe prototype user research CSS',                                                   posted:'6 days ago',  logo:'https://logo.clearbit.com/therapbd.com' },
  { id:'10', title:'Cybersecurity Analyst',         company:'Sheba.xyz',               location:'Dhaka, Bangladesh', type:'Full-time', salary:'৳50,000–75,000/mo', url:'https://sheba.xyz/careers',               description:'Cybersecurity network security Linux Python penetration testing OWASP firewall SIEM',                                  posted:'1 week ago',  logo:'https://logo.clearbit.com/sheba.xyz' },
  { id:'11', title:'Software Engineer (Java)',      company:'BJIT Limited',            location:'Dhaka, Bangladesh', type:'Full-time', salary:'৳45,000–70,000/mo', url:'https://bjitgroup.com/careers',           description:'Java Spring Boot SQL REST API Microservices Docker Git Maven backend development',                                     posted:'2 days ago',  logo:'https://logo.clearbit.com/bjitgroup.com' },
  { id:'12', title:'Cloud Engineer (AWS)',          company:'DataSoft Systems',        location:'Dhaka, Bangladesh', type:'Full-time', salary:'৳60,000–90,000/mo', url:'https://datasoft-bd.com/career',          description:'AWS cloud Lambda EC2 S3 Terraform Docker Kubernetes DevOps infrastructure automation',                                 posted:'4 days ago',  logo:'https://logo.clearbit.com/datasoft-bd.com' },
  { id:'13', title:'PHP Developer (Laravel)',       company:'Nascenia',                location:'Dhaka, Bangladesh', type:'Full-time', salary:'৳28,000–45,000/mo', url:'https://nascenia.com/careers',            description:'PHP Laravel MySQL JavaScript REST API Git backend web development',                                                   posted:'5 days ago',  logo:'https://logo.clearbit.com/nascenia.com' },
  { id:'14', title:'QA Engineer',                  company:'Tiger IT Bangladesh',     location:'Dhaka, Bangladesh', type:'Full-time', salary:'৳30,000–48,000/mo', url:'https://tigertms.com/careers',            description:'QA testing Selenium automation manual testing Python SQL bug reporting agile Jira',                                    posted:'1 week ago',  logo:'https://logo.clearbit.com/tigertms.com' },
  { id:'15', title:'Graduate Trainee – Software',  company:'Grameenphone',            location:'Dhaka, Bangladesh', type:'Full-time', salary:'Competitive',        url:'https://grameenphone.com/about/career',   description:'Python JavaScript SQL software engineering communication teamwork fresh graduate entry level',                        posted:'3 days ago',  logo:'https://logo.clearbit.com/grameenphone.com' },
];

const COMMON_SKILLS = [
  'Python','JavaScript','React','Node.js','Java','C++','SQL','MongoDB',
  'Machine Learning','Docker','AWS','TypeScript','Git','Django','Spring Boot',
  'Flutter','TensorFlow','Kubernetes','PHP','Laravel','DevOps','Figma',
];

function computeMatch(description = '', techSkills = []) {
  if (!description || !techSkills.length) return Math.floor(Math.random() * 30) + 20;
  const desc = description.toLowerCase();
  const hits = techSkills.filter(s => desc.includes(s.toLowerCase()));
  const base = Math.round((hits.length / Math.max(techSkills.length, 5)) * 100);
  return Math.min(98, Math.max(15, base + Math.floor(Math.random() * 12)));
}

function extractRequiredSkills(description = '') {
  const desc = description.toLowerCase();
  return COMMON_SKILLS.filter(s => desc.includes(s.toLowerCase())).slice(0, 8);
}

function getMissing(required, techSkills) {
  const has = techSkills.map(s => s.toLowerCase());
  return required.filter(s => !has.includes(s.toLowerCase()));
}

// ── Match badge ────────────────────────────────────────────────────
const MatchBadge = ({ score }) => {
  const cls = score >= 70
    ? 'bg-emerald-100 text-emerald-700'
    : score >= 45
      ? 'bg-amber-100 text-amber-700'
      : 'bg-red-100 text-red-600';
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black ${cls}`}>
      {score}% match
    </span>
  );
};

// ── Auto-generate professional summary from profile ────────────────
function autoSummary(profile, career) {
  if (career.summary) return career.summary;
  const title = career.title || career.careerGoal || 'technology professional';
  const expYears = career.experience.filter(e => e.role).length;
  const topSkills = career.techSkills.slice(0, 3).join(', ');
  const softList = career.softSkills.slice(0, 2).join(' and ');
  const projectCount = career.projects.filter(p => p.name).length;
  let s = `I am a qualified and professional ${title}`;
  if (expYears > 0) s += ` with ${expYears} year${expYears > 1 ? 's' : ''} of hands-on experience`;
  if (topSkills) s += ` in ${topSkills}`;
  s += '.';
  if (projectCount > 0) s += ` Developed ${projectCount} project${projectCount > 1 ? 's' : ''}`;
  const firstProj = career.projects.find(p => p.name);
  if (firstProj) s += ` including ${firstProj.name}`;
  if (projectCount > 0) s += '.';
  if (softList) s += ` Strong ${softList} skills.`;
  s += ' Team player with an eye for detail and a passion for building impactful solutions.';
  return s;
}

// ── CV Template — pixel-perfect cv.pdf layout ─────────────────────
// Colors: main #244c5d · sidebar bg #d9e6ec · header bg #f4f4f4 · photo #a7c9d8
const CVTemplate = ({ profile, career, photo, targetJob = null, cvData = null }) => {
  const printRef = useRef();
  const data = cvData || career;

  const relevantSkills = targetJob
    ? [...new Set([
        ...data.techSkills.filter(s => (targetJob.required || []).map(r => r.toLowerCase()).includes(s.toLowerCase())),
        ...data.techSkills.filter(s => !(targetJob.required || []).map(r => r.toLowerCase()).includes(s.toLowerCase())),
      ])]
    : data.techSkills;

  const summaryText = targetJob
    ? `${autoSummary(profile, data)} My skills in ${data.techSkills.slice(0,3).join(', ')} align closely with the requirements for the ${targetJob.title} role at ${targetJob.company}.`
    : autoSummary(profile, data);

  const nameParts = (profile.name || 'YOUR NAME').trim().split(' ');
  const firstName = nameParts.slice(0, -1).join(' ') || nameParts[0];
  const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
  const initials = (profile.name || 'ST').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const roleTitle = (data.title || data.careerGoal || 'PROFESSIONAL').toUpperCase();
  const deptTitle = roleTitle.split(' ').slice(0, 2).join(' ');

  // Section title with teal underline (matches cv.pdf GlacialIndifference-Bold style)
  const SideTitle = ({ children }) => (
    <div className="mb-2">
      <p style={{ fontFamily: "'Raleway',sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: '#244c5d' }}>{children}</p>
      <div style={{ width: 22, height: 2, background: '#244c5d', marginTop: 3 }} />
    </div>
  );
  const RightTitle = ({ children }) => (
    <div className="mb-2">
      <p style={{ fontFamily: "'Raleway',sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: '#244c5d' }}>{children}</p>
      <div style={{ width: 22, height: 2, background: '#244c5d', marginTop: 3 }} />
    </div>
  );

  const handlePrint = () => {
    const win = window.open('', '_blank');
    const skillsHtml = relevantSkills.map((s, i) => `
      <div class="skill-row">
        <span class="skill-name">${s}</span>
        <div class="skill-bar"><div class="skill-fill" style="width:${Math.max(45,92-i*8)}%"></div></div>
      </div>`).join('');
    const softHtml = data.softSkills.map(s => `<div class="soft-item">• ${s}</div>`).join('');
    const expHtml = data.experience.filter(e=>e.role).map(e => `
      <div class="exp-block">
        <div class="exp-head"><span class="exp-role">${e.role}</span><span class="exp-date">${e.duration||''}</span></div>
        <div class="exp-co">${e.company||''}</div>
        ${e.description?`<div class="exp-desc">${e.description}</div>`:''}
      </div>`).join('');
    const projHtml = data.projects.filter(p=>p.name).map(p => `
      <div class="exp-block">
        <div class="exp-head"><span class="exp-role">${p.name}</span>${p.tech?`<span class="exp-date">${p.tech}</span>`:''}</div>
        ${p.url?`<div class="exp-co">${p.url}</div>`:''}
        ${p.description?`<div class="exp-desc">${p.description}</div>`:''}
      </div>`).join('');
    const certHtml = data.certificates.filter(c=>c.name).map(c => `
      <div class="cert-row"><span class="cert-dot"></span><span class="cert-name">${c.name}</span>${c.issuer||c.year?`<span class="cert-meta"> — ${[c.issuer,c.year].filter(Boolean).join(', ')}</span>`:''}</div>`).join('');

    win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>${profile.name||'CV'} — Resume</title>
<link href="https://fonts.googleapis.com/css2?family=Raleway:wght@400;600;700&family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#fff;font-family:'Roboto',sans-serif;font-size:10px;color:#464a4e;width:210mm;min-height:297mm}
.page{display:flex;flex-direction:column;width:210mm;min-height:297mm}
/* Header strip */
.header{background:#f4f4f4;display:flex;align-items:center;padding:22px 28px 22px 22px;gap:24px;position:relative}
.photo-box{width:130px;height:130px;background:#a7c9d8;flex-shrink:0;overflow:hidden;display:flex;align-items:center;justify-content:center;font-size:36px;font-weight:700;color:#244c5d}
.photo-box img{width:100%;height:100%;object-fit:cover}
.header-text{flex:1}
.h-dept{font-family:'Raleway',sans-serif;font-size:13px;font-weight:400;color:#244c5d;letter-spacing:1px;text-transform:uppercase}
.h-name{font-family:'Raleway',sans-serif;font-size:24px;font-weight:700;color:#244c5d;line-height:1.15;margin:2px 0 6px}
.h-under{width:28px;height:2px;background:#244c5d;margin-bottom:10px}
.h-summary{font-size:9.5px;color:#625f5f;line-height:1.6;max-width:340px}
/* Body */
.body{display:flex;flex:1}
.sidebar{width:190px;background:#d9e6ec;padding:18px 16px;flex-shrink:0;display:flex;flex-direction:column;gap:16px}
.main{flex:1;padding:18px 22px;display:flex;flex-direction:column;gap:14px}
/* Section titles */
.sect-title{font-family:'Raleway',sans-serif;font-size:8.5px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#244c5d;margin-bottom:5px}
.sect-under{width:22px;height:2px;background:#244c5d;margin-bottom:8px}
/* Sidebar items */
.contact-row{display:flex;align-items:flex-start;gap:6px;margin-bottom:4px;font-size:8.5px;color:#464a4e}
.skill-row{display:flex;align-items:center;gap:6px;margin-bottom:5px}
.skill-name{font-size:8.5px;color:#244c5d;width:75px;flex-shrink:0}
.skill-bar{flex:1;height:3px;background:rgba(36,76,93,0.15);border-radius:2px}
.skill-fill{height:100%;background:#244c5d;border-radius:2px}
.soft-item{font-size:8.5px;color:#464a4e;margin-bottom:3px}
/* Right content */
.exp-block{margin-bottom:10px}
.exp-head{display:flex;justify-content:space-between;align-items:baseline}
.exp-role{font-family:'Raleway',sans-serif;font-size:10px;font-weight:700;color:#244c5d}
.exp-date{font-size:8px;color:#706f6f}
.exp-co{font-size:9px;color:#625f5f;font-weight:500;margin:1px 0}
.exp-desc{font-size:8.5px;color:#464a4e;line-height:1.55;margin-top:2px}
.cert-row{display:flex;align-items:baseline;gap:5px;margin-bottom:4px}
.cert-dot{width:4px;height:4px;border-radius:50%;background:#244c5d;flex-shrink:0;margin-top:2px}
.cert-name{font-size:9px;font-weight:600;color:#244c5d}
.cert-meta{font-size:8px;color:#706f6f}
@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style></head><body>
<div class="page">
  <div class="header">
    <div class="photo-box">${photo?`<img src="${photo}" alt="photo">`:(initials)}</div>
    <div class="header-text">
      <div class="h-dept">${deptTitle}</div>
      <div class="h-name">${firstName}${lastName?' ':''}<strong>${lastName}</strong></div>
      <div class="h-under"></div>
      <div class="h-summary">${summaryText}</div>
    </div>
  </div>
  <div class="body">
    <div class="sidebar">
      <div>
        <div class="sect-title">SKILLS</div><div class="sect-under"></div>
        ${skillsHtml || '<div class="soft-item">Add skills in your profile</div>'}
      </div>
      ${data.softSkills.length>0?`<div><div class="sect-title">SOFT SKILLS</div><div class="sect-under"></div>${softHtml}</div>`:''}
      <div>
        <div class="sect-title">CONTACT</div><div class="sect-under"></div>
        ${profile.phone?`<div class="contact-row">📞 ${profile.phone}</div>`:''}
        ${profile.email?`<div class="contact-row">✉ ${profile.email}</div>`:''}
        ${profile.address?`<div class="contact-row">📍 ${profile.address}</div>`:''}
        ${data.github?`<div class="contact-row">🔗 ${data.github}</div>`:''}
        ${data.linkedin?`<div class="contact-row">💼 ${data.linkedin}</div>`:''}
        ${data.portfolio?`<div class="contact-row">🌐 ${data.portfolio}</div>`:''}
      </div>
      <div>
        <div class="sect-title">EDUCATION</div><div class="sect-under"></div>
        <div class="exp-role" style="font-size:9px">Daffodil International University</div>
        <div class="exp-co">Bachelor's Degree</div>
        <div class="exp-date">${profile.studentId||''} ${profile.currentSemester?'· '+profile.currentSemester:''}</div>
      </div>
    </div>
    <div class="main">
      ${expHtml?`<div><div class="sect-title">EXPERIENCE</div><div class="sect-under"></div>${expHtml}</div>`:''}
      ${projHtml?`<div><div class="sect-title">PROJECTS</div><div class="sect-under"></div>${projHtml}</div>`:''}
      ${certHtml?`<div><div class="sect-title">CERTIFICATIONS</div><div class="sect-under"></div>${certHtml}</div>`:''}
      ${!expHtml&&!projHtml?`<div style="color:#706f6f;font-size:9px;margin-top:8px">Add experience and projects in your profile to populate this section.</div>`:''}
    </div>
  </div>
</div>
</body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 600);
  };

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          {targetJob
            ? <><p className="font-extrabold text-[#244c5d]">CV tailored for: {targetJob.title} @ {targetJob.company}</p><p className="text-xs text-[#625f5f]">Skills reordered by relevance · Summary auto-customized</p></>
            : <p className="font-extrabold text-[#244c5d] text-lg">My Professional CV</p>}
        </div>
        <button onClick={handlePrint}
          className="flex items-center gap-2 px-5 py-2.5 text-white font-bold text-sm rounded-xl hover:opacity-90 transition-all shadow-lg"
          style={{ background: '#244c5d' }}>
          <span className="material-symbols-outlined text-base">download</span>Download PDF
        </button>
      </div>

      {/* ── CV PREVIEW — pixel-perfect cv.pdf reproduction ── */}
      <div ref={printRef} className="rounded-2xl shadow-2xl overflow-hidden border border-slate-200"
        style={{ fontFamily: "'Roboto',sans-serif", fontSize: 11, color: '#464a4e', background: '#fff' }}>

        {/* Header strip — full width light gray */}
        <div className="flex items-center gap-6 px-7 py-5" style={{ background: '#f4f4f4' }}>
          {/* Photo box */}
          <div className="flex-shrink-0 flex items-center justify-center overflow-hidden"
            style={{ width: 120, height: 120, background: '#a7c9d8' }}>
            {photo
              ? <img src={photo} alt="profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ fontSize: 32, fontWeight: 900, color: '#244c5d' }}>{initials}</span>}
          </div>
          {/* Name + summary */}
          <div className="flex-1 min-w-0">
            <p style={{ fontFamily: "'Raleway',sans-serif", fontSize: 13, color: '#244c5d', letterSpacing: 1, textTransform: 'uppercase' }}>{deptTitle}</p>
            <p style={{ fontFamily: "'Raleway',sans-serif", fontSize: 22, fontWeight: 700, color: '#244c5d', lineHeight: 1.2, marginTop: 2 }}>
              {firstName} <strong>{lastName}</strong>
            </p>
            <div style={{ width: 28, height: 2, background: '#244c5d', margin: '6px 0 8px' }} />
            <p style={{ fontSize: 9.5, color: '#625f5f', lineHeight: 1.65, maxWidth: 380 }}>{summaryText}</p>
          </div>
        </div>

        {/* Body: sidebar + main */}
        <div className="flex" style={{ minHeight: 520 }}>

          {/* SIDEBAR — light teal #d9e6ec */}
          <div className="flex flex-col gap-4 p-5" style={{ width: 185, background: '#d9e6ec', flexShrink: 0 }}>

            {relevantSkills.length > 0 && (
              <div>
                <SideTitle>SKILLS</SideTitle>
                {relevantSkills.map((s, i) => (
                  <div key={s} className="flex items-center gap-2 mb-1.5">
                    <span style={{ fontSize: 8.5, color: '#244c5d', width: 70, flexShrink: 0, fontFamily: "'Roboto',sans-serif" }}>{s}</span>
                    <div style={{ flex: 1, height: 3, background: 'rgba(36,76,93,0.15)', borderRadius: 2 }}>
                      <div style={{ height: '100%', width: `${Math.max(45, 92-i*8)}%`, background: '#244c5d', borderRadius: 2 }} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {data.softSkills.length > 0 && (
              <div>
                <SideTitle>SOFT SKILLS</SideTitle>
                {data.softSkills.map(s => (
                  <p key={s} style={{ fontSize: 8.5, color: '#464a4e', marginBottom: 3 }}>• {s}</p>
                ))}
              </div>
            )}

            <div>
              <SideTitle>CONTACT</SideTitle>
              {[
                { ico: '📞', val: profile.phone },
                { ico: '✉', val: profile.email },
                { ico: '📍', val: profile.address },
                { ico: '🔗', val: data.github },
                { ico: '💼', val: data.linkedin },
                { ico: '🌐', val: data.portfolio },
              ].filter(x => x.val).map((x, i) => (
                <div key={i} className="flex items-start gap-1.5 mb-1.5">
                  <span style={{ fontSize: 9, flexShrink: 0 }}>{x.ico}</span>
                  <span style={{ fontSize: 8.5, color: '#464a4e', wordBreak: 'break-all', lineHeight: 1.4 }}>{x.val}</span>
                </div>
              ))}
            </div>

            <div>
              <SideTitle>EDUCATION</SideTitle>
              <p style={{ fontFamily: "'Raleway',sans-serif", fontSize: 9, fontWeight: 700, color: '#244c5d' }}>Daffodil International University</p>
              <p style={{ fontSize: 8.5, color: '#625f5f', marginTop: 2 }}>Bachelor's Degree</p>
              <p style={{ fontSize: 8, color: '#706f6f', marginTop: 1 }}>{profile.studentId} {profile.currentSemester && `· ${profile.currentSemester}`}</p>
            </div>
          </div>

          {/* MAIN content */}
          <div className="flex flex-col gap-5 p-6 bg-white flex-1">

            {data.experience.filter(e => e.role).length > 0 && (
              <div>
                <RightTitle>EXPERIENCE</RightTitle>
                {data.experience.filter(e => e.role).map((exp, i) => (
                  <div key={i} className="mb-3">
                    <div className="flex justify-between items-baseline">
                      <span style={{ fontFamily: "'Raleway',sans-serif", fontSize: 10, fontWeight: 700, color: '#244c5d' }}>{exp.role}</span>
                      <span style={{ fontSize: 8, color: '#706f6f' }}>{exp.duration}</span>
                    </div>
                    <p style={{ fontSize: 9, color: '#625f5f', fontWeight: 500, margin: '1px 0' }}>{exp.company}</p>
                    {exp.description && <p style={{ fontSize: 8.5, color: '#464a4e', lineHeight: 1.55, marginTop: 2 }}>{exp.description}</p>}
                  </div>
                ))}
              </div>
            )}

            {data.projects.filter(p => p.name).length > 0 && (
              <div>
                <RightTitle>PROJECTS</RightTitle>
                {data.projects.filter(p => p.name).map((proj, i) => (
                  <div key={i} className="mb-3">
                    <div className="flex items-baseline gap-3">
                      <span style={{ fontFamily: "'Raleway',sans-serif", fontSize: 10, fontWeight: 700, color: '#244c5d' }}>{proj.name}</span>
                      {proj.tech && <span style={{ fontSize: 8, color: '#706f6f' }}>{proj.tech}</span>}
                    </div>
                    {proj.url && <p style={{ fontSize: 8.5, color: '#625f5f' }}>{proj.url}</p>}
                    {proj.description && <p style={{ fontSize: 8.5, color: '#464a4e', lineHeight: 1.55, marginTop: 2 }}>{proj.description}</p>}
                  </div>
                ))}
              </div>
            )}

            {data.certificates.filter(c => c.name).length > 0 && (
              <div>
                <RightTitle>CERTIFICATIONS</RightTitle>
                {data.certificates.filter(c => c.name).map((cert, i) => (
                  <div key={i} className="flex items-baseline gap-2 mb-1.5">
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#244c5d', flexShrink: 0, marginTop: 2 }} />
                    <span style={{ fontFamily: "'Raleway',sans-serif", fontSize: 9, fontWeight: 600, color: '#244c5d' }}>{cert.name}</span>
                    {(cert.issuer || cert.year) && <span style={{ fontSize: 8, color: '#706f6f' }}>— {[cert.issuer,cert.year].filter(Boolean).join(', ')}</span>}
                  </div>
                ))}
              </div>
            )}

            {!data.experience.filter(e=>e.role).length && !data.projects.filter(p=>p.name).length && (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <p style={{ color: '#706f6f', fontSize: 10 }}>Add experience and projects in your Profile to populate this section.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Main Jobs Page ─────────────────────────────────────────────────
export const JobsPage = () => {
  const navigate = useNavigate();
  const user = authService.getUser();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (!user) return null;

  return <JobsContent user={user} navigate={navigate} />;
};

function JobsContent({ user, navigate }) {
  const [activeTab, setActiveTab] = useState('jobs');
  const [profile] = useState(() => ({ ...loadLocalProfile(user.email), email: user.email, name: user.name }));
  const [career] = useState(() => {
    const s = loadCareerProfile(user.email);
    return {
      title:        s.title        || '',
      summary:      s.summary      || '',
      careerGoal:   s.careerGoal   || '',
      github:       s.github       || '',
      portfolio:    s.portfolio    || '',
      linkedin:     s.linkedin     || '',
      techSkills:   Array.isArray(s.techSkills)   ? s.techSkills   : [],
      softSkills:   Array.isArray(s.softSkills)   ? s.softSkills   : [],
      experience:   Array.isArray(s.experience)   ? s.experience   : [],
      projects:     Array.isArray(s.projects)     ? s.projects     : [],
      certificates: Array.isArray(s.certificates) ? s.certificates : [],
    };
  });
  const [photo] = useState(() => localStorage.getItem(PHOTO_KEY(user.email)));

  // Editable CV data (starts from career profile, can be customized)
  const [cvData, setCvData] = useState(() => ({
    title:        career.title        || '',
    summary:      career.summary      || '',
    careerGoal:   career.careerGoal   || '',
    github:       career.github       || '',
    portfolio:    career.portfolio    || '',
    linkedin:     career.linkedin     || '',
    techSkills:   [...career.techSkills],
    softSkills:   [...career.softSkills],
    experience:   career.experience.map(e => ({ ...e })),
    projects:     career.projects.map(p => ({ ...p })),
    certificates: career.certificates.map(c => ({ ...c })),
  }));
  const [cvSidePanel, setCvSidePanel] = useState('none'); // 'none' | 'edit' | 'ai'

  // Jobs state
  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJob, setSelectedJob] = useState(null);
  const [cvJob, setCvJob] = useState(null);

  // Live external jobs (JSearch API)
  const [externalJobs, setExternalJobs] = useState([]);
  const [externalLoading, setExternalLoading] = useState(false);
  const [externalError, setExternalError] = useState('');

  // Career roadmap state
  const [roadmap, setRoadmap] = useState('');
  const [roadmapLoading, setRoadmapLoading] = useState(false);
  const [careerGoalInput, setCareerGoalInput] = useState(career.careerGoal || '');
  const { processPrompt } = useAI();

  const hasProfile = career.techSkills.length > 0 || career.careerGoal;

  // ── Fetch jobs ───────────────────────────────────────────────
  const filterFallback = useCallback((q) => {
    if (!q) return FALLBACK_JOBS;
    const keywords = q.split(/\s+/).filter(w => w.length > 1);
    return FALLBACK_JOBS.filter(j =>
      keywords.some(kw =>
        j.title.toLowerCase().includes(kw) ||
        j.company.toLowerCase().includes(kw) ||
        j.description.toLowerCase().includes(kw)
      )
    );
  }, []);

  const fetchJobs = useCallback(async (term) => {
    const q = (term || career.techSkills.slice(0, 2).join(' ') || '').trim().toLowerCase();
    setJobsLoading(true);
    try {
      const res = await jobService.searchJobs(q);
      const items = res.data?.data ?? res.data;
      if (Array.isArray(items) && items.length > 0) {
        setJobs(items);
      } else {
        const filtered = filterFallback(q);
        setJobs(filtered.length > 0 ? filtered : FALLBACK_JOBS);
      }
    } catch {
      const filtered = filterFallback(q);
      setJobs(filtered.length > 0 ? filtered : FALLBACK_JOBS);
    } finally {
      setJobsLoading(false);
    }
  }, [career.techSkills, filterFallback]);

  // ── Fetch live external jobs (JSearch via Flask proxy) ───────
  const fetchExternalJobs = useCallback(async (term) => {
    const keyword = (term || '').trim();
    if (!keyword) return;
    setExternalLoading(true);
    setExternalError('');
    setExternalJobs([]);
    try {
      const res = await jobService.searchExternalJobs(keyword);
      const items = res.data?.data ?? [];
      if (items.length === 0) {
        setExternalError('No live jobs found for this search. Try a broader keyword.');
      } else {
        setExternalJobs(items);
      }
    } catch (err) {
      const code = err.response?.data?.errorCode;
      if (code === 'RATE_LIMIT') {
        setExternalError('Live job search limit reached. Please try again in a moment.');
      } else if (code === 'SERVICE_NOT_CONFIGURED') {
        setExternalError('Live job search is not configured yet.');
      } else if (code === 'NOT_SUBSCRIBED') {
        setExternalError('Live job search requires a JSearch API subscription on RapidAPI.');
      } else {
        setExternalError('Could not load live jobs. Showing local results only.');
      }
    } finally {
      setExternalLoading(false);
    }
  }, []);

  // ── Generate roadmap ─────────────────────────────────────────
  const generateRoadmap = async () => {
    const goal = careerGoalInput || career.careerGoal || (career.techSkills[0] ? career.techSkills[0] + ' Developer' : 'Software Engineer');
    setRoadmapLoading(true);
    setRoadmap('');
    try {
      const result = await processPrompt({
        prompt: `Create a detailed, realistic career roadmap for a DIU student who wants to become a ${goal}.
Current skills: ${career.techSkills.join(', ') || 'beginner'}.
Format strictly as:
**Phase 1 (Month 1–3): Foundation**
• Skills to learn: ...
• Projects to build: ...
• Tools: ...

**Phase 2 (Month 4–6): Intermediate**
...continue for 4 phases total...

End with:
**Estimated time to first job: X months**
**Entry-level salary range: ...**`,
        context: 'You are a senior career advisor for tech students. Be specific, realistic, and actionable.',
        moduleType: 'career',
      });
      setRoadmap(result?.data?.response || 'Could not generate roadmap. Please try again.');
    } catch {
      setRoadmap('Connection error. Please try again.');
    } finally {
      setRoadmapLoading(false);
    }
  };

  // ── Tabs ─────────────────────────────────────────────────────
  const tabs = [
    { id: 'jobs',    label: 'Job Matches',   icon: 'work',        count: jobs.length || null },
    { id: 'gap',     label: 'Skill Gap',     icon: 'analytics' },
    { id: 'roadmap', label: 'Career Path',   icon: 'map' },
    { id: 'cv',      label: 'My CV',         icon: 'description' },
  ];

  // ── Profile strength ─────────────────────────────────────────
  const strength = [
    profile.name, profile.phone, career.techSkills.length > 0,
    career.softSkills.length > 0, career.summary, career.careerGoal,
    career.projects.length > 0, career.github,
  ].filter(Boolean).length;

  const strengthPct = Math.round((strength / 8) * 100);
  const strengthColor = strengthPct >= 75 ? '#22c55e' : strengthPct >= 50 ? '#f59e0b' : '#ef4444';

  const firstName = profile.name ? profile.name.split(' ')[0] : (user.name || 'Student');
  const initials = (profile.name || user.name || 'ST').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="min-h-screen bg-[#f6fafe] font-['Inter',sans-serif]">
      <Navigation />

      <main className="pt-16 md:pt-20 flex flex-col min-h-screen">
        <section className="p-6 md:p-8 max-w-[1440px] mx-auto w-full space-y-10 flex-grow">

          {/* ── Hero ── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 space-y-4">
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-[#171c1f]">
                Hi, {firstName} 👋
              </h2>
              <p className="text-lg text-slate-500 max-w-2xl">
                Your AI advisor has matched jobs to your profile. Get personalized skill gap analysis, career roadmap, and an auto-generated CV.
              </p>

              {/* Stat chips */}
              <div className="flex flex-wrap gap-3 pt-2">
                <div className="px-5 py-3 bg-white rounded-2xl shadow-[0_12px_32px_rgba(23,28,31,0.06)] flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#82f5c1]/50 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[#006c4a]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Profile Strength</p>
                    <p className="text-lg font-extrabold text-[#171c1f]">{strengthPct}% Complete</p>
                  </div>
                </div>
                <div className="px-5 py-3 bg-white rounded-2xl shadow-[0_12px_32px_rgba(23,28,31,0.06)] flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#dfe0ff]/60 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[#0c1282]" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Job Matches</p>
                    <p className="text-lg font-extrabold text-[#171c1f]">{jobs.length > 0 ? `${jobs.length} Found` : 'Search Now'}</p>
                  </div>
                </div>
                {!hasProfile && (
                  <button onClick={() => navigate('/profile')}
                    className="px-5 py-3 bg-amber-400 rounded-2xl flex items-center gap-3 hover:bg-amber-300 transition-all shadow-[0_12px_32px_rgba(23,28,31,0.06)]">
                    <span className="material-symbols-outlined text-amber-900" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
                    <span className="text-sm font-extrabold text-amber-900">Complete Career Profile →</span>
                  </button>
                )}
              </div>
            </div>

            {/* AI Summary card */}
            <div className="lg:col-span-4">
              <div className="bg-gradient-to-br from-[#001eb4] to-[#0c1282] rounded-2xl p-6 text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all duration-700" />
                <div className="relative z-10 space-y-5">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/20 bg-white/10 flex items-center justify-center flex-shrink-0">
                        {photo
                          ? <img src={photo} alt="profile" className="w-full h-full object-cover" />
                          : <span className="font-black text-lg">{initials}</span>}
                      </div>
                      <div>
                        <p className="font-extrabold text-sm leading-tight">{profile.name || user.name}</p>
                        <p className="text-[10px] text-white/55 uppercase tracking-wider">{career.title || career.careerGoal || 'DIU Student'}</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 bg-white/20 backdrop-blur rounded-full text-[9px] uppercase font-extrabold tracking-widest">AI Summary</span>
                  </div>
                  {career.techSkills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {career.techSkills.slice(0, 5).map(s => (
                        <span key={s} className="px-2 py-0.5 bg-white/15 rounded-full text-[10px] font-semibold">{s}</span>
                      ))}
                      {career.techSkills.length > 5 && <span className="px-2 py-0.5 text-white/40 text-[10px]">+{career.techSkills.length - 5}</span>}
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] text-white/50">
                      <span>Profile strength</span><span className="font-bold text-white/80">{strengthPct}%</span>
                    </div>
                    <div className="w-full bg-white/15 rounded-full h-1.5">
                      <div className="h-1.5 rounded-full transition-all" style={{ width: `${strengthPct}%`, backgroundColor: strengthColor }} />
                    </div>
                  </div>
                  <button onClick={() => navigate('/profile')}
                    className="flex items-center gap-2 text-sm font-bold hover:underline text-white/80 hover:text-white transition-colors">
                    Edit career profile <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ── Search ── */}
          <div className="space-y-4">
            <div className="relative max-w-3xl">
              <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 text-2xl">search</span>
              <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { fetchJobs(searchTerm); fetchExternalJobs(searchTerm); } }}
                placeholder={career.techSkills[0] ? `Search jobs — try "${career.techSkills[0]} Developer"` : 'Search for jobs, companies, or skills...'}
                className="w-full bg-white border-none shadow-[0_12px_32px_rgba(23,28,31,0.06)] rounded-2xl py-5 pl-14 pr-32 text-base focus:outline-none focus:ring-2 focus:ring-[#0c1282]/30 transition-all" />
              <button onClick={() => { fetchJobs(searchTerm); fetchExternalJobs(searchTerm); }} disabled={jobsLoading || externalLoading}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2.5 bg-[#0c1282] text-white font-bold rounded-xl text-sm hover:bg-[#0c1282]/90 disabled:opacity-60 transition-all flex items-center gap-1.5">
                {jobsLoading
                  ? <><span className="material-symbols-outlined text-base animate-spin">autorenew</span>Searching…</>
                  : <><span className="material-symbols-outlined text-base">search</span>Search</>}
              </button>
            </div>
            {career.techSkills.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mr-1">Top Skills:</span>
                {career.techSkills.slice(0, 7).map((s, i) => (
                  <button key={s} onClick={() => { setSearchTerm(s); fetchJobs(s); fetchExternalJobs(s); }}
                    className={`px-4 py-1.5 rounded-full font-semibold text-sm transition-all ${i === 0 ? 'bg-[#0c1282] text-white hover:opacity-90' : 'bg-[#e4e9ed] text-[#454654] hover:bg-[#dfe0ff] hover:text-[#0c1282]'}`}>
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Tabs ── */}
          <div className="border-b border-slate-200">
            <div className="flex gap-8 overflow-x-auto">
              {tabs.map(t => (
                <button key={t.id} onClick={() => setActiveTab(t.id)}
                  className={`relative pb-4 text-base font-bold whitespace-nowrap transition-colors ${activeTab === t.id ? 'text-[#0c1282] border-b-2 border-[#0c1282]' : 'text-slate-400 hover:text-[#171c1f]'}`}>
                  {t.label}
                  {t.count > 0 && (
                    <span className="absolute -top-1 -right-4 px-1.5 py-0.5 bg-red-500 text-white text-[9px] rounded-full font-black">{t.count}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* ── JOBS TAB ── */}
          {activeTab === 'jobs' && (
            <div className="space-y-6">
              {!jobsLoading && jobs.length === 0 && (
                <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
                  <div className="w-20 h-20 bg-[#0c1282]/5 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="material-symbols-outlined text-4xl text-[#0c1282]/30">work</span>
                  </div>
                  <p className="font-extrabold text-slate-500 text-lg">Search for jobs above</p>
                  <p className="text-slate-400 text-sm mt-1 mb-5">Use your skill tags or type a job title to find matches</p>
                  {career.techSkills.length > 0 && (
                    <button onClick={() => fetchJobs(career.techSkills[0])}
                      className="px-6 py-3 bg-[#0c1282] text-white rounded-xl font-bold text-sm hover:bg-[#0c1282]/90">
                      Find "{career.techSkills[0]}" jobs
                    </button>
                  )}
                </div>
              )}

              {jobs.length > 0 && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-500">{jobs.length} jobs found</span>
                    <span className="text-xs text-slate-400">Green skills = matched · Red = gap</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {jobs.map((job, idx) => {
                      const match = computeMatch(job.description, career.techSkills);
                      const required = extractRequiredSkills(job.description);
                      const missing = getMissing(required, career.techSkills);
                      const matchColor = match >= 70 ? 'text-[#006c4a]' : match >= 45 ? 'text-amber-600' : 'text-red-500';
                      return (
                        <div key={job.id || idx}
                          className="bg-white rounded-2xl p-7 shadow-[0_12px_32px_rgba(23,28,31,0.06)] hover:shadow-xl transition-all duration-300 group flex flex-col gap-6">
                          {/* Header */}
                          <div className="flex justify-between items-start">
                            <div className="flex gap-4">
                              {/* Company logo */}
                              <div className="w-14 h-14 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center flex-shrink-0 overflow-hidden p-1.5">
                                {job.logo ? (
                                  <img
                                    src={job.logo}
                                    alt={job.company}
                                    className="w-full h-full object-contain"
                                    onError={e => {
                                      e.target.style.display = 'none';
                                      e.target.nextSibling.style.display = 'flex';
                                    }}
                                  />
                                ) : null}
                                <span
                                  className="material-symbols-outlined text-slate-300 text-2xl w-full h-full items-center justify-center"
                                  style={{ display: job.logo ? 'none' : 'flex', fontVariationSettings: "'FILL' 1" }}
                                >business</span>
                              </div>
                              <div>
                                <h3 className="text-lg font-extrabold text-[#171c1f] leading-snug">{job.title}</h3>
                                <p className="text-slate-500 font-semibold text-sm mt-0.5">{job.company}</p>
                                <div className="flex items-center gap-1 text-slate-400 text-xs mt-0.5">
                                  <span className="material-symbols-outlined text-xs">location_on</span>
                                  <span>{job.location}</span>
                                  {job.type && <><span>·</span><span>{job.type}</span></>}
                                  {job.posted && <><span>·</span><span>{job.posted}</span></>}
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col items-end flex-shrink-0">
                              <span className={`text-2xl font-black ${matchColor}`}>{match}%</span>
                              <span className="text-[10px] uppercase font-extrabold tracking-tighter text-slate-400">AI Match</span>
                            </div>
                          </div>

                          {/* Skill tags */}
                          <div className="flex flex-wrap gap-2">
                            {required.slice(0, 5).map(s => {
                              const has = career.techSkills.map(x => x.toLowerCase()).includes(s.toLowerCase());
                              return (
                                <span key={s} className={`px-3 py-1 rounded-lg text-sm font-medium ${has ? 'bg-[#82f5c1]/40 text-[#006c4a]' : 'bg-[#e4e9ed] text-[#454654]'}`}>{s}</span>
                              );
                            })}
                            {missing.length > 0 && (
                              <span className="px-3 py-1 rounded-lg text-sm font-extrabold bg-[#ffdcc3]/50 text-[#6e3900]">
                                +{missing.length} to learn
                              </span>
                            )}
                            {job.salary && (
                              <span className="px-3 py-1 rounded-lg text-sm font-semibold bg-emerald-50 text-emerald-700 ml-auto">{job.salary}</span>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-3 mt-auto">
                            <a href={job.url !== '#' ? job.url : undefined} target="_blank" rel="noopener noreferrer"
                              onClick={e => { if (job.url === '#') { e.preventDefault(); toast.info('Apply link not available'); } }}
                              className="flex-grow py-3.5 bg-[#0c1282] text-white rounded-xl font-extrabold text-sm text-center shadow-lg shadow-[#0c1282]/20 hover:bg-[#00117a] transition-all">
                              Apply Now
                            </a>
                            <button onClick={() => { setSelectedJob({ ...job, match, required, missing }); setActiveTab('gap'); }}
                              className="px-5 py-3.5 border border-[#c5c5d7] text-[#0c1282] font-extrabold text-sm rounded-xl hover:bg-[#f0f4ff] transition-all">
                              Analyze Gap
                            </button>
                            <button onClick={() => { setCvJob({ ...job, match, required, missing }); setActiveTab('cv'); }}
                              className="px-4 py-3.5 border border-[#c5c5d7] text-[#454654] font-extrabold text-sm rounded-xl hover:bg-slate-50 transition-all" title="Build CV for this job">
                              <span className="material-symbols-outlined text-base">description</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {/* ── Live Jobs from JSearch API ─────────────────────── */}
              {(externalLoading || externalError || externalJobs.length > 0) && (
                <div className="mt-10 space-y-5">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-slate-200" />
                    <div className="flex items-center gap-2 px-4 py-1.5 bg-[#0c1282]/5 rounded-full">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs font-extrabold text-[#0c1282] uppercase tracking-widest">Live Jobs</span>
                    </div>
                    <div className="flex-1 h-px bg-slate-200" />
                  </div>

                  {externalLoading && (
                    <div className="flex items-center justify-center gap-3 py-12 bg-white rounded-2xl shadow-[0_8px_24px_rgba(23,28,31,0.05)]">
                      <span className="material-symbols-outlined text-2xl text-[#0c1282] animate-spin">autorenew</span>
                      <span className="text-slate-500 font-semibold">Searching live job market…</span>
                    </div>
                  )}

                  {!externalLoading && externalError && (
                    <div className="flex items-center gap-3 px-5 py-4 bg-amber-50 border border-amber-200 rounded-xl">
                      <span className="material-symbols-outlined text-amber-500">info</span>
                      <span className="text-sm text-amber-700 font-medium">{externalError}</span>
                    </div>
                  )}

                  {!externalLoading && externalJobs.length > 0 && (
                    <>
                      <p className="text-sm font-semibold text-slate-500">{externalJobs.length} live jobs found worldwide</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {externalJobs.map((job, idx) => (
                          <div key={idx}
                            className="bg-white rounded-2xl p-6 shadow-[0_8px_24px_rgba(23,28,31,0.06)] hover:shadow-xl transition-all duration-300 flex flex-col gap-4 border border-slate-100">
                            {/* Header */}
                            <div className="flex items-start gap-4">
                              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#001eb4]/10 to-[#0c1282]/5 flex items-center justify-center flex-shrink-0">
                                <span className="material-symbols-outlined text-[#0c1282] text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>work</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="text-base font-extrabold text-[#171c1f] leading-snug truncate">{job.job_title}</h3>
                                <p className="text-sm font-semibold text-slate-500 mt-0.5 truncate">{job.employer_name || 'Company'}</p>
                                <div className="flex items-center gap-1 text-slate-400 text-xs mt-0.5">
                                  <span className="material-symbols-outlined text-xs">location_on</span>
                                  <span className="truncate">{job.job_location || `${job.job_city || ''} ${job.job_country || ''}`.trim() || 'Remote'}</span>
                                </div>
                              </div>
                              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-extrabold rounded-full whitespace-nowrap flex-shrink-0">LIVE</span>
                            </div>

                            {/* Apply */}
                            {job.job_apply_link ? (
                              <a href={job.job_apply_link} target="_blank" rel="noopener noreferrer"
                                className="w-full py-3 bg-gradient-to-r from-[#001eb4] to-[#0c1282] text-white rounded-xl font-extrabold text-sm text-center hover:opacity-90 transition-all shadow-md shadow-[#0c1282]/20 flex items-center justify-center gap-2">
                                <span className="material-symbols-outlined text-base">open_in_new</span>
                                Apply Now
                              </a>
                            ) : (
                              <button disabled
                                className="w-full py-3 bg-slate-100 text-slate-400 rounded-xl font-bold text-sm cursor-not-allowed">
                                Apply Link Unavailable
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── SKILL GAP TAB ── */}
          {activeTab === 'gap' && (
            <SkillGapPanel
              selectedJob={selectedJob}
              career={career}
              profile={profile}
              processPrompt={processPrompt}
              onBrowseJobs={() => setActiveTab('jobs')}
            />
          )}

          {/* ── CAREER PATH TAB ── */}
          {activeTab === 'roadmap' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-[0_12px_32px_rgba(23,28,31,0.06)] p-6">
                <h2 className="text-xl font-extrabold text-[#171c1f] mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#0c1282]" style={{ fontVariationSettings: "'FILL' 1" }}>map</span>
                  Generate Your Career Roadmap
                </h2>
                <div className="flex gap-3">
                  <input value={careerGoalInput} onChange={e => setCareerGoalInput(e.target.value)}
                    placeholder="e.g. AI Engineer, Full Stack Developer, Data Scientist..."
                    className="flex-1 px-4 py-3 border border-[#c5c5d7] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0c1282]/30 focus:border-[#0c1282] bg-[#f6fafe]" />
                  <button onClick={generateRoadmap} disabled={roadmapLoading}
                    className="px-5 py-3 bg-[#0c1282] text-white font-extrabold rounded-xl hover:bg-[#00117a] disabled:opacity-60 text-sm flex items-center gap-2 flex-shrink-0 transition-all">
                    {roadmapLoading ? <><span className="material-symbols-outlined text-base animate-spin">autorenew</span>Generating…</> : <><span className="material-symbols-outlined text-base">auto_awesome</span>Generate</>}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {['AI Engineer','Full Stack Developer','Data Scientist','DevOps Engineer','Mobile Developer','Cybersecurity Analyst'].map(g => (
                    <button key={g} onClick={() => setCareerGoalInput(g)}
                      className={`text-xs px-3 py-1.5 rounded-full font-bold border transition-all ${careerGoalInput === g ? 'bg-[#0c1282] text-white border-[#0c1282]' : 'border-[#c5c5d7] text-[#454654] hover:border-[#0c1282]/40 hover:text-[#0c1282]'}`}>{g}</button>
                  ))}
                </div>
              </div>

              {roadmapLoading && (
                <div className="flex flex-col items-center py-16 bg-white rounded-2xl shadow-[0_12px_32px_rgba(23,28,31,0.06)]">
                  <div className="w-16 h-16 rounded-full bg-[#0c1282]/10 flex items-center justify-center mb-4 animate-pulse">
                    <span className="material-symbols-outlined text-[#0c1282] text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
                  </div>
                  <p className="text-slate-600 font-extrabold">Crafting your personalized roadmap…</p>
                  <p className="text-slate-400 text-sm mt-1">This takes 10–15 seconds</p>
                </div>
              )}

              {roadmap && !roadmapLoading && (
                <div className="bg-white rounded-2xl shadow-[0_12px_32px_rgba(23,28,31,0.06)] p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-[#0c1282]" style={{ fontVariationSettings: "'FILL' 1" }}>route</span>
                    <h3 className="font-extrabold text-[#171c1f]">Roadmap: {careerGoalInput}</h3>
                  </div>
                  <div className="whitespace-pre-wrap text-[#454654] text-sm leading-relaxed bg-[#f6fafe] rounded-xl p-5">{roadmap}</div>
                  <div className="mt-5 pt-4 border-t border-slate-100 flex gap-3">
                    <button onClick={() => setActiveTab('cv')} className="flex items-center gap-2 px-4 py-2.5 bg-[#0c1282] text-white rounded-xl font-extrabold text-sm hover:bg-[#00117a] transition-all">
                      <span className="material-symbols-outlined text-sm">description</span>Build My CV
                    </button>
                    <button onClick={() => setActiveTab('jobs')} className="flex items-center gap-2 px-4 py-2.5 bg-[#e4e9ed] text-[#454654] rounded-xl font-extrabold text-sm hover:bg-[#dfe3e7] transition-all">
                      <span className="material-symbols-outlined text-sm">work</span>Browse Jobs
                    </button>
                  </div>
                </div>
              )}

              {!roadmap && !roadmapLoading && (
                <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-[#c5c5d7]">
                  <div className="w-20 h-20 bg-[#dfe0ff]/40 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="material-symbols-outlined text-4xl text-[#0c1282]/40">map</span>
                  </div>
                  <p className="font-extrabold text-slate-500">Choose a career goal above and generate your roadmap</p>
                </div>
              )}
            </div>
          )}

          {/* ── CV TAB ── */}
          {activeTab === 'cv' && (
            <div className="space-y-4">
              {/* Top action bar */}
              <div className="flex flex-wrap items-center gap-3">
                {cvJob && (
                  <div className="flex items-center gap-2 bg-[#d9e6ec] border border-[#244c5d]/20 rounded-xl px-4 py-2 flex-1 min-w-0">
                    <span className="material-symbols-outlined text-[#244c5d] text-base" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                    <p className="text-sm font-bold text-[#244c5d] truncate">Tailored for: {cvJob.title} @ {cvJob.company}</p>
                    <button onClick={() => setCvJob(null)} className="ml-auto text-[#244c5d] hover:opacity-60">
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  </div>
                )}
                <div className="flex items-center gap-2 ml-auto">
                  <button onClick={() => setCvSidePanel(p => p === 'edit' ? 'none' : 'edit')}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-sm transition-all border ${cvSidePanel === 'edit' ? 'text-white border-[#244c5d]' : 'border-[#244c5d]/30 text-[#244c5d] hover:bg-[#d9e6ec]'}`}
                    style={cvSidePanel === 'edit' ? { background: '#244c5d' } : {}}>
                    <span className="material-symbols-outlined text-base">edit_note</span>Edit CV
                  </button>
                  <button onClick={() => setCvSidePanel(p => p === 'ai' ? 'none' : 'ai')}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-sm transition-all border ${cvSidePanel === 'ai' ? 'text-white border-[#244c5d]' : 'border-[#244c5d]/30 text-[#244c5d] hover:bg-[#d9e6ec]'}`}
                    style={cvSidePanel === 'ai' ? { background: '#244c5d' } : {}}>
                    <span className="material-symbols-outlined text-base">smart_toy</span>AI Assistant
                  </button>
                  <button onClick={() => { setCvData({ title: career.title||'', summary: career.summary||'', careerGoal: career.careerGoal||'', github: career.github||'', portfolio: career.portfolio||'', linkedin: career.linkedin||'', techSkills: [...career.techSkills], softSkills: [...career.softSkills], experience: career.experience.map(e=>({...e})), projects: career.projects.map(p=>({...p})), certificates: career.certificates.map(c=>({...c})) }); toast.success('CV reset to profile data'); }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-sm border border-slate-200 text-slate-500 hover:bg-slate-50 transition-all">
                    <span className="material-symbols-outlined text-base">refresh</span>
                  </button>
                </div>
              </div>

              {!hasProfile && !cvData.techSkills.length ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-[#a7c9d8]">
                  <span className="material-symbols-outlined text-5xl mb-3 block" style={{ color: '#a7c9d8' }}>description</span>
                  <p className="font-extrabold text-[#244c5d] text-lg mb-1">Profile incomplete</p>
                  <p className="text-[#625f5f] text-sm mb-5">Add your skills, experience, and projects to generate your CV.</p>
                  <button onClick={() => navigate('/profile')} className="px-6 py-3 text-white font-extrabold rounded-xl text-sm" style={{ background: '#244c5d' }}>
                    Complete Profile →
                  </button>
                </div>
              ) : (
                <div className="flex gap-5 items-start">
                  {/* CV preview — grows */}
                  <div className="flex-1 min-w-0">
                    <CVTemplate profile={profile} career={career} photo={photo} targetJob={cvJob} cvData={cvData} />
                  </div>
                  {/* Side panel */}
                  {cvSidePanel === 'edit' && (
                    <CVEditPanel cvData={cvData} setCvData={setCvData} onClose={() => setCvSidePanel('none')} />
                  )}
                  {cvSidePanel === 'ai' && (
                    <CVAIAssistant cvData={cvData} setCvData={setCvData} profile={profile} processPrompt={processPrompt} onClose={() => setCvSidePanel('none')} />
                  )}
                </div>
              )}
            </div>
          )}

        </section>

        {/* Footer strip */}
        <footer className="w-full py-8 px-8 bg-white border-t border-slate-100 mt-4">
          <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm font-semibold text-slate-500">© 2025 DIU AI Career Hub — Empowering the next generation of talent.</p>
            <div className="flex gap-6">
              {['Privacy Policy','Terms of Service','University Portal','Contact'].map(l => (
                <button key={l} type="button" className="text-slate-400 hover:text-[#0c1282] transition-colors text-sm font-medium bg-transparent border-none cursor-pointer">{l}</button>
              ))}
            </div>
          </div>
        </footer>
      </main>

      <ChatbotWidget pageContext="career-jobs" studentProfile={{ profile, career }} />
    </div>
  );
}

// ── CV Edit Panel ─────────────────────────────────────────────────
function CVEditPanel({ cvData, setCvData, onClose }) {
  const upd = (field, val) => setCvData(d => ({ ...d, [field]: val }));
  const updSkill = (field, idx, val) => setCvData(d => {
    const arr = [...d[field]]; arr[idx] = val; return { ...d, [field]: arr };
  });
  const addSkill = (field) => setCvData(d => ({ ...d, [field]: [...d[field], ''] }));
  const removeSkill = (field, idx) => setCvData(d => ({ ...d, [field]: d[field].filter((_, i) => i !== idx) }));
  const updExp = (idx, key, val) => setCvData(d => {
    const arr = d.experience.map((e, i) => i === idx ? { ...e, [key]: val } : e);
    return { ...d, experience: arr };
  });
  const addExp = () => setCvData(d => ({ ...d, experience: [...d.experience, { role: '', company: '', duration: '', description: '' }] }));
  const removeExp = (idx) => setCvData(d => ({ ...d, experience: d.experience.filter((_, i) => i !== idx) }));
  const updProj = (idx, key, val) => setCvData(d => {
    const arr = d.projects.map((p, i) => i === idx ? { ...p, [key]: val } : p);
    return { ...d, projects: arr };
  });
  const addProj = () => setCvData(d => ({ ...d, projects: [...d.projects, { name: '', tech: '', url: '', description: '' }] }));
  const removeProj = (idx) => setCvData(d => ({ ...d, projects: d.projects.filter((_, i) => i !== idx) }));

  const F = 'text-xs font-bold text-[#244c5d] mb-1 block uppercase tracking-wider';
  const I = 'w-full px-3 py-2 rounded-lg border border-[#a7c9d8] text-sm focus:outline-none focus:ring-2 focus:ring-[#244c5d]/30 bg-white text-[#464a4e]';
  const TA = `${I} resize-none`;

  return (
    <div className="w-80 flex-shrink-0 rounded-2xl border border-[#a7c9d8] bg-[#f4f4f4] shadow-xl flex flex-col" style={{ maxHeight: '80vh' }}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#a7c9d8]" style={{ background: '#d9e6ec' }}>
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#244c5d] text-lg">edit_note</span>
          <p className="font-extrabold text-[#244c5d] text-sm">Edit CV</p>
        </div>
        <button onClick={onClose} className="text-[#244c5d] hover:opacity-60"><span className="material-symbols-outlined text-lg">close</span></button>
      </div>
      <div className="overflow-y-auto flex-1 p-4 space-y-5">

        {/* Professional title + summary */}
        <div>
          <label className={F}>Professional Title</label>
          <input className={I} value={cvData.title} onChange={e => upd('title', e.target.value)} placeholder="e.g. Full Stack Developer" />
        </div>
        <div>
          <label className={F}>Professional Summary</label>
          <textarea className={TA} rows={4} value={cvData.summary} onChange={e => upd('summary', e.target.value)} placeholder="Leave blank to auto-generate from profile…" />
        </div>

        {/* Links */}
        <div className="grid grid-cols-1 gap-2">
          {[['github','GitHub URL'],['linkedin','LinkedIn URL'],['portfolio','Portfolio URL']].map(([k,lbl]) => (
            <div key={k}>
              <label className={F}>{lbl}</label>
              <input className={I} value={cvData[k]} onChange={e => upd(k, e.target.value)} placeholder={`https://...`} />
            </div>
          ))}
        </div>

        {/* Tech skills */}
        <div>
          <label className={F}>Tech Skills</label>
          <div className="space-y-1.5">
            {cvData.techSkills.map((s, i) => (
              <div key={i} className="flex gap-1.5">
                <input className={`${I} flex-1`} value={s} onChange={e => updSkill('techSkills', i, e.target.value)} placeholder="Skill name" />
                <button onClick={() => removeSkill('techSkills', i)} className="text-red-400 hover:text-red-600"><span className="material-symbols-outlined text-base">remove_circle</span></button>
              </div>
            ))}
            <button onClick={() => addSkill('techSkills')} className="text-xs font-bold text-[#244c5d] flex items-center gap-1 hover:opacity-70">
              <span className="material-symbols-outlined text-sm">add_circle</span>Add skill
            </button>
          </div>
        </div>

        {/* Soft skills */}
        <div>
          <label className={F}>Soft Skills</label>
          <div className="space-y-1.5">
            {cvData.softSkills.map((s, i) => (
              <div key={i} className="flex gap-1.5">
                <input className={`${I} flex-1`} value={s} onChange={e => updSkill('softSkills', i, e.target.value)} />
                <button onClick={() => removeSkill('softSkills', i)} className="text-red-400 hover:text-red-600"><span className="material-symbols-outlined text-base">remove_circle</span></button>
              </div>
            ))}
            <button onClick={() => addSkill('softSkills')} className="text-xs font-bold text-[#244c5d] flex items-center gap-1 hover:opacity-70">
              <span className="material-symbols-outlined text-sm">add_circle</span>Add
            </button>
          </div>
        </div>

        {/* Experience */}
        <div>
          <label className={F}>Experience</label>
          <div className="space-y-3">
            {cvData.experience.map((exp, i) => (
              <div key={i} className="bg-white rounded-xl p-3 border border-[#a7c9d8] space-y-2">
                <div className="flex justify-between items-center">
                  <p className="text-xs font-bold text-[#244c5d]">#{i+1}</p>
                  <button onClick={() => removeExp(i)} className="text-red-400 hover:text-red-600"><span className="material-symbols-outlined text-sm">delete</span></button>
                </div>
                {[['role','Job Title'],['company','Company'],['duration','Duration']].map(([k,lbl]) => (
                  <div key={k}>
                    <label className="text-[10px] text-[#625f5f] font-bold uppercase tracking-wider block mb-0.5">{lbl}</label>
                    <input className={I} value={exp[k]||''} onChange={e => updExp(i, k, e.target.value)} />
                  </div>
                ))}
                <div>
                  <label className="text-[10px] text-[#625f5f] font-bold uppercase tracking-wider block mb-0.5">Description</label>
                  <textarea className={`${TA}`} rows={2} value={exp.description||''} onChange={e => updExp(i, 'description', e.target.value)} />
                </div>
              </div>
            ))}
            <button onClick={addExp} className="text-xs font-bold text-[#244c5d] flex items-center gap-1 hover:opacity-70">
              <span className="material-symbols-outlined text-sm">add_circle</span>Add experience
            </button>
          </div>
        </div>

        {/* Projects */}
        <div>
          <label className={F}>Projects</label>
          <div className="space-y-3">
            {cvData.projects.map((proj, i) => (
              <div key={i} className="bg-white rounded-xl p-3 border border-[#a7c9d8] space-y-2">
                <div className="flex justify-between items-center">
                  <p className="text-xs font-bold text-[#244c5d]">#{i+1}</p>
                  <button onClick={() => removeProj(i)} className="text-red-400 hover:text-red-600"><span className="material-symbols-outlined text-sm">delete</span></button>
                </div>
                {[['name','Project Name'],['tech','Tech Stack'],['url','URL']].map(([k,lbl]) => (
                  <div key={k}>
                    <label className="text-[10px] text-[#625f5f] font-bold uppercase tracking-wider block mb-0.5">{lbl}</label>
                    <input className={I} value={proj[k]||''} onChange={e => updProj(i, k, e.target.value)} />
                  </div>
                ))}
                <div>
                  <label className="text-[10px] text-[#625f5f] font-bold uppercase tracking-wider block mb-0.5">Description</label>
                  <textarea className={TA} rows={2} value={proj.description||''} onChange={e => updProj(i, 'description', e.target.value)} />
                </div>
              </div>
            ))}
            <button onClick={addProj} className="text-xs font-bold text-[#244c5d] flex items-center gap-1 hover:opacity-70">
              <span className="material-symbols-outlined text-sm">add_circle</span>Add project
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── CV AI Assistant ────────────────────────────────────────────────
function CVAIAssistant({ cvData, setCvData, profile, processPrompt, onClose }) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { role: 'ai', text: `Hi! I'm your CV AI Assistant. Tell me what you want to improve or add — I'll refine it professionally and update your CV instantly.\n\nExamples:\n• "Add a summary about my Python experience"\n• "Make my job description at Brain Station more impactful"\n• "Add Docker and Kubernetes to my skills"\n• "Rewrite my project description to sound more professional"` }
  ]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef();

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    setMessages(m => [...m, { role: 'user', text }]);
    setLoading(true);

    const currentCV = JSON.stringify({
      title: cvData.title, summary: cvData.summary, techSkills: cvData.techSkills,
      softSkills: cvData.softSkills,
      experience: cvData.experience.filter(e => e.role),
      projects: cvData.projects.filter(p => p.name),
    }, null, 2);

    const prompt = `You are a professional CV writing assistant for a university student named ${profile.name||'the student'}.

Current CV data (JSON):
${currentCV}

Student's instruction: "${text}"

Task: Apply the student's instruction to improve the CV. Return ONLY a valid JSON object with these exact keys (include ALL keys even if unchanged):
{
  "title": "...",
  "summary": "...",
  "techSkills": [...],
  "softSkills": [...],
  "experience": [{"role":"","company":"","duration":"","description":""},...],
  "projects": [{"name":"","tech":"","url":"","description":""},...],
  "explanation": "One sentence explaining what you changed."
}

Rules:
- Keep existing good content, only improve/add what the student asked
- Make descriptions professional, specific, and achievement-oriented
- Use action verbs (Developed, Designed, Implemented, Led, Optimized...)
- If adding skills, merge with existing list
- Summary should be 2-3 sentences, third-person style like "A qualified developer with..."
- Return ONLY the JSON, no markdown, no extra text`;

    try {
      const result = await processPrompt({ prompt, context: 'CV writing expert. Return only valid JSON.', moduleType: 'career' });
      const raw = result?.data?.response || '';
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON in response');
      const parsed = JSON.parse(jsonMatch[0]);
      setCvData(d => ({
        ...d,
        title:      parsed.title      || d.title,
        summary:    parsed.summary    || d.summary,
        techSkills: Array.isArray(parsed.techSkills) ? parsed.techSkills : d.techSkills,
        softSkills: Array.isArray(parsed.softSkills) ? parsed.softSkills : d.softSkills,
        experience: Array.isArray(parsed.experience) ? parsed.experience : d.experience,
        projects:   Array.isArray(parsed.projects)   ? parsed.projects   : d.projects,
      }));
      setMessages(m => [...m, { role: 'ai', text: `✓ Done! ${parsed.explanation || 'CV updated successfully.'}` }]);
    } catch {
      setMessages(m => [...m, { role: 'ai', text: 'Sorry, I couldn\'t parse the update. Please try rephrasing your instruction.' }]);
    } finally {
      setLoading(false);
    }
  };

  const chips = ['Make my summary more professional','Add Docker to my skills','Improve my experience description','Add an achievement to my last project'];

  return (
    <div className="w-80 flex-shrink-0 rounded-2xl border border-[#a7c9d8] shadow-xl flex flex-col" style={{ maxHeight: '80vh', background: '#fff' }}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#a7c9d8]" style={{ background: '#244c5d' }}>
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-white text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
          <p className="font-extrabold text-white text-sm">CV AI Assistant</p>
        </div>
        <button onClick={onClose} className="text-white/70 hover:text-white"><span className="material-symbols-outlined text-lg">close</span></button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'ai' && (
              <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mr-2 mt-0.5" style={{ background: '#244c5d' }}>
                <span className="material-symbols-outlined text-white text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
              </div>
            )}
            <div className={`max-w-[85%] rounded-2xl px-3 py-2.5 text-xs leading-relaxed whitespace-pre-wrap ${m.role === 'user' ? 'text-white rounded-tr-none' : 'text-[#464a4e] rounded-tl-none'}`}
              style={{ background: m.role === 'user' ? '#244c5d' : '#f4f4f4' }}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="w-7 h-7 rounded-full flex items-center justify-center mr-2 flex-shrink-0" style={{ background: '#244c5d' }}>
              <span className="material-symbols-outlined text-white text-sm animate-spin">autorenew</span>
            </div>
            <div className="px-3 py-2.5 rounded-2xl rounded-tl-none text-xs text-[#625f5f] animate-pulse" style={{ background: '#f4f4f4' }}>
              Updating your CV…
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick chips */}
      <div className="px-3 pt-2 flex flex-wrap gap-1.5">
        {chips.map(c => (
          <button key={c} onClick={() => setInput(c)}
            className="text-[10px] px-2.5 py-1 rounded-full border font-semibold transition-all hover:opacity-80"
            style={{ borderColor: '#a7c9d8', color: '#244c5d', background: '#d9e6ec' }}>{c}</button>
        ))}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-[#a7c9d8] flex gap-2">
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="Tell me what to improve…"
          className="flex-1 px-3 py-2 rounded-xl border border-[#a7c9d8] text-xs focus:outline-none focus:ring-2 focus:ring-[#244c5d]/30 text-[#464a4e]" />
        <button onClick={send} disabled={!input.trim() || loading}
          className="w-9 h-9 rounded-xl flex items-center justify-center disabled:opacity-40 text-white transition-all"
          style={{ background: '#244c5d' }}>
          <span className="material-symbols-outlined text-base">send</span>
        </button>
      </div>
    </div>
  );
}

// ── Skill Gap Panel ────────────────────────────────────────────────
function SkillGapPanel({ selectedJob, career, profile, processPrompt, onBrowseJobs }) {
  const [advice, setAdvice] = useState('');
  const [adviceLoading, setAdviceLoading] = useState(false);

  const getAdvice = async () => {
    if (!selectedJob) return;
    setAdviceLoading(true);
    setAdvice('');
    const prompt = `Student wants to apply for "${selectedJob.title}" at ${selectedJob.company}.
Required skills: ${selectedJob.required?.join(', ') || 'Not specified'}.
Student has: ${career.techSkills.join(', ') || 'None listed'}.
Missing skills: ${selectedJob.missing?.join(', ') || 'None'}.

For each missing skill, provide:
1. Best free resource (YouTube channel or course)
2. A mini project to practice it
3. Time to learn (weeks)

Be specific and actionable.`;

    try {
      const result = await processPrompt({ prompt, context: 'Career advisor. Be practical and specific.', moduleType: 'career' });
      setAdvice(result?.data?.response || 'Could not generate advice.');
    } catch {
      setAdvice('Connection error. Please try again.');
    } finally {
      setAdviceLoading(false);
    }
  };

  if (!selectedJob) {
    return (
      <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
        <div className="w-20 h-20 bg-[#0c1282]/5 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-4xl text-[#0c1282]/30">analytics</span>
        </div>
        <p className="font-black text-slate-500 text-lg">No job selected</p>
        <p className="text-slate-400 text-sm mt-1 mb-4">Go to Job Matches and click "Analyze" on any job</p>
        <button onClick={onBrowseJobs} className="px-5 py-2.5 bg-[#0c1282] text-white font-bold rounded-xl text-sm hover:bg-[#0c1282]/90">Browse Jobs</button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Job summary card */}
      <div className="bg-white border-2 border-[#0c1282]/20 rounded-2xl p-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="font-black text-slate-900 text-xl">{selectedJob.title}</h2>
          <p className="text-slate-500 text-sm mt-0.5">{selectedJob.company} · {selectedJob.location}</p>
        </div>
        <MatchBadge score={selectedJob.match || 0} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Required skills */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h3 className="font-black text-slate-800 mb-4 flex items-center gap-2 text-base">
            <span className="material-symbols-outlined text-emerald-500" style={{ fontVariationSettings: "'FILL' 1" }}>fact_check</span>
            Required Skills
          </h3>
          <div className="space-y-2">
            {(selectedJob.required || []).map(skill => {
              const has = career.techSkills.map(s => s.toLowerCase()).includes(skill.toLowerCase());
              return (
                <div key={skill} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl ${has ? 'bg-emerald-50' : 'bg-red-50'}`}>
                  <span className={`material-symbols-outlined text-base ${has ? 'text-emerald-500' : 'text-red-500'}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                    {has ? 'check_circle' : 'cancel'}
                  </span>
                  <span className={`font-bold text-sm flex-1 ${has ? 'text-emerald-700' : 'text-red-700'}`}>{skill}</span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${has ? 'bg-emerald-200 text-emerald-800' : 'bg-red-200 text-red-800'}`}>
                    {has ? '✓ Have it' : '✗ Missing'}
                  </span>
                </div>
              );
            })}
            {!selectedJob.required?.length && <p className="text-slate-400 text-sm italic">No specific skills extracted from job description.</p>}
          </div>
        </div>

        {/* Missing + action */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h3 className="font-black text-slate-800 mb-4 flex items-center gap-2 text-base">
            <span className="material-symbols-outlined text-orange-500" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
            Gap: {(selectedJob.missing || []).length} skills missing
          </h3>
          {(selectedJob.missing || []).length === 0 ? (
            <div className="text-center py-8">
              <span className="material-symbols-outlined text-4xl text-emerald-500 block mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>celebration</span>
              <p className="font-black text-emerald-700">You have all required skills!</p>
              <p className="text-xs text-slate-400 mt-1">Apply now — you're a strong match.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {(selectedJob.missing || []).map(skill => (
                <div key={skill} className="bg-orange-50 border border-orange-200 rounded-xl p-3">
                  <p className="font-bold text-orange-800 text-sm">{skill}</p>
                  <p className="text-xs text-orange-600 mt-0.5">Click "Get Learning Plan" for free resources →</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* AI learning plan */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-black text-slate-800 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#0c1282]" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
            AI-Powered Learning Plan
          </h3>
          <button onClick={getAdvice} disabled={adviceLoading}
            className="flex items-center gap-2 px-4 py-2 bg-[#0c1282] text-white rounded-xl font-bold text-sm hover:bg-[#0c1282]/90 disabled:opacity-60 transition-all">
            {adviceLoading ? <><span className="material-symbols-outlined text-sm animate-spin">autorenew</span>Generating…</> : <><span className="material-symbols-outlined text-sm">auto_awesome</span>Get Learning Plan</>}
          </button>
        </div>
        {advice ? (
          <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{advice}</div>
        ) : (
          <div className="text-center py-8 text-slate-400">
            <span className="material-symbols-outlined text-3xl block mb-2">lightbulb</span>
            <p className="text-sm">Click "Get Learning Plan" for personalized free resources, projects, and timeline</p>
          </div>
        )}
      </div>
    </div>
  );
}
