package com.smartdairy.service.impl;

import com.smartdairy.dto.AuthResponse;
import com.smartdairy.dto.ForgotPasswordRequest;
import com.smartdairy.dto.ForgotPasswordResponse;
import com.smartdairy.dto.LoginRequest;
import com.smartdairy.dto.RegisterRequest;
import com.smartdairy.dto.ResetPasswordRequest;
import com.smartdairy.dto.VerifyResetTokenRequest;
import com.smartdairy.dto.VerifyResetTokenResponse;
import com.smartdairy.entity.PricingSettings;
import com.smartdairy.entity.Role;
import com.smartdairy.entity.User;
import com.smartdairy.repository.PricingSettingsRepository;
import com.smartdairy.repository.RoleRepository;
import com.smartdairy.repository.UserRepository;
import com.smartdairy.security.JwtService;
import com.smartdairy.service.AuthService;
import com.smartdairy.service.impl.MilkPricingServiceImpl;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private static final String TOKEN_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PricingSettingsRepository pricingSettingsRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    @Value("${app.password-reset.token-expiry-minutes:15}")
    private int resetTokenExpiryMinutes;

    @Value("${app.password-reset.expose-token-in-response:false}")
    private boolean exposeResetTokenInResponse;

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already registered");
        }

        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(resolveRole(request.getRole()))
                .build();
        userRepository.save(user);

        if ("ADMIN".equalsIgnoreCase(user.getRole().getName())) {
            pricingSettingsRepository.save(MilkPricingServiceImpl.createDefaultForAdmin(user));
        }

        String token = jwtService.generateToken(user);
        return AuthResponse.builder()
                .token(token)
                .email(user.getEmail())
                .role(user.getRole().getName())
                .build();
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Invalid credentials"));

        String token = jwtService.generateToken(user);
        return AuthResponse.builder()
                .token(token)
                .email(user.getEmail())
                .role(user.getRole().getName())
                .build();
    }

    @Override
    @Transactional
    public ForgotPasswordResponse forgotPassword(ForgotPasswordRequest request) {
        String email = request.getEmail().trim();
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            return ForgotPasswordResponse.builder()
                    .message("If this email is registered, password reset instructions have been sent.")
                    .build();
        }
        User user = userOpt.get();
        String token = generateResetToken();
        user.setPasswordResetToken(token);
        user.setPasswordResetExpiresAt(Instant.now().plus(resetTokenExpiryMinutes, ChronoUnit.MINUTES));
        userRepository.save(user);
        var builder = ForgotPasswordResponse.builder()
                .message("If this email is registered, password reset instructions have been sent.");
        if (exposeResetTokenInResponse) {
            builder.resetToken(token);
        }
        return builder.build();
    }

    @Override
    @Transactional(readOnly = true)
    public VerifyResetTokenResponse verifyResetToken(VerifyResetTokenRequest request) {
        Optional<User> userOpt = userRepository.findByPasswordResetToken(request.getToken().trim());
        if (userOpt.isEmpty()) {
            return VerifyResetTokenResponse.builder().valid(false).build();
        }
        User user = userOpt.get();
        if (user.getPasswordResetExpiresAt() == null
                || user.getPasswordResetExpiresAt().isBefore(Instant.now())) {
            return VerifyResetTokenResponse.builder().valid(false).build();
        }
        return VerifyResetTokenResponse.builder().valid(true).email(user.getEmail()).build();
    }

    @Override
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        String token = request.getToken().trim();
        User user = userRepository
                .findByPasswordResetToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired reset token"));
        if (user.getPasswordResetExpiresAt() == null
                || user.getPasswordResetExpiresAt().isBefore(Instant.now())) {
            throw new IllegalArgumentException("Reset token has expired");
        }
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setPasswordResetToken(null);
        user.setPasswordResetExpiresAt(null);
        userRepository.save(user);
    }

    private static String generateResetToken() {
        StringBuilder sb = new StringBuilder(12);
        for (int i = 0; i < 12; i++) {
            sb.append(TOKEN_CHARS.charAt(RANDOM.nextInt(TOKEN_CHARS.length())));
        }
        return sb.toString();
    }

    private Role resolveRole(String requestedRole) {
        return roleRepository.findByName(requestedRole.toUpperCase())
                .orElseThrow(() -> new IllegalArgumentException("Invalid role: " + requestedRole));
    }
}
