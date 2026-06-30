import { useEffect, useState } from 'react';
import { analyticsApi } from '../analyticsApi';
import { T, CHART_COLORS } from '../theme';
import { Panel, DonutWithLegend, TopPagesList, FunnelChart } from '../dashboard/widgets';

const CLARITY_PROJECT = 'xf02utwxp6';
const CLARITY_BASE = `https://clarity.microsoft.com/projects/view/${CLARITY_PROJECT}`;

// ── Shared: shown when PostHog isn't connected on the backend yet ──────────────
function NotConfigured({ what = 'Visitor analytics' }) {
  return (
    <div className="rounded-2xl p-10 text-center" style={{ backgroundColor: T.card, border: `1px dashed ${T.borderStrong}` }}>
      <span className="material-symbols-outlined text-4xl" style={{ color: T.accent }}>insights</span>
      <p className="text-[15px] font-bold mt-2" style={{ color: T.text }}>{what} not connected yet</p>
      <p className="text-[13px] mt-2 max-w-md mx-auto leading-relaxed" style={{ color: T.textDim }}>
        The PostHog snippet is already live on your public site, so data is being collected.
        To show it here, set <b>POSTHOG_API_KEY</b> and <b>POSTHOG_PROJECT_ID</b> on the API service
        (a secret Personal API Key from PostHog → Settings).
      </p>
      <a href="https://us.posthog.com" target="_blank" rel="noreferrer"
         className="inline-flex items-center gap-1.5 mt-4 px-4 h-9 rounded-lg text-[12px] font-bold text-white"
         style={{ backgroundColor: T.accent }}>
        <span className="material-symbols-outlined text-[16px]">open_in_new</span>Open PostHog
      </a>
    </div>
  );
}

function RangeBar({ days, setDays, loading }) {
  const OPTS = [{ d: 1, l: 'Today' }, { d: 7, l: '7 days' }, { d: 30, l: '30 days' }, { d: 90, l: '90 days' }];
  return (
    <div className="flex items-center gap-2 mb-4">
      {OPTS.map((o) => (
        <button key={o.d} onClick={() => setDays(o.d)}
                className="px-3 h-8 rounded-lg text-[12px] font-semibold"
                style={{
                  backgroundColor: days === o.d ? T.accent : T.card,
                  color: days === o.d ? '#fff' : T.textDim,
                  border: `1px solid ${T.border}`,
                }}>{o.l}</button>
      ))}
      {loading && <span className="text-[12px]" style={{ color: T.textFaint }}>Loading…</span>}
    </div>
  );
}

const withPct = (rows, key = 'value') => {
  const total = rows.reduce((s, r) => s + (r[key] || 0), 0) || 1;
  return rows.map((r, i) => ({ ...r, pct: Math.round((r[key] / total) * 1000) / 10, color: CHART_COLORS[i % CHART_COLORS.length] }));
};
const fmt = (n) => (n >= 1000 ? `${(n / 1000).toFixed(1)}K` : `${n ?? 0}`);

const fmtDur = (s) => {
  if (!s) return '0s';
  const m = Math.floor(s / 60), sec = Math.round(s % 60);
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
};

// ── Visitors (visitors, sessions, duration, bounce, devices, locations) ───────
export function VisitorsPage() {
  const [days, setDays] = useState(7);
  const [ov, setOv] = useState(null);
  const [devices, setDevices] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let on = true;
    setLoading(true);
    Promise.all([analyticsApi.overview(days), analyticsApi.devices(days), analyticsApi.locations(days)])
      .then(([o, d, l]) => {
        if (!on) return;
        setOv(o); setDevices(withPct(d.devices || [])); setLocations(withPct(l.locations || []));
        setLoading(false);
      });
    return () => { on = false; };
  }, [days]);

  if (ov && ov.configured === false) return <div className="p-4 sm:p-6"><RangeBar days={days} setDays={setDays} /><NotConfigured /></div>;

  const cards = [
    { label: 'Page Views', value: fmt(ov?.pageviews), icon: 'visibility', c: '#6366F1' },
    { label: 'Unique Visitors', value: fmt(ov?.uniqueVisitors), icon: 'group', c: '#A78BFA' },
    { label: 'Sessions', value: fmt(ov?.sessions), icon: 'timeline', c: '#34D399' },
    { label: 'Active Now', value: fmt(ov?.activeNow), icon: 'sensors', c: '#22D3EE' },
    { label: 'Avg Session', value: fmtDur(ov?.avgSessionSeconds), icon: 'timer', c: '#FBBF24' },
    { label: 'Bounce Rate', value: `${ov?.bounceRate ?? 0}%`, icon: 'call_missed_outgoing', c: '#FB7185' },
  ];

  return (
    <div className="p-4 sm:p-6">
      <RangeBar days={days} setDays={setDays} loading={loading} />
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4 mb-5">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl p-4" style={{ backgroundColor: T.card, border: `1px solid ${T.border}` }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-[18px]" style={{ color: c.c }}>{c.icon}</span>
              <p className="text-[12px] font-medium" style={{ color: T.textDim }}>{c.label}</p>
            </div>
            <p className="text-[22px] font-extrabold" style={{ color: T.text }}>{c.value}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Panel title="Device Breakdown" subtitle="Unique visitors by device type">
          {devices.length ? <DonutWithLegend data={devices} centerValue={fmt(ov?.uniqueVisitors)} centerLabel="Visitors" />
            : <p className="text-[13px]" style={{ color: T.textFaint }}>No device data for this range yet.</p>}
        </Panel>
        <Panel title="Visitor Locations" subtitle="Top countries by visitors">
          {locations.length ? (
            <ul className="space-y-2.5">
              {locations.map((l, i) => (
                <li key={l.name} className="flex items-center gap-2.5 text-[13px] min-w-0">
                  <span className="w-5 text-right font-bold flex-shrink-0" style={{ color: T.textFaint }}>{i + 1}</span>
                  <span className="flex-1 truncate" style={{ color: T.text }}>{l.name}</span>
                  <span className="font-semibold flex-shrink-0" style={{ color: T.text }}>{fmt(l.value)}</span>
                  <span className="w-11 text-right text-[12px] flex-shrink-0" style={{ color: T.textFaint }}>{l.pct}%</span>
                </li>
              ))}
            </ul>
          ) : <p className="text-[13px]" style={{ color: T.textFaint }}>No location data yet (PostHog GeoIP fills this automatically).</p>}
        </Panel>
      </div>
    </div>
  );
}

