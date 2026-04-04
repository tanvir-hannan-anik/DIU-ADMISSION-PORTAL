import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Pages
import { Dashboard } from './components/dashboard/Dashboard';
import { PreRegisterPage } from './components/preregister/PreRegisterPage';
import { OnlineAdmitPage } from './components/admit/OnlineAdmitPage';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { PaymentPage } from './components/admission/PaymentPage';
import { RegistrationConfirmPage } from './components/admission/RegistrationConfirmPage';
import { StudentIDCardPage } from './components/admission/StudentIDCardPage';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />

          {/* Pre-Register Routes */}
          <Route path="/pre-register" element={<PreRegisterPage />} />

          {/* Online Admission Flow */}
          <Route path="/admit-card" element={<OnlineAdmitPage />} />
          <Route path="/admission/payment" element={<PaymentPage />} />
          <Route path="/admission/confirmation" element={<RegistrationConfirmPage />} />
          <Route path="/admission/id-card" element={<StudentIDCardPage />} />

          {/* Admin */}
          <Route path="/admin/dashboard" element={<AdminDashboard />} />

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
