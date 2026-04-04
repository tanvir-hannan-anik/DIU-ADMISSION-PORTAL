package com.university.repository;

import com.university.model.entity.AdmissionApplication;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface AdmissionApplicationRepository extends JpaRepository<AdmissionApplication, Long> {
    Optional<AdmissionApplication> findByEmail(String email);
    Optional<AdmissionApplication> findByAppId(String appId);
    List<AdmissionApplication> findByStatus(String status);
    long countByStatus(String status);
    List<AdmissionApplication> findAllByOrderByCreatedAtDesc();
}