// ── Traffic sources ─────────────────────────────────────────────────────────
export function TrafficPage() {
  const [days, setDays] = useState(7);
  const [rows, setRows] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let on = true; setLoading(true);
    analyticsApi.traffic(days).then((r) => { if (!on) return; setRows(r); setLoading(false); });
    return () => { on = false; };
  }, [days]);

  if (rows && rows.configured === false) return <div className="p-4 sm:p-6"><RangeBar days={days} setDays={setDays} /><NotConfigured what="Traffic sources" /></div>;
  const data = withPct(rows?.sources || []);
  const total = (rows?.sources || []).reduce((s, r) => s + r.value, 0);

  return (
    <div className="p-4 sm:p-6">
      <RangeBar days={days} setDays={setDays} loading={loading} />
      <Panel title="Visitors by Source" subtitle="Referring domain of each pageview">
        {data.length ? <DonutWithLegend data={data} centerValue={fmt(total)} centerLabel="Total" />
          : <p className="text-[13px]" style={{ color: T.textFaint }}>No traffic recorded yet for this range.</p>}
      </Panel>
    </div>
  );
}

// ── Top pages ─────────────────────────────────────────────────────────────────
export function PagesPage() {
  const [days, setDays] = useState(7);
  const [rows, setRows] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let on = true; setLoading(true);
    analyticsApi.pages(days).then((r) => { if (!on) return; setRows(r); setLoading(false); });
    return () => { on = false; };
  }, [days]);

  if (rows && rows.configured === false) return <div className="p-4 sm:p-6"><RangeBar days={days} setDays={setDays} /><NotConfigured what="Page analytics" /></div>;
  const pages = rows?.pages || [];
  return (
    <div className="p-4 sm:p-6">
      <RangeBar days={days} setDays={setDays} loading={loading} />
      <Panel title="Top Pages" subtitle="Most-viewed pages on your public site">
        {pages.length ? <TopPagesList pages={pages} />
          : <p className="text-[13px]" style={{ color: T.textFaint }}>No pageviews recorded yet for this range.</p>}
      </Panel>
    </div>
  );
}

