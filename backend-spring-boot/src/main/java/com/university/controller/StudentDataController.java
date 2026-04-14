package com.university.controller;

import com.university.model.dto.ResponseWrapper;
import com.university.model.entity.CourseRegistrationRecord;
import com.university.model.entity.LateRegistrationRecord;
import com.university.model.entity.StudentProfile;
import com.university.repository.CourseRegistrationRepository;
import com.university.repository.LateRegistrationRepository;
import com.university.repository.StudentProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/v1/student")
@RequiredArgsConstructor
public class StudentDataController {

    private final StudentProfileRepository profileRepo;
    private final CourseRegistrationRepository courseRegRepo;
    private final LateRegistrationRepository lateRegRepo;

    private String currentEmail() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }

    // ── Profile ───────────────────────────────────────────────────────────────

    @GetMapping("/profile")
    public ResponseEntity<ResponseWrapper<StudentProfile>> getProfile() {
        String email = currentEmail();
        StudentProfile profile = profileRepo.findByEmail(email)
                .orElse(StudentProfile.builder().email(email).build());
        return ResponseEntity.ok(ResponseWrapper.success(profile));
    }

    @PutMapping("/profile")
    public ResponseEntity<ResponseWrapper<StudentProfile>> saveProfile(@RequestBody Map<String, Object> body) {
        String email = currentEmail();
        StudentProfile profile = profileRepo.findByEmail(email)
                .orElse(StudentProfile.builder().email(email).build());

        if (body.containsKey("name"))             profile.setName((String) body.get("name"));
        if (body.containsKey("studentId"))        profile.setStudentId((String) body.get("studentId"));
        if (body.containsKey("department"))       profile.setDepartment((String) body.get("department"));
        if (body.containsKey("semester"))         profile.setSemester((String) body.get("semester"));
        if (body.containsKey("phone"))            profile.setPhone((String) body.get("phone"));
        if (body.containsKey("address"))          profile.setAddress((String) body.get("address"));
        if (body.containsKey("cgpa") && body.get("cgpa") instanceof Number)
            profile.setCgpa(((Number) body.get("cgpa")).doubleValue());
        if (body.containsKey("creditsCompleted") && body.get("creditsCompleted") instanceof Number)
            profile.setCreditsCompleted(((Number) body.get("creditsCompleted")).intValue());

        profileRepo.save(profile);
        return ResponseEntity.ok(ResponseWrapper.success(profile));
    }

    // ── Course Registrations ──────────────────────────────────────────────────

    @GetMapping("/registrations")
    public ResponseEntity<ResponseWrapper<List<CourseRegistrationRecord>>> getRegistrations() {
        String email = currentEmail();
        List<CourseRegistrationRecord> list = courseRegRepo.findByEmailOrderByRegisteredAtDesc(email);
        return ResponseEntity.ok(ResponseWrapper.success(list));
    }

    @PostMapping("/registrations")
    public ResponseEntity<ResponseWrapper<CourseRegistrationRecord>> saveRegistration(@RequestBody Map<String, Object> body) {
        String email = currentEmail();
        CourseRegistrationRecord record = CourseRegistrationRecord.builder()
                .email(email)
                .semester((String) body.get("semester"))
                .coursesJson((String) body.get("coursesJson"))
                .totalCredits(body.get("totalCredits") != null ? ((Number) body.get("totalCredits")).doubleValue() : null)
                .totalFee(body.get("totalFee") != null ? ((Number) body.get("totalFee")).longValue() : null)
                .status((String) body.getOrDefault("status", "APPROVED"))
                .build();
        courseRegRepo.save(record);
        return ResponseEntity.ok(ResponseWrapper.success(record));
    }

    // ── Late Registrations ────────────────────────────────────────────────────

    @GetMapping("/late-registrations")
    public ResponseEntity<ResponseWrapper<List<LateRegistrationRecord>>> getLateRegistrations() {
        String email = currentEmail();
        List<LateRegistrationRecord> list = lateRegRepo.findByEmailOrderBySubmittedAtDesc(email);
        return ResponseEntity.ok(ResponseWrapper.success(list));
    }

    @PostMapping("/late-registrations")
    public ResponseEntity<ResponseWrapper<LateRegistrationRecord>> saveLateRegistration(@RequestBody Map<String, Object> body) {
        String email = currentEmail();
        LateRegistrationRecord record = LateRegistrationRecord.builder()
                .email(email)
                .semester((String) body.get("semester"))
                .coursesJson((String) body.get("coursesJson"))
                .reason((String) body.get("reason"))
                .evidenceCount(body.get("evidenceCount") != null ? ((Number) body.get("evidenceCount")).intValue() : 0)
                .status((String) body.getOrDefault("status", "SUBMITTED"))
                .build();
        lateRegRepo.save(record);
        return ResponseEntity.ok(ResponseWrapper.success(record));
    }
}
