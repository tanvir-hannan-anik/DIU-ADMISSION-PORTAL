import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navigation } from '../common/Navigation';
import { authService } from '../../services/authService';
import { useAuth } from '../../hooks/useAuth';

export const ProfilePage = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const user = authService.getUser();

  const [activeTab, setActiveTab] = useState('overview');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  const initials = user.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'ST';

  const navItems = [
    { id: 'overview', label: 'Overview', icon: 'dashboard' },
    { id: 'academic', label: 'Academic Record', icon: 'school' },
    { id: 'enrollment', label: 'Enrollment', icon: 'assignment_turned_in' },
    { id: 'support', label: 'Support', icon: 'help_outline' },
  ];

  /* ── shared inline styles ── */
  const card = { backgroundColor: '#033860', border: '1px solid rgba(255,255,255,0.08)' };
  const cardDeep = { backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' };
  const inputStyle = { backgroundColor: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' };

  return (
    <div className="antialiased min-h-screen" style={{ backgroundColor: '#0A1045', color: 'white' }}>
      <Navigation />

      <div className="flex min-h-screen pt-20">

        {/* Sidebar */}
        <aside className="hidden lg:flex flex-col h-[calc(100vh-80px)] sticky top-20 p-4 w-64 shrink-0"
          style={{ backgroundColor: '#033860', borderRight: '1px solid rgba(255,255,255,0.08)' }}>

          {/* Mini profile */}
          <div className="mb-8 px-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm text-white shrink-0"
              style={{ backgroundColor: '#0A1045' }}>
              {initials}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-white truncate">{user.name}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40 truncate">{user.semester}</p>
            </div>
          </div>

          <nav className="flex-grow space-y-1">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className="flex items-center gap-3 w-full text-left p-3 rounded-lg text-sm font-semibold uppercase tracking-wider transition-all duration-200"
                style={activeTab === item.id
                  ? { backgroundColor: 'rgba(255,255,255,0.12)', color: 'white', transform: 'translateX(4px)' }
                  : { color: 'rgba(255,255,255,0.5)' }}
              >
                <span
                  className="material-symbols-outlined"
                  style={activeTab === item.id ? { fontVariationSettings: "'FILL' 1" } : {}}
                >
                  {item.icon}
                </span>
                {item.label}
              </button>
            ))}
          </nav>

          <div className="mt-auto pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full text-left p-3 rounded-lg transition-all duration-200 text-sm font-semibold uppercase tracking-wider hover:text-red-400"
              style={{ color: 'rgba(255,255,255,0.4)' }}
            >
              <span className="material-symbols-outlined">logout</span>
              Logout
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-grow p-6 lg:p-12 overflow-y-auto">

          {/* Profile header */}
          <section className="mb-12 flex flex-col md:flex-row gap-8 items-start">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="h-32 w-32 md:h-40 md:w-40 rounded-xl flex items-center justify-center shadow-lg"
                style={{ backgroundColor: '#0c1282' }}>
                <span className="text-white font-black text-5xl">{initials}</span>
              </div>
              <div className="absolute -bottom-2 -right-2 text-white p-1.5 rounded-full shadow-lg"
                style={{ backgroundColor: '#0c1282' }}>
                <span className="material-symbols-outlined text-sm">verified</span>
              </div>
            </div>

            {/* Info */}
            <div className="flex-grow">
              <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-3 text-white">
                {user.name}
              </h1>
              <div className="flex flex-wrap gap-3 items-center">
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest text-white"
                  style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}>
                  {user.semester}
                </span>
                <span className="font-medium text-white/60">{user.department}</span>
                <span className="text-white/30">•</span>
                <span className="font-medium text-white/60">ID: {user.studentId}</span>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={() => window.open('https://auth1.diu.edu.bd/realms/diu-student/protocol/openid-connect/auth?client_id=student-portal-ui&redirect_uri=https%3A%2F%2Fstudentportal.diu.edu.bd%2F&state=21f9f678-4c18-4451-b490-f5e2ff6cc0f5&response_mode=fragment&response_type=code&scope=openid&nonce=ab738521-dd74-4ef1-8139-7b95bc1fc8b7', '_blank')}
                  className="px-6 py-2 rounded-lg font-semibold text-sm text-white flex items-center gap-2 hover:opacity-90 transition-all shadow-sm"
                  style={{ backgroundColor: '#0c1282' }}
                >
                  <span className="material-symbols-outlined text-base">open_in_new</span>
                  Open Student Portal
                </button>
                <button
                  onClick={() => navigate('/course-registration')}
                  className="font-bold text-sm px-6 py-2 rounded-lg transition-all flex items-center gap-2 text-white hover:bg-white/10"
                  style={{ border: '1px solid rgba(255,255,255,0.2)' }}
                >
                  <span className="material-symbols-outlined text-base">menu_book</span>
                  Course Registration
                </button>
              </div>
            </div>
          </section>

          {/* Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

            {/* Left column */}
            <div className="lg:col-span-8 space-y-8">

              {/* Personal Information */}
              <div className="rounded-xl p-8" style={card}>
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-2xl font-bold tracking-tight text-white">Personal Information</h3>
                  <span className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full flex items-center gap-1 text-white/50"
                    style={{ backgroundColor: 'rgba(255,255,255,0.07)' }}>
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse inline-block"></span>
                    Verified Student
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                  {[
                    { label: 'Full Name', value: user.name },
                    { label: 'University Email', value: user.email },
                    { label: 'Student ID', value: user.studentId },
                    { label: 'Department', value: user.department },
                    { label: 'Batch / Semester', value: user.semester },
                  ].map(({ label, value }) => (
                    <div key={label} className="space-y-1">
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40">
                        {label}
                      </label>
                      <p className="font-semibold text-lg text-white break-all">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stats bento */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="rounded-xl p-6 flex flex-col justify-between text-white"
                  style={{ backgroundColor: '#0c1282' }}>
                  <span className="material-symbols-outlined text-3xl opacity-40">school</span>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Status</p>
                    <p className="text-2xl font-black">Active</p>
                  </div>
                </div>
                <div className="rounded-xl p-6 flex flex-col justify-between" style={card}>
                  <span className="material-symbols-outlined text-3xl text-white/30">badge</span>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Student ID</p>
                    <p className="text-xl font-black text-white">{user.studentId}</p>
                  </div>
                </div>
                <div className="rounded-xl p-6 flex flex-col justify-between" style={cardDeep}>
                  <span className="material-symbols-outlined text-3xl text-white/30">verified</span>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Account</p>
                    <p className="text-2xl font-black text-white">Verified</p>
                  </div>
                </div>
              </div>

              {/* Info callout */}
              <div className="rounded-xl p-8" style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderLeft: '4px solid rgba(255,255,255,0.2)' }}>
                <p className="italic font-medium leading-relaxed text-white/60">
                  "Welcome to Daffodil International University. Access your Student Portal for full academic records, results, and university services. Use Course Registration to manage your semester schedule."
                </p>
                <div className="mt-4 flex items-center gap-2">
                  <span className="h-6 w-6 rounded-full bg-white/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-xs text-white/60">verified</span>
                  </span>
                  <span className="text-xs font-bold uppercase tracking-tighter text-white/40">DIU Academic Office</span>
                </div>
              </div>
            </div>

            {/* Right column */}
            <div className="lg:col-span-4 space-y-8">

              {/* Security */}
              <div className="rounded-xl p-8" style={card}>
                <h3 className="text-xl font-bold tracking-tight mb-6 text-white">Security & Access</h3>
                <div className="space-y-6">
                  {[
                    { label: 'Account Status', sub: 'Verified & Active', subColor: '#4ade80', icon: 'check_circle' },
                    { label: 'Session', sub: 'JWT secured, 24h expiry', subColor: 'rgba(255,255,255,0.4)', icon: 'lock' },
                    { label: 'Password', sub: 'Encrypted (BCrypt)', subColor: 'rgba(255,255,255,0.4)', icon: 'shield' },
                  ].map(({ label, sub, subColor, icon }) => (
                    <div key={label} className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-sm text-white">{label}</p>
                        <p className="text-xs font-bold" style={{ color: subColor }}>{sub}</p>
                      </div>
                      <span className="material-symbols-outlined text-white/30">{icon}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick links */}
              <div className="rounded-xl p-8" style={cardDeep}>
                <h3 className="text-xl font-bold tracking-tight mb-6 text-white">Quick Access</h3>
                <div className="space-y-2">
                  {[
                    {
                      label: 'Student Portal', icon: 'school',
                      action: () => window.open('https://auth1.diu.edu.bd/realms/diu-student/protocol/openid-connect/auth?client_id=student-portal-ui&redirect_uri=https%3A%2F%2Fstudentportal.diu.edu.bd%2F&state=21f9f678-4c18-4451-b490-f5e2ff6cc0f5&response_mode=fragment&response_type=code&scope=openid&nonce=ab738521-dd74-4ef1-8139-7b95bc1fc8b7', '_blank'),
                    },
                    { label: 'Course Registration', icon: 'menu_book', action: () => navigate('/course-registration') },
                    { label: 'Dashboard', icon: 'home', action: () => navigate('/') },
                  ].map(({ label, icon, action }) => (
                    <button key={label} onClick={action}
                      className="w-full flex items-center justify-between p-3 rounded-lg transition-colors group hover:bg-white/5">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-white/40">{icon}</span>
                        <span className="text-sm font-semibold text-white/70 group-hover:text-white transition-colors">{label}</span>
                      </div>
                      <span className="material-symbols-outlined text-white/30 group-hover:translate-x-1 transition-transform">chevron_right</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Campus card */}
              <div
                className="overflow-hidden rounded-xl relative cursor-pointer group"
                style={{ background: 'linear-gradient(135deg, #0c1282, #0A1045)' }}
                onClick={() => navigate('/')}
              >
                <div className="absolute inset-0 opacity-20"
                  style={{ background: 'linear-gradient(135deg, #033860, transparent)' }}></div>
                <div className="relative p-6 flex flex-col justify-end h-40">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Campus ID</p>
                  <h4 className="text-white text-xl font-black">{user.studentId}</h4>
                  <p className="text-xs text-white/40">{user.department}</p>
                </div>
              </div>

            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
