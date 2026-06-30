import { useEffect, useState } from 'react';
import adminApi from '../adminApi';
import { T } from '../theme';

// Connection status for every external service the portal depends on, plus where
// to configure each one. Status flags come from the backend; client-side trackers
// (PostHog snippet, Clarity) are known-on because they ship in index.html.
export default function IntegrationsPage() {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    adminApi.get('/v1/admin/integrations').then((r) => setStatus(r.data.data)).catch(() => setStatus({}));
  }, []);

  const items = [
    {
      key: 'posthog', name: 'PostHog', icon: 'insights', color: '#6366F1',
      desc: 'Visitor analytics, events & funnels (native charts in this portal).',
      on: status?.posthog,
      onText: 'Connected — dashboard charts are live.',
      offText: 'Snippet is live on the site (collecting data). Set POSTHOG_API_KEY + POSTHOG_PROJECT_ID on the API service to show it here.',
      where: 'API env vars',
    },
    {
      key: 'clarity', name: 'Microsoft Clarity', icon: 'whatshot', color: '#FBBF24',
      desc: 'Heatmaps & session replays.',
      on: true,
      onText: 'Snippet installed (project xf02utwxp6). View in the Heatmaps / Replays pages.',
      where: 'public/index.html',
    },
    {
      key: 'email', name: 'Email (SMTP)', icon: 'mail', color: '#34D399',
      desc: 'Application & admission confirmation emails.',
      on: status?.email,
      onText: 'Configured — transactional emails will send.',
      offText: 'Set MAIL_USERNAME + MAIL_PASSWORD on the API service to enable emails.',
      where: 'API env vars',
    },
    {
      key: 'aiService', name: 'AI Service (Groq RAG)', icon: 'smart_toy', color: '#22D3EE',
      desc: 'Chatbot, Smart Advisor & Smart Proctor.',
      on: status?.aiService,
      onText: 'Linked — chatbot logging feeds Chat Analytics.',
      offText: 'Set PYTHON_SERVICE_URL on the API service.',
      where: 'API env vars',
    },
    {
      key: 'database', name: 'Database (PostgreSQL)', icon: 'database', color: '#A78BFA',
      desc: 'Leads, applications, users, audit & chat logs.',
      on: status?.database,
      onText: 'Connected.',
      offText: 'Unreachable.',
      where: 'API env vars',
    },
    {
      key: 'marketing', name: 'Ad Platforms (Meta / Google Ads)', icon: 'campaign', color: '#FB7185',
      desc: 'Cost-per-lead & ROI (optional, advanced).',
      on: false,
      offText: 'Not connected. Add Meta Marketing API / Google Ads credentials to compute ROI.',
      where: 'Later phase',
    },
  ];

  return (
    <div className="p-4 sm:p-6">
      <p className="text-[13px] mb-4" style={{ color: T.textDim }}>
        Status of the services that power this portal. Secrets live in environment variables on the
        API service (Render) — never in the codebase.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {items.map((it) => (
          <div key={it.key} className="rounded-2xl p-4 flex gap-3" style={{ backgroundColor: T.card, border: `1px solid ${T.border}` }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${it.color}22` }}>
              <span className="material-symbols-outlined" style={{ color: it.color }}>{it.icon}</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[14px] font-bold" style={{ color: T.text }}>{it.name}</p>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0"
                      style={{ backgroundColor: it.on ? 'rgba(52,211,153,0.15)' : 'rgba(148,163,184,0.15)', color: it.on ? T.up : T.textFaint }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: it.on ? T.up : T.textFaint }} />
                  {it.on ? 'Connected' : 'Not set'}
                </span>
              </div>
              <p className="text-[12px] mt-0.5" style={{ color: T.textDim }}>{it.desc}</p>
              <p className="text-[12px] mt-2" style={{ color: it.on ? T.up : T.textFaint }}>
                {it.on ? it.onText : it.offText}
              </p>
              <p className="text-[11px] mt-1.5" style={{ color: T.textFaint }}>
                <span className="material-symbols-outlined text-[13px] align-middle">tune</span> {it.where}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
