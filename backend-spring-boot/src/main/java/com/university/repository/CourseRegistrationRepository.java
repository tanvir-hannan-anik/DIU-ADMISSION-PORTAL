package com.university.repository;

import com.university.model.entity.CourseRegistrationRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CourseRegistrationRepository extends JpaRepository<CourseRegistrationRecord, Long> {
    List<CourseRegistrationRecord> findByEmailOrderByRegisteredAtDesc(String email);
}
