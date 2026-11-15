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
public class FeedSummaryResponse {
    private LocalDate from;
    private LocalDate to;
    private long purchaseCount;
    private BigDecimal totalQuantity;
    private BigDecimal totalAmount;
    private BigDecimal outstandingAmount;
}
