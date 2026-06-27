import { T } from '../theme';

// Shown for sections planned but not yet built. Keeps the shell fully
// navigable and documents which phase each area belongs to.
export default function Placeholder({ title, phase, icon }) {
  return (
    <div className="p-6">
      <div className="rounded-2xl p-12 text-center" style={{ backgroundColor: T.card, border: `1px dashed ${T.borderStrong}` }}>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
             style={{ backgroundColor: T.accentSoft }}>
          <span className="material-symbols-outlined text-3xl" style={{ color: T.accent }}>{icon || 'construction'}</span>
        </div>
        <p className="text-[16px] font-bold" style={{ color: T.text }}>Coming in {phase || 'a later phase'}</p>
        <p className="text-[13px] mt-2 max-w-md mx-auto leading-relaxed" style={{ color: T.textDim }}>
          This section is part of the planned roadmap. The Phase 0 foundation it depends on
          (auth, role-based access control, audit logging) is already in place.
        </p>
      </div>
    </div>
  );
}
