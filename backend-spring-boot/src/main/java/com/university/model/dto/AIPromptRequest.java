package com.university.model.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AIPromptRequest {

    @NotBlank(message = "Prompt cannot be empty")
    @Size(min = 3, max = 5000, message = "Prompt must be between 3 and 5000 characters")
    private String prompt;

    private String context;
    private String userId;
    private String moduleType;
}
