import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from './hooks/useAuth';

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
import { ProfilePage }            from './components/student/ProfilePage';

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
          <Route path="/profile"             element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>

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
