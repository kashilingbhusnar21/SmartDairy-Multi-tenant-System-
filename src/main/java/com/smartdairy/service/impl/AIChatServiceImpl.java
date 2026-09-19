package com.smartdairy.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartdairy.dto.AIChatRequest;
import com.smartdairy.dto.AIChatResponse;
import com.smartdairy.exception.OpenAIException;
import com.smartdairy.service.AIChatService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Duration;
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

    private static final Duration REQUEST_TIMEOUT = Duration.ofSeconds(30);

    @Override
    public AIChatResponse chat(AIChatRequest request, String userRole) {
        String language = normalizeLanguage(request.getLanguage());
        log.info("=== Starting Groq Chat Request ===");
        log.info("User Role: {}", userRole);
        log.info("Language: {}", language);
        log.info("Message Length: {} chars", request.getMessage() != null ? request.getMessage().length() : 0);
        
        // Validate input
        if (request.getMessage() == null || request.getMessage().trim().isEmpty()) {
            log.error("Empty message received");
            return AIChatResponse.builder()
                    .response(emptyMessageText(language))
                    .conversationId(request.getConversationId() != null ? request.getConversationId() : UUID.randomUUID().toString())
                    .model(groqModel)
                    .language(language)
                    .modelUsed("none")
                    .build();
        }
        String systemPrompt = getSystemPrompt(userRole, language);
        Map<String, Object> requestBody = buildRequestBody(systemPrompt, request.getMessage(), language);

        log.info("=== Groq API Call Configuration ===");
        log.info("API URL: {}", groqApiUrl);
        log.info("API Key (masked): {}...{}", 
            groqApiKey.substring(0, Math.min(7, groqApiKey.length())),
            groqApiKey.substring(Math.max(groqApiKey.length() - 4, 0)));
        log.info("Model: {}", groqModel);
        log.info("Request timeout: {} seconds", REQUEST_TIMEOUT.getSeconds());

        try {
            log.info("=== Calling Groq API with model: {} ===", groqModel);
            String response = callGroqModel(groqModel, requestBody);
            
            log.info("=== Successfully got response from model: {} ===", groqModel);
            String aiResponse = parseGroqResponse(response);
            String cleanResponse = cleanMarkdown(aiResponse);
            
            log.info("=== Response Processing Complete ===");
            log.info("Final response length: {} chars", cleanResponse.length());
            
            AIChatResponse aiChatResponse = AIChatResponse.builder()
                    .response(cleanResponse)
                    .conversationId(request.getConversationId() != null ? request.getConversationId() : UUID.randomUUID().toString())
                    .model(groqModel)
                    .language(language)
                    .modelUsed(groqModel)
                    .build();
            
            log.info("=== Returning successful response to controller ===");
            return aiChatResponse;
                    
        } catch (Exception e) {
            log.error("=== Groq API Call Failed ===");
            log.error("Error: {}", e.getMessage(), e);
            
            log.error("Returning fallback response to controller");
            return AIChatResponse.builder()
                    .response(unavailableText(language))
                    .conversationId(request.getConversationId() != null ? request.getConversationId() : UUID.randomUUID().toString())
                    .model(groqModel)
                    .language(language)
                    .modelUsed("none")
                    .build();
        }
    }


    private String cleanMarkdown(String text) {
        if (text == null) return "";
        
        return text
            .replaceAll("###\\s*", "")
            .replaceAll("\\*\\*\\s*", "")
            .replaceAll("\\*\\s*", "")
            .replaceAll("##\\s*", "")
            .replaceAll("#\\s*", "")
            .replaceAll("-\\s*", "")
            .replaceAll("\\n\\n+", "\n\n")
            .trim();
    }

    private String callGroqModel(String model, Map<String, Object> requestBody) throws Exception {
        String fullUrl = groqApiUrl + "/chat/completions";
        
        log.info("=== Groq API Call Details ===");
        log.info("Full API URL: {}", fullUrl);
        log.info("Model: {}", model);
        log.info("API Key (masked): {}...{}", 
            groqApiKey.substring(0, Math.min(7, groqApiKey.length())),
            groqApiKey.substring(Math.max(groqApiKey.length() - 4, 0)));
        
        try {
            String requestBodyJson = objectMapper.writeValueAsString(requestBody);
            log.info("Request body: {}", requestBodyJson);
        } catch (Exception e) {
            log.error("Failed to serialize request body: {}", e.getMessage());
        }
        
        // Update the model in the request body
        requestBody.put("model", model);
        
        WebClient webClient = webClientBuilder
                .baseUrl(fullUrl)
                .defaultHeader("Content-Type", "application/json")
                .defaultHeader("Authorization", "Bearer " + groqApiKey)
                .build();

        try {
            Mono<String> responseMono = webClient.post()
                    .uri("")
                    .bodyValue(requestBody)
                    .retrieve()
                    .onStatus(
                        status -> status.is4xxClientError() || status.is5xxServerError(),
                        response -> {
                            log.error("=== HTTP Error Response ===");
                            log.error("Status Code: {}", response.statusCode());
                            return response.bodyToMono(String.class)
                                .flatMap(body -> {
                                    log.error("Error Response Body: {}", body);
                                    return Mono.error(new OpenAIException(
                                        "HTTP " + response.statusCode(),
                                        response.statusCode().value(),
                                        body
                                    ));
                                });
                        }
                    )
                    .bodyToMono(String.class)
                    .timeout(REQUEST_TIMEOUT)
                    .doOnSuccess(response -> {
                        log.info("=== API Call Successful ===");
                        log.info("Response received (first 200 chars): {}", 
                            response.substring(0, Math.min(200, response.length())));
                    })
                    .doOnError(error -> {
                        log.error("=== API Call Failed ===");
                        log.error("Error Type: {}", error.getClass().getSimpleName());
                        log.error("Error Message: {}", error.getMessage());
                    });

            String result = responseMono.block();
            
            if (result == null || result.trim().isEmpty()) {
                log.error("API returned null or empty response");
                throw new OpenAIException("Empty response from Groq API", 0, "null");
            }
            
            log.info("Full Response Length: {} characters", result.length());
            return result;
            
        } catch (Exception e) {
            log.error("Unexpected error during API call: {}", e.getMessage(), e);
            throw new OpenAIException("Unexpected error: " + e.getMessage(), 500, e.getMessage());
        }
    }

    private String parseGroqResponse(String response) throws Exception {
        log.info("=== Parsing Groq Response ===");
        
        if (response == null || response.trim().isEmpty()) {
            log.error("Response is null or empty");
            throw new OpenAIException("Null or empty response", 0, "null");
        }
        
        JsonNode jsonResponse;
        try {
            jsonResponse = objectMapper.readTree(response);
            log.info("JSON parsed successfully");
        } catch (Exception e) {
            log.error("Failed to parse JSON response: {}", e.getMessage());
            throw new OpenAIException("Invalid JSON response", 0, response);
        }
        
        // Handle potential error responses from Groq
        if (jsonResponse.has("error")) {
            String errorMessage = jsonResponse.get("error").has("message") 
                ? jsonResponse.get("error").get("message").asText()
                : "Unknown error";
            String errorType = jsonResponse.get("error").has("type")
                ? jsonResponse.get("error").get("type").asText()
                : "unknown";
            log.error("Groq API Error - Type: {}, Message: {}", errorType, errorMessage);
            throw new OpenAIException("Groq API error: " + errorMessage, 0, jsonResponse.get("error").toString());
        }

        if (!jsonResponse.has("choices") || jsonResponse.get("choices").isEmpty()) {
            log.error("No choices in Groq response. Response: {}", response);
            throw new OpenAIException("No choices in response", 0, response);
        }

        JsonNode choice = jsonResponse.get("choices").get(0);
        if (!choice.has("message")) {
            log.error("No message in choice. Response: {}", response);
            throw new OpenAIException("No message in response choice", 0, response);
        }

        JsonNode messageNode = choice.get("message");
        String content = messageNode.has("content") ? messageNode.get("content").asText() : "";
        if ((content == null || content.trim().isEmpty()) && messageNode.has("reasoning")) {
            content = messageNode.get("reasoning").asText();
        }
        if (content == null || content.trim().isEmpty()) {
            log.error("Content is null or empty");
            throw new OpenAIException("Empty content in response", 0, response);
        }
        
        log.info("Successfully extracted content (length: {} chars)", content.length());
        return content;
    }

    private Map<String, Object> buildRequestBody(String systemPrompt, String userMessage, String language) {
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", groqModel);
        String languageLabel = getLanguageName(language);
        String wrappedUserMessage = """
                Reply language: %s
                Write the entire answer in %s only. Do not mix languages.

                User question:
                %s
                """.formatted(languageLabel, languageLabel, userMessage);
        requestBody.put("messages", buildOpenAIMessages(systemPrompt, wrappedUserMessage));
        requestBody.put("temperature", 0.7);
        requestBody.put("max_tokens", 1000);
        return requestBody;
    }

    private List<Map<String, Object>> buildOpenAIMessages(String systemPrompt, String userMessage) {
        List<Map<String, Object>> messages = new ArrayList<>();
        
        // System message
        Map<String, Object> systemMessage = new HashMap<>();
        systemMessage.put("role", "system");
        systemMessage.put("content", systemPrompt);
        messages.add(systemMessage);
        
        // User message
        Map<String, Object> userMsg = new HashMap<>();
        userMsg.put("role", "user");
        userMsg.put("content", userMessage);
        messages.add(userMsg);
        
        return messages;
    }

    private String getSystemPrompt(String userRole, String language) {
        String languageInstruction = getLanguageInstruction(language);
        String basePrompt;
        
        if ("FARMER".equalsIgnoreCase(userRole)) {
            basePrompt = """
                You are a helpful dairy farming assistant for farmers in India.
                
                IMPORTANT INSTRUCTIONS:
                - Respond entirely in %s
                - Do not mix English, Hindi, or Marathi unless the user asked for a translation
                - Use simple, easy-to-understand language
                - Give practical, actionable advice
                - Keep responses concise (maximum 8-10 lines)
                - Use bullet points when listing multiple items
                - Remove markdown formatting (no ###, **, etc.)
                
                Topics you help with:
                - Cow health and disease management
                - Milk production improvement
                - Cattle nutrition and feeding
                - Breeding and reproduction
                - General dairy farm management
                
                IMPORTANT: For serious health issues, always suggest consulting a veterinarian.
                If unsure about any advice, recommend consulting a local expert.
                """.formatted(languageInstruction);
        } else {
            basePrompt = """
                You are a professional dairy management assistant for dairy cooperative administrators in India.
                
                IMPORTANT INSTRUCTIONS:
                - Respond entirely in %s
                - Do not mix English, Hindi, or Marathi unless the user asked for a translation
                - Use professional but clear language
                - Be concise and practical (maximum 8-10 lines)
                - Use bullet points when listing multiple items
                - Remove markdown formatting (no ###, **, etc.)
                
                Topics you help with:
                - System usage and navigation
                - Report interpretation and analysis
                - Business decision support
                - Dairy management best practices
                - Financial and operational insights
                - Pricing and analytics
                
                Focus on business and operational aspects.
                """.formatted(languageInstruction);
        }

        return basePrompt;
    }

    private String getLanguageInstruction(String language) {
        return switch (normalizeLanguage(language)) {
            case "hi" -> "Hindi (हिंदी) using Devanagari script";
            case "mr" -> "Marathi (मराठी) using Devanagari script";
            default -> "English";
        };
    }

    private String getLanguageName(String language) {
        return switch (normalizeLanguage(language)) {
            case "hi" -> "Hindi";
            case "mr" -> "Marathi";
            default -> "English";
        };
    }

    private String normalizeLanguage(String language) {
        if (language == null || language.isBlank()) {
            return "en";
        }
        return switch (language.trim().toLowerCase()) {
            case "hi", "hindi" -> "hi";
            case "mr", "marathi" -> "mr";
            default -> "en";
        };
    }

    private String emptyMessageText(String language) {
        return switch (normalizeLanguage(language)) {
            case "hi" -> "कृपया अपना संदेश लिखें।";
            case "mr" -> "कृपया तुमचा संदेश लिहा.";
            default -> "Please provide a message.";
        };
    }

    private String unavailableText(String language) {
        return switch (normalizeLanguage(language)) {
            case "hi" -> "AI सेवा फिलहाल उपलब्ध नहीं है। कृपया बाद में पुनः प्रयास करें।";
            case "mr" -> "AI सेवा सध्या उपलब्ध नाही. कृपया नंतर पुन्हा प्रयत्न करा.";
            default -> "AI service is temporarily unavailable. Please try again later.";
        };
    }
}
