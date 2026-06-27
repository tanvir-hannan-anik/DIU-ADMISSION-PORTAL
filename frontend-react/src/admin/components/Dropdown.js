import { useState, useRef, useEffect } from 'react';
import { T } from '../theme';

// Click-to-open menu that closes on outside-click or Escape.
// `trigger` is a render-prop receiving { open }. `items` render the menu body.
export default function Dropdown({ trigger, children, align = 'right', width = 240 }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <div onClick={() => setOpen((o) => !o)}>{trigger({ open })}</div>
      {open && (
        <div
          className="absolute mt-2 rounded-xl overflow-hidden z-50 adm-card-shadow"
          style={{
            [align]: 0,
            width,
            backgroundColor: T.card,
            border: `1px solid ${T.borderStrong}`,
            boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
          }}
        >
          {children({ close: () => setOpen(false) })}
        </div>
      )}
    </div>
  );
}

// Convenience row used inside a Dropdown menu.
export function MenuItem({ icon, label, sub, danger, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-white/5 transition-colors"
      style={{ color: danger ? T.down : T.text }}
    >
      {icon && <span className="material-symbols-outlined text-[19px]" style={{ color: danger ? T.down : T.textDim }}>{icon}</span>}
      <span className="flex-1 min-w-0">
        <span className="block text-[13px] font-medium truncate">{label}</span>
        {sub && <span className="block text-[11px] truncate" style={{ color: T.textFaint }}>{sub}</span>}
      </span>
    </button>
  );
}
