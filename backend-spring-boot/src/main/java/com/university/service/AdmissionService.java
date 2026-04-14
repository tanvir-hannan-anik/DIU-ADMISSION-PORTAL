package com.university.service;

import com.university.model.dto.AdmissionApplicationRequest;
import com.university.model.entity.AdmissionApplication;
import com.university.repository.AdmissionApplicationRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
public class AdmissionService {

    private final AdmissionApplicationRepository repository;
    private final EmailService emailService;

    public AdmissionService(AdmissionApplicationRepository repository, EmailService emailService) {
        this.repository = repository;
        this.emailService = emailService;
    }

    // ── Admission schedule per faculty ─────────────────────────
    // Dates are computed dynamically: exam in the next April relative to today,
    // so the schedule never silently shows a past year.
    private static Map<String, String[]> buildFacultySchedule() {
        int year = java.time.LocalDate.now().getYear();
        // If current month is past April, schedule for next year
        if (java.time.LocalDate.now().getMonthValue() > 4) year++;
        Map<String, String[]> map = new LinkedHashMap<>();
        map.put("science",     new String[]{"April 15, " + year + " | 10:00 AM – 1:00 PM", "April 22, " + year + " | 9:00 AM – 12:00 PM"});
        map.put("business",    new String[]{"April 16, " + year + " | 10:00 AM – 1:00 PM", "April 23, " + year + " | 9:00 AM – 12:00 PM"});
        map.put("engineering", new String[]{"April 17, " + year + " | 10:00 AM – 1:00 PM", "April 24, " + year + " | 9:00 AM – 12:00 PM"});
        map.put("health",      new String[]{"April 18, " + year + " | 10:00 AM – 1:00 PM", "April 25, " + year + " | 9:00 AM – 12:00 PM"});
        map.put("humanities",  new String[]{"April 19, " + year + " | 10:00 AM – 1:00 PM", "April 26, " + year + " | 9:00 AM – 12:00 PM"});
        return map;
    }
    private static final Map<String, String[]> FACULTY_SCHEDULE = buildFacultySchedule();

    private String[] getScheduleForProgram(String program) {
        if (program == null) return FACULTY_SCHEDULE.get("science");
        String p = program.toLowerCase();
        if (p.contains("cse") || p.contains("swe") || p.contains("software") || p.contains("computing") ||
                p.contains("cis") || p.contains("itm") || p.contains("mct") || p.contains("multimedia") ||
                p.contains("robotics") || p.contains("computer")) {
            return FACULTY_SCHEDULE.get("science");
        } else if (p.contains("bba") || p.contains("business") || p.contains("finance") || p.contains("marketing") ||
                p.contains("accounting") || p.contains("entrepreneurship") || p.contains("tourism") ||
                p.contains("real estate") || p.contains("fintech")) {
            return FACULTY_SCHEDULE.get("business");
        } else if (p.contains("eee") || p.contains("electrical") || p.contains("civil") || p.contains("textile") ||
                p.contains("architecture") || p.contains("ice") || p.contains("communication")) {
            return FACULTY_SCHEDULE.get("engineering");
        } else if (p.contains("pharmacy") || p.contains("health") || p.contains("nutrition") ||
                p.contains("agricultural") || p.contains("genetic") || p.contains("fisheries") ||
                p.contains("environmental") || p.contains("sports")) {
            return FACULTY_SCHEDULE.get("health");
        } else if (p.contains("english") || p.contains("law") || p.contains("llb") ||
                p.contains("journalism") || p.contains("jmc")) {
            return FACULTY_SCHEDULE.get("humanities");
        }
        return FACULTY_SCHEDULE.get("science");
    }

