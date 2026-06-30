package com.university.service;

import com.university.model.entity.ChatLog;
import com.university.repository.ChatLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatLogService {

    private final ChatLogRepository repository;

    public ChatLog record(String moduleType, String question, Boolean answered, Long responseTimeMs, String lang) {
        return repository.save(ChatLog.builder()
                .moduleType(moduleType == null ? "general" : moduleType)
                .question(truncate(question, 1000))
                .answered(answered == null ? Boolean.TRUE : answered)
                .responseTimeMs(responseTimeMs)
                .lang(lang)
                .build());
    }

    public Map<String, Object> stats() {
        LocalDateTime weekAgo = LocalDateTime.now().minusDays(7);
        List<ChatLog> recent = repository.findByCreatedAtAfter(LocalDateTime.now().minusDays(30));

        long total = repository.count();
        long last7 = repository.countByCreatedAtAfter(weekAgo);
        long unanswered = repository.countByAnsweredFalse();
        double answeredRate = total > 0 ? Math.round((1 - (unanswered * 1.0 / total)) * 1000) / 10.0 : 0.0;

        double avgMs = recent.stream().filter(c -> c.getResponseTimeMs() != null)
                .mapToLong(ChatLog::getResponseTimeMs).average().orElse(0);

        // Volume per day (last 7 days).
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("MMM dd");
        Map<String, Long> daily = new LinkedHashMap<>();
        LocalDate today = LocalDate.now();
        for (int i = 6; i >= 0; i--) daily.put(today.minusDays(i).format(fmt), 0L);
        recent.stream()
                .filter(c -> c.getCreatedAt() != null && !c.getCreatedAt().toLocalDate().isBefore(today.minusDays(6)))
                .forEach(c -> daily.merge(c.getCreatedAt().toLocalDate().format(fmt), 1L, Long::sum));

        // By module.
        Map<String, Long> byModule = recent.stream()
                .collect(Collectors.groupingBy(
                        c -> c.getModuleType() == null ? "general" : c.getModuleType(),
                        Collectors.counting()));

        // Top repeated questions (exact, case-insensitive).
        Map<String, Long> topQuestions = recent.stream()
                .filter(c -> c.getQuestion() != null && !c.getQuestion().isBlank())
                .collect(Collectors.groupingBy(c -> c.getQuestion().trim().toLowerCase(), Collectors.counting()))
                .entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(10)
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue, (a, b) -> a, LinkedHashMap::new));

        List<Map<String, Object>> unansweredList = repository.findTop20ByAnsweredFalseOrderByCreatedAtDesc()
                .stream().map(c -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("question", c.getQuestion());
                    m.put("moduleType", c.getModuleType());
                    m.put("createdAt", c.getCreatedAt());
                    return m;
                }).collect(Collectors.toList());

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("totalChats", total);
        out.put("chatsLast7Days", last7);
        out.put("unanswered", unanswered);
        out.put("answeredRate", answeredRate);
        out.put("avgResponseMs", Math.round(avgMs));
        out.put("dailyVolume", daily);
        out.put("byModule", byModule);
        out.put("topQuestions", topQuestions);
        out.put("recentUnanswered", unansweredList);
        return out;
    }

    private String truncate(String v, int max) {
        if (v == null) return null;
        return v.length() <= max ? v : v.substring(0, max);
    }
}
