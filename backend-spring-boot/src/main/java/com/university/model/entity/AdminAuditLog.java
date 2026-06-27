package com.university.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Append-only audit trail of security-relevant admin events
 * (logins, failures, and — later — sensitive admin actions).
 * Feeds the portal's Login History / Activity Logs / Audit Logs features.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "admin_audit_logs", indexes = {
        @Index(name = "idx_audit_email", columnList = "email"),
        @Index(name = "idx_audit_created_at", columnList = "created_at")
})
public class AdminAuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** The actor's email (or attempted email on a failed login). */
    @Column(name = "email")
    private String email;

    /** Event type, e.g. LOGIN_SUCCESS, LOGIN_FAILURE, LOGIN_LOCKED. */
    @Column(name = "action", nullable = false)
    private String action;

    /** Optional human-readable detail. */
    @Column(name = "detail", length = 512)
    private String detail;

    @Column(name = "ip_address")
    private String ipAddress;

    @Column(name = "user_agent", length = 512)
    private String userAgent;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }
}
