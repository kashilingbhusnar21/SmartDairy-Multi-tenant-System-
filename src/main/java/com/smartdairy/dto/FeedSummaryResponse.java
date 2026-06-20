package com.smartdairy.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class FeedSummaryResponse {
    private LocalDate from;
    private LocalDate to;
    private long purchaseCount;
    private BigDecimal totalQuantity;
    private BigDecimal totalAmount;
    private BigDecimal outstandingAmount;
}
