import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { seedAdminAccount } from './components/admin/AdminPanel';

// Pages
import { Dashboard } from './components/dashboard/Dashboard';
import { PreRegisterPage } from './components/preregister/PreRegisterPage';
import { OnlineAdmitPage } from './components/admit/OnlineAdmitPage';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { PaymentPage } from './components/admission/PaymentPage';
import { RegistrationConfirmPage } from './components/admission/RegistrationConfirmPage';
import { StudentIDCardPage } from './components/admission/StudentIDCardPage';

// Auth Pages
import { LoginPage } from './components/auth/LoginPage';
import { RegisterPage } from './components/auth/RegisterPage';
import { SetPasswordPage } from './components/auth/SetPasswordPage';

// Student Pages
import { CourseRegistrationPage } from './components/student/CourseRegistrationPage';
import { LateRegistrationPage } from './components/student/LateRegistrationPage';
import { ProfilePage } from './components/student/ProfilePage';

// Admin & Accounts
import { AdminPanel } from './components/admin/AdminPanel';
import { AccountsPanel } from './components/accounts/AccountsPanel';

// Seed admin account on every app load — ensures admin@diu.edu.bd always has role:'admin'
seedAdminAccount();

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />

          {/* Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/set-password" element={<SetPasswordPage />} />

          {/* Pre-Register Routes */}
          <Route path="/pre-register" element={<PreRegisterPage />} />

          {/* Online Admission Flow */}
          <Route path="/admit-card" element={<OnlineAdmitPage />} />
          <Route path="/admission/payment" element={<PaymentPage />} />
          <Route path="/admission/confirmation" element={<RegistrationConfirmPage />} />
          <Route path="/admission/id-card" element={<StudentIDCardPage />} />

          {/* Student Routes */}
          <Route path="/course-registration" element={<CourseRegistrationPage />} />
          <Route path="/late-registration" element={<LateRegistrationPage />} />
          <Route path="/profile" element={<ProfilePage />} />

          {/* Admin */}
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />

          {/* Accounts */}
          <Route path="/accounts" element={<AccountsPanel />} />

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
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </Router>
  );
}

export default App;
