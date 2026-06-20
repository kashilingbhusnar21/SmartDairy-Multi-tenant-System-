package com.smartdairy.dto;

import com.smartdairy.entity.MilkCollection.Shift;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import lombok.Data;

@Data
public class MilkCollectionRequest {

    @NotNull
    private Long farmerId;

    @NotNull
    private LocalDate date;

    @NotNull
    private Shift shift;

    @NotNull
    @DecimalMin(value = "0.10", message = "Quantity must be at least 0.10 L")
    private BigDecimal quantityLiters;

    @NotNull
    @DecimalMin(value = "0.0")
    @DecimalMax(value = "10.0")
    private BigDecimal fatPercentage;

    @NotNull
    @DecimalMin(value = "0.0")
    @DecimalMax(value = "15.0")
    private BigDecimal snfPercentage;
}

