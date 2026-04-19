package com.university.controller;

import com.university.model.dto.ResponseWrapper;
import com.university.model.entity.Payment;
import com.university.model.entity.StudentNotification;
import com.university.repository.PaymentRepository;
import com.university.repository.StudentNotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/v1/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentRepository paymentRepo;
    private final StudentNotificationRepository notifRepo;

    private String currentEmail() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }

    @GetMapping("/my")
    public ResponseEntity<ResponseWrapper<List<Payment>>> getMyPayments() {
        return ResponseEntity.ok(ResponseWrapper.success(
                paymentRepo.findByEmailOrderByCreatedAtDesc(currentEmail())));
    }

    @GetMapping("/my/total")
    public ResponseEntity<ResponseWrapper<Map<String, Object>>> getMyTotal() {
        String email = currentEmail();
        Long total = paymentRepo.sumCompletedByEmail(email);
        return ResponseEntity.ok(ResponseWrapper.success(Map.of("totalPaid", total)));
    }

    @GetMapping("/all")
    public ResponseEntity<ResponseWrapper<List<Payment>>> getAllPayments() {
        return ResponseEntity.ok(ResponseWrapper.success(paymentRepo.findAllByOrderByCreatedAtDesc()));
    }

    @PostMapping
    public ResponseEntity<ResponseWrapper<Payment>> createPayment(@RequestBody Map<String, Object> body) {
        String email = currentEmail();
        Payment payment = Payment.builder()
                .email(email)
                .studentId((String) body.get("studentId"))
                .paymentType((String) body.get("paymentType"))
                .amount(body.get("amount") != null ? ((Number) body.get("amount")).longValue() : 0L)
                .status((String) body.getOrDefault("status", "COMPLETED"))
                .paymentMethod((String) body.getOrDefault("paymentMethod", "ONLINE"))
                .semester((String) body.get("semester"))
                .description((String) body.get("description"))
                .paidAt(LocalDateTime.now())
                .build();

        Payment saved = paymentRepo.save(payment);

        notifRepo.save(StudentNotification.builder()
                .email(email)
                .title("Payment Confirmed")
                .message("Your payment of ৳" + payment.getAmount() + " for " + payment.getPaymentType() + " has been recorded.")
                .type("SUCCESS")
                .actionUrl("/profile")
                .build());

        return ResponseEntity.ok(ResponseWrapper.success(saved));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ResponseWrapper<Payment>> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        return paymentRepo.findById(id).map(payment -> {
            payment.setStatus(body.getOrDefault("status", "PENDING").toUpperCase());
            if ("COMPLETED".equals(payment.getStatus())) {
                payment.setPaidAt(LocalDateTime.now());
            }
            return ResponseEntity.ok(ResponseWrapper.success(paymentRepo.save(payment)));
        }).orElse(ResponseEntity.notFound().build());
    }
}
