import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { T, CHART_COLORS } from '../theme';
import { downloadCsv } from '../utils';
import adminApi from '../adminApi';
import { analyticsApi } from '../analyticsApi';
import Dropdown from '../components/Dropdown';
import {
  Panel, KpiCard, DonutWithLegend, DeviceBars,
  TopPagesList, FunnelChart, GaugeChart, ActivityFeed,
} from '../dashboard/widgets';

const RANGES = [
  { label: 'Today', days: 1 }, { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 }, { label: 'Last 90 days', days: 90 },
];

const withPct = (rows, key = 'value') => {
  const total = rows.reduce((s, r) => s + (r[key] || 0), 0) || 1;
  return rows.map((r, i) => ({ ...r, pct: Math.round((r[key] / total) * 1000) / 10, color: CHART_COLORS[i % CHART_COLORS.length] }));
};
const fmtK = (n) => (n >= 1000 ? `${(n / 1000).toFixed(1)}K` : `${n ?? 0}`);
const fmtDuration = (s) => {
  if (!s) return '0s';
  const m = Math.floor(s / 60), sec = Math.round(s % 60);
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
};
const timeAgo = (d) => {
  if (!d) return '';
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

// All-real dashboard. DB metrics (leads/applications) are always live; visitor
// analytics come from PostHog and show a connect-hint until the API key is set.
// No demo/mock data anywhere.
export default function AdminDashboard() {
  const navigate = useNavigate();
  const [range, setRange] = useState(RANGES[1]);
  const [stats, setStats] = useState(null);     // DB stats
  const [a, setA] = useState(null);             // analytics bundle

  useEffect(() => {
    adminApi.get('/v1/admin/stats').then((r) => setStats(r.data.data)).catch(() => {});
  }, []);

  useEffect(() => {
    const d = range.days;
    setA(null);
    Promise.all([
      analyticsApi.overview(d), analyticsApi.traffic(d), analyticsApi.pages(d),
      analyticsApi.funnel(Math.max(d, 30)), analyticsApi.devices(d),
    ]).then(([overview, traffic, pages, funnel, devices]) => {
      setA({
        configured: overview.configured !== false,
        overview, sources: traffic.sources || [], pages: pages.pages || [],
        funnel: (funnel.funnel || []).filter((s) => s.value > 0), devices: devices.devices || [],
      });
    }).catch(() => setA({ configured: false, overview: {}, sources: [], pages: [], funnel: [], devices: [] }));
  }, [range]);

  const live = a?.configured;
  const ov = a?.overview || {};
  const sources = withPct(a?.sources || []);
  const devices = withPct(a?.devices || []);
  const quality = stats?.leadQuality || { high: 0, medium: 0, low: 0, avgScore: 0 };

  const activity = (stats?.recentLeads || []).map((l, i) => ({
    id: l.id ?? i, icon: 'person_add', tint: CHART_COLORS[i % CHART_COLORS.length],
    title: 'Lead captured', sub: `${l.email}${l.interestedProgram ? ' · ' + l.interestedProgram : ''}`,
    meta: l.source, time: timeAgo(l.createdAt),
  }));

  // KPI cards — DB ones always live; visitor ones live only when PostHog configured.
  const dash = '—';
  const kpiCards = [
    { id: 'visitors', label: 'Unique Visitors', value: live ? fmtK(ov.uniqueVisitors) : dash,
      color: '#6366F1', data: live ? (ov.dailySeries || []) : [], hideDelta: true, live, subtitle: range.label },
    { id: 'leads', label: 'Total Leads', value: stats ? fmtK(stats.totalLeads) : '…',
      delta: stats?.newLeadsThisWeek ?? 0, up: true, color: '#A78BFA', live: true, subtitle: '+ this week' },
    { id: 'apps', label: 'Applications', value: stats ? fmtK(stats.totalApplications) : '…',
      color: '#34D399', live: true, hideDelta: true, subtitle: 'all time' },
    { id: 'admitted', label: 'Admitted', value: stats ? fmtK(stats.admittedApplications) : '…',
      color: '#22D3EE', live: true, hideDelta: true, subtitle: 'all time' },
    { id: 'conv', label: 'Conversion Rate', value: stats ? `${stats.applicationConversionRate ?? 0}%` : '…',
      color: '#FBBF24', live: true, hideDelta: true, subtitle: 'admitted / total' },
    { id: 'active', label: 'Active Now', value: live ? `${ov.activeNow ?? 0}` : dash,
      color: '#FB7185', live, hideDelta: true, subtitle: 'last 30 min' },
  ];

  const handleExport = () => {
    const rows = [
      ['DIU Admin — Dashboard Export', range.label], [],
      ['Metric', 'Value'],
      ['Unique Visitors', live ? ov.uniqueVisitors : 'n/a'],
      ['Active Now', live ? ov.activeNow : 'n/a'],
      ['Avg Session', live ? fmtDuration(ov.avgSessionSeconds) : 'n/a'],
      ['Bounce Rate', live ? `${ov.bounceRate}%` : 'n/a'],
      ['Total Leads', stats?.totalLeads ?? 0],
      ['Applications', stats?.totalApplications ?? 0],
      ['Admitted', stats?.admittedApplications ?? 0],
      ['Conversion Rate', `${stats?.applicationConversionRate ?? 0}%`],
      [],
      ['Traffic Source', 'Visitors'],
      ...sources.map((s) => [s.name, s.value]),
    ];
    downloadCsv(`diu-dashboard-${new Date().toISOString().slice(0, 10)}.csv`, rows);
    toast.success('Report exported as CSV');
  };

  return (
    <div className="flex min-h-full">
      <div className="flex-1 min-w-0 p-4 sm:p-5 lg:p-6 space-y-5">
        {/* Sub-bar */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-1.5 px-2.5 h-7 rounded-full text-[12px] font-semibold"
                style={{ backgroundColor: live ? 'rgba(52,211,153,0.12)' : 'rgba(148,163,184,0.12)', color: live ? T.up : T.textDim }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: live ? T.up : T.textDim }} />
            {live ? 'Live' : 'DB only'}
          </span>
          <span className="text-[13px] hidden sm:inline" style={{ color: T.textDim }}>Real-time data from your website &amp; database</span>
          <div className="ml-auto flex items-center gap-2">
            <Dropdown width={170} trigger={() => (
              <button className="flex items-center gap-1.5 px-3 h-9 rounded-lg text-[12px] font-medium"
                      style={{ backgroundColor: T.card, color: T.textDim, border: `1px solid ${T.border}` }}>
                <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                <span className="hidden sm:inline">{range.label}</span>
                <span className="material-symbols-outlined text-[16px]">expand_more</span>
              </button>
            )}>
              {({ close }) => (
                <div className="py-1">
                  {RANGES.map((r) => (
                    <button key={r.label} onClick={() => { setRange(r); close(); }}
                            className="w-full text-left px-3 py-2 text-[13px] hover:bg-white/5"
                            style={{ color: r.label === range.label ? T.accent : T.text }}>{r.label}</button>
                  ))}
                </div>
              )}
            </Dropdown>
            <button onClick={handleExport}
                    className="flex items-center gap-1.5 px-3 h-9 rounded-lg text-[12px] font-bold text-white hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: T.accent }}>
              <span className="material-symbols-outlined text-[16px]">download</span>
              <span className="hidden sm:inline">Export Report</span>
            </button>
          </div>
        </div>

        {/* Connect-PostHog banner (only when visitor analytics aren't wired) */}
        {a && !live && (
          <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg text-[12px]"
               style={{ backgroundColor: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', color: '#FBBF24' }}>
            <span className="material-symbols-outlined text-[16px] flex-shrink-0">info</span>
            <span>Lead &amp; application metrics are <b>live from your database</b>. To light up visitor analytics
              (visitors, sources, devices, sessions), set <b>POSTHOG_API_KEY</b> + <b>POSTHOG_PROJECT_ID</b> on the
              API service — see <b>Settings → Integrations</b>.</span>
          </div>
        )}

        {/* KPI row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
          {kpiCards.map((k) => <KpiCard key={k.id} {...k} />)}
        </div>

        {/* Session quality strip (live only) */}
        {live && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { l: 'Page Views', v: fmtK(ov.pageviews), i: 'visibility' },
              { l: 'Sessions', v: fmtK(ov.sessions), i: 'timeline' },
              { l: 'Avg Session', v: fmtDuration(ov.avgSessionSeconds), i: 'timer' },
              { l: 'Bounce Rate', v: `${ov.bounceRate ?? 0}%`, i: 'call_missed_outgoing' },
            ].map((x) => (
              <div key={x.l} className="rounded-xl p-3 flex items-center gap-2.5" style={{ backgroundColor: T.card, border: `1px solid ${T.border}` }}>
                <span className="material-symbols-outlined text-[20px]" style={{ color: T.accent }}>{x.i}</span>
                <div><p className="text-[18px] font-extrabold leading-none" style={{ color: T.text }}>{x.v}</p>
                  <p className="text-[11px]" style={{ color: T.textDim }}>{x.l}</p></div>
              </div>
            ))}
          </div>
        )}

        {/* Row 2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <Panel title="Visitors by Source" subtitle="Where your visitors come from">
            <DonutWithLegend data={sources} centerValue={live ? fmtK(ov.uniqueVisitors) : '—'} centerLabel="Visitors" />
          </Panel>

          <Panel title="Active Users (Real Time)" subtitle="Currently active on your site"
                 action={<button onClick={() => navigate('/admin/realtime')} className="text-[12px] font-semibold" style={{ color: T.accent }}>View All</button>}>
            <p className="text-[40px] font-extrabold leading-none mb-1" style={{ color: T.text }}>{live ? (ov.activeNow ?? 0) : '—'}</p>
            <p className="text-[12px] mb-3" style={{ color: T.textDim }}>visitors in the last 30 minutes</p>
            <DeviceBars items={devices.length ? devices : []} />
            {!devices.length && <p className="text-[12px]" style={{ color: T.textFaint }}>No device data yet.</p>}
          </Panel>

          <Panel title="Top Pages" subtitle="By page views">
            <TopPagesList pages={a?.pages || []} />
          </Panel>
        </div>

        {/* Row 3 */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <Panel title="User Journey" subtitle="Admission conversion funnel">
            <FunnelChart stages={a?.funnel || []} />
          </Panel>

          <Panel title="Device Analytics" subtitle="By device type">
            <DonutWithLegend data={devices} centerValue={live ? fmtK(ov.uniqueVisitors) : '—'} centerLabel="Visitors" />
          </Panel>

          <Panel title="Lead Quality" subtitle="From real lead scores in your CRM">
            <GaugeChart score={quality.avgScore} high={quality.high} medium={quality.medium} low={quality.low} />
          </Panel>
        </div>

        <p className="text-[11px] pt-2" style={{ color: T.textFaint }}>© 2026 DIU Admission Portal · Admin Intelligence</p>
      </div>

      {/* Right — live activity rail */}
      <aside className="hidden xl:block w-80 flex-shrink-0 border-l p-4 sticky top-0 self-start"
             style={{ borderColor: T.border, height: 'calc(100vh - 4rem)' }}>
        <ActivityFeed items={activity} onViewAll={() => navigate('/admin/leads')} />
      </aside>
    </div>
  );
}
