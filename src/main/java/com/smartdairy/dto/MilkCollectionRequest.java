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
public class MilkCollectionRequest {

    @NotNull(message = "Farmer ID is required")
    @Min(value = 1, message = "Farmer ID must be a positive number greater than 0")
    private Long farmerId;

    @NotNull(message = "Collection date is required")
    private LocalDate date;

    @NotNull(message = "Shift is required")
    private Shift shift;

    @NotNull(message = "Quantity is required")
    @DecimalMin(value = "0.10", message = "Quantity must be at least 0.10 L")
    @DecimalMax(value = "1000.00", message = "Quantity cannot exceed 1000.00 L")
    private BigDecimal quantityLiters;

    @NotNull(message = "FAT percentage is required")
    @DecimalMin(value = "2.00", message = "FAT percentage must be at least 2.00%")
    @DecimalMax(value = "12.00", message = "FAT percentage cannot exceed 12.00%")
    private BigDecimal fatPercentage;

    @NotNull(message = "SNF percentage is required")
    @DecimalMin(value = "6.00", message = "SNF percentage must be at least 6.00%")
    @DecimalMax(value = "12.00", message = "SNF percentage cannot exceed 12.00%")
    private BigDecimal snfPercentage;
}
