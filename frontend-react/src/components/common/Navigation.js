import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export const Navigation = () => {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-[#0c1282]/90 backdrop-blur-md shadow-xl shadow-[#0c1282]/10">
      <div className="flex justify-between items-center px-8 h-20 w-full max-w-screen-2xl mx-auto font-['Manrope'] text-sm tracking-wide">

        {/* Logo */}
        <div
          className="text-2xl font-bold tracking-tighter text-white cursor-pointer"
          onClick={() => navigate('/')}
        >
          Daffodil International University
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          <button
            onClick={() => navigate('/')}
            className="text-white border-b-2 border-primary-fixed pb-1 hover:text-white transition-colors duration-300"
          >
            Programs
          </button>

          {/* Show Student Portal & Course Registration before Admissions when logged in */}
          {isAuthenticated && (
            <>
              <button
                onClick={() => window.open('https://auth1.diu.edu.bd/realms/diu-student/protocol/openid-connect/auth?client_id=student-portal-ui&redirect_uri=https%3A%2F%2Fstudentportal.diu.edu.bd%2F&state=21f9f678-4c18-4451-b490-f5e2ff6cc0f5&response_mode=fragment&response_type=code&scope=openid&nonce=ab738521-dd74-4ef1-8139-7b95bc1fc8b7', '_blank')}
                className="text-slate-200/70 hover:text-white transition-colors duration-300"
              >
                Student Portal
              </button>
              <button
                onClick={() => navigate('/course-registration')}
                className="text-slate-200/70 hover:text-white transition-colors duration-300"
              >
                Course Registration
              </button>
            </>
          )}

          <button
            onClick={() => navigate('/')}
            className="text-slate-200/70 hover:text-white transition-colors duration-300"
          >
            Admissions
          </button>
          <button
            onClick={() => navigate('/')}
            className="text-slate-200/70 hover:text-white transition-colors duration-300"
          >
            Scholarships
          </button>
          <button
            onClick={() => navigate('/')}
            className="text-slate-200/70 hover:text-white transition-colors duration-300"
          >
            Campus Life
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/pre-register')}
            className="px-5 py-2 bg-primary-fixed text-on-primary-fixed rounded-md font-bold scale-95 active:scale-90 transition-transform hover:bg-opacity-90"
          >
            Apply Now
          </button>

          {isAuthenticated ? (
            <>
              <button
                onClick={() => navigate('/profile')}
                title="View Profile"
                className="w-9 h-9 rounded-full bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <span className="material-symbols-outlined text-white text-xl">account_circle</span>
              </button>
              <button
                onClick={handleLogout}
                className="px-5 py-2 text-red-400 border border-red-400/30 rounded-md hover:bg-red-400/10 transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="px-5 py-2 text-white border border-white/20 rounded-md hover:bg-white/10 transition-colors"
            >
              Login
            </button>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-white"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-[#0c1282] px-8 py-4 border-t border-white/10">
          <button
            onClick={() => { navigate('/'); setIsMobileMenuOpen(false); }}
            className="block w-full text-left text-white py-2 hover:text-primary-fixed"
          >
            Programs
          </button>

          {isAuthenticated && (
            <>
              <button
                onClick={() => { window.open('https://auth1.diu.edu.bd/realms/diu-student/protocol/openid-connect/auth?client_id=student-portal-ui&redirect_uri=https%3A%2F%2Fstudentportal.diu.edu.bd%2F&state=21f9f678-4c18-4451-b490-f5e2ff6cc0f5&response_mode=fragment&response_type=code&scope=openid&nonce=ab738521-dd74-4ef1-8139-7b95bc1fc8b7', '_blank'); setIsMobileMenuOpen(false); }}
                className="block w-full text-left text-slate-200/70 py-2 hover:text-white"
              >
                Student Portal
              </button>
              <button
                onClick={() => { navigate('/course-registration'); setIsMobileMenuOpen(false); }}
                className="block w-full text-left text-slate-200/70 py-2 hover:text-white"
              >
                Course Registration
              </button>
            </>
          )}

          <button
            onClick={() => { navigate('/'); setIsMobileMenuOpen(false); }}
            className="block w-full text-left text-slate-200/70 py-2 hover:text-white"
          >
            Admissions
          </button>
          <button
            onClick={() => { navigate('/'); setIsMobileMenuOpen(false); }}
            className="block w-full text-left text-slate-200/70 py-2 hover:text-white"
          >
            Scholarships
          </button>
          <button
            onClick={() => { navigate('/'); setIsMobileMenuOpen(false); }}
            className="block w-full text-left text-slate-200/70 py-2 hover:text-white"
          >
            Campus Life
          </button>
          {isAuthenticated && (
            <button
              onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
              className="block w-full text-left text-red-400 py-2 hover:text-red-300"
            >
              Logout
            </button>
          )}
        </div>
      )}
    </nav>
  );
};
