package com.smartdairy.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class VerifyResetTokenRequest {
    @NotBlank
    private String token;
}
