package com.university.repository;

import com.university.model.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    List<Payment> findByEmailOrderByCreatedAtDesc(String email);

    Optional<Payment> findByTransactionId(String transactionId);

    List<Payment> findAllByOrderByCreatedAtDesc();

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.email = :email AND p.status = 'COMPLETED'")
    Long sumCompletedByEmail(String email);

    List<Payment> findByEmailAndSemester(String email, String semester);
}
