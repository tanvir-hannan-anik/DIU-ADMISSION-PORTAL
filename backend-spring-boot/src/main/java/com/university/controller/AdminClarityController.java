package com.university.controller;

import com.university.model.dto.ResponseWrapper;
import com.university.service.ClarityService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Microsoft Clarity behavior metrics for the admin (Heatmaps / Session Replays
 * pages). Gated by hasAnyRole(...) via /v1/admin/** in SecurityConfig.
 */
@RestController
@RequestMapping("/v1/admin/clarity")
@RequiredArgsConstructor
public class AdminClarityController {

    private final ClarityService clarityService;

    @GetMapping("/insights")
    public ResponseEntity<ResponseWrapper<Object>> insights(@RequestParam(defaultValue = "3") int days) {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("configured", clarityService.isConfigured());
        out.put("projectId", clarityService.getProjectId());
        out.put("days", Math.min(Math.max(days, 1), 3));
        out.put("metrics", clarityService.insights(days));
        return ResponseEntity.ok(ResponseWrapper.success(out));
    }
}
