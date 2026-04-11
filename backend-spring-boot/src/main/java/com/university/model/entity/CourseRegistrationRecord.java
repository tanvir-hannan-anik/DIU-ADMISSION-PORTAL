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
@Table(name = "course_registrations")
public class CourseRegistrationRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "email", nullable = false)
    private String email;

    @Column(name = "semester", nullable = false)
    private String semester;

    @Column(name = "courses_json", columnDefinition = "TEXT")
    private String coursesJson;

    @Column(name = "total_credits")
    private Double totalCredits;

    @Column(name = "total_fee")
    private Long totalFee;

    @Column(name = "status")
    private String status;

    @Column(name = "registered_at")
    private LocalDateTime registeredAt;

    @PrePersist
    public void prePersist() {
        registeredAt = LocalDateTime.now();
    }
}
