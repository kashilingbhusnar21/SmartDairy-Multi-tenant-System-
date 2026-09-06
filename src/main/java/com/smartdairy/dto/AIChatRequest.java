package com.smartdairy.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AIChatRequest {
    
    @NotBlank(message = "Message is required")
    private String message;
    
    private String conversationId;
    
    private String language;
}
