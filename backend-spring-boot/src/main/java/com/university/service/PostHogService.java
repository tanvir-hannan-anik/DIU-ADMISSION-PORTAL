package com.university.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

/**
 * Server-side bridge to the PostHog Query API (HogQL). The browser sends events
 * to PostHog with the *public* phc_ key; this service reads them back with a
 * *secret* Personal API Key so the admin dashboard can render native charts.
 *
 * Config (env vars, all optional — when unset, isConfigured() is false and the
 * controller returns configured:false so the UI shows a setup hint instead of
 * breaking):
 *   POSTHOG_API_KEY     — Personal API Key (phx_...), secret
 *   POSTHOG_PROJECT_ID  — numeric project id
 *   POSTHOG_HOST        — https://us.posthog.com (default) or eu
 */
@Slf4j
@Service
public class PostHogService {

    private final RestTemplate restTemplate;

    @Value("${posthog.api-key:}")
    private String apiKey;

    @Value("${posthog.project-id:}")
    private String projectId;

    @Value("${posthog.host:https://us.posthog.com}")
    private String host;

    public PostHogService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank()
                && projectId != null && !projectId.isBlank();
    }

    /**
     * Run a HogQL query and return the raw rows (each row is a list of column
     * values). Returns an empty list on any failure — analytics never throws.
     */
    @SuppressWarnings("unchecked")
    public List<List<Object>> query(String hogql) {
        if (!isConfigured()) return Collections.emptyList();
        try {
            String url = host.replaceAll("/$", "") + "/api/projects/" + projectId + "/query/";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);

            Map<String, Object> inner = new HashMap<>();
            inner.put("kind", "HogQLQuery");
            inner.put("query", hogql);
            Map<String, Object> body = new HashMap<>();
            body.put("query", inner);

            ResponseEntity<Map> res = restTemplate.exchange(
                    url, HttpMethod.POST, new HttpEntity<>(body, headers), Map.class);

            Object results = res.getBody() != null ? res.getBody().get("results") : null;
            if (results instanceof List) return (List<List<Object>>) results;
            return Collections.emptyList();
        } catch (Exception e) {
            log.warn("PostHog query failed: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    // ── Helpers ────────────────────────────────────────────────────────────────
    private long firstLong(List<List<Object>> rows) {
        if (rows.isEmpty() || rows.get(0).isEmpty()) return 0;
        Object v = rows.get(0).get(0);
        return v instanceof Number ? ((Number) v).longValue() : 0;
    }

    private long asLong(Object v) { return v instanceof Number ? ((Number) v).longValue() : 0; }

    private double firstDouble(List<List<Object>> rows) {
        if (rows.isEmpty() || rows.get(0).isEmpty()) return 0;
        Object v = rows.get(0).get(0);
        return v instanceof Number ? ((Number) v).doubleValue() : 0;
    }

    private String asStr(Object v) { return v == null ? "" : String.valueOf(v); }

    private int round1(double d) { return (int) Math.round(d); }

    /** Headline KPIs for the dashboard over the last N days. */
    public Map<String, Object> overview(int days) {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("pageviews", firstLong(query(
                "SELECT count() FROM events WHERE event = '$pageview' AND timestamp > now() - INTERVAL " + days + " DAY")));
        out.put("uniqueVisitors", firstLong(query(
                "SELECT count(DISTINCT person_id) FROM events WHERE timestamp > now() - INTERVAL " + days + " DAY")));
        out.put("sessions", firstLong(query(
                "SELECT count(DISTINCT properties.$session_id) FROM events WHERE timestamp > now() - INTERVAL " + days + " DAY")));
        out.put("leadEvents", firstLong(query(
                "SELECT count() FROM events WHERE event = 'lead_captured' AND timestamp > now() - INTERVAL " + days + " DAY")));

        // Avg session duration (seconds): span of each session's events.
        out.put("avgSessionSeconds", Math.round(firstDouble(query(
                "SELECT avg(dur) FROM (SELECT properties.$session_id AS sid, " +
                "dateDiff('second', min(timestamp), max(timestamp)) AS dur FROM events " +
                "WHERE timestamp > now() - INTERVAL " + days + " DAY AND properties.$session_id != '' GROUP BY sid)"))));

        // Bounce rate (%): share of sessions with a single pageview.
        out.put("bounceRate", round1(firstDouble(query(
                "SELECT 100.0 * sum(if(pv = 1, 1, 0)) / count() FROM (" +
                "SELECT properties.$session_id AS sid, count() AS pv FROM events " +
                "WHERE event = '$pageview' AND timestamp > now() - INTERVAL " + days + " DAY " +
                "AND properties.$session_id != '' GROUP BY sid)"))));

        out.put("dailySeries", dailyPageviews(days));
        return out;
    }

    /** Daily pageview series for sparklines / area charts. */
    public List<Map<String, Object>> dailyPageviews(int days) {
        List<List<Object>> rows = query(
                "SELECT toDate(timestamp) AS d, count() AS c FROM events " +
                "WHERE event = '$pageview' AND timestamp > now() - INTERVAL " + days + " DAY " +
                "GROUP BY d ORDER BY d");
        List<Map<String, Object>> out = new ArrayList<>();
        int i = 0;
        for (List<Object> r : rows) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("x", i++);
            m.put("label", asStr(r.get(0)));
            m.put("y", asLong(r.get(1)));
            out.add(m);
        }
        return out;
    }

    /** Visitors currently active (last 30 minutes). */
    public long realtimeActive() {
        return firstLong(query(
                "SELECT count(DISTINCT person_id) FROM events WHERE timestamp > now() - INTERVAL 30 MINUTE"));
    }

    /** Top visitor locations by country. */
    public List<Map<String, Object>> locations(int days) {
        List<List<Object>> rows = query(
                "SELECT coalesce(nullIf(properties.$geoip_country_name, ''), 'Unknown') AS country, " +
                "count(DISTINCT person_id) AS c FROM events " +
                "WHERE timestamp > now() - INTERVAL " + days + " DAY " +
                "GROUP BY country ORDER BY c DESC LIMIT 12");
        List<Map<String, Object>> out = new ArrayList<>();
        for (List<Object> r : rows) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("name", r.get(0));
            m.put("value", asLong(r.get(1)));
            out.add(m);
        }
        return out;
    }

    // Canonical channel order for the traffic donut.
    private static final List<String> CHANNELS = List.of(
            "Facebook", "Google", "Instagram", "Twitter (X)", "YouTube", "LinkedIn", "Direct", "Other");

    /**
     * Traffic grouped into named marketing channels. Uses utm_source first (most
     * reliable — set it on your ad links), then the referring domain, then Direct.
     */
    public List<Map<String, Object>> trafficSources(int days) {
        List<List<Object>> rows = query(
                "SELECT coalesce(nullIf(lower(properties.utm_source), ''), " +
                "nullIf(lower(properties.$referring_domain), ''), 'direct') AS src, count() AS c " +
                "FROM events WHERE event = '$pageview' AND timestamp > now() - INTERVAL " + days + " DAY " +
                "GROUP BY src ORDER BY c DESC LIMIT 100");

        Map<String, Long> buckets = new LinkedHashMap<>();
        for (String ch : CHANNELS) buckets.put(ch, 0L);
        for (List<Object> r : rows) {
            buckets.merge(channelOf(asStr(r.get(0))), asLong(r.get(1)), Long::sum);
        }

        List<Map<String, Object>> out = new ArrayList<>();
        for (Map.Entry<String, Long> e : buckets.entrySet()) {
            if (e.getValue() == 0) continue; // only show channels that have traffic
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("name", e.getKey());
            m.put("value", e.getValue());
            out.add(m);
        }
        return out;
    }

    /** Map a utm_source / referrer domain to one of the named channels. */
    private String channelOf(String raw) {
        String s = raw == null ? "" : raw.toLowerCase();
        if (s.isBlank() || s.equals("direct") || s.equals("$direct")) return "Direct";
        if (s.contains("facebook") || s.equals("fb") || s.contains("fb.com") || s.contains("l.facebook")) return "Facebook";
        if (s.contains("google") || s.contains("googleads") || s.contains("doubleclick")) return "Google";
        if (s.contains("instagram") || s.equals("ig") || s.contains("l.instagram")) return "Instagram";
        if (s.contains("twitter") || s.contains("t.co") || s.equals("x") || s.contains("x.com")) return "Twitter (X)";
        if (s.contains("youtube") || s.contains("youtu.be")) return "YouTube";
        if (s.contains("linkedin") || s.contains("lnkd")) return "LinkedIn";
        return "Other";
    }

    /** Top pages by views. */
    public List<Map<String, Object>> topPages(int days) {
        List<List<Object>> rows = query(
                "SELECT coalesce(properties.$pathname, '/') AS path, count() AS c " +
                "FROM events WHERE event = '$pageview' AND timestamp > now() - INTERVAL " + days + " DAY " +
                "GROUP BY path ORDER BY c DESC LIMIT 10");
        List<Map<String, Object>> out = new ArrayList<>();
        for (List<Object> r : rows) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("path", r.get(0));
            m.put("views", asLong(r.get(1)));
            out.add(m);
        }
        return out;
    }

    /** Custom event counts (Apply Now clicks, eligibility checks, etc.). */
    public List<Map<String, Object>> events(int days) {
        List<List<Object>> rows = query(
                "SELECT event, count() AS c FROM events " +
                "WHERE timestamp > now() - INTERVAL " + days + " DAY " +
                "GROUP BY event ORDER BY c DESC LIMIT 15");
        List<Map<String, Object>> out = new ArrayList<>();
        for (List<Object> r : rows) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("name", r.get(0));
            m.put("count", asLong(r.get(1)));
            out.add(m);
        }
        return out;
    }

    /** Device-type breakdown by unique persons. */
    public List<Map<String, Object>> devices(int days) {
        List<List<Object>> rows = query(
                "SELECT coalesce(properties.$device_type, 'Unknown') AS device, count(DISTINCT person_id) AS c " +
                "FROM events WHERE timestamp > now() - INTERVAL " + days + " DAY " +
                "GROUP BY device ORDER BY c DESC");
        List<Map<String, Object>> out = new ArrayList<>();
        for (List<Object> r : rows) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("name", r.get(0));
            m.put("value", asLong(r.get(1)));
            out.add(m);
        }
        return out;
    }

    /**
     * Admission conversion funnel by unique persons per step. Uses the custom
     * events fired by the public site (see frontend utils/tracking.js).
     */
    public List<Map<String, Object>> funnel(int days) {
        String[][] steps = {
                {"Visitors", "$pageview"},
                {"Apply Now", "apply_now_clicked"},
                {"Eligibility", "eligibility_checked"},
                {"Lead Captured", "lead_captured"},
                {"Submitted", "application_submitted"},
        };
        List<Map<String, Object>> out = new ArrayList<>();
        for (String[] step : steps) {
            long v = firstLong(query(
                    "SELECT count(DISTINCT person_id) FROM events WHERE event = '" + step[1] +
                    "' AND timestamp > now() - INTERVAL " + days + " DAY"));
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("stage", step[0]);
            m.put("value", v);
            out.add(m);
        }
        return out;
    }
}
