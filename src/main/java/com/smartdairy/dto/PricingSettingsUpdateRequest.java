package com.smartdairy.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PricingSettingsUpdateRequest {

    @NotNull(message = "Default FAT % is required")
    @DecimalMin(value = "2.00", message = "Default FAT % must be at least 2.00%")
    @DecimalMax(value = "12.00", message = "Default FAT % cannot exceed 12.00%")
    private BigDecimal defaultFat;

    @NotNull(message = "Default SNF % is required")
    @DecimalMin(value = "6.00", message = "Default SNF % must be at least 6.00%")
    @DecimalMax(value = "12.00", message = "Default SNF % cannot exceed 12.00%")
    private BigDecimal defaultSnf;

    @NotNull(message = "Base rate per liter is required")
    @DecimalMin(value = "10.00", message = "Base rate must be at least ₹10.00 per liter")
    @DecimalMax(value = "200.00", message = "Base rate cannot exceed ₹200.00 per liter")
    private BigDecimal baseRatePerLiter;

    @NotNull(message = "FAT bonus per point is required")
    @DecimalMin(value = "0.00", message = "FAT bonus per point cannot be negative")
    @DecimalMax(value = "50.00", message = "FAT bonus per point cannot exceed ₹50.00")
    private BigDecimal fatBonusPerPoint;

    @NotNull(message = "SNF bonus per point is required")
    @DecimalMin(value = "0.00", message = "SNF bonus per point cannot be negative")
    @DecimalMax(value = "50.00", message = "SNF bonus per point cannot exceed ₹50.00")
    private BigDecimal snfBonusPerPoint;
}