    // ── Submit application ──────────────────────────────────────
    public AdmissionApplication submitApplication(AdmissionApplicationRequest request) {
        log.info("Submitting application for: {}", request.getEmail());
        String[] schedule = getScheduleForProgram(request.getProgram());

        AdmissionApplication app = AdmissionApplication.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .dateOfBirth(request.getDateOfBirth())
                .contactNumber(request.getContactNumber())
                .program(request.getProgram())
                .major(request.getMajor())
                .sscResult(request.getSscResult())
                .sscGroup(request.getSscGroup())
                .sscBoard(request.getSscBoard())
                .sscYear(request.getSscYear())
                .sscMarksheet(request.getSscMarksheet())
                .hscResult(request.getHscResult())
                .hscGroup(request.getHscGroup())
                .hscBoard(request.getHscBoard())
                .hscYear(request.getHscYear())
                .hscMarksheet(request.getHscMarksheet())
                .admissionDate(schedule[0])
                .vivaDate(schedule[1])
                .essayOne(request.getEssayOne())
                .essayTwo(request.getEssayTwo())
                .build();

        AdmissionApplication saved = repository.save(app);
        emailService.sendApplicationReceived(saved);
        return saved;
    }

    // ── Queries ─────────────────────────────────────────────────
    public List<AdmissionApplication> getAllApplications() {
        return repository.findAllByOrderByCreatedAtDesc();
    }

    public AdmissionApplication getByAppId(String appId) {
        return repository.findByAppId(appId)
                .orElseThrow(() -> new RuntimeException("Application not found: " + appId));
    }

    // ── Update status — triggers email on ADMITTED ───────────────
    public AdmissionApplication updateStatus(String appId, String status) {
        AdmissionApplication app = repository.findByAppId(appId)
                .orElseThrow(() -> new RuntimeException("Application not found: " + appId));
        String oldStatus = app.getStatus();
        app.setStatus(status.toUpperCase());
        log.info("Updating application {} status: {} → {}", appId, oldStatus, status.toUpperCase());
        AdmissionApplication saved = repository.save(app);

        if ("ADMITTED".equalsIgnoreCase(status) && !"ADMITTED".equalsIgnoreCase(oldStatus)) {
            emailService.sendAdmissionConfirmation(saved);
        }
        return saved;
    }

    // ── Dashboard stats ─────────────────────────────────────────
    public Map<String, Object> getDashboardStats() {
        List<AdmissionApplication> all = repository.findAll();
        long total     = all.size();
        long pending   = all.stream().filter(a -> "PENDING".equals(a.getStatus())).count();
        long reviewing = all.stream().filter(a -> "REVIEWING".equals(a.getStatus())).count();
        long admitted  = all.stream().filter(a -> "ADMITTED".equals(a.getStatus())).count();
        long rejected  = all.stream().filter(a -> "REJECTED".equals(a.getStatus())).count();

        double conversionRate = total > 0 ? Math.round((admitted * 100.0 / total) * 10.0) / 10.0 : 0.0;
        double qualifiedRate  = total > 0 ? Math.round(((admitted + reviewing) * 100.0 / total) * 10.0) / 10.0 : 0.0;

        Map<String, Long> deptBreakdown = all.stream()
                .filter(a -> a.getProgram() != null && !a.getProgram().isBlank())
                .collect(Collectors.groupingBy(AdmissionApplication::getProgram, Collectors.counting()));

        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("MMM dd");
        Map<String, Long> dailyCounts = new LinkedHashMap<>();
        LocalDate today = LocalDate.now();
        for (int i = 6; i >= 0; i--) dailyCounts.put(today.minusDays(i).format(fmt), 0L);
        all.stream()
                .filter(a -> a.getCreatedAt() != null)
                .filter(a -> !a.getCreatedAt().toLocalDate().isBefore(today.minusDays(6)))
                .forEach(a -> dailyCounts.merge(a.getCreatedAt().toLocalDate().format(fmt), 1L, Long::sum));

        List<Map<String, Object>> recent = all.stream()
                .sorted(Comparator.comparing(AdmissionApplication::getCreatedAt,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(5)
                .map(a -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("appId", a.getAppId());
                    m.put("fullName", a.getFullName());
                    m.put("program", a.getProgram());
                    m.put("status", a.getStatus());
                    m.put("createdAt", a.getCreatedAt());
                    return m;
                })
                .collect(Collectors.toList());

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("total", total);
        stats.put("pending", pending);
        stats.put("reviewing", reviewing);
        stats.put("admitted", admitted);
        stats.put("rejected", rejected);
        stats.put("conversionRate", conversionRate);
        stats.put("qualifiedRate", qualifiedRate);
        stats.put("departmentBreakdown", deptBreakdown);
        stats.put("dailyLeads", dailyCounts);
        stats.put("recentApplications", recent);
        return stats;
    }
}
