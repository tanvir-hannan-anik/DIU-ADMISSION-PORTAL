package com.university.service;

import com.university.model.dto.AIPromptRequest;
import com.university.model.dto.AIPromptResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.RestClientException;

@Slf4j
@Service
public class PythonServiceClient {

    private final RestTemplate restTemplate;

    @Value("${python.service.url}")
    private String pythonServiceUrl;

    public PythonServiceClient(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public AIPromptResponse processAIPrompt(AIPromptRequest request) {
        try {
            // Render's fromService property:host gives a bare hostname (no scheme); RestTemplate
            // needs a full URL, so prepend https:// when the configured value lacks a scheme.
            String base = pythonServiceUrl.matches("^https?://.*") ? pythonServiceUrl : "https://" + pythonServiceUrl;
            String url = base + "/api/v1/ai/process";
            long startTime = System.currentTimeMillis();

            AIPromptResponse response = restTemplate.postForObject(url, request, AIPromptResponse.class);

            long processingTime = System.currentTimeMillis() - startTime;
            if (response != null) {
                response.setProcessingTimeMs(processingTime);
            }

            log.info("AI prompt processed in {}ms", processingTime);
            return response;

        } catch (RestClientException e) {
            log.error("Error communicating with Python service: {}", e.getMessage());
            return AIPromptResponse.builder()
                    .status("error")
                    .response("AI service is currently unavailable. Please try again later.")
                    .modelUsed("N/A")
                    .build();
        }
    }
}
