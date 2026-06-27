package com.university.controller;

import com.university.model.dto.ResponseWrapper;
import com.university.model.entity.AdminAuditLog;
import com.university.model.entity.User;
import com.university.repository.AdminAuditLogRepository;
import com.university.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
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
}
