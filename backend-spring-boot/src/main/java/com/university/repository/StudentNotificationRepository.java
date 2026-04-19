package com.university.repository;

import com.university.model.entity.StudentNotification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

public interface StudentNotificationRepository extends JpaRepository<StudentNotification, Long> {

    List<StudentNotification> findByEmailOrderByCreatedAtDesc(String email);

    List<StudentNotification> findByEmailAndIsReadFalseOrderByCreatedAtDesc(String email);

    long countByEmailAndIsReadFalse(String email);

    @Modifying
    @Transactional
    @Query("UPDATE StudentNotification n SET n.isRead = true WHERE n.email = :email AND n.isRead = false")
    int markAllReadByEmail(String email);
}
