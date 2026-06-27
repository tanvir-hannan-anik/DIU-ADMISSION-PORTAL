import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { NAV_GROUPS } from '../adminNav';
import { T } from '../theme';

const ALL = NAV_GROUPS.flatMap((g) => g.items.map((i) => ({ ...i, group: g.title })));

// ⌘K / Ctrl+K command palette: filter and jump to any admin section.
export default function CommandPalette({ open, onClose }) {
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return ALL;
    return ALL.filter((i) =>
      i.label.toLowerCase().includes(term) || i.group.toLowerCase().includes(term));
  }, [q]);

  useEffect(() => {
    if (open) { setQ(''); setActive(0); setTimeout(() => inputRef.current?.focus(), 30); }
  }, [open]);

  useEffect(() => { setActive(0); }, [q]);

  if (!open) return null;

  const go = (item) => { if (item) { navigate(`/admin/${item.path}`); onClose(); } };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); go(results[active]); }
    else if (e.key === 'Escape') { onClose(); }
  };

  return (
    <div className="adm-overlay" onMouseDown={onClose}>
      <div
        className="w-full max-w-xl rounded-2xl overflow-hidden"
        style={{ backgroundColor: T.card, border: `1px solid ${T.borderStrong}`, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 h-14" style={{ borderBottom: `1px solid ${T.border}` }}>
          <span className="material-symbols-outlined" style={{ color: T.textFaint }}>search</span>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search sections…"
            className="flex-1 bg-transparent outline-none text-[15px]"
            style={{ color: T.text }}
          />
          <kbd className="text-[10px] px-1.5 py-0.5 rounded" style={{ color: T.textFaint, border: `1px solid ${T.border}` }}>ESC</kbd>
        </div>
        <div className="max-h-80 overflow-y-auto py-2">
          {results.length === 0 ? (
            <p className="px-4 py-6 text-center text-[13px]" style={{ color: T.textFaint }}>No matches.</p>
          ) : results.map((item, i) => (
            <button
              key={item.path}
              onMouseEnter={() => setActive(i)}
              onClick={() => go(item)}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left"
              style={{ backgroundColor: i === active ? T.accentSoft : 'transparent' }}
            >
              <span className="material-symbols-outlined text-[20px]" style={{ color: T.accent }}>{item.icon}</span>
              <span className="flex-1 text-[14px]" style={{ color: T.text }}>{item.label}</span>
              <span className="text-[11px]" style={{ color: T.textFaint }}>{item.group}{item.live ? '' : ' · soon'}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
