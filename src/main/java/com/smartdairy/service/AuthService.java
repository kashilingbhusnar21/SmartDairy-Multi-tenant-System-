package com.smartdairy.service;

import com.smartdairy.dto.AuthResponse;
import com.smartdairy.dto.ForgotPasswordRequest;
import com.smartdairy.dto.ForgotPasswordResponse;
import com.smartdairy.dto.LoginRequest;
import com.smartdairy.dto.RegisterRequest;
import com.smartdairy.dto.ResetPasswordRequest;
import com.smartdairy.dto.VerifyResetTokenRequest;
import com.smartdairy.dto.VerifyResetTokenResponse;

public interface AuthService {
    AuthResponse register(RegisterRequest request);

    AuthResponse login(LoginRequest request);

    ForgotPasswordResponse forgotPassword(ForgotPasswordRequest request);

    VerifyResetTokenResponse verifyResetToken(VerifyResetTokenRequest request);

    void resetPassword(ResetPasswordRequest request);
}