// ── Events ────────────────────────────────────────────────────────────────────
export function EventsPage() {
  const [days, setDays] = useState(7);
  const [rows, setRows] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let on = true; setLoading(true);
    analyticsApi.events(days).then((r) => { if (!on) return; setRows(r); setLoading(false); });
    return () => { on = false; };
  }, [days]);

  if (rows && rows.configured === false) return <div className="p-4 sm:p-6"><RangeBar days={days} setDays={setDays} /><NotConfigured what="Event tracking" /></div>;
  const events = rows?.events || [];
  const max = Math.max(1, ...events.map((e) => e.count));
  return (
    <div className="p-4 sm:p-6">
      <RangeBar days={days} setDays={setDays} loading={loading} />
      <Panel title="Events" subtitle="Custom actions captured on the public site (Apply Now, lead captured, etc.)">
        {events.length ? (
          <div className="space-y-2.5">
            {events.map((e, i) => (
              <div key={e.name} className="flex items-center gap-2.5 text-[13px] min-w-0">
                <span className="w-40 truncate flex-shrink-0 font-mono text-[12px]" style={{ color: T.textDim }} title={e.name}>{e.name}</span>
                <div className="flex-1 min-w-0 h-2 rounded-full overflow-hidden" style={{ backgroundColor: T.track }}>
                  <div className="h-full rounded-full" style={{ width: `${(e.count / max) * 100}%`, backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                </div>
                <span className="w-12 text-right font-semibold flex-shrink-0" style={{ color: T.text }}>{fmt(e.count)}</span>
              </div>
            ))}
          </div>
        ) : <p className="text-[13px]" style={{ color: T.textFaint }}>No events recorded yet for this range.</p>}
      </Panel>
    </div>
  );
}

// ── Funnels / Journey (same data, different framing) ──────────────────────────
function FunnelView({ subtitle }) {
  const [days, setDays] = useState(30);
  const [rows, setRows] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let on = true; setLoading(true);
    analyticsApi.funnel(days).then((r) => { if (!on) return; setRows(r); setLoading(false); });
    return () => { on = false; };
  }, [days]);

  if (rows && rows.configured === false) return <div className="p-4 sm:p-6"><RangeBar days={days} setDays={setDays} /><NotConfigured what="Funnel analysis" /></div>;
  const stages = (rows?.funnel || []).filter((s) => s.value > 0);
  return (
    <div className="p-4 sm:p-6">
      <RangeBar days={days} setDays={setDays} loading={loading} />
      <Panel title="Admission Conversion Funnel" subtitle={subtitle}>
        {stages.length ? <FunnelChart stages={stages} />
          : <p className="text-[13px]" style={{ color: T.textFaint }}>
              Not enough funnel data yet — it fills as visitors fire the events (Apply Now, eligibility, lead, submitted).
            </p>}
      </Panel>
    </div>
  );
}
export function FunnelsPage() { return <FunnelView subtitle="Unique visitors reaching each step" />; }
export function JourneyPage() { return <FunnelView subtitle="How prospective students move toward applying" />; }

// ── Heatmaps & Replays (Clarity — deep link, not embeddable in an iframe) ─────
function ClarityLink({ title, icon, desc, path }) {
  return (
    <div className="p-4 sm:p-6">
      <div className="rounded-2xl p-10 text-center" style={{ backgroundColor: T.card, border: `1px solid ${T.border}` }}>
        <span className="material-symbols-outlined text-4xl" style={{ color: T.accent }}>{icon}</span>
        <p className="text-[16px] font-bold mt-2" style={{ color: T.text }}>{title}</p>
        <p className="text-[13px] mt-2 max-w-md mx-auto leading-relaxed" style={{ color: T.textDim }}>{desc}</p>
        <a href={`${CLARITY_BASE}/${path}`} target="_blank" rel="noreferrer"
           className="inline-flex items-center gap-1.5 mt-4 px-4 h-10 rounded-lg text-[13px] font-bold text-white"
           style={{ backgroundColor: T.accent }}>
          <span className="material-symbols-outlined text-[18px]">open_in_new</span>Open in Microsoft Clarity
        </a>
        <div className="mt-4 text-left max-w-md mx-auto text-[11px] space-y-1" style={{ color: T.textFaint }}>
          <p>• Clarity is <b>already installed</b> (project <code>{CLARITY_PROJECT}</code>) and recording live sessions.</p>
          <p>• Microsoft blocks embedding its dashboards in an iframe, so this button opens your project directly.</p>
          <p>• Data appears after the site is <b>deployed</b> with the snippet and gets real traffic — first recordings can take up to a couple of hours.</p>
        </div>
      </div>
    </div>
  );
}
export function HeatmapsPage() {
  return <ClarityLink title="Heatmaps" icon="whatshot" path="heatmaps"
    desc="Click, scroll, and area heatmaps for every public page — see exactly where prospective students focus and where they drop off." />;
}
export function ReplaysPage() {
  return <ClarityLink title="Session Replays" icon="smart_display" path="recordings"
    desc="Watch real recordings of visitor sessions on your site to understand friction in the admission journey." />;
}

// ── Real-time ─────────────────────────────────────────────────────────────────
export function RealtimePage() {
  const [active, setActive] = useState(null);
  const [configured, setConfigured] = useState(true);
  useEffect(() => {
    let on = true;
    const tick = () => analyticsApi.realtime().then((r) => {
      if (!on) return;
      setConfigured(r.configured !== false);
      setActive(r.activeNow ?? 0);
    });
    tick();
    const id = setInterval(tick, 15000); // poll — no WebSocket needed for a dashboard
    return () => { on = false; clearInterval(id); };
  }, []);

  if (!configured) return <div className="p-4 sm:p-6"><NotConfigured what="Real-time analytics" /></div>;
  return (
    <div className="p-4 sm:p-6">
      <div className="rounded-2xl p-10 text-center" style={{ backgroundColor: T.card, border: `1px solid ${T.border}` }}>
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: T.up }} />
          <span className="text-[13px] font-semibold" style={{ color: T.up }}>Live · updates every 15s</span>
        </div>
        <p className="text-[64px] font-extrabold leading-none" style={{ color: T.text }}>{active ?? '…'}</p>
        <p className="text-[14px] mt-2" style={{ color: T.textDim }}>visitors active on your site right now (last 30 min)</p>
      </div>
    </div>
  );
}
