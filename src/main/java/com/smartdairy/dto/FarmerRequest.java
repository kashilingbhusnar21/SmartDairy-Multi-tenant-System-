package com.smartdairy.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FarmerRequest {

    @NotBlank(message = "Full name is required")
    @Size(min = 2, max = 100, message = "Full name must be between 2 and 100 characters")
    @Pattern(regexp = "^[a-zA-Z\\s.'-]+$", message = "Full name must contain only letters and spaces (e.g. Ramesh Patil)")
    private String fullName;

    @NotBlank(message = "Mobile number is required")
    @Pattern(regexp = "^[6-9]\\d{9}$", message = "Mobile number must be a valid 10-digit Indian number (e.g. 9876543210)")
    private String mobileNumber;

    @NotBlank(message = "Village name is required")
    @Size(min = 2, max = 100, message = "Village name must be between 2 and 100 characters")
    @Pattern(regexp = "^[a-zA-Z\\s.'-]+$", message = "Village name must contain only letters and spaces")
    private String village;

    @Size(max = 255)
    private String address;

    @NotBlank(message = "Aadhaar number is required")
    @Pattern(regexp = "^\\d{12}$", message = "Aadhaar number must be exactly 12 digits")
    private String aadhaarNumber;

    @NotBlank(message = "Bank account number is required")
    @Pattern(regexp = "^\\d{9,18}$", message = "Bank account number must contain 9 to 18 digits")
    private String bankAccountNumber;

    @NotBlank(message = "IFSC code is required")
    @Pattern(regexp = "^[A-Z]{4}0[A-Z0-9]{6}$", message = "Invalid IFSC code format (e.g. SBIN0001234 - total 11 characters)")
    private String ifscCode;

    @Size(min = 6, max = 100)
    private String password;
}
