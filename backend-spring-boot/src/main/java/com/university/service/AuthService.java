package com.university.service;

import com.university.model.entity.AdmittedStudent;
import com.university.model.entity.User;
import com.university.repository.AdmittedStudentRepository;
import com.university.repository.UserRepository;
import com.university.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AdmittedStudentRepository admittedStudentRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    /**
     * Step 1: Register — check email in admitted_students, create unverified user, send demo link.
     */
    public Map<String, Object> register(String email) {
        AdmittedStudent student = admittedStudentRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("EMAIL_NOT_FOUND"));

        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("ACCOUNT_EXISTS");
        }

        String token = UUID.randomUUID().toString();

        User user = User.builder()
                .email(email)
                .admittedStudentId(student.getId())
                .verified(false)
                .verificationToken(token)
                .build();
        userRepository.save(user);

        // Demo: return verification link directly (no real email sent)
        String verificationLink = "/set-password?token=" + token;

        return Map.of(
                "message", "Verification link sent (demo mode)",
                "studentName", student.getName(),
                "verificationLink", verificationLink
        );
    }

    /**
     * Step 2: Verify token is valid (called when user clicks verification link).
     */
    public Map<String, Object> verifyToken(String token) {
        User user = userRepository.findByVerificationToken(token)
                .orElseThrow(() -> new RuntimeException("INVALID_TOKEN"));

        if (Boolean.TRUE.equals(user.getVerified())) {
            throw new RuntimeException("TOKEN_ALREADY_USED");
        }

        return Map.of("email", user.getEmail(), "valid", true);
    }

    /**
     * Step 3: Set password — activate account.
     */
    public Map<String, Object> setPassword(String token, String rawPassword) {
        User user = userRepository.findByVerificationToken(token)
                .orElseThrow(() -> new RuntimeException("INVALID_TOKEN"));

        if (Boolean.TRUE.equals(user.getVerified())) {
            throw new RuntimeException("TOKEN_ALREADY_USED");
        }

        user.setPassword(passwordEncoder.encode(rawPassword));
        user.setVerified(true);
        user.setVerificationToken(null);
        userRepository.save(user);

        return Map.of("message", "Account activated successfully");
    }

    /**
     * Step 4: Login.
     */
    public Map<String, Object> login(String email, String rawPassword) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("INVALID_CREDENTIALS"));

        if (!Boolean.TRUE.equals(user.getVerified())) {
            throw new RuntimeException("ACCOUNT_NOT_VERIFIED");
        }

        if (!passwordEncoder.matches(rawPassword, user.getPassword())) {
            throw new RuntimeException("INVALID_CREDENTIALS");
        }

        String token = jwtUtil.generateToken(email);

        AdmittedStudent student = admittedStudentRepository.findById(user.getAdmittedStudentId())
                .orElseThrow(() -> new RuntimeException("STUDENT_NOT_FOUND"));

        return Map.of(
                "token", token,
                "user", Map.of(
                        "email", user.getEmail(),
                        "name", student.getName(),
                        "studentId", student.getStudentId(),
                        "department", student.getDepartment(),
                        "semester", student.getSemester()
                )
        );
    }
}
