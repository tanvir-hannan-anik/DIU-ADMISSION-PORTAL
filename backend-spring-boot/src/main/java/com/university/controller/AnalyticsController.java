package com.university.controller;

import com.university.model.dto.ResponseWrapper;
import com.university.service.PostHogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Visitor-analytics endpoints backed by PostHog. Gated by hasRole("ADMIN") via
 * /v1/admin/** in SecurityConfig. Every response includes "configured" so the
 * frontend knows whether to render charts or a "connect PostHog" hint.
 */
@RestController
@RequestMapping("/v1/admin/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final PostHogService postHog;

    private Map<String, Object> wrap(String key, Object value) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("configured", postHog.isConfigured());
        m.put(key, value);
        return m;
    }

    @GetMapping("/overview")
    public ResponseEntity<ResponseWrapper<Object>> overview(@RequestParam(defaultValue = "7") int days) {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("configured", postHog.isConfigured());
        out.putAll(postHog.overview(days));
        out.put("activeNow", postHog.realtimeActive());
        return ResponseEntity.ok(ResponseWrapper.success(out));
    }

    @GetMapping("/traffic")
    public ResponseEntity<ResponseWrapper<Object>> traffic(@RequestParam(defaultValue = "7") int days) {
        return ResponseEntity.ok(ResponseWrapper.success(wrap("sources", postHog.trafficSources(days))));
    }

    @GetMapping("/pages")
    public ResponseEntity<ResponseWrapper<Object>> pages(@RequestParam(defaultValue = "7") int days) {
        return ResponseEntity.ok(ResponseWrapper.success(wrap("pages", postHog.topPages(days))));
    }

    @GetMapping("/events")
    public ResponseEntity<ResponseWrapper<Object>> events(@RequestParam(defaultValue = "7") int days) {
        return ResponseEntity.ok(ResponseWrapper.success(wrap("events", postHog.events(days))));
    }

    @GetMapping("/devices")
    public ResponseEntity<ResponseWrapper<Object>> devices(@RequestParam(defaultValue = "7") int days) {
        return ResponseEntity.ok(ResponseWrapper.success(wrap("devices", postHog.devices(days))));
    }

    @GetMapping("/locations")
    public ResponseEntity<ResponseWrapper<Object>> locations(@RequestParam(defaultValue = "7") int days) {
        return ResponseEntity.ok(ResponseWrapper.success(wrap("locations", postHog.locations(days))));
    }

    @GetMapping("/funnel")
    public ResponseEntity<ResponseWrapper<Object>> funnel(@RequestParam(defaultValue = "7") int days) {
        return ResponseEntity.ok(ResponseWrapper.success(wrap("funnel", postHog.funnel(days))));
    }

    @GetMapping("/realtime")
    public ResponseEntity<ResponseWrapper<Object>> realtime() {
        return ResponseEntity.ok(ResponseWrapper.success(wrap("activeNow", postHog.realtimeActive())));
    }
}
