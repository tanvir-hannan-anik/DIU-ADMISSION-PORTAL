package com.university.controller;

import com.university.model.dto.ResponseWrapper;
import com.university.model.entity.Notice;
import com.university.repository.NoticeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/v1/notices")
@RequiredArgsConstructor
public class NoticeController {

    private final NoticeRepository noticeRepo;

    @GetMapping
    public ResponseEntity<ResponseWrapper<List<Notice>>> getActiveNotices() {
        List<Notice> notices = noticeRepo.findActiveNotices(LocalDateTime.now());
        return ResponseEntity.ok(ResponseWrapper.success(notices));
    }

    @GetMapping("/all")
    public ResponseEntity<ResponseWrapper<List<Notice>>> getAllNotices() {
        return ResponseEntity.ok(ResponseWrapper.success(noticeRepo.findAllByOrderByCreatedAtDesc()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ResponseWrapper<Notice>> getById(@PathVariable Long id) {
        return noticeRepo.findById(id)
                .map(n -> ResponseEntity.ok(ResponseWrapper.success(n)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<ResponseWrapper<Notice>> create(@RequestBody Map<String, Object> body) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        Notice notice = Notice.builder()
                .title((String) body.get("title"))
                .content((String) body.get("content"))
                .type(body.getOrDefault("type", "INFO").toString())
                .targetRole(body.getOrDefault("targetRole", "all").toString())
                .createdBy(email)
                .isActive(true)
                .build();

        if (body.containsKey("expiresAt") && body.get("expiresAt") != null) {
            try {
                notice.setExpiresAt(LocalDateTime.parse(body.get("expiresAt").toString()));
            } catch (java.time.format.DateTimeParseException ignored) {}
        }

        return ResponseEntity.ok(ResponseWrapper.success(noticeRepo.save(notice)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ResponseWrapper<Notice>> update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        return noticeRepo.findById(id).map(notice -> {
            if (body.containsKey("title"))      notice.setTitle((String) body.get("title"));
            if (body.containsKey("content"))    notice.setContent((String) body.get("content"));
            if (body.containsKey("type"))       notice.setType((String) body.get("type"));
            if (body.containsKey("targetRole")) notice.setTargetRole((String) body.get("targetRole"));
            if (body.containsKey("isActive"))   notice.setIsActive((Boolean) body.get("isActive"));
            return ResponseEntity.ok(ResponseWrapper.success(noticeRepo.save(notice)));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ResponseWrapper<String>> delete(@PathVariable Long id) {
        if (!noticeRepo.existsById(id)) return ResponseEntity.notFound().build();
        noticeRepo.deleteById(id);
        return ResponseEntity.ok(ResponseWrapper.success("Notice deleted"));
    }
}
