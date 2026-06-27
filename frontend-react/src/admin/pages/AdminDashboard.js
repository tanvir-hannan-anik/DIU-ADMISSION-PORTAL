import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { T } from '../theme';
import { downloadCsv } from '../utils';
import Dropdown from '../components/Dropdown';
import {
  KPIS, VISITOR_SOURCES, REALTIME_SERIES, DEVICE_BREAKDOWN, TOP_PAGES,
  FUNNEL, DEVICE_ANALYTICS, AI_LEADS, ACTIVITY_FEED,
} from '../mockData';
import {
  Panel, SelectPill, KpiCard, DonutWithLegend, RealtimeArea, DeviceBars,
  TopPagesList, FunnelChart, GaugeChart, ActivityFeed,
} from '../dashboard/widgets';
import { CHART_COLORS } from '../theme';

const RANGES = ['Today', 'Last 7 days', 'Last 30 days', 'This Month', 'This Year'];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [range, setRange] = useState('Last 7 days');
  const [sourcePeriod, setSourcePeriod] = useState('This Week');
  const [pagesPeriod, setPagesPeriod] = useState('This Week');
  const [journeyPeriod, setJourneyPeriod] = useState('This Week');

  const sources = VISITOR_SOURCES.map((s, i) => ({ ...s, color: CHART_COLORS[i] }));

  const handleExport = () => {
    const rows = [
      ['DIU Admin — Dashboard Export', range],
      [],
      ['KPI', 'Value', 'Change %'],
      ...KPIS.map((k) => [k.label, k.value, `${k.up ? '+' : ''}${k.delta}`]),
      [],
      ['Traffic Source', 'Visitors', 'Share %'],
      ...VISITOR_SOURCES.map((s) => [s.name, s.value, s.pct]),
    ];
    downloadCsv(`diu-dashboard-${new Date().toISOString().slice(0, 10)}.csv`, rows);
    toast.success('Report exported as CSV');
  };

  return (
    <div className="flex min-h-full">
      {/* Left — main content */}
      <div className="flex-1 min-w-0 p-4 sm:p-5 lg:p-6 space-y-5">
        {/* Sub-bar */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-1.5 px-2.5 h-7 rounded-full text-[12px] font-semibold"
                style={{ backgroundColor: 'rgba(52,211,153,0.12)', color: T.up }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: T.up }} />Live
          </span>
          <span className="text-[13px] hidden sm:inline" style={{ color: T.textDim }}>Your website &amp; apps data in real-time</span>
          <div className="ml-auto flex items-center gap-2">
            <Dropdown
              width={170}
              trigger={() => (
                <button className="flex items-center gap-1.5 px-3 h-9 rounded-lg text-[12px] font-medium"
                        style={{ backgroundColor: T.card, color: T.textDim, border: `1px solid ${T.border}` }}>
                  <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                  <span className="hidden sm:inline">{range}</span>
                  <span className="material-symbols-outlined text-[16px]">expand_more</span>
                </button>
              )}
            >
              {({ close }) => (
                <div className="py-1">
                  {RANGES.map((r) => (
                    <button key={r} onClick={() => { setRange(r); close(); toast.info(`Range: ${r}`); }}
                            className="w-full text-left px-3 py-2 text-[13px] hover:bg-white/5"
                            style={{ color: r === range ? T.accent : T.text }}>{r}</button>
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

        {/* Demo-data banner */}
        <div className="flex items-start gap-2 px-3 py-2 rounded-lg text-[12px]"
             style={{ backgroundColor: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', color: '#FBBF24' }}>
          <span className="material-symbols-outlined text-[16px] flex-shrink-0">info</span>
          <span>Showing demo data — these widgets connect to live analytics in Phase 2 (event pipeline + PostHog/Clarity).</span>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
          {KPIS.map((k) => <KpiCard key={k.id} {...k} />)}
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <Panel title="Visitors by Source" subtitle="Where your visitors come from"
                 action={<SelectPill value={sourcePeriod} onChange={setSourcePeriod} />}>
            <DonutWithLegend data={sources} centerValue="12.6K" centerLabel="Total Visitors" />
          </Panel>

          <Panel title="Active Users (Real Time)" subtitle="Currently active users on your site"
                 action={<button onClick={() => navigate('/admin/realtime')} className="text-[12px] font-semibold" style={{ color: T.accent }}>View All</button>}>
            <p className="text-[28px] font-extrabold" style={{ color: T.text }}>126</p>
            <RealtimeArea data={REALTIME_SERIES} />
            <DeviceBars items={DEVICE_BREAKDOWN} />
          </Panel>

          <Panel title="Top Pages" subtitle="By page views"
                 action={<SelectPill value={pagesPeriod} onChange={setPagesPeriod} />}>
            <TopPagesList pages={TOP_PAGES} />
          </Panel>
        </div>

        {/* Row 3 */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <Panel title="User Journey" subtitle="See how users navigate your site"
                 action={<SelectPill value={journeyPeriod} onChange={setJourneyPeriod} />}>
            <FunnelChart stages={FUNNEL} />
          </Panel>

          <Panel title="Device Analytics" subtitle="By device type">
            <DonutWithLegend data={DEVICE_ANALYTICS} centerValue="12.6K" centerLabel="Total" />
          </Panel>

          <Panel title="AI Prediction Overview" subtitle="AI insights for your leads">
            <GaugeChart score={AI_LEADS.score} high={AI_LEADS.high} medium={AI_LEADS.medium} low={AI_LEADS.low} />
          </Panel>
        </div>

        <p className="text-[11px] pt-2" style={{ color: T.textFaint }}>© 2026 DIU Admission Portal · Admin Intelligence</p>
      </div>

      {/* Right — live activity rail */}
      <aside className="hidden xl:block w-80 flex-shrink-0 border-l p-4 sticky top-0 self-start"
             style={{ borderColor: T.border, height: 'calc(100vh - 4rem)' }}>
        <ActivityFeed items={ACTIVITY_FEED} onViewAll={() => navigate('/admin/events')} />
      </aside>
    </div>
  );
}
