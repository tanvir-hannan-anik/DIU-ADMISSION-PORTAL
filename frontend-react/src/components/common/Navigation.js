import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export const Navigation = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { isAuthenticated, logout, user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(null);

  // Load profile photo from localStorage whenever user changes or page focuses
  useEffect(() => {
    const loadPhoto = () => {
      if (user?.email) {
        const photo = localStorage.getItem(`diu_photo_${user.email}`);
        setProfilePhoto(photo || null);
      }
    };
    loadPhoto();
    window.addEventListener('focus', loadPhoto);
    // Also listen for storage changes (photo updated on profile page)
    window.addEventListener('storage', loadPhoto);
    return () => {
      window.removeEventListener('focus', loadPhoto);
      window.removeEventListener('storage', loadPhoto);
    };
  }, [user]);

  // Re-read photo after navigation (covers same-tab profile save)
  useEffect(() => {
    if (user?.email) {
      const photo = localStorage.getItem(`diu_photo_${user.email}`);
      setProfilePhoto(photo || null);
    }
  }, [location.pathname, user]);

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

  return (
    <nav className="fixed top-0 w-full z-50 bg-white shadow-md">
      <div className="flex justify-between items-center px-4 md:px-8 h-16 md:h-20 w-full max-w-screen-2xl mx-auto font-['Manrope'] text-sm tracking-wide">

        {/* Logo */}
        <div className="cursor-pointer flex items-center flex-shrink-0" onClick={() => navigate('/')}>
          <img src="/diulogo.png" alt="Daffodil International University" className="h-12 w-auto" />
        </div>

        {/* Desktop Navigation */}
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

        {/* Action Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={() => navigate('/pre-register')}
            className="px-5 py-2 bg-[#0c1282] text-white rounded-lg font-bold hover:bg-[#0c1282]/85 active:scale-95 transition-all text-sm"
          >
            Apply Now
          </button>

          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              {/* Profile photo avatar */}
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

        {/* Mobile: right side (avatar + hamburger) */}
        <div className="md:hidden flex items-center gap-2">
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
