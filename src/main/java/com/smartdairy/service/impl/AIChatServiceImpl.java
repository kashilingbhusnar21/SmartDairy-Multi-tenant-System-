package com.smartdairy.service.impl;

import com.smartdairy.dto.AIChatRequest;
import com.smartdairy.dto.AIChatResponse;
import com.smartdairy.service.AIChatService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@Slf4j
public class AIChatServiceImpl implements AIChatService {

    private final ChatClient chatClient;

    @Value("${spring.ai.openai.chat.options.model:llama-3.3-70b-versatile}")
    private String modelName = "llama-3.3-70b-versatile";

    public AIChatServiceImpl(ChatClient.Builder chatClientBuilder) {
        this.chatClient = chatClientBuilder.build();
    }

    @Override
    public AIChatResponse chat(AIChatRequest request, String userRole) {
        String language = normalizeLanguage(request.getLanguage());
        log.info("=== Starting Spring AI Chat Request (Groq) ===");
        log.info("User Role: {}, Language: {}", userRole, language);

        // Validate input
        if (request.getMessage() == null || request.getMessage().trim().isEmpty()) {
            log.warn("Empty message received");
            return AIChatResponse.builder()
                    .response(emptyMessageText(language))
                    .conversationId(request.getConversationId() != null ? request.getConversationId() : UUID.randomUUID().toString())
                    .model(modelName)
                    .language(language)
                    .modelUsed("none")
                    .build();
        }

        String systemPrompt = getSystemPrompt(userRole, language);
        String languageLabel = getLanguageName(language);
        String userPrompt = """
                Reply language: %s
                Write the entire answer in %s only. Do not mix languages.

                User question:
                %s
                """.formatted(languageLabel, languageLabel, request.getMessage());

        try {
            log.info("Calling Spring AI ChatClient with model: {}", modelName);

            String aiResponse = chatClient.prompt()
                    .system(systemPrompt)
                    .user(userPrompt)
                    .call()
                    .content();

            String cleanResponse = cleanMarkdown(aiResponse);
            log.info("Successfully received Spring AI response (length: {} chars)", cleanResponse != null ? cleanResponse.length() : 0);

            return AIChatResponse.builder()
                    .response(cleanResponse)
                    .conversationId(request.getConversationId() != null ? request.getConversationId() : UUID.randomUUID().toString())
                    .model(modelName)
                    .language(language)
                    .modelUsed(modelName)
                    .build();

        } catch (Exception e) {
            log.error("=== Spring AI Groq API Call Failed ===", e);
            return AIChatResponse.builder()
                    .response(unavailableText(language))
                    .conversationId(request.getConversationId() != null ? request.getConversationId() : UUID.randomUUID().toString())
                    .model(modelName)
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
                
                CRITICAL: You must ONLY answer questions related to dairy farming, cattle, milk production, and dairy operations.
                If the user asks about non-dairy topics (politics, sports, entertainment, general knowledge, technology, etc.),
                politely decline and say you can only help with dairy farming questions.
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
                
                CRITICAL: You must ONLY answer questions related to dairy management, dairy operations, system usage, and dairy business.
                If the user asks about non-dairy topics (politics, sports, entertainment, general knowledge, technology, etc.),
                politely decline and say you can only help with dairy management questions.
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
