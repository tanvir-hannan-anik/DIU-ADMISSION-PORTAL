package com.university.controller;

import com.university.model.dto.ResponseWrapper;
import com.university.model.entity.AdminAuditLog;
import com.university.model.entity.User;
import com.university.repository.AdminAuditLogRepository;
import com.university.repository.UserRepository;
import com.university.service.AdmissionService;
import com.university.service.LeadService;
import com.university.service.PostHogService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Root of the admin portal API. Everything under /v1/admin/** is gated by
 * hasRole("ADMIN") in SecurityConfig, so reaching any method here means the
 * caller is an authenticated admin.
 */
@RestController
@RequestMapping("/v1/admin")
@RequiredArgsConstructor
public class AdminController {

    private final UserRepository userRepository;
    private final AdminAuditLogRepository auditLogRepository;
    private final LeadService leadService;
    private final AdmissionService admissionService;
    private final PostHogService postHogService;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @Value("${python.service.url:}")
    private String pythonServiceUrl;

    /** Returns the current admin's identity — used by the frontend to confirm access. */
    @GetMapping("/me")
    public ResponseEntity<ResponseWrapper<Object>> me(Authentication authentication) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email).orElse(null);

        Map<String, Object> info = new HashMap<>();
        info.put("email", email);
        info.put("role", user != null && user.getRole() != null ? user.getRole() : "admin");
        info.put("name", user != null && user.getName() != null ? user.getName() : "Administrator");
        return ResponseEntity.ok(ResponseWrapper.success(info));
    }

    /** Paginated audit/login history (Login History, Activity Logs features). */
    @GetMapping("/audit-logs")
    public ResponseEntity<ResponseWrapper<Object>> auditLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        int safeSize = Math.min(Math.max(size, 1), 200);
        Page<AdminAuditLog> logs = auditLogRepository
                .findAllByOrderByCreatedAtDesc(PageRequest.of(Math.max(page, 0), safeSize));

        Map<String, Object> body = new HashMap<>();
        body.put("content", logs.getContent());
        body.put("page", logs.getNumber());
        body.put("totalPages", logs.getTotalPages());
        body.put("totalElements", logs.getTotalElements());
        return ResponseEntity.ok(ResponseWrapper.success(body));
    }

    /** Combined KPIs for the dashboard cards (leads + applications). */
    @GetMapping("/stats")
    public ResponseEntity<ResponseWrapper<Object>> stats() {
        Map<String, Object> out = new HashMap<>(leadService.getLeadStats());
        Map<String, Object> appStats = admissionService.getDashboardStats();
        out.put("totalApplications", appStats.get("total"));
        out.put("admittedApplications", appStats.get("admitted"));
        out.put("pendingApplications", appStats.get("pending"));
        out.put("applicationConversionRate", appStats.get("conversionRate"));
        out.put("departmentBreakdown", appStats.get("departmentBreakdown"));
        return ResponseEntity.ok(ResponseWrapper.success(out));
    }

    /** Connection status of each external integration (Settings → Integrations). */
    @GetMapping("/integrations")
    public ResponseEntity<ResponseWrapper<Object>> integrations() {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("posthog", postHogService.isConfigured());
        out.put("email", mailUsername != null && !mailUsername.isBlank());
        out.put("aiService", pythonServiceUrl != null && !pythonServiceUrl.isBlank());
        out.put("database", true); // reaching this endpoint means the DB is up
        return ResponseEntity.ok(ResponseWrapper.success(out));
    }

    /** All admission applications (Application Tracking). */
    @GetMapping("/applications")
    public ResponseEntity<ResponseWrapper<Object>> applications() {
        return ResponseEntity.ok(ResponseWrapper.success(admissionService.getAllApplications()));
    }

    /** Update an application's status (PENDING/REVIEWING/ADMITTED/REJECTED). */
    @PutMapping("/applications/{appId}/status")
    public ResponseEntity<ResponseWrapper<Object>> updateApplicationStatus(
            @PathVariable String appId, @RequestBody Map<String, String> body) {
        try {
            return ResponseEntity.ok(ResponseWrapper.success(
                    admissionService.updateStatus(appId, body.get("status"))));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ResponseWrapper.error(e.getMessage(), e.getMessage()));
        }
    }
}
