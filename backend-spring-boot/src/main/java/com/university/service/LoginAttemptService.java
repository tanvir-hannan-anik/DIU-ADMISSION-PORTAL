package com.university.service;

import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory brute-force protection for the login endpoint. After
 * MAX_ATTEMPTS consecutive failures for an email, that email is locked
 * for LOCKOUT_MINUTES. A successful login clears the counter.
 *
 * Note: in-memory means counters reset on restart and are per-instance.
 * That is acceptable for a single small deployment; move to Redis if the
 * API is ever scaled to multiple instances.
 */
@Service
public class LoginAttemptService {

    private static final int MAX_ATTEMPTS = 5;
    private static final long LOCKOUT_MINUTES = 15;

    private record Attempt(int count, Instant lockedUntil) {}

    private final ConcurrentHashMap<String, Attempt> attempts = new ConcurrentHashMap<>();

    private String key(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }

    public boolean isLocked(String email) {
        Attempt a = attempts.get(key(email));
        if (a == null || a.lockedUntil() == null) return false;
        if (Instant.now().isBefore(a.lockedUntil())) return true;
        // Lock expired — clear it.
        attempts.remove(key(email));
        return false;
    }

    public long minutesRemaining(String email) {
        Attempt a = attempts.get(key(email));
        if (a == null || a.lockedUntil() == null) return 0;
        long secs = a.lockedUntil().getEpochSecond() - Instant.now().getEpochSecond();
        return Math.max(0, (secs + 59) / 60);
    }

    public void recordFailure(String email) {
        attempts.compute(key(email), (k, prev) -> {
            int count = (prev == null ? 0 : prev.count()) + 1;
            Instant lockedUntil = count >= MAX_ATTEMPTS
                    ? Instant.now().plusSeconds(LOCKOUT_MINUTES * 60)
                    : null;
            return new Attempt(count, lockedUntil);
        });
    }

    public void recordSuccess(String email) {
        attempts.remove(key(email));
    }
}
