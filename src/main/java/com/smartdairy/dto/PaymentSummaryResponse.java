package com.smartdairy.dto;

import java.math.BigDecimal;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PaymentSummaryResponse {
    private long paymentCount;
    private BigDecimal totalAmount;
    private String periodLabel;
}
