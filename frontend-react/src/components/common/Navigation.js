import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { noticeService } from '../../services/noticeService';

const TYPE_STYLES = {
  URGENT:  { bar: 'bg-red-500',    badge: 'bg-red-100 text-red-700',     icon: '🚨' },
  WARNING: { bar: 'bg-amber-500',  badge: 'bg-amber-100 text-amber-700',  icon: '⚠️' },
  EVENT:   { bar: 'bg-purple-500', badge: 'bg-purple-100 text-purple-700', icon: '🎉' },
  INFO:    { bar: 'bg-blue-500',   badge: 'bg-blue-100 text-blue-700',    icon: 'ℹ️' },
};

export const Navigation = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { isAuthenticated, logout, user } = useAuth();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [profilePhoto,     setProfilePhoto]     = useState(null);

  // Notices state
  const [notices,      setNotices]      = useState([]);
  const [noticesOpen,  setNoticesOpen]  = useState(false);
  const [expanded,     setExpanded]     = useState(null);
  const [seen,         setSeen]         = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('diu_seen_notices') || '[]')); }
    catch { return new Set(); }
  });
  const noticesRef = useRef(null);

  // Load profile photo
  useEffect(() => {
    const loadPhoto = () => {
      if (user?.email) {
        const photo = localStorage.getItem(`diu_photo_${user.email}`);
        setProfilePhoto(photo || null);
      }
    };
    loadPhoto();
    window.addEventListener('focus', loadPhoto);
    window.addEventListener('storage', loadPhoto);
    return () => {
      window.removeEventListener('focus', loadPhoto);
      window.removeEventListener('storage', loadPhoto);
    };
  }, [user]);

  useEffect(() => {
    if (user?.email) {
      const photo = localStorage.getItem(`diu_photo_${user.email}`);
      setProfilePhoto(photo || null);
    }
  }, [location.pathname, user]);

  // Fetch notices once on mount
  useEffect(() => {
    noticeService.getActiveNotices()
      .then(res => {
        const data = res.data?.data ?? res.data;
        if (Array.isArray(data)) setNotices(data);
      })
      .catch(() => {});
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (noticesRef.current && !noticesRef.current.contains(e.target)) {
        setNoticesOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const unreadCount = notices.filter(n => !seen.has(n.id)).length;

  const openNotices = () => {
    setNoticesOpen(prev => !prev);
    setExpanded(null);
  };

  const markAllSeen = () => {
    const newSeen = new Set(notices.map(n => n.id));
    setSeen(newSeen);
    localStorage.setItem('diu_seen_notices', JSON.stringify([...newSeen]));
  };

  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false);
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  const navLinkClass = (path) =>
    `transition-colors duration-200 font-semibold text-sm ${
      isActive(path)
        ? 'text-[#0c1282] border-b-2 border-[#0c1282] pb-0.5'
        : 'text-[#0c1282]/60 hover:text-[#0c1282]'
    }`;

  const mobileNavLinkClass = (path) =>
    `block w-full text-left py-2.5 px-3 rounded-lg font-semibold text-sm transition-colors ${
      isActive(path)
        ? 'bg-[#0c1282]/10 text-[#0c1282]'
        : 'text-[#0c1282]/70 hover:bg-[#0c1282]/5 hover:text-[#0c1282]'
    }`;

  // ── Notices Dropdown Panel ─────────────────────────────────────────────────
  const NoticesDropdown = () => (
    <div className="absolute right-0 top-full mt-2 w-[360px] max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/60">
        <div className="flex items-center gap-2">
          <span className="text-lg">🔔</span>
          <span className="font-bold text-gray-800 text-sm">University Notices</span>
          {unreadCount > 0 && (
            <span className="bg-[#0c1282] text-white text-[10px] font-black px-1.5 py-0.5 rounded-full leading-none">
              {unreadCount} new
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllSeen}
            className="text-[10px] text-[#0c1282] font-semibold hover:underline"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* Notice list */}
      <div className="max-h-[420px] overflow-y-auto divide-y divide-gray-50">
        {notices.length === 0 ? (
          <div className="py-10 text-center text-gray-400 text-sm">No active notices</div>
        ) : (
          notices.map(n => {
            const style  = TYPE_STYLES[n.type] || TYPE_STYLES.INFO;
            const isOpen = expanded === n.id;
            const isNew  = !seen.has(n.id);
            return (
              <div
                key={n.id}
                className={`relative transition-colors ${isNew ? 'bg-blue-50/40' : 'bg-white'} hover:bg-gray-50`}
              >
                {/* left color bar */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${style.bar}`} />
                <div className="pl-4 pr-3 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-sm shrink-0">{style.icon}</span>
                      <p className="text-xs font-semibold text-gray-800 leading-snug line-clamp-2">{n.title}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {isNew && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />}
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${style.badge}`}>{n.type}</span>
                    </div>
                  </div>
                  <p className={`text-[11px] text-gray-500 mt-1 leading-relaxed ${isOpen ? '' : 'line-clamp-2'}`}>
                    {n.content}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] text-gray-400">
                      {new Date(n.createdAt).toLocaleDateString('en-BD', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    <button
                      onClick={() => setExpanded(isOpen ? null : n.id)}
                      className="text-[10px] text-[#0c1282] font-semibold hover:underline"
                    >
                      {isOpen ? 'Show less ↑' : 'Read more ↓'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      {notices.length > 0 && (
        <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50/60 text-center">
          <span className="text-[11px] text-gray-400">{notices.length} active notice{notices.length !== 1 ? 's' : ''}</span>
        </div>
      )}
    </div>
  );

  return (
    <nav className="fixed top-0 w-full z-50 bg-white shadow-md">
      <div className="flex justify-between items-center px-4 md:px-8 h-16 md:h-20 w-full max-w-screen-2xl mx-auto font-['Manrope'] text-sm tracking-wide">

        {/* Logo */}
        <div className="cursor-pointer flex items-center flex-shrink-0" onClick={() => navigate('/')}>
          <img src="/diulogo.png" alt="Daffodil International University" className="h-12 w-auto" />
        </div>

        {/* Desktop Nav links */}
        <div className="hidden md:flex items-center gap-7">
          <button onClick={() => navigate('/')} className={navLinkClass('/')}>
            Programs
          </button>
          {isAuthenticated && (
            <>
              <button
                onClick={() => window.open('https://studentportal.diu.edu.bd/', '_blank')}
                className="text-[#0c1282]/60 hover:text-[#0c1282] transition-colors font-semibold text-sm"
              >
                Student Portal
              </button>
              <button onClick={() => navigate('/course-registration')} className={navLinkClass('/course-registration')}>
                Courses
              </button>
            </>
          )}
          <button onClick={() => navigate('/pre-register')} className={navLinkClass('/pre-register')}>
            Admissions
          </button>
          <button onClick={() => navigate('/scholarship')} className={navLinkClass('/scholarship')}>
            Scholarships
          </button>
          <button onClick={() => navigate('/facilities')} className={navLinkClass('/facilities')}>
            Campus Life
          </button>
          <button onClick={() => navigate('/jobs')} className={navLinkClass('/jobs')}>
            <span className="flex items-center gap-1">
              Jobs
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-black bg-green-500 text-white leading-none">AI</span>
            </span>
          </button>
          {isAuthenticated && (
            <button onClick={() => navigate('/smart-proctor')} className={navLinkClass('/smart-proctor')}>
              <span className="flex items-center gap-1">
                Smart Proctor
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-black bg-[#0c1282] text-white leading-none">AI</span>
              </span>
            </button>
          )}
        </div>

        {/* Desktop action buttons */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={() => navigate('/pre-register')}
            className="px-5 py-2 bg-[#0c1282] text-white rounded-lg font-bold hover:bg-[#0c1282]/85 active:scale-95 transition-all text-sm"
          >
            Apply Now
          </button>

          {/* Notices bell — desktop (authenticated only) */}
          {isAuthenticated && (
            <div ref={noticesRef} className="relative">
              <button
                onClick={openNotices}
                title="University Notices"
                className="relative w-9 h-9 rounded-full border-2 border-[#0c1282]/20 hover:border-[#0c1282]/60 transition-all flex items-center justify-center hover:bg-[#0c1282]/5"
              >
                <span
                  className="material-symbols-outlined text-[#0c1282] text-xl"
                  style={{ fontVariationSettings: noticesOpen ? "'FILL' 1" : "'FILL' 0" }}
                >
                  notifications
                </span>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center px-0.5 leading-none">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              {noticesOpen && <NoticesDropdown />}
            </div>
          )}

          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/profile')}
                title="My Profile"
                className="w-9 h-9 rounded-full overflow-hidden border-2 border-[#0c1282]/20 hover:border-[#0c1282]/60 transition-all flex-shrink-0 shadow-sm"
              >
                {profilePhoto ? (
                  <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-[#0c1282]/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[#0c1282] text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>account_circle</span>
                  </div>
                )}
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm text-red-500 border border-red-300/50 rounded-lg hover:bg-red-50 transition-colors font-semibold"
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 text-sm text-[#0c1282] border border-[#0c1282]/30 rounded-lg hover:bg-[#0c1282]/10 transition-colors font-semibold"
            >
              Login
            </button>
          )}
        </div>

        {/* Mobile: right side */}
        <div className="md:hidden flex items-center gap-2">
          {/* Notices bell — mobile (authenticated only) */}
          {isAuthenticated && (
            <div ref={noticesRef} className="relative">
              <button
                onClick={openNotices}
                className="relative w-8 h-8 rounded-full border-2 border-[#0c1282]/20 flex items-center justify-center"
              >
                <span
                  className="material-symbols-outlined text-[#0c1282] text-lg"
                  style={{ fontVariationSettings: noticesOpen ? "'FILL' 1" : "'FILL' 0" }}
                >
                  notifications
                </span>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[14px] h-3.5 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center px-0.5 leading-none">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              {noticesOpen && <NoticesDropdown />}
            </div>
          )}

          {isAuthenticated && (
            <button onClick={() => navigate('/profile')} className="w-8 h-8 rounded-full overflow-hidden border-2 border-[#0c1282]/20 flex-shrink-0">
              {profilePhoto ? (
                <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-[#0c1282]/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[#0c1282] text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>account_circle</span>
                </div>
              )}
            </button>
          )}
          <button
            onClick={() => navigate('/pre-register')}
            className="px-3 py-1.5 bg-[#0c1282] text-white rounded-md font-bold text-xs"
          >
            Apply
          </button>
          <button
            className="text-[#0c1282] p-1"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <span className="material-symbols-outlined">{isMobileMenuOpen ? 'close' : 'menu'}</span>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white px-4 py-3 border-t border-[#0c1282]/10 space-y-1">
          <button onClick={() => { navigate('/'); setIsMobileMenuOpen(false); }} className={mobileNavLinkClass('/')}>
            Programs
          </button>
          {isAuthenticated && (
            <>
              <button
                onClick={() => { window.open('https://studentportal.diu.edu.bd/', '_blank'); setIsMobileMenuOpen(false); }}
                className="block w-full text-left py-2.5 px-3 rounded-lg font-semibold text-sm text-[#0c1282]/70 hover:bg-[#0c1282]/5 hover:text-[#0c1282] transition-colors"
              >
                Student Portal
              </button>
              <button onClick={() => { navigate('/course-registration'); setIsMobileMenuOpen(false); }} className={mobileNavLinkClass('/course-registration')}>
                Course Registration
              </button>
            </>
          )}
          <button onClick={() => { navigate('/pre-register'); setIsMobileMenuOpen(false); }} className={mobileNavLinkClass('/pre-register')}>
            Admissions
          </button>
          <button onClick={() => { navigate('/scholarship'); setIsMobileMenuOpen(false); }} className={mobileNavLinkClass('/scholarship')}>
            Scholarships
          </button>
          <button onClick={() => { navigate('/facilities'); setIsMobileMenuOpen(false); }} className={mobileNavLinkClass('/facilities')}>
            Campus Life
          </button>
          <button onClick={() => { navigate('/faculty'); setIsMobileMenuOpen(false); }} className={mobileNavLinkClass('/faculty')}>
            Faculty
          </button>
          <button onClick={() => { navigate('/jobs'); setIsMobileMenuOpen(false); }} className={mobileNavLinkClass('/jobs')}>
            <span className="flex items-center gap-2">
              Jobs & Career
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-black bg-green-500 text-white leading-none">AI</span>
            </span>
          </button>
          {isAuthenticated && (
            <button onClick={() => { navigate('/smart-proctor'); setIsMobileMenuOpen(false); }} className={mobileNavLinkClass('/smart-proctor')}>
              <span className="flex items-center gap-2">
                Smart Proctor
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-black bg-[#0c1282] text-white leading-none">AI</span>
              </span>
            </button>
          )}
          <div className="pt-2 border-t border-[#0c1282]/10 mt-2">
            {isAuthenticated ? (
              <button onClick={handleLogout} className="block w-full text-left py-2.5 px-3 rounded-lg font-semibold text-sm text-red-500 hover:bg-red-50 transition-colors">
                Logout
              </button>
            ) : (
              <button onClick={() => { navigate('/login'); setIsMobileMenuOpen(false); }} className="block w-full text-left py-2.5 px-3 rounded-lg font-semibold text-sm text-[#0c1282] hover:bg-[#0c1282]/5 transition-colors">
                Login
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
