package com.university.repository;

import com.university.model.entity.LateRegistrationRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface LateRegistrationRepository extends JpaRepository<LateRegistrationRecord, Long> {
    List<LateRegistrationRecord> findByEmailOrderBySubmittedAtDesc(String email);
}
