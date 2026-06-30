package com.university.controller;

import com.university.model.dto.ResponseWrapper;
import com.university.service.ChatLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Public, fire-and-forget chat logging. The frontend posts a small record after
 * each chatbot exchange so the admin "Chat Analytics" view has real data. No PII
 * beyond the question text; permitted without auth in SecurityConfig.
 */
@RestController
@RequestMapping("/v1/chat")
@RequiredArgsConstructor
public class ChatLogController {

    private final ChatLogService chatLogService;

    @PostMapping("/log")
    public ResponseEntity<ResponseWrapper<Object>> log(@RequestBody Map<String, Object> body) {
        try {
            Object rt = body.get("responseTimeMs");
            Long responseTime = rt instanceof Number ? ((Number) rt).longValue() : null;
            Object answered = body.get("answered");
            Boolean ans = answered instanceof Boolean ? (Boolean) answered : Boolean.TRUE;

            chatLogService.record(
                    (String) body.get("moduleType"),
                    (String) body.get("question"),
                    ans, responseTime, (String) body.get("lang"));
            return ResponseEntity.ok(ResponseWrapper.success(Map.of("ok", true)));
        } catch (Exception e) {
            // Logging must never surface an error to the chat UI.
            return ResponseEntity.ok(ResponseWrapper.success(Map.of("ok", false)));
        }
    }
}
