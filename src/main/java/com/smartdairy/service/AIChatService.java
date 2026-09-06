package com.smartdairy.service;

import com.smartdairy.dto.AIChatRequest;
import com.smartdairy.dto.AIChatResponse;

public interface AIChatService {
    
    AIChatResponse chat(AIChatRequest request, String userRole);
}
