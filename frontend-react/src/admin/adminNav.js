// Grouped admin navigation, mirroring the enterprise reference layout.
// `live: true` items are functional in Phase 0; the rest are navigable
// placeholders tagged with the phase that will build them.
export const NAV_GROUPS = [
  {
    title: 'Overview',
    items: [
      { path: 'dashboard', label: 'Dashboard', icon: 'dashboard', live: true },
      { path: 'realtime',  label: 'Real Time',  icon: 'sensors', phase: 'Phase 2', dot: true },
    ],
  },
  {
    title: 'Analytics',
    items: [
      { path: 'visitors',    label: 'Visitors',        icon: 'group',          phase: 'Phase 2' },
      { path: 'traffic',     label: 'Traffic Sources', icon: 'travel_explore', phase: 'Phase 2' },
      { path: 'pages',       label: 'Pages',           icon: 'description',    phase: 'Phase 2' },
      { path: 'events',      label: 'Events',          icon: 'ads_click',      phase: 'Phase 2' },
      { path: 'funnels',     label: 'Funnels',         icon: 'filter_alt',     phase: 'Phase 2' },
      { path: 'journey',     label: 'User Journey',    icon: 'route',          phase: 'Phase 2' },
      { path: 'heatmaps',    label: 'Heatmaps',        icon: 'whatshot',       phase: 'Phase 2 · Clarity' },
      { path: 'replays',     label: 'Session Replays', icon: 'smart_display',  phase: 'Phase 2 · Clarity' },
    ],
  },
  {
    title: 'Leads & CRM',
    items: [
      { path: 'leads',        label: 'Leads',        icon: 'groups',          live: true },
      { path: 'applications', label: 'Applications', icon: 'assignment',      live: true },
      { path: 'followups',    label: 'Follow Ups',   icon: 'event_repeat',    phase: 'Phase 1' },
      { path: 'pipeline',     label: 'CRM Pipeline', icon: 'view_kanban',     phase: 'Phase 1' },
    ],
  },
  {
    title: 'Engagement',
    items: [
      { path: 'chat', label: 'Chat Analytics', icon: 'forum',     phase: 'Phase 3' },
      { path: 'ai',   label: 'AI Predictions', icon: 'neurology', phase: 'Phase 5' },
    ],
  },
  {
    title: 'Settings',
    items: [
      { path: 'integrations', label: 'Integrations', icon: 'extension',       phase: 'Phase 2' },
      { path: 'audit',        label: 'Audit Logs',   icon: 'manage_history',  live: true },
      { path: 'users',        label: 'Users & Roles',icon: 'admin_panel_settings', phase: 'Phase 6' },
    ],
  },
];

// Flat list of placeholder routes (everything not marked live).
export const PLACEHOLDER_ROUTES = NAV_GROUPS
  .flatMap((g) => g.items)
  .filter((i) => !i.live);
