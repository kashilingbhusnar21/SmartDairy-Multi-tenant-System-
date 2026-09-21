package com.smartdairy.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class VendorRequest {

    @NotBlank
    @Size(max = 100)
    private String name;

    @NotBlank
    @Size(min = 10, max = 15)
    private String phone;

    @Size(max = 255)
    private String shopAddress;
}
