import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from './hooks/useAuth';
import { captureUtmParams } from './utils/tracking';
import RequestInfoWidget from './components/common/RequestInfoWidget';

// Pages
import { Dashboard }              from './components/dashboard/Dashboard';
import { PreRegisterPage }        from './components/preregister/PreRegisterPage';
import { OnlineAdmitPage }        from './components/admit/OnlineAdmitPage';
import { PaymentPage }            from './components/admission/PaymentPage';
import { RegistrationConfirmPage } from './components/admission/RegistrationConfirmPage';
import { StudentIDCardPage }      from './components/admission/StudentIDCardPage';
import { LoginPage }              from './components/auth/LoginPage';
import { RegisterPage }           from './components/auth/RegisterPage';
import { SetPasswordPage }        from './components/auth/SetPasswordPage';
import { CourseRegistrationPage } from './components/student/CourseRegistrationPage';
import { LateRegistrationPage }   from './components/student/LateRegistrationPage';
import { CoursePaymentPage }      from './components/student/CoursePaymentPage';
import { ProfilePage }            from './components/student/ProfilePage';
import { FacilitiesPage }         from './components/facilities/FacilitiesPage';
import { FacultyPage }            from './components/faculty/FacultyPage';
import { ScholarshipPage }        from './components/scholarship/ScholarshipPage';
import { JobsPage }               from './components/jobs/JobsPage';
import { SmartProctorPage }       from './components/proctor/SmartProctorPage';

// Admin portal is lazy-loaded so its code never ships to public-site visitors
// until someone navigates to /admin.
const AdminApp = lazy(() => import('./admin/AdminApp'));

// ── Protected route: redirects to /login if not authenticated ─────────────────
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

// ── Guest route: redirects authenticated users away from login/register ───────
function GuestRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (isAuthenticated) return <Navigate to="/" replace />;
  return children;
}

function App() {
  // Persist UTM params once on first load so campaign attribution survives
  // navigation before a lead is captured.
  useEffect(() => { captureUtmParams(); }, []);

  return (
    <Router>
      <div className="min-h-screen bg-background">
        <Routes>
          {/* Public Routes */}
          <Route path="/"          element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />

          {/* Auth Routes (redirect away if already logged in) */}
          <Route path="/login"        element={<GuestRoute><LoginPage /></GuestRoute>} />
          <Route path="/register"     element={<GuestRoute><RegisterPage /></GuestRoute>} />
          <Route path="/set-password" element={<SetPasswordPage />} />

          {/* Admission flow (public — anyone can apply) */}
          <Route path="/pre-register"           element={<PreRegisterPage />} />
          <Route path="/admit-card"             element={<OnlineAdmitPage />} />
          <Route path="/admission/payment"      element={<PaymentPage />} />
          <Route path="/admission/confirmation" element={<RegistrationConfirmPage />} />
          <Route path="/admission/id-card"      element={<StudentIDCardPage />} />

          {/* Protected student routes */}
          <Route path="/course-registration" element={<ProtectedRoute><CourseRegistrationPage /></ProtectedRoute>} />
          <Route path="/late-registration"   element={<ProtectedRoute><LateRegistrationPage /></ProtectedRoute>} />
          <Route path="/course-payment"      element={<ProtectedRoute><CoursePaymentPage /></ProtectedRoute>} />
          <Route path="/profile"             element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

          {/* Info pages */}
          <Route path="/facilities"  element={<FacilitiesPage />} />
          <Route path="/faculty"     element={<FacultyPage />} />
          <Route path="/scholarship" element={<ScholarshipPage />} />
          <Route path="/jobs"          element={<ProtectedRoute><JobsPage /></ProtectedRoute>} />
          <Route path="/smart-proctor" element={<ProtectedRoute><SmartProctorPage /></ProtectedRoute>} />

          {/* Admin portal (lazy, self-contained, backend role-gated) */}
          <Route
            path="/admin/*"
            element={
              <Suspense fallback={<div className="flex h-screen items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" /></div>}>
                <AdminApp />
              </Suspense>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>

      {/* Global lead-capture CTA (auto-hidden on /admin + auth pages) */}
      <RequestInfoWidget />

      <ToastContainer
        position="bottom-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </Router>
  );
}

export default App;
