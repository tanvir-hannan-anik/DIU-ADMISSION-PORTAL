// Thin wrappers around the globally-loaded PostHog snippet (see public/index.html)
// plus UTM helpers. Safe to call even if PostHog hasn't loaded or is blocked —
// every call is guarded so analytics can never break the app.

/** Fire a custom analytics event (no-op if PostHog isn't present). */
export function trackEvent(name, props = {}) {
  try {
    window.posthog?.capture(name, props);
  } catch {
    /* analytics must never throw into the UI */
  }
}

/** Tie subsequent events to a known person once they identify themselves. */
export function identifyLead(email, traits = {}) {
  if (!email) return;
  try {
    window.posthog?.identify(email, traits);
  } catch {
    /* ignore */
  }
}

/**
 * Read UTM params from the current URL and persist them for the session, so a
 * lead captured three pages later still credits the campaign that brought them.
 */
export function captureUtmParams() {
  try {
    const p = new URLSearchParams(window.location.search);
    const utm = {};
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach((k) => {
      const v = p.get(k);
      if (v) utm[k] = v;
    });
    if (Object.keys(utm).length) {
      sessionStorage.setItem('diu_utm', JSON.stringify(utm));
    }
  } catch {
    /* ignore */
  }
}

/** Best-guess lead source string for the CRM (UTM source → uppercase, else WEBSITE). */
export function getLeadSource() {
  try {
    const utm = JSON.parse(sessionStorage.getItem('diu_utm') || '{}');
    if (utm.utm_source) return String(utm.utm_source).toUpperCase();
    // Fall back to referrer host (e.g. FACEBOOK, GOOGLE) when no UTM tag.
    const ref = document.referrer;
    if (ref) {
      const host = new URL(ref).hostname.replace('www.', '');
      if (host.includes('facebook')) return 'FACEBOOK';
      if (host.includes('google')) return 'GOOGLE';
      if (host.includes('instagram')) return 'INSTAGRAM';
      if (host.includes('linkedin')) return 'LINKEDIN';
      if (host.includes('youtube')) return 'YOUTUBE';
      if (!host.includes(window.location.hostname)) return 'REFERRAL';
    }
  } catch {
    /* ignore */
  }
  return 'WEBSITE';
}

/** Full UTM object (for attaching to a lead payload / events). */
export function getUtm() {
  try {
    return JSON.parse(sessionStorage.getItem('diu_utm') || '{}');
  } catch {
    return {};
  }
}
