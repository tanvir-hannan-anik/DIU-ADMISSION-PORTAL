package com.university.controller;

import com.university.model.dto.ResponseWrapper;
import com.university.model.entity.User;
import com.university.repository.UserRepository;
import com.university.service.AuditService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Manage admin-portal staff accounts and their roles. All endpoints live under
 * /v1/admin/** (role-gated in SecurityConfig); mutating endpoints additionally
 * require the top-level ADMIN role — only a super admin can manage the team.
 */
@RestController
@RequestMapping("/v1/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;

    // Roles that belong to the admin portal (everything except "student").
    public static final List<String> PORTAL_ROLES =
            List.of("admin", "admission_officer", "marketing", "faculty_admin");

    private boolean isSuperAdmin(Authentication auth) {
        return auth != null && auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(a -> a.equals("ROLE_ADMIN"));
    }

    private Map<String, Object> view(User u) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", u.getId());
        m.put("name", u.getName());
        m.put("email", u.getEmail());
        m.put("role", u.getRole());
        m.put("active", Boolean.TRUE.equals(u.getVerified()));
        m.put("createdAt", u.getCreatedAt());
        return m;
    }

    private String normRole(String role) {
        String r = role == null ? "" : role.trim().toLowerCase();
        if (!PORTAL_ROLES.contains(r)) throw new RuntimeException("INVALID_ROLE");
        return r;
    }

    @GetMapping
    public ResponseEntity<ResponseWrapper<Object>> list() {
        List<Map<String, Object>> users = userRepository.findByRoleInOrderByCreatedAtDesc(PORTAL_ROLES)
                .stream().map(this::view).collect(Collectors.toList());
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("users", users);
        body.put("roles", PORTAL_ROLES);
        return ResponseEntity.ok(ResponseWrapper.success(body));
    }

    @PostMapping
    public ResponseEntity<ResponseWrapper<Object>> create(
            @RequestBody Map<String, String> body, Authentication auth) {
        if (!isSuperAdmin(auth)) return forbidden();
        try {
            String email = Optional.ofNullable(body.get("email")).map(String::trim).map(String::toLowerCase).orElse("");
            String password = body.get("password");
            if (email.isBlank() || password == null || password.length() < 8)
                return ResponseEntity.badRequest().body(ResponseWrapper.error("INVALID_INPUT", "Email and an 8+ char password are required."));
            if (userRepository.existsByEmail(email))
                return ResponseEntity.badRequest().body(ResponseWrapper.error("ACCOUNT_EXISTS", "A user with that email already exists."));

            String role = normRole(body.get("role"));
            User u = userRepository.save(User.builder()
                    .email(email)
                    .name(body.getOrDefault("name", email.split("@")[0]))
                    .password(passwordEncoder.encode(password))
                    .role(role)
                    .verified(true)
                    .build());
            auditService.record(auth.getName(), "USER_CREATED", "Created " + role + " " + email, null);
            return ResponseEntity.ok(ResponseWrapper.success(view(u)));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ResponseWrapper.error(e.getMessage(), e.getMessage()));
        }
    }

    @PutMapping("/{id}/role")
    public ResponseEntity<ResponseWrapper<Object>> setRole(
            @PathVariable Long id, @RequestBody Map<String, String> body, Authentication auth) {
        if (!isSuperAdmin(auth)) return forbidden();
        try {
            User u = userRepository.findById(id).orElseThrow(() -> new RuntimeException("USER_NOT_FOUND"));
            if (u.getEmail().equalsIgnoreCase(auth.getName()))
                return ResponseEntity.badRequest().body(ResponseWrapper.error("SELF_CHANGE", "You cannot change your own role."));
            u.setRole(normRole(body.get("role")));
            userRepository.save(u);
            auditService.record(auth.getName(), "USER_ROLE_CHANGED", "Set " + u.getEmail() + " → " + u.getRole(), null);
            return ResponseEntity.ok(ResponseWrapper.success(view(u)));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ResponseWrapper.error(e.getMessage(), e.getMessage()));
        }
    }

    @PutMapping("/{id}/active")
    public ResponseEntity<ResponseWrapper<Object>> setActive(
            @PathVariable Long id, @RequestBody Map<String, Object> body, Authentication auth) {
        if (!isSuperAdmin(auth)) return forbidden();
        try {
            User u = userRepository.findById(id).orElseThrow(() -> new RuntimeException("USER_NOT_FOUND"));
            if (u.getEmail().equalsIgnoreCase(auth.getName()))
                return ResponseEntity.badRequest().body(ResponseWrapper.error("SELF_CHANGE", "You cannot disable your own account."));
            u.setVerified(Boolean.TRUE.equals(body.get("active")));
            userRepository.save(u);
            auditService.record(auth.getName(), "USER_ACTIVE_CHANGED",
                    (u.getVerified() ? "Enabled " : "Disabled ") + u.getEmail(), null);
            return ResponseEntity.ok(ResponseWrapper.success(view(u)));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ResponseWrapper.error(e.getMessage(), e.getMessage()));
        }
    }

    private ResponseEntity<ResponseWrapper<Object>> forbidden() {
        return ResponseEntity.status(403).body(
                ResponseWrapper.error("FORBIDDEN", "Only a Super Admin can manage users."));
    }
}
