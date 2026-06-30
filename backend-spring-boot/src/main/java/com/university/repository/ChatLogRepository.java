package com.university.repository;

import com.university.model.entity.ChatLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface ChatLogRepository extends JpaRepository<ChatLog, Long> {

    long countByCreatedAtAfter(LocalDateTime since);

    long countByAnsweredFalse();

    List<ChatLog> findTop20ByAnsweredFalseOrderByCreatedAtDesc();

    List<ChatLog> findByCreatedAtAfter(LocalDateTime since);
}
