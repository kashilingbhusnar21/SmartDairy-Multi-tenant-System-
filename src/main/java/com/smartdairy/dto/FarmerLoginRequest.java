package com.smartdairy.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class FarmerLoginRequest {

    @NotBlank
    private String dairyCode;

    @NotNull
    private Long farmerId;

    @NotBlank
    private String password;
}
