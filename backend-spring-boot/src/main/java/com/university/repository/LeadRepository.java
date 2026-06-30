package com.university.repository;

import com.university.model.entity.Lead;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface LeadRepository extends JpaRepository<Lead, Long> {

    Page<Lead> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Page<Lead> findByStatusOrderByCreatedAtDesc(String status, Pageable pageable);

    List<Lead> findTop5ByOrderByCreatedAtDesc();

    long countByStatus(String status);

    long countByCreatedAtAfter(LocalDateTime since);

    Optional<Lead> findFirstByEmailOrderByCreatedAtDesc(String email);

    // Follow Ups: leads with a scheduled follow-up, soonest first.
    List<Lead> findByNextFollowUpAtIsNotNullOrderByNextFollowUpAtAsc();

    long countByNextFollowUpAtBefore(LocalDateTime when);
}
