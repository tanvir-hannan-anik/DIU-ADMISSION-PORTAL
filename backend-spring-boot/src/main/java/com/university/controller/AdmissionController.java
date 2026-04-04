package com.university.controller;

import com.university.model.dto.AdmissionApplicationRequest;
import com.university.model.dto.ResponseWrapper;
import com.university.model.entity.AdmissionApplication;
import com.university.service.AdmissionService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@Slf4j
@RestController
@RequestMapping("/v1/admission")
public class AdmissionController {

    private final AdmissionService admissionService;

    public AdmissionController(AdmissionService admissionService) {
        this.admissionService = admissionService;
    }

    @PostMapping("/submit")
    public ResponseEntity<ResponseWrapper<AdmissionApplication>> submit(
            @Valid @RequestBody AdmissionApplicationRequest request) {
        AdmissionApplication app = admissionService.submitApplication(request);
        return ResponseEntity.ok(ResponseWrapper.success(app));
    }

    @GetMapping("/applications")
    public ResponseEntity<ResponseWrapper<List<AdmissionApplication>>> getAll() {
        List<AdmissionApplication> apps = admissionService.getAllApplications();
        return ResponseEntity.ok(ResponseWrapper.success(apps));
    }

    @GetMapping("/applications/{appId}")
    public ResponseEntity<ResponseWrapper<AdmissionApplication>> getByAppId(@PathVariable String appId) {
        AdmissionApplication app = admissionService.getByAppId(appId);
        return ResponseEntity.ok(ResponseWrapper.success(app));
    }

    @PatchMapping("/applications/{appId}/status")
    public ResponseEntity<ResponseWrapper<AdmissionApplication>> updateStatus(
            @PathVariable String appId,
            @RequestBody Map<String, String> body) {
        AdmissionApplication app = admissionService.updateStatus(appId, body.getOrDefault("status", "PENDING"));
        return ResponseEntity.ok(ResponseWrapper.success(app));
    }

    @GetMapping("/stats")
    public ResponseEntity<ResponseWrapper<Map<String, Object>>> getStats() {
        Map<String, Object> stats = admissionService.getDashboardStats();
        return ResponseEntity.ok(ResponseWrapper.success(stats));
    }
}
