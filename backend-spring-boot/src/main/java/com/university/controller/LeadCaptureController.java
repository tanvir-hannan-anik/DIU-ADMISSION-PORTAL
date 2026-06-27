package com.university.controller;

import com.university.model.dto.ResponseWrapper;
import com.university.service.LeadService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Public endpoint for the website to submit a lead (contact form, "request info",
 * etc.). Permitted without auth in SecurityConfig.
 */
@RestController
@RequestMapping("/v1/leads")
@RequiredArgsConstructor
public class LeadCaptureController {

    private final LeadService leadService;

    @PostMapping
    public ResponseEntity<ResponseWrapper<Object>> capture(@RequestBody Map<String, String> body) {
        try {
            var lead = leadService.capture(
                    body.get("name"),
                    body.get("email"),
                    body.get("phone"),
                    body.getOrDefault("program", body.get("interestedProgram")),
                    body.getOrDefault("source", "WEBSITE"),
                    body.get("message"));
            return ResponseEntity.ok(ResponseWrapper.success(Map.of("id", lead.getId(), "status", lead.getStatus())));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ResponseWrapper.error(e.getMessage(), e.getMessage()));
        }
    }
}
