import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { adminAuth } from './adminAuth';
import { ThemeProvider } from './themeContext';
import AdminLoginPage from './AdminLoginPage';
import AdminLayout from './AdminLayout';
import AdminDashboard from './pages/AdminDashboard';
import AuditLogsPage from './pages/AuditLogsPage';
import Placeholder from './pages/Placeholder';
import { NAV_GROUPS, PLACEHOLDER_ROUTES } from './adminNav';
import { T } from './theme';
import './admin.css';

const ALL_ITEMS = NAV_GROUPS.flatMap((g) => g.items);

function headerFor(pathname) {
  const slug = pathname.replace(/^\/admin\/?/, '').split('/')[0] || 'dashboard';
  const item = ALL_ITEMS.find((i) => i.path === slug);
  if (slug === 'dashboard') return { title: 'Dashboard', subtitle: 'Welcome back, Admin 👋' };
  return { title: item?.label || 'Admin', subtitle: item?.phase ? `Planned · ${item.phase}` : '' };
}

// Self-contained admin SPA, lazy-loaded from App.js at /admin/*.
export default function AdminApp() {
  const [status, setStatus] = useState('checking'); // checking | authed | guest
  const location = useLocation();

  useEffect(() => {
    adminAuth.verify().then((ok) => setStatus(ok ? 'authed' : 'guest'));
  }, []);

  const { title, subtitle } = headerFor(location.pathname);

  let inner;
  if (status === 'checking') {
    inner = (
      <div className="flex h-screen items-center justify-center" style={{ backgroundColor: T.bg }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: T.accent }} />
      </div>
    );
  } else if (status === 'guest') {
    inner = <AdminLoginPage onSuccess={() => setStatus('authed')} />;
  } else {
    inner = (
      <AdminLayout title={title} subtitle={subtitle}>
        <Routes>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="audit" element={<AuditLogsPage />} />
          {PLACEHOLDER_ROUTES.map((n) => (
            <Route key={n.path} path={n.path}
                   element={<Placeholder title={n.label} phase={n.phase} icon={n.icon} />} />
          ))}
          <Route path="*" element={<Navigate to="dashboard" replace />} />
        </Routes>
      </AdminLayout>
    );
  }

  return <ThemeProvider>{inner}</ThemeProvider>;
}
