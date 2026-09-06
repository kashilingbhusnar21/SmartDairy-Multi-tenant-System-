package com.smartdairy.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartdairy.dto.AIChatRequest;
import com.smartdairy.dto.AIChatResponse;
import com.smartdairy.service.AIChatService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AIChatServiceImpl implements AIChatService {

    @Value("${groq.api.key}")
    private String groqApiKey;

    @Value("${groq.api.url}")
    private String groqApiUrl;

    @Value("${groq.model}")
    private String groqModel;

    private final WebClient.Builder webClientBuilder;
    private final ObjectMapper objectMapper;

    @Override
    public AIChatResponse chat(AIChatRequest request, String userRole) {
        try {
            String systemPrompt = getSystemPrompt(userRole, request.getLanguage());
            
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", groqModel);
            requestBody.put("messages", buildMessages(systemPrompt, request.getMessage()));
            requestBody.put("temperature", 0.7);
            requestBody.put("max_tokens", 1000);

            WebClient webClient = webClientBuilder
                    .baseUrl(groqApiUrl)
                    .defaultHeader("Authorization", "Bearer " + groqApiKey)
                    .defaultHeader("Content-Type", "application/json")
                    .build();

            String response = webClient.post()
                    .uri("/chat/completions")
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            JsonNode jsonResponse = objectMapper.readTree(response);
            String aiResponse = jsonResponse.get("choices").get(0).get("message").get("content").asText();

            return AIChatResponse.builder()
                    .response(aiResponse)
                    .conversationId(request.getConversationId() != null ? request.getConversationId() : UUID.randomUUID().toString())
                    .model(groqModel)
                    .language(request.getLanguage() != null ? request.getLanguage() : "en")
                    .build();

        } catch (Exception e) {
            log.error("Error calling Groq API", e);
            return AIChatResponse.builder()
                    .response("Sorry, I'm having trouble connecting right now. Please try again later.")
                    .conversationId(request.getConversationId() != null ? request.getConversationId() : UUID.randomUUID().toString())
                    .model(groqModel)
                    .language(request.getLanguage() != null ? request.getLanguage() : "en")
                    .build();
        }
    }

    private List<Map<String, String>> buildMessages(String systemPrompt, String userMessage) {
        List<Map<String, String>> messages = new ArrayList<>();
        
        Map<String, String> systemMessage = new HashMap<>();
        systemMessage.put("role", "system");
        systemMessage.put("content", systemPrompt);
        messages.add(systemMessage);
        
        Map<String, String> userMsg = new HashMap<>();
        userMsg.put("role", "user");
        userMsg.put("content", userMessage);
        messages.add(userMsg);
        
        return messages;
    }

    private String getSystemPrompt(String userRole, String language) {
        String basePrompt;
        
        if ("FARMER".equalsIgnoreCase(userRole)) {
            basePrompt = """
                You are a helpful agricultural assistant for dairy farmers in India. 
                Provide practical, easy-to-understand advice about:
                - Cow health and disease management
                - Milk production improvement
                - Cattle nutrition and feeding
                - Breeding and reproduction
                - General dairy farm management
                
                Always include a disclaimer for serious health issues to consult a veterinarian.
                Use simple language. Be concise and practical.
                If unsure, recommend consulting a local expert.
                """;
        } else {
            basePrompt = """
                You are a helpful dairy management assistant for dairy cooperative administrators in India.
                Provide assistance with:
                - System usage and navigation
                - Report interpretation and analysis
                - Business decision support
                - Dairy management best practices
                - Financial and operational insights
                
                Be professional, concise, and practical.
                Focus on business and operational aspects.
                """;
        }

        if (language != null && language.equalsIgnoreCase("hi")) {
            basePrompt += "\n\nPlease respond in Hindi (Devanagari script).";
        }

        return basePrompt;
    }
}
