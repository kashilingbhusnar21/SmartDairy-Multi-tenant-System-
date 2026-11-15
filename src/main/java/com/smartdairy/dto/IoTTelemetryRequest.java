package com.smartdairy.dto;

import com.smartdairy.entity.MilkCollection.Shift;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IoTTelemetryRequest {

    @NotNull(message = "Farmer ID is required")
    @Min(value = 1, message = "Farmer ID must be a positive number greater than 0")
    private Long farmerId;

    @NotNull(message = "Quantity is required")
    @DecimalMin(value = "0.10", message = "Quantity must be at least 0.10 L")
    private BigDecimal quantityLiters;

    @NotNull(message = "FAT percentage is required")
    @DecimalMin(value = "2.5", message = "FAT must be at least 2.50%")
    @DecimalMax(value = "9.0", message = "FAT must not exceed 9.00%")
    private BigDecimal fatPercentage;

    @NotNull(message = "SNF percentage is required")
    @DecimalMin(value = "7.5", message = "SNF must be at least 7.50%")
    @DecimalMax(value = "9.0", message = "SNF must not exceed 9.00%")
    private BigDecimal snfPercentage;

    private Shift shift;

    private LocalDate date;

    private BigDecimal clr;
}
