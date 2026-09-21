package com.smartdairy.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class EquipmentRequest {

    @NotNull
    private Long vendorId;

    @NotBlank
    @Size(max = 100)
    private String name;

    @Size(max = 100)
    private String companyName;

    @NotNull
    @DecimalMin(value = "0.0", inclusive = false)
    private BigDecimal price;

    @Size(max = 1000)
    private String description;

    @Size(max = 500)
    private String imageUrl;
}
