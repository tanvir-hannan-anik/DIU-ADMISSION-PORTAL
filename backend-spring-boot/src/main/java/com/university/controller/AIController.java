package com.university.controller;

import com.university.model.dto.AIPromptRequest;
import com.university.model.dto.AIPromptResponse;
import com.university.model.dto.ResponseWrapper;
import com.university.service.AIService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/v1/ai")
public class AIController {

    private final AIService aiService;

    public AIController(AIService aiService) {
        this.aiService = aiService;
    }

    @PostMapping("/process")
    public ResponseEntity<ResponseWrapper<AIPromptResponse>> processPrompt(
            @Valid @RequestBody AIPromptRequest request) {
        log.info("AI prompt request received");
        AIPromptResponse response = aiService.processPrompt(request);
        return ResponseEntity.ok(ResponseWrapper.success(response));
    }

    @GetMapping("/health")
    public ResponseEntity<ResponseWrapper<String>> health() {
        return ResponseEntity.ok(ResponseWrapper.success("AI Service is running"));
    }
}
