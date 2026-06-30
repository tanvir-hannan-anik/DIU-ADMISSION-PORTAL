import api from './api';
import { getLeadSource, getUtm, trackEvent, identifyLead } from '../utils/tracking';

// Public lead capture for the marketing site (Request Info / Talk to a Counselor
// forms). Posts to the open /v1/leads endpoint and mirrors the event to PostHog
// so the funnel + CRM stay in sync.
export const leadService = {
  capture: async ({ name, email, phone, program, message, source }) => {
    const utm = getUtm();
    const payload = {
      name,
      email,
      phone,
      program,
      message,
      source: source || getLeadSource(),
      ...(utm.utm_campaign ? { campaign: utm.utm_campaign } : {}),
    };

    try {
      const res = await api.post('/v1/leads', payload);
      // Analytics: identify the person and record the conversion event.
      identifyLead(email, { name, interested_program: program });
      trackEvent('lead_captured', { program: program || 'unspecified', source: payload.source });
      return { success: true, data: res.data?.data || res.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Submission failed',
      };
    }
  },
};
