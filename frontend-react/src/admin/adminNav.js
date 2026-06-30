// Grouped admin navigation, mirroring the enterprise reference layout.
// `live: true` items are functional in Phase 0; the rest are navigable
// placeholders tagged with the phase that will build them.
export const NAV_GROUPS = [
  {
    title: 'Overview',
    items: [
      { path: 'dashboard', label: 'Dashboard', icon: 'dashboard', live: true },
      { path: 'realtime',  label: 'Real Time',  icon: 'sensors', live: true, dot: true },
    ],
  },
  {
    title: 'Analytics',
    items: [
      { path: 'visitors',    label: 'Visitors',        icon: 'group',          live: true },
      { path: 'traffic',     label: 'Traffic Sources', icon: 'travel_explore', live: true },
      { path: 'pages',       label: 'Pages',           icon: 'description',    live: true },
      { path: 'events',      label: 'Events',          icon: 'ads_click',      live: true },
      { path: 'funnels',     label: 'Funnels',         icon: 'filter_alt',     live: true },
      { path: 'journey',     label: 'User Journey',    icon: 'route',          live: true },
      { path: 'heatmaps',    label: 'Heatmaps',        icon: 'whatshot',       live: true },
      { path: 'replays',     label: 'Session Replays', icon: 'smart_display',  live: true },
    ],
  },
  {
    title: 'Leads & CRM',
    items: [
      { path: 'leads',        label: 'Leads',        icon: 'groups',          live: true },
      { path: 'applications', label: 'Applications', icon: 'assignment',      live: true },
      { path: 'followups',    label: 'Follow Ups',   icon: 'event_repeat',    live: true },
      { path: 'pipeline',     label: 'CRM Pipeline', icon: 'view_kanban',     live: true },
    ],
  },
  {
    title: 'Engagement',
    items: [
      { path: 'chat', label: 'Chat Analytics', icon: 'forum',     live: true },
      { path: 'ai',   label: 'AI Predictions', icon: 'neurology', phase: 'Phase 5' },
    ],
  },
  {
    title: 'Settings',
    items: [
      { path: 'integrations', label: 'Integrations', icon: 'extension',       live: true },
      { path: 'audit',        label: 'Audit Logs',   icon: 'manage_history',  live: true },
      { path: 'users',        label: 'Users & Roles',icon: 'admin_panel_settings', live: true },
    ],
  },
];

// Flat list of placeholder routes (everything not marked live).
export const PLACEHOLDER_ROUTES = NAV_GROUPS
  .flatMap((g) => g.items)
  .filter((i) => !i.live);

// Which sidebar paths each non-super-admin role may see. "admin" (Super Admin)
// always sees everything, so it's not listed here. This is a UX convenience —
// the real gate is server-side per endpoint.
const ROLE_ACCESS = {
  admission_officer: ['dashboard', 'realtime', 'leads', 'applications', 'followups', 'pipeline', 'audit'],
  marketing: ['dashboard', 'realtime', 'visitors', 'traffic', 'pages', 'events', 'funnels', 'journey', 'heatmaps', 'replays', 'leads', 'pipeline', 'integrations'],
  faculty_admin: ['dashboard', 'applications', 'chat'],
};

export const ROLE_LABELS = {
  admin: 'Super Admin',
  admission_officer: 'Admission Officer',
  marketing: 'Marketing',
  faculty_admin: 'Faculty Admin',
};

/** Returns the nav groups visible to a given role (empty groups removed). */
export function navGroupsForRole(role) {
  const r = (role || '').toLowerCase();
  if (r === 'admin' || !ROLE_ACCESS[r]) return NAV_GROUPS; // super admin / unknown → full
  const allowed = new Set(ROLE_ACCESS[r]);
  return NAV_GROUPS
    .map((g) => ({ ...g, items: g.items.filter((i) => allowed.has(i.path)) }))
    .filter((g) => g.items.length > 0);
}
