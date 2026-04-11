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
    <nav className="fixed top-0 w-full z-50 bg-white shadow-md">
      <div className="flex justify-between items-center px-4 md:px-8 h-16 md:h-20 w-full max-w-screen-2xl mx-auto font-['Manrope'] text-sm tracking-wide">

        {/* Logo */}
        <div
          className="cursor-pointer flex items-center"
          onClick={() => navigate('/')}
        >
          <img src="/diulogo.png" alt="Daffodil International University" className="h-12 w-auto" />
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          <button
            onClick={() => navigate('/')}
            className="text-[#0c1282] font-semibold border-b-2 border-[#0c1282] pb-1 hover:text-[#0c1282]/70 transition-colors duration-300"
          >
            Programs
          </button>

          {isAuthenticated && (
            <>
              <button
                onClick={() => window.open('https://auth1.diu.edu.bd/realms/diu-student/protocol/openid-connect/auth?client_id=student-portal-ui&redirect_uri=https%3A%2F%2Fstudentportal.diu.edu.bd%2F&state=21f9f678-4c18-4451-b490-f5e2ff6cc0f5&response_mode=fragment&response_type=code&scope=openid&nonce=ab738521-dd74-4ef1-8139-7b95bc1fc8b7', '_blank')}
                className="text-[#0c1282]/70 hover:text-[#0c1282] transition-colors duration-300"
              >
                Student Portal
              </button>
              <button
                onClick={() => navigate('/course-registration')}
                className="text-[#0c1282]/70 hover:text-[#0c1282] transition-colors duration-300"
              >
                Course Registration
              </button>
            </>
          )}

          <button
            onClick={() => navigate('/')}
            className="text-[#0c1282]/70 hover:text-[#0c1282] transition-colors duration-300"
          >
            Admissions
          </button>
          <button
            onClick={() => navigate('/')}
            className="text-[#0c1282]/70 hover:text-[#0c1282] transition-colors duration-300"
          >
            Scholarships
          </button>
          <button
            onClick={() => navigate('/')}
            className="text-[#0c1282]/70 hover:text-[#0c1282] transition-colors duration-300"
          >
            Campus Life
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 md:gap-4">
          <button
            onClick={() => navigate('/pre-register')}
            className="px-3 md:px-5 py-2 bg-[#0c1282] text-white rounded-md font-bold scale-95 active:scale-90 transition-transform hover:bg-[#0c1282]/85 text-sm"
          >
            <span className="hidden sm:inline">Apply Now</span>
            <span className="sm:hidden">Apply</span>
          </button>

          {isAuthenticated ? (
            <>
              <button
                onClick={() => navigate('/profile')}
                title="View Profile"
                className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-[#0c1282]/10 border border-[#0c1282]/20 flex items-center justify-center hover:bg-[#0c1282]/20 transition-colors"
              >
                <span className="material-symbols-outlined text-[#0c1282] text-lg md:text-xl">account_circle</span>
              </button>
              <button
                onClick={handleLogout}
                className="hidden sm:block px-4 py-2 text-sm text-red-500 border border-red-400/40 rounded-md hover:bg-red-50 transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="hidden sm:block px-4 py-2 text-sm text-[#0c1282] border border-[#0c1282]/30 rounded-md hover:bg-[#0c1282]/10 transition-colors"
            >
              Login
            </button>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-[#0c1282] p-1"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <span className="material-symbols-outlined">{isMobileMenuOpen ? 'close' : 'menu'}</span>
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white px-4 py-4 border-t border-[#0c1282]/10">
          <button
            onClick={() => { navigate('/'); setIsMobileMenuOpen(false); }}
            className="block w-full text-left text-[#0c1282] font-semibold py-2 hover:text-[#0c1282]/70"
          >
            Programs
          </button>

          {isAuthenticated && (
            <>
              <button
                onClick={() => { window.open('https://auth1.diu.edu.bd/realms/diu-student/protocol/openid-connect/auth?client_id=student-portal-ui&redirect_uri=https%3A%2F%2Fstudentportal.diu.edu.bd%2F&state=21f9f678-4c18-4451-b490-f5e2ff6cc0f5&response_mode=fragment&response_type=code&scope=openid&nonce=ab738521-dd74-4ef1-8139-7b95bc1fc8b7', '_blank'); setIsMobileMenuOpen(false); }}
                className="block w-full text-left text-[#0c1282]/70 py-2 hover:text-[#0c1282]"
              >
                Student Portal
              </button>
              <button
                onClick={() => { navigate('/course-registration'); setIsMobileMenuOpen(false); }}
                className="block w-full text-left text-[#0c1282]/70 py-2 hover:text-[#0c1282]"
              >
                Course Registration
              </button>
            </>
          )}

          <button
            onClick={() => { navigate('/'); setIsMobileMenuOpen(false); }}
            className="block w-full text-left text-[#0c1282]/70 py-2 hover:text-[#0c1282]"
          >
            Admissions
          </button>
          <button
            onClick={() => { navigate('/'); setIsMobileMenuOpen(false); }}
            className="block w-full text-left text-[#0c1282]/70 py-2 hover:text-[#0c1282]"
          >
            Scholarships
          </button>
          <button
            onClick={() => { navigate('/'); setIsMobileMenuOpen(false); }}
            className="block w-full text-left text-[#0c1282]/70 py-2 hover:text-[#0c1282]"
          >
            Campus Life
          </button>
          {isAuthenticated && (
            <button
              onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
              className="block w-full text-left text-red-500 py-2 hover:text-red-400"
            >
              Logout
            </button>
          )}
        </div>
      )}
    </nav>
  );
};
