import { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import adminApi from '../adminApi';
import { T } from '../theme';

const STAGES = [
  { key: 'NEW', label: 'New', color: '#6366F1' },
  { key: 'CONTACTED', label: 'Contacted', color: '#22D3EE' },
  { key: 'QUALIFIED', label: 'Qualified', color: '#A78BFA' },
  { key: 'APPLICATION_STARTED', label: 'App Started', color: '#FBBF24' },
  { key: 'SUBMITTED', label: 'Submitted', color: '#3B82F6' },
  { key: 'ADMITTED', label: 'Admitted', color: '#34D399' },
  { key: 'LOST', label: 'Lost', color: '#FB7185' },
];

// Drag-and-drop CRM pipeline. Columns are pipeline stages; dragging a card to a
// new column calls the existing PUT /leads/{id}/status endpoint.
export default function PipelinePage() {
  const [board, setBoard] = useState({});
  const [loading, setLoading] = useState(true);
  const [dragId, setDragId] = useState(null);
  const [overCol, setOverCol] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.get('/v1/admin/pipeline');
      setBoard(res.data.data || {});
    } catch { toast.error('Failed to load pipeline'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const moveCard = async (id, toStatus) => {
    // Optimistic: find the card, then move it across columns immediately.
    const allCards = Object.values(board).flat();
    const card = allCards.find((c) => c.id === id);
    if (!card || card.status === toStatus) return;

    const next = {};
    for (const [stage, cards] of Object.entries(board)) {
      next[stage] = (cards || []).filter((c) => c.id !== id);
    }
    next[toStatus] = [{ ...card, status: toStatus }, ...(next[toStatus] || [])];
    setBoard(next);

    try {
      await adminApi.put(`/v1/admin/leads/${id}/status`, { status: toStatus });
      toast.success(`Moved to ${toStatus.replace(/_/g, ' ')}`);
    } catch {
      toast.error('Move failed');
      load(); // revert from source of truth
    }
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[13px]" style={{ color: T.textDim }}>
          Drag a lead between stages to update its status. {loading && '· Loading…'}
        </p>
        <button onClick={load} className="px-3 h-8 rounded-lg text-[12px] font-semibold flex items-center gap-1"
                style={{ backgroundColor: T.card, color: T.textDim, border: `1px solid ${T.border}` }}>
          <span className="material-symbols-outlined text-[16px]">refresh</span>Refresh
        </button>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-4">
        {STAGES.map((stage) => {
          const cards = board[stage.key] || [];
          const isOver = overCol === stage.key;
          return (
            <div key={stage.key}
                 onDragOver={(e) => { e.preventDefault(); setOverCol(stage.key); }}
                 onDragLeave={() => setOverCol((c) => (c === stage.key ? null : c))}
                 onDrop={(e) => { e.preventDefault(); setOverCol(null); if (dragId != null) moveCard(dragId, stage.key); }}
                 className="flex-shrink-0 w-64 rounded-xl p-2.5"
                 style={{
                   backgroundColor: isOver ? T.cardHover : T.card,
                   border: `1px solid ${isOver ? stage.color : T.border}`,
                   transition: 'background-color .15s, border-color .15s',
                 }}>
              <div className="flex items-center justify-between px-1 pb-2 mb-1" style={{ borderBottom: `1px solid ${T.border}` }}>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: stage.color }} />
                  <span className="text-[13px] font-bold" style={{ color: T.text }}>{stage.label}</span>
                </div>
                <span className="text-[11px] font-bold px-1.5 rounded" style={{ backgroundColor: T.bg, color: T.textDim }}>
                  {cards.length}
                </span>
              </div>

              <div className="space-y-2 min-h-[60px]">
                {cards.map((c) => (
                  <div key={c.id}
                       draggable
                       onDragStart={() => setDragId(c.id)}
                       onDragEnd={() => setDragId(null)}
                       className="rounded-lg p-2.5 cursor-grab active:cursor-grabbing"
                       style={{ backgroundColor: T.bg, border: `1px solid ${T.border}` }}>
                    <p className="text-[13px] font-semibold truncate" style={{ color: T.text }}>{c.name || c.email}</p>
                    <p className="text-[11px] truncate" style={{ color: T.textDim }}>{c.email}</p>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: T.card, color: T.textFaint }}>
                        {c.interestedProgram || c.source || '—'}
                      </span>
                      <span className="text-[11px] font-bold" style={{ color: stage.color }}>{c.score ?? 0}</span>
                    </div>
                  </div>
                ))}
                {cards.length === 0 && (
                  <p className="text-[11px] text-center py-3" style={{ color: T.textFaint }}>Drop here</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
