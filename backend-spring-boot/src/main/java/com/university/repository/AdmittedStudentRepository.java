package com.university.repository;

import com.university.model.entity.AdmittedStudent;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface AdmittedStudentRepository extends JpaRepository<AdmittedStudent, Long> {
    Optional<AdmittedStudent> findByEmail(String email);
}
