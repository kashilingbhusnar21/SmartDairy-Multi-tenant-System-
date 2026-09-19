package com.smartdairy.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class DoctorRequest {

    @NotBlank
    @Size(max = 100)
    private String fullName;

    @NotBlank
    @Size(min = 10, max = 15)
    private String mobileNumber;

    @Pattern(regexp = "(?i)(veterinary|livestock|equine|bovine|poultry|small animal|large animal)", message = "Specialization must be one of: Veterinary, Livestock, Equine, Bovine, Poultry, Small Animal, Large Animal")
    @NotBlank(message = "Specialization is required")
    @Size(max = 100)
    private String specialization;

    @Size(max = 255)
    private String clinicAddress;
}
