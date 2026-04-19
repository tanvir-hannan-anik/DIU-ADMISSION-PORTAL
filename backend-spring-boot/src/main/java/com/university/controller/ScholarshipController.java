package com.university.controller;

import com.university.model.dto.ResponseWrapper;
import com.university.model.entity.ScholarshipApplication;
import com.university.model.entity.StudentNotification;
import com.university.repository.ScholarshipApplicationRepository;
import com.university.repository.StudentNotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/v1/scholarships")
@RequiredArgsConstructor
public class ScholarshipController {

    private final ScholarshipApplicationRepository scholarshipRepo;
    private final StudentNotificationRepository notifRepo;

    private String currentEmail() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }

    @GetMapping("/my")
    public ResponseEntity<ResponseWrapper<List<ScholarshipApplication>>> getMyApplications() {
        return ResponseEntity.ok(ResponseWrapper.success(
                scholarshipRepo.findByEmailOrderByAppliedAtDesc(currentEmail())));
    }

    @GetMapping("/all")
    public ResponseEntity<ResponseWrapper<List<ScholarshipApplication>>> getAll() {
        return ResponseEntity.ok(ResponseWrapper.success(scholarshipRepo.findAllByOrderByAppliedAtDesc()));
    }

    @GetMapping("/all/status/{status}")
    public ResponseEntity<ResponseWrapper<List<ScholarshipApplication>>> getByStatus(@PathVariable String status) {
        return ResponseEntity.ok(ResponseWrapper.success(
                scholarshipRepo.findByStatusOrderByAppliedAtDesc(status.toUpperCase())));
    }

    @PostMapping("/apply")
    public ResponseEntity<ResponseWrapper<ScholarshipApplication>> apply(@RequestBody Map<String, Object> body) {
        String email = currentEmail();
        String scholarshipType = (String) body.get("scholarshipType");

        if (scholarshipRepo.existsByEmailAndScholarshipTypeAndStatus(email, scholarshipType, "SUBMITTED") ||
            scholarshipRepo.existsByEmailAndScholarshipTypeAndStatus(email, scholarshipType, "REVIEWING")) {
            return ResponseEntity.badRequest()
                    .body(ResponseWrapper.error("You already have a pending application for this scholarship.", "DUPLICATE_APPLICATION"));
        }

        ScholarshipApplication app = ScholarshipApplication.builder()
                .email(email)
                .studentName((String) body.get("studentName"))
                .studentId((String) body.get("studentId"))
                .department((String) body.get("department"))
                .scholarshipType(scholarshipType)
                .gpa(body.get("gpa") != null ? ((Number) body.get("gpa")).doubleValue() : null)
                .semester((String) body.get("semester"))
                .reason((String) body.get("reason"))
                .supportingDocs((String) body.get("supportingDocs"))
                .build();

        ScholarshipApplication saved = scholarshipRepo.save(app);

        notifRepo.save(StudentNotification.builder()
                .email(email)
                .title("Scholarship Application Submitted")
                .message("Your " + scholarshipType + " scholarship application has been submitted and is under review.")
                .type("INFO")
                .actionUrl("/scholarships")
                .build());

        return ResponseEntity.ok(ResponseWrapper.success(saved));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ResponseWrapper<ScholarshipApplication>> updateStatus(
            @PathVariable Long id, @RequestBody Map<String, Object> body) {
        return scholarshipRepo.findById(id).map(app -> {
            String newStatus = body.getOrDefault("status", "SUBMITTED").toString().toUpperCase();
            app.setStatus(newStatus);
            app.setReviewedAt(LocalDateTime.now());
            if (body.containsKey("reviewerNote")) app.setReviewerNote((String) body.get("reviewerNote"));
            if (body.containsKey("awardedAmount") && body.get("awardedAmount") != null) {
                app.setAwardedAmount(((Number) body.get("awardedAmount")).longValue());
            }
            ScholarshipApplication saved = scholarshipRepo.save(app);

            String notifMsg = "APPROVED".equals(newStatus)
                    ? "Congratulations! Your scholarship application has been approved."
                    : "Your scholarship application status has been updated to: " + newStatus;
            notifRepo.save(StudentNotification.builder()
                    .email(app.getEmail())
                    .title("Scholarship Application Update")
                    .message(notifMsg)
                    .type("APPROVED".equals(newStatus) ? "SUCCESS" : "INFO")
                    .actionUrl("/scholarships")
                    .build());

            return ResponseEntity.ok(ResponseWrapper.success(saved));
        }).orElse(ResponseEntity.notFound().build());
    }
}
