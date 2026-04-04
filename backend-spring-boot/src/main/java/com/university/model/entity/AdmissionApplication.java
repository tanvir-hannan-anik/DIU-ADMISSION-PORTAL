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
@Table(name = "admission_applications")
public class AdmissionApplication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "app_id", unique = true)
    private String appId;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Column(name = "email", nullable = false)
    private String email;

    @Column(name = "date_of_birth")
    private String dateOfBirth;

    @Column(name = "contact_number")
    private String contactNumber;

    @Column(name = "program")
    private String program;

    @Column(name = "major")
    private String major;

    // SSC fields
    @Column(name = "ssc_result")
    private String sscResult;

    @Column(name = "ssc_group")
    private String sscGroup;

    @Column(name = "ssc_board")
    private String sscBoard;

    @Column(name = "ssc_year")
    private String sscYear;

    @Column(name = "ssc_marksheet")
    private String sscMarksheet;

    // HSC fields
    @Column(name = "hsc_result")
    private String hscResult;

    @Column(name = "hsc_group")
    private String hscGroup;

    @Column(name = "hsc_board")
    private String hscBoard;

    @Column(name = "hsc_year")
    private String hscYear;

    @Column(name = "hsc_marksheet")
    private String hscMarksheet;

    // Admission schedule
    @Column(name = "admission_date")
    private String admissionDate;

    @Column(name = "viva_date")
    private String vivaDate;

    @Column(name = "essay_one", columnDefinition = "TEXT")
    private String essayOne;

    @Column(name = "essay_two", columnDefinition = "TEXT")
    private String essayTwo;

    @Column(name = "status")
    @Builder.Default
    private String status = "PENDING";

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        createdAt = LocalDateTime.now();
        if (appId == null) {
            appId = "DIU-" + System.currentTimeMillis();
        }
    }
}
