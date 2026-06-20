package com.smartdairy.dto;

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
public class TimeSeriesMilkDto {
    private LocalDate date;
    private BigDecimal quantityLiters;
    private BigDecimal totalAmount;
}
