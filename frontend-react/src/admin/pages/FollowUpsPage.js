import { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import adminApi from '../adminApi';
import { T } from '../theme';

const BUCKETS = [
  { key: 'OVERDUE', label: 'Overdue', color: '#FB7185', icon: 'warning' },
  { key: 'TODAY', label: 'Due Today', color: '#FBBF24', icon: 'today' },
  { key: 'UPCOMING', label: 'Upcoming', color: '#34D399', icon: 'event_upcoming' },
];

// Follow Ups: every lead with a scheduled next-contact date, bucketed by urgency.
export default function FollowUpsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.get('/v1/admin/followups');
      setRows(res.data.data || []);
    } catch { toast.error('Failed to load follow-ups'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const complete = async (id) => {
    try {
      await adminApi.post(`/v1/admin/leads/${id}/followup/complete`, { outcome: 'Done' });
      toast.success('Follow-up completed');
      load();
    } catch { toast.error('Failed'); }
  };

  const byBucket = (b) => rows.filter((r) => r.bucket === b);

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-[13px]" style={{ color: T.textDim }}>
          Schedule follow-ups from any lead's detail drawer. {loading && '· Loading…'}
        </p>
        <button onClick={load} className="px-3 h-8 rounded-lg text-[12px] font-semibold flex items-center gap-1"
                style={{ backgroundColor: T.card, color: T.textDim, border: `1px solid ${T.border}` }}>
          <span className="material-symbols-outlined text-[16px]">refresh</span>Refresh
        </button>
      </div>

      {!loading && rows.length === 0 && (
        <div className="rounded-2xl p-10 text-center" style={{ backgroundColor: T.card, border: `1px dashed ${T.borderStrong}` }}>
          <span className="material-symbols-outlined text-4xl" style={{ color: T.textFaint }}>event_available</span>
          <p className="text-[14px] font-bold mt-2" style={{ color: T.text }}>No follow-ups scheduled</p>
          <p className="text-[12px] mt-1" style={{ color: T.textDim }}>
            Open a lead in the Leads page and use “Schedule follow-up” to add one.
          </p>
        </div>
      )}

      {BUCKETS.map((bk) => {
        const items = byBucket(bk.key);
        if (items.length === 0) return null;
        return (
          <div key={bk.key}>
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-[18px]" style={{ color: bk.color }}>{bk.icon}</span>
              <h3 className="text-[14px] font-bold" style={{ color: T.text }}>{bk.label}</h3>
              <span className="text-[11px] font-bold px-1.5 rounded" style={{ backgroundColor: `${bk.color}22`, color: bk.color }}>
                {items.length}
              </span>
            </div>
            <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: T.card, border: `1px solid ${T.border}` }}>
              {items.map(({ lead }) => (
                <div key={lead.id} className="flex items-center gap-4 px-4 py-3" style={{ borderTop: `1px solid ${T.border}` }}>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold truncate" style={{ color: T.text }}>{lead.name || lead.email}</p>
                    <p className="text-[12px] truncate" style={{ color: T.textDim }}>
                      {lead.email}{lead.phone ? ` · ${lead.phone}` : ''}{lead.interestedProgram ? ` · ${lead.interestedProgram}` : ''}
                    </p>
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="text-[11px] uppercase font-bold" style={{ color: T.textFaint }}>Due</p>
                    <p className="text-[12px]" style={{ color: bk.color }}>
                      {lead.nextFollowUpAt ? new Date(lead.nextFollowUpAt).toLocaleString() : '—'}
                    </p>
                  </div>
                  <button onClick={() => complete(lead.id)}
                          className="px-3 h-8 rounded-lg text-[12px] font-semibold text-white flex items-center gap-1 flex-shrink-0"
                          style={{ backgroundColor: T.accent }}>
                    <span className="material-symbols-outlined text-[16px]">check</span>Done
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
