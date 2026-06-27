package com.university.controller;

import com.university.model.dto.ResponseWrapper;
import com.university.service.LeadService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * Admin CRM endpoints. Gated by hasRole("ADMIN") via /v1/admin/** in SecurityConfig.
 */
@RestController
@RequestMapping("/v1/admin")
@RequiredArgsConstructor
public class AdminLeadController {

    private final LeadService leadService;

    private String actor(Authentication auth) {
        return auth != null ? auth.getName() : "admin";
    }

    // ── Leads ─────────────────────────────────────────────────────────────────
    @GetMapping("/leads")
    public ResponseEntity<ResponseWrapper<Object>> list(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size) {
        Page<?> leads = leadService.list(status, page, size);
        Map<String, Object> body = new HashMap<>();
        body.put("content", leads.getContent());
        body.put("page", leads.getNumber());
        body.put("totalPages", leads.getTotalPages());
        body.put("totalElements", leads.getTotalElements());
        return ResponseEntity.ok(ResponseWrapper.success(body));
    }

    @GetMapping("/leads/{id}")
    public ResponseEntity<ResponseWrapper<Object>> detail(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(ResponseWrapper.success(leadService.getDetail(id)));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ResponseWrapper.error(e.getMessage(), e.getMessage()));
        }
    }

    @PutMapping("/leads/{id}/status")
    public ResponseEntity<ResponseWrapper<Object>> updateStatus(
            @PathVariable Long id, @RequestBody Map<String, String> body, Authentication auth) {
        try {
            return ResponseEntity.ok(ResponseWrapper.success(
                    leadService.updateStatus(id, body.get("status"), actor(auth))));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ResponseWrapper.error(e.getMessage(), e.getMessage()));
        }
    }

    @PostMapping("/leads/{id}/assign")
    public ResponseEntity<ResponseWrapper<Object>> assign(
            @PathVariable Long id, @RequestBody Map<String, Object> body, Authentication auth) {
        try {
            Object cid = body.get("counselorId");
            Long counselorId = cid == null ? null : Long.valueOf(cid.toString());
            return ResponseEntity.ok(ResponseWrapper.success(
                    leadService.assign(id, counselorId, actor(auth))));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ResponseWrapper.error(e.getMessage(), e.getMessage()));
        }
    }

    @PostMapping("/leads/{id}/notes")
    public ResponseEntity<ResponseWrapper<Object>> addNote(
            @PathVariable Long id, @RequestBody Map<String, String> body, Authentication auth) {
        try {
            return ResponseEntity.ok(ResponseWrapper.success(
                    leadService.addNote(id, body.get("detail"), actor(auth))));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ResponseWrapper.error(e.getMessage(), e.getMessage()));
        }
    }

    // ── Counselors ────────────────────────────────────────────────────────────
    @GetMapping("/counselors")
    public ResponseEntity<ResponseWrapper<Object>> counselors() {
        return ResponseEntity.ok(ResponseWrapper.success(leadService.listCounselors()));
    }

    @PostMapping("/counselors")
    public ResponseEntity<ResponseWrapper<Object>> createCounselor(@RequestBody Map<String, String> body) {
        try {
            return ResponseEntity.ok(ResponseWrapper.success(
                    leadService.createCounselor(body.get("name"), body.get("email"))));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ResponseWrapper.error(e.getMessage(), e.getMessage()));
        }
    }
}
