// Admin-side client for the PostHog-backed analytics endpoints. Every call
// returns { configured, ...data }; pages use `configured` to decide whether to
// render charts or a "connect PostHog" hint.
import adminApi from './adminApi';

const get = async (path, days = 7) => {
  try {
    const res = await adminApi.get(`/v1/admin/analytics/${path}`, { params: { days } });
    return res.data.data || {};
  } catch {
    return { configured: false };
  }
};

export const analyticsApi = {
  overview: (days) => get('overview', days),
  traffic: (days) => get('traffic', days),
  pages: (days) => get('pages', days),
  events: (days) => get('events', days),
  devices: (days) => get('devices', days),
  locations: (days) => get('locations', days),
  funnel: (days) => get('funnel', days),
  realtime: () => get('realtime'),
};
