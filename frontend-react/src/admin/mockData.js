// Demo data for the dashboard UI. Clearly mock until real analytics are wired
// (Phase 2: PostHog/GA + event pipeline). Swap each export for an API call later.

const spark = (seed) => Array.from({ length: 16 }, (_, i) => ({
  x: i,
  y: Math.round(40 + 30 * Math.sin(i / 2 + seed) + (i * 1.5) + Math.random() * 8),
}));

export const KPIS = [
  { id: 'visitors',   label: 'Total Visitors',   value: '12.6K', delta: 24.5,  up: true,  color: '#6366F1', data: spark(1) },
  { id: 'unique',     label: 'Unique Visitors',  value: '8.4K',  delta: 18.2,  up: true,  color: '#A78BFA', data: spark(2) },
  { id: 'sessions',   label: 'Total Sessions',   value: '18.9K', delta: 22.1,  up: true,  color: '#34D399', data: spark(3) },
  { id: 'bounce',     label: 'Bounce Rate',      value: '32.6%', delta: -8.6,  up: false, color: '#FBBF24', data: spark(4) },
  { id: 'session',    label: 'Avg. Session Time',value: '04:32', delta: 12.8,  up: true,  color: '#22D3EE', data: spark(5) },
  { id: 'conversions',label: 'Conversions',      value: '1.8K',  delta: 16.3,  up: true,  color: '#FB7185', data: spark(6) },
];

export const VISITOR_SOURCES = [
  { name: 'Facebook',  value: 4200, pct: 33.3 },
  { name: 'Google',    value: 3100, pct: 24.6 },
  { name: 'Instagram', value: 1800, pct: 14.3 },
  { name: 'Twitter',   value: 1200, pct: 9.5 },
  { name: 'YouTube',   value: 890,  pct: 7.1 },
  { name: 'LinkedIn',  value: 540,  pct: 4.3 },
  { name: 'Direct',    value: 420,  pct: 3.3 },
  { name: 'Others',    value: 390,  pct: 3.1 },
];

export const REALTIME_SERIES = Array.from({ length: 24 }, (_, i) => ({
  x: i,
  users: Math.round(90 + 40 * Math.sin(i / 3) + Math.random() * 20),
}));

export const DEVICE_BREAKDOWN = [
  { name: 'Desktop', value: 62, pct: 49.2, color: '#6366F1' },
  { name: 'Mobile',  value: 54, pct: 42.9, color: '#34D399' },
  { name: 'Tablet',  value: 10, pct: 7.9,  color: '#FBBF24' },
];

export const TOP_PAGES = [
  { path: '/',                         views: 3200 },
  { path: '/admission',                views: 2600 },
  { path: '/departments',              views: 2100 },
  { path: '/scholarship',              views: 1600 },
  { path: '/about-diu',                views: 1200 },
  { path: '/contact',                  views: 890 },
  { path: '/blog',                     views: 620 },
  { path: '/faq',                      views: 420 },
];

export const FUNNEL = [
  { stage: 'Visitors',        value: 12600 },
  { stage: 'Departments',     value: 8400 },
  { stage: 'Admission Info',  value: 6200 },
  { stage: 'Eligibility',     value: 3800 },
  { stage: 'Apply Now',       value: 2100 },
  { stage: 'Submitted',       value: 1200 },
];

export const DEVICE_ANALYTICS = [
  { name: 'Mobile',  value: 7700, pct: 61.3, color: '#34D399' },
  { name: 'Desktop', value: 4200, pct: 33.5, color: '#6366F1' },
  { name: 'Tablet',  value: 700,  pct: 5.2,  color: '#FBBF24' },
];

export const AI_LEADS = { score: 78, high: 1200, medium: 420, low: 180 };

export const ACTIVITY_FEED = [
  { id: 1, icon: 'person_add', tint: '#6366F1', title: 'New visitor from', sub: 'Facebook · Campaign', meta: 'Dhaka, Bangladesh', time: '2s ago' },
  { id: 2, icon: 'visibility', tint: '#22D3EE', title: 'Page viewed', sub: '/admission', time: '2s ago' },
  { id: 3, icon: 'mail',       tint: '#34D399', title: 'Lead captured', sub: 'anik.hasan@gmail.com', time: '10s ago' },
  { id: 4, icon: 'forum',      tint: '#FBBF24', title: 'Chat started', sub: 'Regarding Scholarship', time: '12s ago' },
  { id: 5, icon: 'visibility', tint: '#22D3EE', title: 'Page viewed', sub: '/departments/computer-science', time: '15s ago' },
  { id: 6, icon: 'ads_click',  tint: '#A78BFA', title: 'Button clicked', sub: 'Apply Now', time: '18s ago' },
  { id: 7, icon: 'description',tint: '#FB7185', title: 'Form submitted', sub: 'Admission Form', time: '22s ago' },
  { id: 8, icon: 'person_add', tint: '#6366F1', title: 'New visitor from', sub: 'Google · Organic', meta: 'Chittagong, Bangladesh', time: '25s ago' },
  { id: 9, icon: 'visibility', tint: '#22D3EE', title: 'Page viewed', sub: '/scholarship', time: '30s ago' },
];
