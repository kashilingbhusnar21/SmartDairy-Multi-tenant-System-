package com.smartdairy.controller;

import com.smartdairy.dto.AuthResponse;
import com.smartdairy.dto.ForgotPasswordRequest;
import com.smartdairy.dto.ForgotPasswordResponse;
import com.smartdairy.dto.LoginRequest;
import com.smartdairy.dto.RegisterRequest;
import com.smartdairy.dto.ResetPasswordRequest;
import com.smartdairy.dto.VerifyResetTokenRequest;
import com.smartdairy.dto.VerifyResetTokenResponse;
import com.smartdairy.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ForgotPasswordResponse> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        return ResponseEntity.ok(authService.forgotPassword(request));
    }

    @PostMapping("/verify-reset-token")
    public ResponseEntity<VerifyResetTokenResponse> verifyResetToken(
            @Valid @RequestBody VerifyResetTokenRequest request) {
        return ResponseEntity.ok(authService.verifyResetToken(request));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.ok().build();
    }
}
