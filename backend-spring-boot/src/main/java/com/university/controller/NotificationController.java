package com.university.controller;

import com.university.model.dto.ResponseWrapper;
import com.university.model.entity.StudentNotification;
import com.university.repository.StudentNotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final StudentNotificationRepository notifRepo;

    private String currentEmail() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }

    @GetMapping("/my")
    public ResponseEntity<ResponseWrapper<List<StudentNotification>>> getMyNotifications() {
        return ResponseEntity.ok(ResponseWrapper.success(
                notifRepo.findByEmailOrderByCreatedAtDesc(currentEmail())));
    }

    @GetMapping("/my/unread")
    public ResponseEntity<ResponseWrapper<List<StudentNotification>>> getUnread() {
        return ResponseEntity.ok(ResponseWrapper.success(
                notifRepo.findByEmailAndIsReadFalseOrderByCreatedAtDesc(currentEmail())));
    }

    @GetMapping("/my/count")
    public ResponseEntity<ResponseWrapper<Map<String, Long>>> getUnreadCount() {
        long count = notifRepo.countByEmailAndIsReadFalse(currentEmail());
        return ResponseEntity.ok(ResponseWrapper.success(Map.of("unreadCount", count)));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<ResponseWrapper<StudentNotification>> markRead(@PathVariable Long id) {
        return notifRepo.findById(id).map(n -> {
            n.setIsRead(true);
            return ResponseEntity.ok(ResponseWrapper.success(notifRepo.save(n)));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/read-all")
    public ResponseEntity<ResponseWrapper<Map<String, Integer>>> markAllRead() {
        int updated = notifRepo.markAllReadByEmail(currentEmail());
        return ResponseEntity.ok(ResponseWrapper.success(Map.of("updated", updated)));
    }
}
