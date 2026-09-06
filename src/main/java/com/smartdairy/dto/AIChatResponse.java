package com.smartdairy.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AIChatResponse {
    
    private String response;
    
    private String conversationId;
    
    private String model;
    
    private String language;
}
