package com.university.controller;

import com.university.model.dto.ResponseWrapper;
import com.university.model.entity.JobListing;
import com.university.repository.JobListingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/v1/jobs")
@RequiredArgsConstructor
public class JobListingController {

    private final JobListingRepository jobRepo;

    @GetMapping
    public ResponseEntity<ResponseWrapper<List<JobListing>>> getJobs(@RequestParam(required = false) String term) {
        List<JobListing> jobs;
        if (term != null && !term.isBlank()) {
            jobs = jobRepo.searchJobs(term.toLowerCase().trim());
        } else {
            jobs = jobRepo.findByIsActiveTrueOrderByIsFeaturedDescPostedAtDesc();
        }
        return ResponseEntity.ok(ResponseWrapper.success(jobs));
    }

    @GetMapping("/category/{category}")
    public ResponseEntity<ResponseWrapper<List<JobListing>>> getByCategory(@PathVariable String category) {
        return ResponseEntity.ok(ResponseWrapper.success(
                jobRepo.findByCategoryAndIsActiveTrueOrderByPostedAtDesc(category)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ResponseWrapper<JobListing>> getById(@PathVariable Long id) {
        return jobRepo.findById(id)
                .map(j -> ResponseEntity.ok(ResponseWrapper.success(j)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<ResponseWrapper<JobListing>> create(@RequestBody Map<String, Object> body) {
        JobListing job = buildFromBody(new JobListing(), body);
        job.setPostedAt(LocalDateTime.now());
        return ResponseEntity.ok(ResponseWrapper.success(jobRepo.save(job)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ResponseWrapper<JobListing>> update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        return jobRepo.findById(id).map(job -> {
            buildFromBody(job, body);
            return ResponseEntity.ok(ResponseWrapper.success(jobRepo.save(job)));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ResponseWrapper<String>> delete(@PathVariable Long id) {
        if (!jobRepo.existsById(id)) return ResponseEntity.notFound().build();
        jobRepo.findById(id).ifPresent(j -> { j.setIsActive(false); jobRepo.save(j); });
        return ResponseEntity.ok(ResponseWrapper.success("Job listing deactivated"));
    }

    private JobListing buildFromBody(JobListing job, Map<String, Object> body) {
        if (body.containsKey("title"))       job.setTitle((String) body.get("title"));
        if (body.containsKey("company"))     job.setCompany((String) body.get("company"));
        if (body.containsKey("location"))    job.setLocation((String) body.get("location"));
        if (body.containsKey("type"))        job.setType((String) body.get("type"));
        if (body.containsKey("salary"))      job.setSalary((String) body.get("salary"));
        if (body.containsKey("url"))         job.setUrl((String) body.get("url"));
        if (body.containsKey("description")) job.setDescription((String) body.get("description"));
        if (body.containsKey("logo"))        job.setLogo((String) body.get("logo"));
        if (body.containsKey("category"))    job.setCategory((String) body.get("category"));
        if (body.containsKey("isFeatured"))  job.setIsFeatured((Boolean) body.get("isFeatured"));
        if (body.containsKey("isActive"))    job.setIsActive((Boolean) body.get("isActive"));
        return job;
    }
}
