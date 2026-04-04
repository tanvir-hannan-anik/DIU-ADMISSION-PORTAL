import React, { useEffect, useState, useCallback } from 'react';
import { Navigation } from '../common/Navigation';
import { Footer } from '../common/Footer';
import { admissionService } from '../../services/admissionService';
import { toast } from 'react-toastify';

const STATUSES = ['PENDING', 'REVIEWING', 'ADMITTED', 'REJECTED'];

const statusStyle = {
  ADMITTED:  'bg-green-50 text-green-700 border border-green-200',
  REVIEWING: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
  PENDING:   'bg-blue-50 text-blue-700 border border-blue-200',
  REJECTED:  'bg-red-50 text-red-700 border border-red-200',
};

const statusDot = {
  ADMITTED:  'bg-green-500',
  REVIEWING: 'bg-yellow-500',
  PENDING:   'bg-blue-500',
  REJECTED:  'bg-red-500',
};

// ── Metric Card ────────────────────────────────────────────────
const MetricCard = ({ label, value, sub, icon, accent, loading }) => (
  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
    <div className="flex items-start justify-between mb-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${accent}`}>
        <span className="material-symbols-outlined text-white text-lg">{icon}</span>
      </div>
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{sub}</span>
    </div>
    <div className="text-3xl font-extrabold font-headline text-slate-900 mb-1">
      {loading ? <span className="block w-16 h-8 bg-slate-100 rounded animate-pulse" /> : value}
    </div>
    <div className="text-xs text-slate-500 font-medium">{label}</div>
  </div>
);

