package com.university.controller;

import com.university.model.dto.ResponseWrapper;
import com.university.service.ChatLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Admin Chat Analytics. Gated by hasAnyRole(...) via /v1/admin/** in SecurityConfig.
 */
@RestController
@RequestMapping("/v1/admin/chat")
@RequiredArgsConstructor
public class AdminChatController {

    private final ChatLogService chatLogService;

    @GetMapping("/stats")
    public ResponseEntity<ResponseWrapper<Object>> stats() {
        return ResponseEntity.ok(ResponseWrapper.success(chatLogService.stats()));
    }
}
