package com.smartdairy.controller;

import com.smartdairy.dto.AIChatRequest;
import com.smartdairy.dto.AIChatResponse;
import com.smartdairy.service.AIChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai-chat")
@RequiredArgsConstructor
public class AIChatController {

    private final AIChatService aiChatService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'FARMER')")
    public ResponseEntity<AIChatResponse> chat(@Valid @RequestBody AIChatRequest request) {
        String userRole = getUserRole();
        AIChatResponse response = aiChatService.chat(request, userRole);
        return ResponseEntity.ok(response);
    }

    private String getUserRole() {
        org.springframework.security.core.Authentication authentication = 
            org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication != null && authentication.getAuthorities() != null) {
            return authentication.getAuthorities().stream()
                .map(authority -> authority.getAuthority())
                .filter(auth -> auth.startsWith("ROLE_"))
                .map(auth -> auth.substring(5))
                .findFirst()
                .orElse("ADMIN");
        }
        return "ADMIN";
    }
}
