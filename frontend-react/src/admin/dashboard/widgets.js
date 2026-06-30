import {
  ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell,
  RadialBarChart, RadialBar,
} from 'recharts';
import { T } from '../theme';
import Dropdown from '../components/Dropdown';

const fmt = (n) => (n >= 1000 ? `${(n / 1000).toFixed(1)}K` : `${n}`);

// ── Generic panel surface ─────────────────────────────────────────────────────
export function Panel({ title, subtitle, action, className = '', children }) {
  return (
    <div className={`rounded-2xl p-5 flex flex-col adm-card-shadow ${className}`}
         style={{ backgroundColor: T.card, border: `1px solid ${T.border}` }}>
      {(title || action) && (
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            {title && <h3 className="text-[15px] font-bold truncate" style={{ color: T.text }}>{title}</h3>}
            {subtitle && <p className="text-[12px] mt-0.5 truncate" style={{ color: T.textDim }}>{subtitle}</p>}
          </div>
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
      )}
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

// ── Functional dropdown pill (replaces the old static "This Week") ─────────────
export function SelectPill({ value = 'This Week', options = ['Today', 'This Week', 'This Month', 'This Year'], onChange }) {
  return (
    <Dropdown
      width={170}
      trigger={() => (
        <button className="flex items-center gap-1 px-3 h-8 rounded-lg text-[12px] font-medium"
                style={{ backgroundColor: T.bg, color: T.textDim, border: `1px solid ${T.border}` }}>
          {value}<span className="material-symbols-outlined text-[16px]">expand_more</span>
        </button>
      )}
    >
      {({ close }) => (
        <div className="py-1">
          {options.map((opt) => (
            <button key={opt} onClick={() => { onChange?.(opt); close(); }}
                    className="w-full text-left px-3 py-2 text-[13px] hover:bg-white/5"
                    style={{ color: opt === value ? T.accent : T.text }}>
              {opt}
            </button>
          ))}
        </div>
      )}
    </Dropdown>
  );
}

// ── KPI card with sparkline ───────────────────────────────────────────────────
export function KpiCard({ label, value, delta, up, color, data, live, subtitle, hideDelta }) {
  const gid = `spark-${label.replace(/\W/g, '')}`;
  return (
    <div className="rounded-2xl p-4 min-w-0 adm-card-shadow" style={{ backgroundColor: T.card, border: `1px solid ${T.border}` }}>
      <p className="text-[12px] font-medium mb-2 truncate flex items-center gap-1.5" style={{ color: T.textDim }}>
        {live && <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: T.up }} title="Live data" />}
        {label}
      </p>
      <div className="flex flex-wrap items-end gap-x-2 gap-y-0.5">
        <span className="text-[24px] font-extrabold leading-none" style={{ color: T.text }}>{value}</span>
        {!hideDelta && (
          <span className="flex items-center text-[12px] font-bold mb-0.5" style={{ color: up ? T.up : T.down }}>
            <span className="material-symbols-outlined text-[15px]">{up ? 'trending_up' : 'trending_down'}</span>
            {Math.abs(delta)}%
          </span>
        )}
      </div>
      <p className="text-[11px] mt-1 truncate" style={{ color: T.textFaint }}>{subtitle || 'last 7 days'}</p>
      {data && data.length > 0 && (
        <div className="h-9 mt-2 -mx-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 4, right: 2, left: 2, bottom: 0 }}>
              <defs>
                <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="y" stroke={color} strokeWidth={2} fill={`url(#${gid})`} dot={false} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

// ── Donut + legend (responsive, no overflow) ──────────────────────────────────
function NoData({ label = 'No data yet' }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <span className="material-symbols-outlined text-[28px]" style={{ color: T.textFaint }}>bar_chart_4_bars</span>
      <p className="text-[12px] mt-1" style={{ color: T.textFaint }}>{label}</p>
    </div>
  );
}

export function DonutWithLegend({ data, centerValue, centerLabel }) {
  if (!data || data.length === 0) return <NoData />;
  return (
    <div className="flex flex-col sm:flex-row items-center gap-5">
      <div className="relative w-40 h-40 flex-shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" innerRadius="68%" outerRadius="100%" paddingAngle={2} stroke="none" isAnimationActive={false}>
              {data.map((d, i) => <Cell key={i} fill={d.color} />)}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[20px] font-extrabold" style={{ color: T.text }}>{centerValue}</span>
          <span className="text-[11px]" style={{ color: T.textDim }}>{centerLabel}</span>
        </div>
      </div>
      <ul className="w-full min-w-0 flex-1 space-y-2">
        {data.map((it) => (
          <li key={it.name} className="flex items-center gap-2 text-[13px] min-w-0">
            <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: it.color }} />
            <span className="truncate min-w-0 flex-1" style={{ color: T.textDim }}>{it.name}</span>
            <span className="font-semibold flex-shrink-0" style={{ color: T.text }}>{fmt(it.value)}</span>
            <span className="w-11 text-right flex-shrink-0 text-[12px]" style={{ color: T.textFaint }}>{it.pct}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Realtime area + device bars ───────────────────────────────────────────────
export function RealtimeArea({ data }) {
  return (
    <div className="h-28">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 6, right: 4, left: 4, bottom: 0 }}>
          <defs>
            <linearGradient id="rt" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#34D399" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#34D399" stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="users" stroke="#34D399" strokeWidth={2} fill="url(#rt)" dot={false} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DeviceBars({ items }) {
  return (
    <div className="space-y-3 mt-3">
      {items.map((d) => (
        <div key={d.name}>
          <div className="flex items-center justify-between text-[12px] mb-1 gap-2">
            <span className="flex items-center gap-1.5 min-w-0" style={{ color: T.textDim }}>
              <span className="material-symbols-outlined text-[15px]">
                {d.name === 'Desktop' ? 'desktop_windows' : d.name === 'Mobile' ? 'smartphone' : 'tablet'}
              </span>
              <span className="truncate">{d.name}</span>
            </span>
            <span className="flex-shrink-0" style={{ color: T.text }}>
              <span className="font-semibold">{d.value}</span> <span style={{ color: T.textFaint }}>{d.pct}%</span>
            </span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: T.track }}>
            <div className="h-full rounded-full" style={{ width: `${d.pct}%`, backgroundColor: d.color }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Top pages bar list ────────────────────────────────────────────────────────
export function TopPagesList({ pages }) {
  if (!pages || pages.length === 0) return <NoData label="No page views yet" />;
  const max = Math.max(...pages.map((p) => p.views));
  return (
    <div className="space-y-2.5">
      {pages.map((p, i) => (
        <div key={p.path} className="flex items-center gap-2.5 text-[13px] min-w-0">
          <span className="w-4 text-right font-semibold flex-shrink-0" style={{ color: T.textFaint }}>{i + 1}</span>
          <span className="w-20 sm:w-24 truncate flex-shrink-0" style={{ color: T.textDim }} title={p.path}>{p.path}</span>
          <div className="flex-1 min-w-0 h-2 rounded-full overflow-hidden" style={{ backgroundColor: T.track }}>
            <div className="h-full rounded-full" style={{ width: `${(p.views / max) * 100}%`, background: 'linear-gradient(90deg,#6366F1,#22D3EE)' }} />
          </div>
          <span className="w-11 text-right font-semibold flex-shrink-0" style={{ color: T.text }}>{fmt(p.views)}</span>
        </div>
      ))}
    </div>
  );
}

// ── User-journey funnel (horizontal — robust to long labels) ──────────────────
export function FunnelChart({ stages }) {
  if (!stages || stages.length === 0) return <NoData label="No funnel data yet" />;
  const max = stages[0].value || 1;
  return (
    <div className="space-y-2.5">
      {stages.map((s, i) => {
        const pct = (s.value / max) * 100;
        const drop = i > 0 ? Math.round((1 - s.value / stages[i - 1].value) * 100) : null;
        return (
          <div key={s.stage} className="flex items-center gap-2.5 text-[13px] min-w-0">
            <span className="w-24 sm:w-28 truncate flex-shrink-0" style={{ color: T.textDim }} title={s.stage}>{s.stage}</span>
            <div className="flex-1 min-w-0 h-6 rounded-md overflow-hidden relative" style={{ backgroundColor: T.track }}>
              <div className="h-full rounded-md flex items-center px-2" style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#6366F1,#3B82F6)', minWidth: 36 }}>
                <span className="text-[11px] font-bold text-white">{fmt(s.value)}</span>
              </div>
            </div>
            <span className="w-12 text-right flex-shrink-0 text-[11px]" style={{ color: drop ? T.down : T.textFaint }}>
              {drop !== null ? `↓${drop}%` : '—'}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── AI prediction radial gauge ────────────────────────────────────────────────
export function GaugeChart({ score, high, medium, low }) {
  const data = [{ value: score, fill: '#34D399' }];
  return (
    <div>
      <div className="relative h-36">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart innerRadius="72%" outerRadius="100%" data={data} startAngle={220} endAngle={-40}>
            <RadialBar dataKey="value" cornerRadius={10} background={{ fill: 'rgba(148,163,184,0.16)' }} isAnimationActive={false} domain={[0, 100]} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[24px] font-extrabold leading-none" style={{ color: T.text }}>{score}%</span>
          <span className="text-[10px] text-center mt-1 leading-tight" style={{ color: T.textDim }}>High Quality<br />Leads</span>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 mt-3 text-center">
        {[{ l: 'High', v: high, c: '#34D399' }, { l: 'Medium', v: medium, c: '#FBBF24' }, { l: 'Low', v: low, c: '#FB7185' }].map((x) => (
          <div key={x.l}>
            <p className="text-[16px] font-extrabold" style={{ color: T.text }}>{fmt(x.v)}</p>
            <p className="text-[11px] flex items-center gap-1 justify-center" style={{ color: T.textDim }}>
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: x.c }} />{x.l}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Live activity feed ────────────────────────────────────────────────────────
export function ActivityFeed({ items, onViewAll }) {
  return (
    <div className="rounded-2xl flex flex-col h-full adm-card-shadow" style={{ backgroundColor: T.card, border: `1px solid ${T.border}` }}>
      <div className="p-5 pb-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full animate-pulse flex-shrink-0" style={{ backgroundColor: T.up }} />
          <h3 className="text-[15px] font-bold" style={{ color: T.text }}>Live Activity Feed</h3>
        </div>
        <p className="text-[12px] mt-0.5" style={{ color: T.textDim }}>Real-time user activities</p>
      </div>
      <div className="flex-1 overflow-y-auto px-5 space-y-4 min-h-0">
        {(!items || items.length === 0) && (
          <p className="text-[12px] text-center py-6" style={{ color: T.textFaint }}>
            No recent activity yet. Captured leads and applications appear here.
          </p>
        )}
        {(items || []).map((a) => (
          <div key={a.id} className="flex gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${a.tint}22` }}>
              <span className="material-symbols-outlined text-[18px]" style={{ color: a.tint }}>{a.icon}</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <p className="text-[13px] font-semibold truncate" style={{ color: T.text }}>{a.title}</p>
                <span className="text-[11px] whitespace-nowrap flex-shrink-0" style={{ color: T.textFaint }}>{a.time}</span>
              </div>
              <p className="text-[12px] truncate" style={{ color: a.title.includes('visitor') ? T.accent : T.textDim }}>{a.sub}</p>
              {a.meta && <p className="text-[11px] truncate" style={{ color: T.textFaint }}>{a.meta}</p>}
            </div>
          </div>
        ))}
      </div>
      <div className="p-4 flex-shrink-0">
        <button onClick={onViewAll} className="w-full py-2.5 rounded-lg text-[13px] font-semibold hover:opacity-80 transition-opacity"
                style={{ backgroundColor: T.bg, color: T.text, border: `1px solid ${T.border}` }}>
          View All Activities
        </button>
      </div>
    </div>
  );
}
