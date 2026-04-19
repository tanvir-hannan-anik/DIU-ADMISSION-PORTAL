package com.university.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "scholarship_applications")
public class ScholarshipApplication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String email;

    @Column(name = "student_name")
    private String studentName;

    @Column(name = "student_id")
    private String studentId;

    @Column(nullable = false)
    private String department;

    @Column(name = "scholarship_type", nullable = false)
    private String scholarshipType; // MERIT, NEED_BASED, SPORTS, FREEDOM_FIGHTER, SPECIAL

    private Double gpa;

    private String semester;

    @Column(columnDefinition = "TEXT")
    private String reason;

    @Column(name = "supporting_docs")
    private String supportingDocs; // comma-separated filenames

    @Column(nullable = false)
    @Builder.Default
    private String status = "SUBMITTED"; // SUBMITTED, REVIEWING, APPROVED, REJECTED

    @Column(name = "reviewer_note", columnDefinition = "TEXT")
    private String reviewerNote;

    @Column(name = "awarded_amount")
    private Long awardedAmount;

    @Column(name = "applied_at")
    private LocalDateTime appliedAt;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @PrePersist
    public void prePersist() {
        appliedAt = LocalDateTime.now();
    }
}
