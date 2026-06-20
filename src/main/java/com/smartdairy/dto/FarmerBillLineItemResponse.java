package com.smartdairy.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class FarmerBillLineItemResponse {
    private LocalDate date;
    private String milkType;
    private BigDecimal liters;
    private BigDecimal fat;
    private BigDecimal snf;
    private BigDecimal rate;
    private BigDecimal amount;
}
