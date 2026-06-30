package com.university.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

/**
 * One chatbot exchange, logged (best-effort) by the frontend after each reply.
 * Powers the admin "Chat Analytics" view: volume, answered-rate, response time,
 * and which questions go unanswered.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "chat_logs", indexes = {
        @Index(name = "idx_chat_created_at", columnList = "created_at"),
        @Index(name = "idx_chat_module", columnList = "module_type")
})
public class ChatLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** chatbot | smart-advisor | smart-proctor | general */
    @Column(name = "module_type")
    private String moduleType;

    @Column(name = "question", length = 1000)
    private String question;

    /** Whether the assistant returned a usable answer. */
    @Column(name = "answered")
    @Builder.Default
    private Boolean answered = true;

    @Column(name = "response_time_ms")
    private Long responseTimeMs;

    @Column(name = "lang")
    private String lang;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }
}
