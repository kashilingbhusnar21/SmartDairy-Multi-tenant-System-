package com.smartdairy.dto;

import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MilkRatePreviewResponse {
    private BigDecimal ratePerLiter;
    private BigDecimal totalAmount;
}
