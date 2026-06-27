package com.university.repository;

import com.university.model.entity.Counselor;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CounselorRepository extends JpaRepository<Counselor, Long> {
    List<Counselor> findAllByOrderByNameAsc();
}
