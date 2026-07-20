package com.smartdairy.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class RegisterRequest {
    @Email
    @NotBlank
    private String email;

    @NotBlank
    @Pattern(regexp = "^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z]).{6,}$", 
             message = "Password must be at least 6 characters, contain at least one uppercase letter, one lowercase letter, and one number")
    private String password;

    @NotBlank
    @Pattern(regexp = "ADMIN|FARMER", message = "Role must be ADMIN or FARMER")
    private String role;
}
