package com.university.service;

import com.university.model.dto.AIPromptRequest;
import com.university.model.dto.AIPromptResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class AIService {

    private final PythonServiceClient pythonServiceClient;

    public AIService(PythonServiceClient pythonServiceClient) {
        this.pythonServiceClient = pythonServiceClient;
    }

    public AIPromptResponse processPrompt(AIPromptRequest request) {
        log.info("Processing AI prompt - module: {}, user: {}", request.getModuleType(), request.getUserId());
        return pythonServiceClient.processAIPrompt(request);
    }
}
