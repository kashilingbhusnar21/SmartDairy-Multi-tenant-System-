package com.smartdairy.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class FarmerRequest {

    @NotBlank
    @Size(max = 100)
    private String fullName;

    @NotBlank
    @Size(min = 10, max = 15)
    private String mobileNumber;

    @NotBlank
    @Size(max = 100)
    private String village;

    @Size(max = 255)
    private String address;

    @NotBlank
    @Pattern(regexp = "\\d{12}", message = "Aadhaar number must be 12 digits")
    private String aadhaarNumber;

    @NotBlank
    @Size(min = 6, max = 30)
    private String bankAccountNumber;

    @NotBlank
    @Pattern(regexp = "^[A-Z]{4}0[A-Z0-9]{6}$", message = "Invalid IFSC code format")
    private String ifscCode;
}
