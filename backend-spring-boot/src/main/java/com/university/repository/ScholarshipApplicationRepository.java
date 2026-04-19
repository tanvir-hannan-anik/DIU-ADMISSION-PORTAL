package com.university.repository;

import com.university.model.entity.ScholarshipApplication;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ScholarshipApplicationRepository extends JpaRepository<ScholarshipApplication, Long> {

    List<ScholarshipApplication> findByEmailOrderByAppliedAtDesc(String email);

    List<ScholarshipApplication> findAllByOrderByAppliedAtDesc();

    List<ScholarshipApplication> findByStatusOrderByAppliedAtDesc(String status);

    boolean existsByEmailAndScholarshipTypeAndStatus(String email, String scholarshipType, String status);
}
