package com.university.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AIPromptResponse {
    private String responseId;
    private String response;
    private String modelUsed;
    private long processingTimeMs;
    private String status;
    private List<String> relatedTopics;
    private Double confidence;
}
