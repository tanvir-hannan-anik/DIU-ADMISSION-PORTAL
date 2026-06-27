package com.university.service;

import com.university.model.entity.Counselor;
import com.university.model.entity.Lead;
import com.university.model.entity.LeadActivity;
import com.university.repository.CounselorRepository;
import com.university.repository.LeadActivityRepository;
import com.university.repository.LeadRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class LeadService {

    private final LeadRepository leadRepository;
    private final LeadActivityRepository activityRepository;
    private final CounselorRepository counselorRepository;

    // Pipeline order used for stats/grouping.
    public static final List<String> STATUSES = List.of(
            "NEW", "CONTACTED", "QUALIFIED", "APPLICATION_STARTED", "SUBMITTED", "ADMITTED", "LOST");

    // ── Capture (public) — dedupe by email ────────────────────────────────────
    public Lead capture(String name, String email, String phone, String program, String source, String message) {
        if (email == null || email.isBlank()) throw new RuntimeException("EMAIL_REQUIRED");
        String src = (source == null || source.isBlank()) ? "WEBSITE" : source.toUpperCase();

        Lead existing = leadRepository.findFirstByEmailOrderByCreatedAtDesc(email.trim().toLowerCase()).orElse(null);
        if (existing != null) {
            // Re-engagement: enrich missing fields, log activity, don't duplicate.
            if (existing.getPhone() == null && phone != null) existing.setPhone(phone);
            if (existing.getInterestedProgram() == null && program != null) existing.setInterestedProgram(program);
            Lead saved = leadRepository.save(existing);
            logActivity(saved.getId(), "NOTE", "Re-engaged via " + src, "system");
            return saved;
        }

        Lead lead = Lead.builder()
                .name(name)
                .email(email.trim().toLowerCase())
                .phone(phone)
                .interestedProgram(program)
                .source(src)
                .message(message)
                .status("NEW")
                .score(computeScore(phone, program, message))
                .build();
        Lead saved = leadRepository.save(lead);
        logActivity(saved.getId(), "CREATED", "Lead captured via " + src, "system");
        log.info("Captured lead {} from {}", saved.getEmail(), src);
        return saved;
    }

    private int computeScore(String phone, String program, String message) {
        int score = 30;
        if (phone != null && !phone.isBlank()) score += 30;
        if (program != null && !program.isBlank()) score += 25;
        if (message != null && !message.isBlank()) score += 15;
        return Math.min(score, 100);
    }

    // ── Admin reads ───────────────────────────────────────────────────────────
    public Page<Lead> list(String status, int page, int size) {
        Pageable p = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 200));
        if (status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status)) {
            return leadRepository.findByStatusOrderByCreatedAtDesc(status.toUpperCase(), p);
        }
        return leadRepository.findAllByOrderByCreatedAtDesc(p);
    }

    public Map<String, Object> getDetail(Long id) {
        Lead lead = leadRepository.findById(id).orElseThrow(() -> new RuntimeException("LEAD_NOT_FOUND"));
        List<LeadActivity> activities = activityRepository.findByLeadIdOrderByCreatedAtDesc(id);
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("lead", lead);
        out.put("activities", activities);
        return out;
    }

    // ── Admin mutations ───────────────────────────────────────────────────────
    public Lead updateStatus(Long id, String status, String actor) {
        Lead lead = leadRepository.findById(id).orElseThrow(() -> new RuntimeException("LEAD_NOT_FOUND"));
        String old = lead.getStatus();
        lead.setStatus(status.toUpperCase());
        Lead saved = leadRepository.save(lead);
        logActivity(id, "STATUS_CHANGE", old + " → " + status.toUpperCase(), actor);
        return saved;
    }

    public Lead assign(Long id, Long counselorId, String actor) {
        Lead lead = leadRepository.findById(id).orElseThrow(() -> new RuntimeException("LEAD_NOT_FOUND"));
        lead.setAssignedCounselorId(counselorId);
        Lead saved = leadRepository.save(lead);
        String name = counselorId == null ? "Unassigned"
                : counselorRepository.findById(counselorId).map(Counselor::getName).orElse("#" + counselorId);
        logActivity(id, "ASSIGN", "Assigned to " + name, actor);
        return saved;
    }

    public LeadActivity addNote(Long id, String detail, String actor) {
        leadRepository.findById(id).orElseThrow(() -> new RuntimeException("LEAD_NOT_FOUND"));
        return logActivity(id, "NOTE", detail, actor);
    }

    private LeadActivity logActivity(Long leadId, String type, String detail, String actor) {
        return activityRepository.save(LeadActivity.builder()
                .leadId(leadId).type(type).detail(detail).createdBy(actor).build());
    }

    // ── Counselors ────────────────────────────────────────────────────────────
    public List<Counselor> listCounselors() { return counselorRepository.findAllByOrderByNameAsc(); }

    public Counselor createCounselor(String name, String email) {
        return counselorRepository.save(Counselor.builder().name(name).email(email).active(true).build());
    }

    // ── Stats (KPIs for the dashboard) ────────────────────────────────────────
    public Map<String, Object> getLeadStats() {
        long total = leadRepository.count();
        long newThisWeek = leadRepository.countByCreatedAtAfter(LocalDateTime.now().minusDays(7));

        Map<String, Long> byStatus = new LinkedHashMap<>();
        for (String s : STATUSES) byStatus.put(s, leadRepository.countByStatus(s));

        Map<String, Long> bySource = new LinkedHashMap<>();
        for (Lead l : leadRepository.findAll()) {
            String src = l.getSource() == null ? "WEBSITE" : l.getSource();
            bySource.merge(src, 1L, Long::sum);
        }

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("totalLeads", total);
        out.put("newLeadsThisWeek", newThisWeek);
        out.put("leadsByStatus", byStatus);
        out.put("leadsBySource", bySource);
        out.put("recentLeads", leadRepository.findTop5ByOrderByCreatedAtDesc());
        return out;
    }
}
