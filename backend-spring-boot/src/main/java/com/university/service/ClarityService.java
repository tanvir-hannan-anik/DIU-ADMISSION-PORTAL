package com.university.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

/**
 * Pulls aggregated behavior metrics from Microsoft Clarity's Data Export API so
 * the admin can show REAL Clarity numbers natively (sessions, scroll depth,
 * engagement, dead/rage clicks, etc.). The visual heatmap images and session
 * replays themselves are NOT embeddable (Clarity blocks iframing) — those stay
 * as deep-links to clarity.microsoft.com.
 *
 * Config (env var):
 *   CLARITY_API_TOKEN — a Clarity API token (JWT) generated in
 *   Clarity → Settings → Data Export → "Generate new API token".
 *
 * Note: Clarity limits this API to ~10 calls/project/day and only the last 1–3
 * days, so responses are cached in-memory for an hour.
 */
@Slf4j
@Service
public class ClarityService {

    private final RestTemplate restTemplate;

    @Value("${clarity.api-token:}")
    private String apiToken;

    @Value("${clarity.project-id:}")
    private String projectId;

    private static final long TTL_MS = 60 * 60 * 1000; // 1 hour (respect the 10/day limit)
    private volatile List<Object> cache;
    private volatile int cachedDays = -1;
    private volatile long cachedAt;

    public ClarityService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public boolean isConfigured() {
        return apiToken != null && !apiToken.isBlank();
    }

    public String getProjectId() {
        return projectId;
    }

    /**
     * Live insights for the last {@code days} (Clarity allows only 1–3). Cached
     * for an hour so admin refreshes don't burn the daily quota.
     */
    @SuppressWarnings("unchecked")
    public List<Object> insights(int days) {
        if (!isConfigured()) return Collections.emptyList();
        int d = Math.min(Math.max(days, 1), 3);

        long now = System.currentTimeMillis();
        if (cache != null && cachedDays == d && now - cachedAt < TTL_MS) return cache;

        try {
            String url = "https://www.clarity.ms/export-data/api/v1/project-live-insights?numOfDays=" + d;
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(apiToken);
            headers.setAccept(List.of(MediaType.APPLICATION_JSON));

            ResponseEntity<List> res = restTemplate.exchange(
                    url, HttpMethod.GET, new HttpEntity<>(headers), List.class);

            List<Object> body = res.getBody();
            if (body != null) {
                cache = body;
                cachedDays = d;
                cachedAt = now;
            }
            return cache != null ? cache : Collections.emptyList();
        } catch (Exception e) {
            log.warn("Clarity insights fetch failed: {}", e.getMessage());
            // Serve stale cache if we have it; otherwise empty (never throw).
            return cache != null ? cache : Collections.emptyList();
        }
    }
}
