package com.smartdairy.service.impl;

import com.smartdairy.dto.AIChatRequest;
import com.smartdairy.dto.AIChatResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Answers;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.ai.chat.client.ChatClient;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AIChatServiceImplTest {

    @Mock(answer = Answers.RETURNS_DEEP_STUBS)
    private ChatClient.Builder chatClientBuilder;

    private AIChatServiceImpl aiChatService;

    @BeforeEach
    void setUp() {
        aiChatService = new AIChatServiceImpl(chatClientBuilder);
    }

    @Test
    @DisplayName("Empty message returns validation prompt without calling LLM")
    void testEmptyMessageValidation() {
        AIChatRequest request = AIChatRequest.builder()
                .message("   ")
                .language("en")
                .build();

        AIChatResponse response = aiChatService.chat(request, "FARMER");

        assertThat(response).isNotNull();
        assertThat(response.getResponse()).isEqualTo("Please provide a message.");
        assertThat(response.getModelUsed()).isEqualTo("none");
    }

    @Test
    @DisplayName("Valid farmer question successfully invokes Spring AI ChatClient")
    void testSuccessfulFarmerChat() {
        AIChatRequest request = AIChatRequest.builder()
                .message("How to increase cow milk fat?")
                .language("en")
                .build();

        when(chatClientBuilder.build().prompt()
                .system(anyString())
                .user(anyString())
                .call()
                .content())
                .thenReturn("Feed green fodder and balanced mineral mixture.");

        AIChatResponse response = aiChatService.chat(request, "FARMER");

        assertThat(response).isNotNull();
        assertThat(response.getResponse()).contains("Feed green fodder");
        assertThat(response.getLanguage()).isEqualTo("en");
        assertThat(response.getModelUsed()).isNotNull();
    }
}
