package com.university.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

/**
 * A timeline entry on a lead: note, status change, assignment, or follow-up.
 * Gives admission officers the communication/history view.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "lead_activities", indexes = {
        @Index(name = "idx_activity_lead", columnList = "lead_id")
})
public class LeadActivity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "lead_id", nullable = false)
    private Long leadId;

    /** CREATED, NOTE, STATUS_CHANGE, ASSIGN, FOLLOW_UP. */
    @Column(name = "type", nullable = false)
    private String type;

    @Column(name = "detail", length = 1000)
    private String detail;

    @Column(name = "created_by")
    private String createdBy;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }
}
