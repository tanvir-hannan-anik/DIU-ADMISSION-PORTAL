package com.university.repository;

import com.university.model.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Optional<User> findByVerificationToken(String token);
    boolean existsByEmail(String email);

    // Admin-portal staff accounts (any non-student role), newest first.
    List<User> findByRoleInOrderByCreatedAtDesc(List<String> roles);
}