// ── Funnel Bar ──────────────────────────────────────────────────
const FunnelBar = ({ label, value, total, color }) => {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-semibold text-slate-700">{label}</span>
        <span className="text-sm font-bold text-slate-900">{value} <span className="text-slate-400 font-normal">({pct}%)</span></span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-3">
        <div className={`h-3 rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

// ── Main Dashboard ──────────────────────────────────────────────
export const AdminDashboard = () => {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  const [sidebarOpen, setSidebarOpen]   = useState(false);
  const [activeNav, setActiveNav]       = useState('dashboard');
  const [searchTerm, setSearchTerm]     = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [applications, setApplications] = useState([]);
  const [role, setRole]                 = useState('student');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [adminPass, setAdminPass]       = useState('');
  const [loginError, setLoginError]     = useState(false);
  const [stats, setStats]               = useState({
    total: 0, pending: 0, reviewing: 0, admitted: 0, rejected: 0,
    conversionRate: 0, qualifiedRate: 0,
    departmentBreakdown: {}, dailyLeads: {}, recentApplications: [],
  });
  const [loading, setLoading]       = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [expandedApp, setExpandedApp] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [appsResult, statsResult] = await Promise.all([
        admissionService.getApplications(),
        admissionService.getStats(),
      ]);
      if (appsResult.success) setApplications(appsResult.data || []);
      if (statsResult.success) setStats(prev => ({ ...prev, ...statsResult.data }));
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleStatusChange = async (appId, newStatus) => {
    setUpdatingId(appId);
    const result = await admissionService.updateStatus(appId, newStatus);
    if (result.success) {
      toast.success(`Status updated to ${newStatus}`);
      fetchData();
    } else {
      toast.error(result.error || 'Update failed');
    }
    setUpdatingId(null);
  };

  const handleExport = () => {
    if (!applications.length) { toast.info('No applications to export'); return; }
    const rows = [
      ['App ID', 'Full Name', 'Email', 'Phone', 'Program', 'Major', 'SSC GPA', 'HSC GPA', 'Status', 'Applied At'],
      ...applications.map(a => [
        a.appId || '', a.fullName || '', a.email || '', a.contactNumber || '',
        a.program || '', a.major || '', a.sscResult || '', a.hscResult || '',
        a.status || '', a.createdAt ? new Date(a.createdAt).toLocaleDateString() : '',
      ]),
    ];
    const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `diu-leads-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported successfully!');
  };

  // Derived values
  const filteredApps = applications.filter(app => {
    const matchSearch =
      (app.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (app.email    || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (app.appId    || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (app.program  || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || app.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const deptBreakdown = Object.entries(stats.departmentBreakdown || {})
    .sort((a, b) => b[1] - a[1]);
  const maxDept = deptBreakdown.length > 0 ? Math.max(...deptBreakdown.map(d => d[1])) : 1;

  const dailyLeads  = Object.entries(stats.dailyLeads || {});
  const maxDaily    = dailyLeads.length > 0 ? Math.max(...dailyLeads.map(d => d[1]), 1) : 1;

  const ADMIN_PASSWORD = 'admin2024';

  const handleAdminLogin = () => {
    if (adminPass === ADMIN_PASSWORD) {
      setRole('admin');
      setShowLoginModal(false);
      setAdminPass('');
      setLoginError(false);
      toast.success('Welcome, Admin!');
    } else {
      setLoginError(true);
    }
  };

  const handleAdminLogout = () => {
    setRole('student');
    setActiveNav('dashboard');
    toast.info('Switched to student view');
  };

  const allNavItems = [
    { label: 'Dashboard',    icon: 'dashboard',    key: 'dashboard'    },
    { label: 'Leads',        icon: 'leaderboard',  key: 'leads'        },
    { label: 'Applications', icon: 'description',  key: 'applications' },
    { label: 'Analytics',    icon: 'insights',     key: 'analytics'    },
    { label: 'Settings',     icon: 'settings',     key: 'settings'     },
  ];

  const navItems = role === 'admin'
    ? allNavItems
    : allNavItems.filter(n => n.key === 'dashboard' || n.key === 'analytics');

  // ── Section: DASHBOARD ───────────────────────────────────────
  const renderDashboard = () => (
    <div>
      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <MetricCard label="Total Leads"      value={stats.total}      sub="All Time"    icon="group_add"       accent="bg-primary"       loading={loading} />
        <MetricCard label="Pending Review"   value={stats.pending}    sub="Awaiting"    icon="hourglass_empty" accent="bg-slate-500"      loading={loading} />
        <MetricCard label="In Review"        value={stats.reviewing}  sub="Processing"  icon="pending_actions" accent="bg-amber-500"      loading={loading} />
        <MetricCard label="Admitted"         value={stats.admitted}   sub="Confirmed"   icon="verified"        accent="bg-green-600"      loading={loading} />
        <MetricCard label="Rejected"         value={stats.rejected}   sub="Declined"    icon="cancel"          accent="bg-red-500"        loading={loading} />
      </div>

      {/* Conversion + Dept Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Dept bar chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-slate-900 font-headline">Department Breakdown</h3>
              <p className="text-xs text-slate-400 mt-0.5">Applications per program</p>
            </div>
            <button onClick={fetchData} className="text-slate-400 hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-sm">refresh</span>
            </button>
          </div>
          {loading ? (
            <div className="flex items-end gap-4 h-48">
              {[80,60,45,35,20].map((h,i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full bg-slate-100 rounded-t animate-pulse" style={{height:`${h}%`}} />
                  <div className="w-10 h-2 bg-slate-100 rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : deptBreakdown.length > 0 ? (
            <div className="flex items-end gap-3 h-48">
              {deptBreakdown.slice(0, 7).map(([name, count]) => (
                <div key={name} className="flex-1 flex flex-col items-center gap-2 group">
                  <span className="text-[10px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">{count}</span>
                  <div className="w-full bg-slate-50 rounded-t flex flex-col justify-end" style={{height:'100%'}}>
                    <div
                      className="w-full bg-primary hover:bg-primary/80 rounded-t transition-all duration-500"
                      style={{height:`${Math.max(6, Math.round((count / maxDept) * 100))}%`}}
                    />
                  </div>
                  <span className="text-[9px] font-bold uppercase text-slate-400 text-center leading-tight w-full truncate">{name.slice(0,5)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-48 flex flex-col items-center justify-center text-slate-300">
              <span className="material-symbols-outlined text-5xl mb-2">bar_chart</span>
              <p className="text-sm">No data yet — submit applications to see breakdown</p>
            </div>
          )}
        </div>

        {/* Conversion ring */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col items-center justify-center text-center">
          <h3 className="font-bold text-slate-900 font-headline mb-4">Conversion Rate</h3>
          <div className="relative w-36 h-36 mb-4">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f1f5f9" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="15.9" fill="none"
                stroke="#0c1282" strokeWidth="3"
                strokeDasharray={`${stats.conversionRate} ${100 - stats.conversionRate}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-primary">{stats.conversionRate}%</span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Admitted</span>
            </div>
          </div>
          <div className="w-full space-y-2 border-t border-slate-100 pt-4">
            {[
              { label: 'Qualified Rate', value: `${stats.qualifiedRate}%`, color: 'text-amber-600' },
              { label: 'Conversion',     value: `${stats.conversionRate}%`, color: 'text-green-600' },
            ].map(item => (
              <div key={item.label} className="flex justify-between items-center text-xs">
                <span className="text-slate-500">{item.label}</span>
                <span className={`font-bold ${item.color}`}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Daily Trend */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-8">
        <h3 className="font-bold text-slate-900 font-headline mb-1">Daily Lead Trend</h3>
        <p className="text-xs text-slate-400 mb-6">Last 7 days</p>
        <div className="flex items-end gap-4 h-32">
          {dailyLeads.map(([day, count]) => (
            <div key={day} className="flex-1 flex flex-col items-center gap-2 group">
              <span className="text-[10px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">{count}</span>
              <div className="w-full bg-slate-50 rounded flex flex-col justify-end" style={{height:'100%'}}>
                <div
                  className="w-full bg-primary/80 hover:bg-primary rounded transition-all duration-500"
                  style={{height: count > 0 ? `${Math.round((count / maxDaily) * 100)}%` : '4px'}}
                />
              </div>
              <span className="text-[9px] text-slate-400 font-medium whitespace-nowrap">{day}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Applications */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 font-headline">Recent Applications</h3>
          <button onClick={() => setActiveNav('leads')} className="text-xs text-primary font-bold hover:underline">View All</button>
        </div>
        <div className="divide-y divide-slate-100">
          {loading ? [...Array(3)].map((_, i) => (
            <div key={i} className="px-6 py-4 flex items-center gap-4">
              <div className="w-9 h-9 bg-slate-100 rounded-lg animate-pulse" />
              <div className="flex-1 space-y-1">
                <div className="w-32 h-3 bg-slate-100 rounded animate-pulse" />
                <div className="w-24 h-2 bg-slate-100 rounded animate-pulse" />
              </div>
              <div className="w-16 h-5 bg-slate-100 rounded animate-pulse" />
            </div>
          )) : (stats.recentApplications || []).length === 0 ? (
            <div className="px-6 py-8 text-center text-slate-400 text-sm">No applications yet</div>
          ) : (stats.recentApplications || []).map((app, i) => (
            <div key={i} className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
              <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-black text-xs flex-shrink-0">
                {(app.fullName || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-slate-900 truncate">{app.fullName}</div>
                <div className="text-[11px] text-slate-400 truncate">{app.program || '—'}</div>
              </div>
              <span className={`text-[9px] font-black px-2 py-1 rounded uppercase tracking-wider ${statusStyle[app.status] || 'bg-slate-50 text-slate-600'}`}>
                {app.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ── Section: LEADS (Applications Table) ─────────────────────
  const renderLeads = () => (
    <div>
      {/* Filter bar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 mb-6 flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {['ALL', ...STATUSES].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all ${
                statusFilter === s
                  ? 'bg-primary text-white'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              {s === 'ALL' ? `All (${applications.length})` : `${s} (${applications.filter(a => a.status === s).length})`}
            </button>
          ))}
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
            <input
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary/30 outline-none"
              placeholder="Search name, email, ID..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={handleExport}
            className="bg-primary text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wide flex items-center gap-1 hover:bg-primary/90 transition-colors flex-shrink-0"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <span className="text-sm text-slate-500">{filteredApps.length} lead{filteredApps.length !== 1 ? 's' : ''} found</span>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-slate-400">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-3" />
              <p className="text-sm">Loading leads...</p>
            </div>
          ) : filteredApps.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <span className="material-symbols-outlined text-5xl mb-3 block">inbox</span>
              <p className="font-bold text-slate-600 mb-1">No leads found</p>
              <p className="text-sm">{searchTerm ? 'Try a different search term.' : 'Leads submitted via Pre-Register will appear here.'}</p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-slate-50">
                <tr>
                  {['Applicant', 'App ID', 'Program', 'GPA', 'Status', 'Applied', 'Action'].map(h => (
                    <th key={h} className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredApps.map(app => (
                  <tr key={app.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-black text-xs flex-shrink-0">
                          {(app.fullName || '?').split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-sm text-slate-900">{app.fullName}</div>
                          <div className="text-[11px] text-slate-400">{app.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-[11px] font-mono text-slate-600 bg-slate-100 px-2 py-1 rounded">{app.appId || '—'}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="text-sm font-semibold text-slate-700">{app.program || '—'}</div>
                      <div className="text-[10px] text-slate-400">{app.major || ''}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="text-xs text-slate-600">
                        <span className="font-semibold">SSC:</span> {app.sscResult || '—'}
                      </div>
                      <div className="text-xs text-slate-600">
                        <span className="font-semibold">HSC:</span> {app.hscResult || '—'}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black tracking-wider ${statusStyle[app.status] || 'bg-slate-50 text-slate-700'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusDot[app.status] || 'bg-slate-400'}`} />
                        {app.status || 'PENDING'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-[11px] text-slate-500">{app.createdAt ? new Date(app.createdAt).toLocaleDateString() : '—'}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <select
                        value={app.status || 'PENDING'}
                        disabled={updatingId === app.appId}
                        onChange={e => handleStatusChange(app.appId, e.target.value)}
                        className="text-[11px] border border-slate-200 bg-white rounded-lg px-2 py-1.5 font-bold outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer disabled:opacity-50"
                      >
                        {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );

  // ── Section: APPLICATIONS (Detailed Cards) ───────────────────
  const renderApplications = () => (
    <div>
      <div className="mb-6 flex gap-2 flex-wrap">
        {['ALL', ...STATUSES].map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all ${
              statusFilter === s ? 'bg-primary text-white' : 'bg-white border border-slate-200 text-slate-500 hover:border-primary'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-6 animate-pulse">
              <div className="w-10 h-10 bg-slate-100 rounded-lg mb-4" />
              <div className="w-32 h-4 bg-slate-100 rounded mb-2" />
              <div className="w-24 h-3 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      ) : filteredApps.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <span className="material-symbols-outlined text-6xl block mb-3">folder_open</span>
          <p className="font-bold text-slate-600">No applications</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredApps.map(app => (
            <div key={app.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-sm flex-shrink-0">
                      {(app.fullName || '?').split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{app.fullName}</div>
                      <div className="text-[11px] text-slate-400">{app.email}</div>
                    </div>
                  </div>
                  <span className={`text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-wider flex-shrink-0 ${statusStyle[app.status] || 'bg-slate-50 text-slate-600'}`}>
                    {app.status}
                  </span>
                </div>

                <div className="space-y-2 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-slate-400">school</span>
                    <span className="font-semibold text-slate-700">{app.program || '—'}</span>
                    {app.major && <span className="text-slate-400">/ {app.major}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-slate-400">tag</span>
                    <span className="font-mono">{app.appId || '—'}</span>
                  </div>
                  {app.contactNumber && (
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm text-slate-400">call</span>
                      <span>{app.contactNumber}</span>
                    </div>
                  )}
                  <div className="flex gap-4 pt-1">
                    <div className="bg-slate-50 rounded-lg px-3 py-1.5 flex-1 text-center">
                      <div className="text-[10px] text-slate-400 uppercase font-bold">SSC</div>
                      <div className="font-black text-slate-800">{app.sscResult || '—'}</div>
                    </div>
                    <div className="bg-slate-50 rounded-lg px-3 py-1.5 flex-1 text-center">
                      <div className="text-[10px] text-slate-400 uppercase font-bold">HSC</div>
                      <div className="font-black text-slate-800">{app.hscResult || '—'}</div>
                    </div>
                    <div className="bg-slate-50 rounded-lg px-3 py-1.5 flex-1 text-center">
                      <div className="text-[10px] text-slate-400 uppercase font-bold">Date</div>
                      <div className="font-bold text-slate-800 text-[10px]">{app.createdAt ? new Date(app.createdAt).toLocaleDateString('en-GB',{day:'2-digit',month:'short'}) : '—'}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Expand toggle */}
              <button
                onClick={() => setExpandedApp(expandedApp === app.id ? null : app.id)}
                className="w-full px-5 py-2.5 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500 font-bold flex items-center justify-center gap-1 hover:bg-slate-100 transition-colors"
              >
                <span className="material-symbols-outlined text-sm">{expandedApp === app.id ? 'expand_less' : 'expand_more'}</span>
                {expandedApp === app.id ? 'Less' : 'Full Details'}
              </button>
              {expandedApp === app.id && (
                <div className="px-5 pb-5 pt-3 border-t border-slate-100 space-y-3">
                  {app.essayOne && (
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Statement 1</div>
                      <p className="text-xs text-slate-600 leading-relaxed">{app.essayOne}</p>
                    </div>
                  )}
                  {app.essayTwo && (
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Statement 2</div>
                      <p className="text-xs text-slate-600 leading-relaxed">{app.essayTwo}</p>
                    </div>
                  )}
                  <div className="flex items-center gap-2 pt-1">
                    <label className="text-[11px] font-bold text-slate-600">Update Status:</label>
                    <select
                      value={app.status || 'PENDING'}
                      disabled={updatingId === app.appId}
                      onChange={e => handleStatusChange(app.appId, e.target.value)}
                      className="text-[11px] border border-slate-200 bg-white rounded-lg px-3 py-1.5 font-bold outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer disabled:opacity-50"
                    >
                      {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // ── Section: ANALYTICS ───────────────────────────────────────
  const renderAnalytics = () => (
    <div className="space-y-6">
      {/* Conversion Funnel */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h3 className="font-bold text-slate-900 font-headline mb-1">Admission Funnel</h3>
        <p className="text-xs text-slate-400 mb-6">How leads move through the pipeline</p>
        <FunnelBar label="Total Leads"   value={stats.total}     total={stats.total} color="bg-blue-500"   />
        <FunnelBar label="In Review"     value={stats.reviewing} total={stats.total} color="bg-amber-500"  />
        <FunnelBar label="Admitted"      value={stats.admitted}  total={stats.total} color="bg-green-500"  />
        <FunnelBar label="Rejected"      value={stats.rejected}  total={stats.total} color="bg-red-400"    />
        <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          {[
            { label: 'Conversion Rate',  value: `${stats.conversionRate}%`,  color: 'text-green-600' },
            { label: 'Qualified Rate',   value: `${stats.qualifiedRate}%`,   color: 'text-amber-600' },
            { label: 'Rejection Rate',   value: `${stats.total > 0 ? Math.round((stats.rejected / stats.total) * 100) : 0}%`, color: 'text-red-500' },
            { label: 'Pending Rate',     value: `${stats.total > 0 ? Math.round((stats.pending / stats.total) * 100) : 0}%`,  color: 'text-blue-500' },
          ].map(item => (
            <div key={item.label} className="bg-slate-50 rounded-xl p-4">
              <div className={`text-2xl font-black ${item.color}`}>{item.value}</div>
              <div className="text-[10px] text-slate-400 uppercase font-bold mt-1">{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Department Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 font-headline">Department-wise Lead Report</h3>
        </div>
        {deptBreakdown.length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-sm">No data yet</div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-slate-50">
              <tr>
                {['Rank', 'Department', 'Leads', 'Share', 'Distribution'].map(h => (
                  <th key={h} className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {deptBreakdown.map(([name, count], i) => {
                const share = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                return (
                  <tr key={name} className="hover:bg-slate-50/60">
                    <td className="px-5 py-3">
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-[11px] font-black flex items-center justify-center">{i+1}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-sm font-semibold text-slate-800">{name}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-sm font-bold text-slate-900">{count}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-sm font-bold text-primary">{share}%</span>
                    </td>
                    <td className="px-5 py-3 w-48">
                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <div className="h-2 bg-primary rounded-full transition-all duration-500" style={{width:`${share}%`}} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Status Breakdown */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { status: 'PENDING',   icon: 'hourglass_empty', label: 'Awaiting Review',  accent: 'bg-blue-50 border-blue-200',   text: 'text-blue-700',  count: stats.pending   },
          { status: 'REVIEWING', icon: 'pending_actions', label: 'Under Review',     accent: 'bg-amber-50 border-amber-200', text: 'text-amber-700', count: stats.reviewing },
          { status: 'ADMITTED',  icon: 'verified',        label: 'Admitted',         accent: 'bg-green-50 border-green-200', text: 'text-green-700', count: stats.admitted  },
          { status: 'REJECTED',  icon: 'cancel',          label: 'Rejected',         accent: 'bg-red-50 border-red-200',     text: 'text-red-700',   count: stats.rejected  },
        ].map(item => (
          <div key={item.status} className={`rounded-xl border p-5 ${item.accent}`}>
            <span className={`material-symbols-outlined text-2xl ${item.text} mb-2 block`}>{item.icon}</span>
            <div className={`text-3xl font-black ${item.text}`}>{item.count}</div>
            <div className={`text-[11px] font-bold mt-1 ${item.text} opacity-70`}>{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );

  // ── Section: SETTINGS ────────────────────────────────────────
  const renderSettings = () => (
    <div className="max-w-2xl space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h3 className="font-bold text-slate-900 font-headline mb-4">Intake Cycle</h3>
        <div className="space-y-4">
          {[
            { label: 'Current Cycle', value: 'Summer 2024', type: 'text' },
            { label: 'Application Deadline', value: '', type: 'date' },
            { label: 'Admission Officer Email', value: 'admission@daffodilvarsity.edu.bd', type: 'email' },
          ].map(field => (
            <div key={field.label}>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1">{field.label}</label>
              <input
                type={field.type}
                defaultValue={field.value}
                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30 bg-slate-50"
              />
            </div>
          ))}
          <button className="bg-primary text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors">
            Save Changes
          </button>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h3 className="font-bold text-slate-900 font-headline mb-2">Data Management</h3>
        <p className="text-sm text-slate-500 mb-4">Export or clear admission data for the current cycle.</p>
        <div className="flex gap-3">
          <button onClick={handleExport} className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-slate-700 transition-colors">
            <span className="material-symbols-outlined text-sm">download</span>
            Export All CSV
          </button>
        </div>
      </div>
    </div>
  );

  // ── Layout ───────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Navigation />

      {/* Admin Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm mx-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary">admin_panel_settings</span>
              </div>
              <div>
                <div className="font-bold text-slate-900 font-headline">Admin Access</div>
                <div className="text-xs text-slate-400">Enter your admin password to continue</div>
              </div>
            </div>
            <input
              type="password"
              value={adminPass}
              onChange={e => { setAdminPass(e.target.value); setLoginError(false); }}
              onKeyDown={e => e.key === 'Enter' && handleAdminLogin()}
              placeholder="Admin password"
              autoFocus
              className={`w-full border rounded-xl px-4 py-3 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-primary/30 ${loginError ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-slate-50'}`}
            />
            {loginError && (
              <p className="text-xs text-red-500 mb-3 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">error</span>
                Incorrect password. Please try again.
              </p>
            )}
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => { setShowLoginModal(false); setAdminPass(''); setLoginError(false); }}
                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAdminLogin}
                className="flex-1 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors"
              >
                Login
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex pt-20 min-h-screen">

        {/* Sidebar */}
        <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 w-60 fixed left-0 top-20 bottom-0 bg-white border-r border-slate-200 flex flex-col py-6 z-40`}>
          <div className="px-6 mb-8">
            <div className="text-base font-black text-slate-900 font-headline">Admin Portal</div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Admission Management</div>
            <div className={`mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
              role === 'admin' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
            }`}>
              <span className="material-symbols-outlined text-xs" style={{ fontSize: '12px' }}>
                {role === 'admin' ? 'shield' : 'school'}
              </span>
              {role === 'admin' ? 'Admin' : 'Student View'}
            </div>
          </div>

          <nav className="flex-1 space-y-0.5 px-3">
            {navItems.map(item => (
              <button
                key={item.key}
                onClick={() => { setActiveNav(item.key); setSidebarOpen(false); }}
                className={`flex items-center gap-3 px-3 py-2.5 w-full rounded-lg transition-all text-sm ${
                  activeNav === item.key
                    ? 'bg-primary/10 text-primary font-bold'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>

          <div className="px-4 mt-auto space-y-2">
            {role === 'admin' ? (
              <>
                <button onClick={handleExport} className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-2.5 rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-slate-700 transition-all">
                  <span className="material-symbols-outlined text-sm">download</span>
                  Export CSV
                </button>
                <button onClick={handleAdminLogout} className="w-full flex items-center justify-center gap-2 border border-slate-200 text-slate-500 py-2 rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-all">
                  <span className="material-symbols-outlined text-sm">logout</span>
                  Exit Admin
                </button>
              </>
            ) : (
              <button onClick={() => setShowLoginModal(true)} className="w-full flex items-center justify-center gap-2 bg-primary text-white py-2.5 rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-primary/90 transition-all">
                <span className="material-symbols-outlined text-sm">admin_panel_settings</span>
                Admin Login
              </button>
            )}
          </div>
        </aside>

        {/* Mobile Toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="md:hidden fixed top-24 right-6 z-50 bg-primary text-white p-2 rounded-lg shadow-lg"
        >
          <span className="material-symbols-outlined">{sidebarOpen ? 'close' : 'menu'}</span>
        </button>
        {sidebarOpen && <div className="md:hidden fixed inset-0 bg-black/30 z-30" onClick={() => setSidebarOpen(false)} />}

        {/* Main */}
        <main className="flex-1 md:ml-60 p-6 lg:p-8">
          {/* Page Header */}
          <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold font-headline text-slate-900 tracking-tight">
                {navItems.find(n => n.key === activeNav)?.label}
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                {{
                  dashboard:    'Real-time overview of admission performance',
                  leads:        'Manage and update all student leads',
                  applications: 'Detailed view of individual applications',
                  analytics:    'Conversion funnel and department analytics',
                  settings:     'Configure intake cycle and system settings',
                }[activeNav]}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 font-medium">Summer 2024 Intake</span>
              <button onClick={fetchData} className="flex items-center gap-1.5 text-xs text-primary font-bold bg-primary/10 px-3 py-1.5 rounded-lg hover:bg-primary/20 transition-colors">
                <span className="material-symbols-outlined text-sm">refresh</span>
                Refresh
              </button>
            </div>
          </div>

          {/* Student View Banner */}
          {role === 'student' && (
            <div className="mb-6 flex items-center justify-between gap-4 bg-blue-50 border border-blue-200 rounded-xl px-5 py-3.5">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-blue-600">info</span>
                <div>
                  <div className="text-sm font-bold text-blue-800">Student View — Read Only</div>
                  <div className="text-xs text-blue-600">You can view Dashboard and Analytics. Leads, Applications, and Settings require admin access.</div>
                </div>
              </div>
              <button
                onClick={() => setShowLoginModal(true)}
                className="flex-shrink-0 flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors"
              >
                <span className="material-symbols-outlined text-sm">lock_open</span>
                Admin Login
              </button>
            </div>
          )}

          {/* Section Content */}
          {activeNav === 'dashboard'    && renderDashboard()}
          {activeNav === 'leads'        && role === 'admin' && renderLeads()}
          {activeNav === 'applications' && role === 'admin' && renderApplications()}
          {activeNav === 'analytics'    && renderAnalytics()}
          {activeNav === 'settings'     && role === 'admin' && renderSettings()}
        </main>
      </div>
      <Footer />
    </div>
  );
};
