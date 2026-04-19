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
@Table(name = "job_listings")
public class JobListing {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String company;

    @Column(nullable = false)
    private String location;

    private String type; // Full-time, Part-time, Internship, Remote

    private String salary;

    private String url;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String logo;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "is_featured")
    @Builder.Default
    private Boolean isFeatured = false;

    private String category; // tech, business, health, engineering

    @Column(name = "posted_at")
    private LocalDateTime postedAt;

    @PrePersist
    public void prePersist() {
        if (postedAt == null) postedAt = LocalDateTime.now();
    }
}
