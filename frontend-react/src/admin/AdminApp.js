import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { adminAuth } from './adminAuth';
import { ThemeProvider } from './themeContext';
import AdminLoginPage from './AdminLoginPage';
import AdminLayout from './AdminLayout';
import AdminDashboard from './pages/AdminDashboard';
import AuditLogsPage from './pages/AuditLogsPage';
import LeadsPage from './pages/LeadsPage';
import ApplicationsPage from './pages/ApplicationsPage';
import FollowUpsPage from './pages/FollowUpsPage';
import PipelinePage from './pages/PipelinePage';
import {
  VisitorsPage, TrafficPage, PagesPage, EventsPage,
  FunnelsPage, JourneyPage, HeatmapsPage, ReplaysPage, RealtimePage,
} from './pages/analytics';
import UsersRolesPage from './pages/UsersRolesPage';
import IntegrationsPage from './pages/IntegrationsPage';
import ChatAnalyticsPage from './pages/ChatAnalyticsPage';
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
          <Route path="realtime" element={<RealtimePage />} />
          <Route path="visitors" element={<VisitorsPage />} />
          <Route path="traffic" element={<TrafficPage />} />
          <Route path="pages" element={<PagesPage />} />
          <Route path="events" element={<EventsPage />} />
          <Route path="funnels" element={<FunnelsPage />} />
          <Route path="journey" element={<JourneyPage />} />
          <Route path="heatmaps" element={<HeatmapsPage />} />
          <Route path="replays" element={<ReplaysPage />} />
          <Route path="leads" element={<LeadsPage />} />
          <Route path="applications" element={<ApplicationsPage />} />
          <Route path="followups" element={<FollowUpsPage />} />
          <Route path="pipeline" element={<PipelinePage />} />
          <Route path="chat" element={<ChatAnalyticsPage />} />
          <Route path="users" element={<UsersRolesPage />} />
          <Route path="integrations" element={<IntegrationsPage />} />
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
