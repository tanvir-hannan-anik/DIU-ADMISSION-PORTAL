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
        return out;
    }

    /** Visitors currently active (last 30 minutes). */
    public long realtimeActive() {
        return firstLong(query(
                "SELECT count(DISTINCT person_id) FROM events WHERE timestamp > now() - INTERVAL 30 MINUTE"));
    }

    /** Traffic grouped by referring domain. */
    public List<Map<String, Object>> trafficSources(int days) {
        List<List<Object>> rows = query(
                "SELECT coalesce(nullIf(properties.$referring_domain, ''), 'direct') AS source, count() AS c " +
                "FROM events WHERE event = '$pageview' AND timestamp > now() - INTERVAL " + days + " DAY " +
                "GROUP BY source ORDER BY c DESC LIMIT 8");
        List<Map<String, Object>> out = new ArrayList<>();
        for (List<Object> r : rows) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("name", r.get(0));
            m.put("value", asLong(r.get(1)));
            out.add(m);
        }
        return out;
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
