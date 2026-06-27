package com.university.service;

import com.university.model.entity.AdminAuditLog;
import com.university.repository.AdminAuditLogRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * Records security-relevant admin events to the append-only audit trail.
 * Failures here must never break the calling flow (e.g. a login), so all
 * writes are best-effort.
 */
@Service
@RequiredArgsConstructor
public class AuditService {

    private final AdminAuditLogRepository auditLogRepository;

    public void record(String email, String action, String detail, HttpServletRequest request) {
        try {
            auditLogRepository.save(AdminAuditLog.builder()
                    .email(email)
                    .action(action)
                    .detail(detail)
                    .ipAddress(clientIp(request))
                    .userAgent(truncate(request != null ? request.getHeader("User-Agent") : null, 512))
                    .build());
        } catch (Exception ignored) {
            // Audit logging is best-effort; never propagate.
        }
    }

    private String clientIp(HttpServletRequest request) {
        if (request == null) return null;
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private String truncate(String value, int max) {
        if (value == null) return null;
        return value.length() <= max ? value : value.substring(0, max);
    }
}
