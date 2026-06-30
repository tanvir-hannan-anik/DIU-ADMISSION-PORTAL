import { useEffect, useState } from 'react';
import adminApi from '../adminApi';
import { T, CHART_COLORS } from '../theme';
import { Panel } from '../dashboard/widgets';

const fmt = (n) => (n >= 1000 ? `${(n / 1000).toFixed(1)}K` : `${n ?? 0}`);

// Admin Chat Analytics — fed by the chat_logs the frontend writes after each
// chatbot exchange (see services/aiService.js).
export default function ChatAnalyticsPage() {
  const [s, setS] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.get('/v1/admin/chat/stats')
      .then((r) => setS(r.data.data))
      .catch(() => setS(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6 text-[13px]" style={{ color: T.textFaint }}>Loading…</div>;

  if (!s || s.totalChats === 0) {
    return (
      <div className="p-4 sm:p-6">
        <div className="rounded-2xl p-10 text-center" style={{ backgroundColor: T.card, border: `1px dashed ${T.borderStrong}` }}>
          <span className="material-symbols-outlined text-4xl" style={{ color: T.accent }}>forum</span>
          <p className="text-[15px] font-bold mt-2" style={{ color: T.text }}>No chat data yet</p>
          <p className="text-[13px] mt-2 max-w-md mx-auto" style={{ color: T.textDim }}>
            Conversation logging is live. As soon as visitors use the chatbot, Smart Advisor, or
            Smart Proctor, this fills with volume, answered-rate, response times, and unanswered questions.
          </p>
        </div>
      </div>
    );
  }

  const daily = Object.entries(s.dailyVolume || {});
  const maxDaily = Math.max(1, ...daily.map(([, v]) => v));
  const modules = Object.entries(s.byModule || {});
  const maxMod = Math.max(1, ...modules.map(([, v]) => v));
  const topQ = Object.entries(s.topQuestions || {});

  const kpis = [
    { label: 'Total Chats', value: fmt(s.totalChats), icon: 'forum', c: '#6366F1' },
    { label: 'Last 7 Days', value: fmt(s.chatsLast7Days), icon: 'calendar_month', c: '#A78BFA' },
    { label: 'Answered Rate', value: `${s.answeredRate}%`, icon: 'task_alt', c: '#34D399' },
    { label: 'Avg Response', value: `${(s.avgResponseMs / 1000).toFixed(1)}s`, icon: 'timer', c: '#22D3EE' },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-2xl p-4" style={{ backgroundColor: T.card, border: `1px solid ${T.border}` }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-[18px]" style={{ color: k.c }}>{k.icon}</span>
              <p className="text-[12px] font-medium" style={{ color: T.textDim }}>{k.label}</p>
            </div>
            <p className="text-[26px] font-extrabold" style={{ color: T.text }}>{k.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Panel title="Chat Volume" subtitle="Conversations per day (last 7 days)">
          <div className="flex items-end gap-2 h-40 pt-2">
            {daily.map(([day, v], i) => (
              <div key={day} className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
                <span className="text-[11px] font-bold" style={{ color: T.textDim }}>{v}</span>
                <div className="w-full rounded-t-md" style={{ height: `${(v / maxDaily) * 100}%`, minHeight: 4, backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                <span className="text-[10px] truncate w-full text-center" style={{ color: T.textFaint }}>{day}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="By Assistant" subtitle="Which AI feature is used most">
          <div className="space-y-3">
            {modules.map(([name, v], i) => (
              <div key={name}>
                <div className="flex items-center justify-between text-[12px] mb-1">
                  <span className="capitalize" style={{ color: T.textDim }}>{name.replace(/-/g, ' ')}</span>
                  <span className="font-semibold" style={{ color: T.text }}>{fmt(v)}</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: T.track }}>
                  <div className="h-full rounded-full" style={{ width: `${(v / maxMod) * 100}%`, backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Panel title="Top Questions" subtitle="Most frequently asked">
          {topQ.length ? (
            <ol className="space-y-2">
              {topQ.map(([q, count], i) => (
                <li key={q} className="flex items-start gap-2.5 text-[13px]">
                  <span className="w-5 text-right font-bold flex-shrink-0" style={{ color: T.textFaint }}>{i + 1}</span>
                  <span className="flex-1 min-w-0" style={{ color: T.text }}>{q}</span>
                  <span className="font-bold flex-shrink-0" style={{ color: T.accent }}>×{count}</span>
                </li>
              ))}
            </ol>
          ) : <p className="text-[13px]" style={{ color: T.textFaint }}>No repeated questions yet.</p>}
        </Panel>

        <Panel title="Unanswered Questions" subtitle="Where the knowledge base needs improvement">
          {(s.recentUnanswered || []).length ? (
            <ul className="space-y-2.5">
              {s.recentUnanswered.map((u, i) => (
                <li key={i} className="flex items-start gap-2 text-[13px]">
                  <span className="material-symbols-outlined text-[16px] mt-0.5 flex-shrink-0" style={{ color: T.down }}>help</span>
                  <div className="min-w-0">
                    <p className="truncate" style={{ color: T.text }}>{u.question || '—'}</p>
                    <p className="text-[11px]" style={{ color: T.textFaint }}>
                      {u.moduleType} · {u.createdAt ? new Date(u.createdAt).toLocaleString() : ''}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : <p className="text-[13px]" style={{ color: T.textFaint }}>None — every question got an answer. 🎉</p>}
        </Panel>
      </div>
    </div>
  );
}
