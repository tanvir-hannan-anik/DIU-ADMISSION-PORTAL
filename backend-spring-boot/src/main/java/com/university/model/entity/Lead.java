package com.university.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

/**
 * A prospective student captured from the public site (contact form, admission
 * start, chatbot, etc.). Backs the Lead Management / CRM section of the admin portal.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "leads", indexes = {
        @Index(name = "idx_lead_email", columnList = "email"),
        @Index(name = "idx_lead_status", columnList = "status"),
        @Index(name = "idx_lead_created_at", columnList = "created_at")
})
public class Lead {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name")
    private String name;

    @Column(name = "email", nullable = false)
    private String email;

    @Column(name = "phone")
    private String phone;

    /** Program/department the lead is interested in. */
    @Column(name = "interested_program")
    private String interestedProgram;

    /** WEBSITE, CONTACT_FORM, APPLICATION, CHATBOT, REFERRAL, etc. */
    @Column(name = "source")
    @Builder.Default
    private String source = "WEBSITE";

    /** NEW, CONTACTED, QUALIFIED, APPLICATION_STARTED, SUBMITTED, ADMITTED, LOST. */
    @Column(name = "status")
    @Builder.Default
    private String status = "NEW";

    /** 0–100 lead quality score (heuristic now, AI later). */
    @Column(name = "score")
    @Builder.Default
    private Integer score = 0;

    @Column(name = "assigned_counselor_id")
    private Long assignedCounselorId;

    /** When the next follow-up with this lead is due (drives the Follow Ups page). */
    @Column(name = "next_follow_up_at")
    private LocalDateTime nextFollowUpAt;

    @Column(name = "message", columnDefinition = "TEXT")
    private String message;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
