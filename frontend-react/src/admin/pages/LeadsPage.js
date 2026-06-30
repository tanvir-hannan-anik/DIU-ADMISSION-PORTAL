import { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import adminApi from '../adminApi';
import { T } from '../theme';

const STATUSES = ['NEW', 'CONTACTED', 'QUALIFIED', 'APPLICATION_STARTED', 'SUBMITTED', 'ADMITTED', 'LOST'];

const STATUS_COLOR = {
  NEW: '#6366F1', CONTACTED: '#22D3EE', QUALIFIED: '#A78BFA',
  APPLICATION_STARTED: '#FBBF24', SUBMITTED: '#3B82F6', ADMITTED: '#34D399', LOST: '#FB7185',
};

const badge = (status) => {
  const c = STATUS_COLOR[status] || '#64748B';
  return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap"
               style={{ backgroundColor: `${c}22`, color: c }}>{(status || '').replace(/_/g, ' ')}</span>;
};

export default function LeadsPage() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [counselors, setCounselors] = useState([]);
  const [selected, setSelected] = useState(null);    // detail { lead, activities }
  const [note, setNote] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.get('/v1/admin/leads', { params: { status: filter, size: 100 } });
      setLeads(res.data.data.content || []);
    } catch { toast.error('Failed to load leads'); }
    finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    adminApi.get('/v1/admin/counselors').then((r) => setCounselors(r.data.data || [])).catch(() => {});
  }, []);

  const openDetail = async (id) => {
    try {
      const res = await adminApi.get(`/v1/admin/leads/${id}`);
      setSelected(res.data.data);
      setNote('');
    } catch { toast.error('Failed to load lead'); }
  };

  const refreshDetail = (id) => openDetail(id);

  const changeStatus = async (id, status) => {
    try { await adminApi.put(`/v1/admin/leads/${id}/status`, { status }); toast.success('Status updated'); load(); refreshDetail(id); }
    catch { toast.error('Update failed'); }
  };
  const assign = async (id, counselorId) => {
    try { await adminApi.post(`/v1/admin/leads/${id}/assign`, { counselorId: counselorId || null }); toast.success('Assigned'); load(); refreshDetail(id); }
    catch { toast.error('Assign failed'); }
  };
  const addNote = async (id) => {
    if (!note.trim()) return;
    try { await adminApi.post(`/v1/admin/leads/${id}/notes`, { detail: note.trim() }); setNote(''); refreshDetail(id); }
    catch { toast.error('Note failed'); }
  };
  const scheduleFollowUp = async (id, dueAt) => {
    if (!dueAt) { toast.error('Pick a date & time'); return; }
    try { await adminApi.post(`/v1/admin/leads/${id}/followup`, { dueAt }); toast.success('Follow-up scheduled'); load(); refreshDetail(id); }
    catch { toast.error('Could not schedule'); }
  };
  const counselorName = (cid) => counselors.find((c) => c.id === cid)?.name || (cid ? `#${cid}` : '—');

  return (
    <div className="p-4 sm:p-6 space-y-5">
      {/* Filter pills */}
      <div className="flex flex-wrap gap-2">
        {['ALL', ...STATUSES].map((s) => (
          <button key={s} onClick={() => setFilter(s)}
                  className="px-3 h-8 rounded-lg text-[12px] font-semibold transition-colors"
                  style={{
                    backgroundColor: filter === s ? T.accent : T.card,
                    color: filter === s ? '#fff' : T.textDim,
                    border: `1px solid ${T.border}`,
                  }}>
            {s.replace(/_/g, ' ')}
          </button>
        ))}
        <button onClick={load} className="ml-auto px-3 h-8 rounded-lg text-[12px] font-semibold flex items-center gap-1"
                style={{ backgroundColor: T.card, color: T.textDim, border: `1px solid ${T.border}` }}>
          <span className="material-symbols-outlined text-[16px]">refresh</span>Refresh
        </button>
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: T.card, border: `1px solid ${T.border}` }}>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                {['Name', 'Email', 'Program', 'Source', 'Score', 'Status', 'Assigned', 'Created'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider whitespace-nowrap"
                      style={{ color: T.textFaint }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center" style={{ color: T.textFaint }}>Loading…</td></tr>
              ) : leads.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center" style={{ color: T.textFaint }}>
                  No leads yet. They appear when visitors submit forms or applications.</td></tr>
              ) : leads.map((l) => (
                <tr key={l.id} onClick={() => openDetail(l.id)} className="cursor-pointer hover:bg-white/5"
                    style={{ borderTop: `1px solid ${T.border}` }}>
                  <td className="px-4 py-3 font-semibold" style={{ color: T.text }}>{l.name || '—'}</td>
                  <td className="px-4 py-3" style={{ color: T.textDim }}>{l.email}</td>
                  <td className="px-4 py-3" style={{ color: T.textDim }}>{l.interestedProgram || '—'}</td>
                  <td className="px-4 py-3 text-[11px]" style={{ color: T.textFaint }}>{l.source}</td>
                  <td className="px-4 py-3"><span className="font-bold" style={{ color: T.text }}>{l.score ?? 0}</span></td>
                  <td className="px-4 py-3">{badge(l.status)}</td>
                  <td className="px-4 py-3" style={{ color: T.textDim }}>{counselorName(l.assignedCounselorId)}</td>
                  <td className="px-4 py-3 text-[12px] whitespace-nowrap" style={{ color: T.textFaint }}>
                    {l.createdAt ? new Date(l.createdAt).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail drawer */}
      {selected && (
        <LeadDrawer
          detail={selected} counselors={counselors} counselorName={counselorName}
          note={note} setNote={setNote}
          onClose={() => setSelected(null)}
          onStatus={changeStatus} onAssign={assign} onAddNote={addNote}
          onScheduleFollowUp={scheduleFollowUp}
        />
      )}
    </div>
  );
}

function LeadDrawer({ detail, counselors, counselorName, note, setNote, onClose, onStatus, onAssign, onAddNote, onScheduleFollowUp }) {
  const { lead, activities } = detail;
  const [followUp, setFollowUp] = useState('');
  const field = (label, value) => (
    <div>
      <p className="text-[11px] uppercase tracking-wider font-bold" style={{ color: T.textFaint }}>{label}</p>
      <p className="text-[14px]" style={{ color: T.text }}>{value || '—'}</p>
    </div>
  );

  return (
    <>
      <div className="fixed inset-0 z-40" style={{ backgroundColor: 'rgba(2,6,16,0.6)' }} onClick={onClose} />
      <aside className="fixed top-0 right-0 h-full w-full max-w-md z-50 overflow-y-auto p-6 space-y-5"
             style={{ backgroundColor: T.panel, borderLeft: `1px solid ${T.borderStrong}` }}>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-[20px] font-extrabold" style={{ color: T.text }}>{lead.name || lead.email}</h2>
            <p className="text-[13px]" style={{ color: T.textDim }}>{lead.email}</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-white/5">
            <span className="material-symbols-outlined" style={{ color: T.textDim }}>close</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {field('Phone', lead.phone)}
          {field('Program', lead.interestedProgram)}
          {field('Source', lead.source)}
          {field('Score', lead.score)}
          {field('Assigned', counselorName(lead.assignedCounselorId))}
          {field('Created', lead.createdAt ? new Date(lead.createdAt).toLocaleString() : '—')}
        </div>
        {lead.message && <div>{field('Message', lead.message)}</div>}

        {/* Actions */}
        <div className="space-y-3 pt-2" style={{ borderTop: `1px solid ${T.border}` }}>
          <div className="pt-3">
            <p className="text-[11px] uppercase tracking-wider font-bold mb-1.5" style={{ color: T.textFaint }}>Status</p>
            <select value={lead.status} onChange={(e) => onStatus(lead.id, e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-[13px] outline-none"
                    style={{ backgroundColor: T.bg, color: T.text, border: `1px solid ${T.border}` }}>
              {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider font-bold mb-1.5" style={{ color: T.textFaint }}>Assign counselor</p>
            <select value={lead.assignedCounselorId || ''} onChange={(e) => onAssign(lead.id, e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-[13px] outline-none"
                    style={{ backgroundColor: T.bg, color: T.text, border: `1px solid ${T.border}` }}>
              <option value="">Unassigned</option>
              {counselors.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {counselors.length === 0 && (
              <p className="text-[11px] mt-1" style={{ color: T.textFaint }}>No counselors yet — add them in Settings → Users &amp; Roles.</p>
            )}
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider font-bold mb-1.5" style={{ color: T.textFaint }}>Schedule follow-up</p>
            {lead.nextFollowUpAt && (
              <p className="text-[11px] mb-1.5" style={{ color: T.accent }}>
                Next: {new Date(lead.nextFollowUpAt).toLocaleString()}
              </p>
            )}
            <div className="flex gap-2">
              <input type="datetime-local" value={followUp} onChange={(e) => setFollowUp(e.target.value)}
                     className="flex-1 px-3 py-2 rounded-lg text-[13px] outline-none"
                     style={{ backgroundColor: T.bg, color: T.text, border: `1px solid ${T.border}` }} />
              <button onClick={() => onScheduleFollowUp(lead.id, followUp)}
                      className="px-3 rounded-lg text-[13px] font-semibold text-white" style={{ backgroundColor: T.accent }}>
                Set
              </button>
            </div>
          </div>
        </div>

        {/* Activity timeline */}
        <div className="pt-2" style={{ borderTop: `1px solid ${T.border}` }}>
          <p className="text-[13px] font-bold mb-3 pt-3" style={{ color: T.text }}>Activity</p>
          <div className="flex gap-2 mb-3">
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note…"
                   onKeyDown={(e) => e.key === 'Enter' && onAddNote(lead.id)}
                   className="flex-1 px-3 py-2 rounded-lg text-[13px] outline-none"
                   style={{ backgroundColor: T.bg, color: T.text, border: `1px solid ${T.border}` }} />
            <button onClick={() => onAddNote(lead.id)} className="px-3 rounded-lg text-[13px] font-semibold text-white"
                    style={{ backgroundColor: T.accent }}>Add</button>
          </div>
          <div className="space-y-3">
            {activities.length === 0 ? (
              <p className="text-[12px]" style={{ color: T.textFaint }}>No activity yet.</p>
            ) : activities.map((a) => (
              <div key={a.id} className="flex gap-2">
                <span className="material-symbols-outlined text-[16px] mt-0.5" style={{ color: T.accent }}>
                  {a.type === 'STATUS_CHANGE' ? 'sync' : a.type === 'ASSIGN' ? 'person' : a.type === 'CREATED' ? 'add_circle' : 'sticky_note_2'}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px]" style={{ color: T.text }}>{a.detail}</p>
                  <p className="text-[11px]" style={{ color: T.textFaint }}>
                    {a.createdBy} · {a.createdAt ? new Date(a.createdAt).toLocaleString() : ''}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </>
  );
}
