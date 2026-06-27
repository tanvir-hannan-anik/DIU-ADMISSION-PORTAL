// Admin theme tokens. Values are CSS variables defined in admin.css, so the
// dark/light toggle flips them globally without per-component changes.
export const T = {
  bg: 'var(--adm-bg)',
  panel: 'var(--adm-panel)',
  card: 'var(--adm-card)',
  cardHover: 'var(--adm-card-hover)',
  border: 'var(--adm-border)',
  borderStrong: 'var(--adm-border-strong)',
  text: 'var(--adm-text)',
  textDim: 'var(--adm-text-dim)',
  textFaint: 'var(--adm-text-faint)',
  accent: 'var(--adm-accent)',
  accentSoft: 'var(--adm-accent-soft)',
  up: 'var(--adm-up)',
  down: 'var(--adm-down)',
  track: 'var(--adm-track)',       // neutral fill for chart/bar tracks (both themes)
};

// Ordered palette for multi-series charts (works on dark and light).
export const CHART_COLORS = [
  '#6366F1', '#3B82F6', '#22D3EE', '#34D399',
  '#FBBF24', '#F472B6', '#A78BFA', '#64748B',
];
