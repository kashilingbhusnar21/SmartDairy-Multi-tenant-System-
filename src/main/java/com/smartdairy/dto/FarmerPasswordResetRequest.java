package com.smartdairy.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class FarmerPasswordResetRequest {

    @NotBlank
    @Size(min = 6, max = 100)
    private String password;
}
