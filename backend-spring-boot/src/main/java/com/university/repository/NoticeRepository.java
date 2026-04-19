package com.university.repository;

import com.university.model.entity.Notice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.time.LocalDateTime;
import java.util.List;

public interface NoticeRepository extends JpaRepository<Notice, Long> {

    @Query("SELECT n FROM Notice n WHERE n.isActive = true AND (n.expiresAt IS NULL OR n.expiresAt > :now) ORDER BY n.createdAt DESC")
    List<Notice> findActiveNotices(LocalDateTime now);

    List<Notice> findByTargetRoleInAndIsActiveTrueOrderByCreatedAtDesc(List<String> roles);

    List<Notice> findAllByOrderByCreatedAtDesc();
}
