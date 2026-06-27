import { useEffect, useState } from 'react';
import adminApi from '../adminApi';
import { T } from '../theme';

const ACTION_STYLES = {
  LOGIN_SUCCESS: { bg: 'rgba(52,211,153,0.12)', fg: '#34D399' },
  LOGIN_FAILURE: { bg: 'rgba(251,113,133,0.12)', fg: '#FB7185' },
  LOGIN_LOCKED:  { bg: 'rgba(251,191,36,0.12)', fg: '#FBBF24' },
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await adminApi.get('/v1/admin/audit-logs', { params: { page: 0, size: 100 } });
        if (active) setLogs(res.data.data.content || []);
      } catch {
        if (active) setError('Could not load audit logs.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  return (
    <div className="p-6 space-y-5">
      {loading && <p className="text-[13px]" style={{ color: T.textDim }}>Loading…</p>}
      {error && <p className="text-[13px]" style={{ color: T.down }}>{error}</p>}

      {!loading && !error && (
        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: T.card, border: `1px solid ${T.border}` }}>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                  {['Time', 'Email', 'Action', 'Detail', 'IP'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider"
                        style={{ color: T.textFaint }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-12 text-center" style={{ color: T.textFaint }}>No audit events yet.</td></tr>
                ) : logs.map((log) => {
                  const s = ACTION_STYLES[log.action] || { bg: 'rgba(148,163,184,0.12)', fg: T.textDim };
                  return (
                    <tr key={log.id} style={{ borderTop: `1px solid ${T.border}` }}>
                      <td className="px-4 py-3 whitespace-nowrap" style={{ color: T.textDim }}>
                        {log.createdAt ? new Date(log.createdAt).toLocaleString() : '-'}
                      </td>
                      <td className="px-4 py-3" style={{ color: T.text }}>{log.email || '-'}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold"
                              style={{ backgroundColor: s.bg, color: s.fg }}>{log.action}</span>
                      </td>
                      <td className="px-4 py-3" style={{ color: T.textDim }}>{log.detail || '-'}</td>
                      <td className="px-4 py-3 font-mono text-[12px]" style={{ color: T.textFaint }}>{log.ipAddress || '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
