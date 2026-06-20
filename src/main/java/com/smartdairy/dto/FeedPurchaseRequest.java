package com.smartdairy.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import lombok.Data;

@Data
public class FeedPurchaseRequest {
    @NotNull
    private Long farmerId;

    @NotNull
    private LocalDate feedDate;

    @NotBlank
    private String feedType;

    @NotBlank
    private String feedCompanyName;

    @NotNull
    @DecimalMin(value = "0.01")
    private BigDecimal feedQuantity;

    @NotBlank
    private String unitType;

    @NotNull
    @DecimalMin(value = "0.01")
    private BigDecimal ratePerUnit;

    private String notes;
}
