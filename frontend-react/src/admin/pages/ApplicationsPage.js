import { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import adminApi from '../adminApi';
import { T } from '../theme';

const STATUSES = ['PENDING', 'REVIEWING', 'ADMITTED', 'REJECTED'];
const STATUS_COLOR = { PENDING: '#FBBF24', REVIEWING: '#22D3EE', ADMITTED: '#34D399', REJECTED: '#FB7185' };

export default function ApplicationsPage() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.get('/v1/admin/applications');
      setApps(res.data.data || []);
    } catch { toast.error('Failed to load applications'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const changeStatus = async (appId, status) => {
    try { await adminApi.put(`/v1/admin/applications/${appId}/status`, { status }); toast.success('Status updated'); load(); }
    catch { toast.error('Update failed'); }
  };

  const shown = filter === 'ALL' ? apps : apps.filter((a) => a.status === filter);

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="flex flex-wrap gap-2">
        {['ALL', ...STATUSES].map((s) => (
          <button key={s} onClick={() => setFilter(s)}
                  className="px-3 h-8 rounded-lg text-[12px] font-semibold"
                  style={{ backgroundColor: filter === s ? T.accent : T.card, color: filter === s ? '#fff' : T.textDim, border: `1px solid ${T.border}` }}>
            {s}
          </button>
        ))}
        <button onClick={load} className="ml-auto px-3 h-8 rounded-lg text-[12px] font-semibold flex items-center gap-1"
                style={{ backgroundColor: T.card, color: T.textDim, border: `1px solid ${T.border}` }}>
          <span className="material-symbols-outlined text-[16px]">refresh</span>Refresh
        </button>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: T.card, border: `1px solid ${T.border}` }}>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                {['App ID', 'Name', 'Email', 'Program', 'SSC', 'HSC', 'Submitted', 'Status'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider whitespace-nowrap"
                      style={{ color: T.textFaint }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center" style={{ color: T.textFaint }}>Loading…</td></tr>
              ) : shown.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center" style={{ color: T.textFaint }}>No applications found.</td></tr>
              ) : shown.map((a) => (
                <tr key={a.id} style={{ borderTop: `1px solid ${T.border}` }}>
                  <td className="px-4 py-3 font-mono text-[12px]" style={{ color: T.textDim }}>{a.appId}</td>
                  <td className="px-4 py-3 font-semibold" style={{ color: T.text }}>{a.fullName}</td>
                  <td className="px-4 py-3" style={{ color: T.textDim }}>{a.email}</td>
                  <td className="px-4 py-3" style={{ color: T.textDim }}>{a.program || '—'}</td>
                  <td className="px-4 py-3" style={{ color: T.textDim }}>{a.sscResult || '—'}</td>
                  <td className="px-4 py-3" style={{ color: T.textDim }}>{a.hscResult || '—'}</td>
                  <td className="px-4 py-3 text-[12px] whitespace-nowrap" style={{ color: T.textFaint }}>
                    {a.createdAt ? new Date(a.createdAt).toLocaleDateString() : '—'}</td>
                  <td className="px-4 py-3">
                    <select value={a.status} onChange={(e) => changeStatus(a.appId, e.target.value)}
                            className="px-2 py-1 rounded-lg text-[12px] font-semibold outline-none"
                            style={{ backgroundColor: `${STATUS_COLOR[a.status] || '#64748B'}22`, color: STATUS_COLOR[a.status] || '#64748B', border: `1px solid ${T.border}` }}>
                      {STATUSES.map((s) => <option key={s} value={s} style={{ backgroundColor: T.card, color: T.text }}>{s}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
