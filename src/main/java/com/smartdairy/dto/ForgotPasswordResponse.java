package com.smartdairy.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ForgotPasswordResponse {
    private String message;
    /** Only populated when app.password-reset.expose-token-in-response=true (local/dev). */
    private String resetToken;
}
