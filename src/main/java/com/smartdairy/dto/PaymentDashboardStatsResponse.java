package com.smartdairy.dto;

import java.math.BigDecimal;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PaymentDashboardStatsResponse {
    private long pendingCount;
    private BigDecimal pendingTotalAmount;
    private long paidThisWeekCount;
    private BigDecimal paidThisWeekTotal;
    private long paidThisMonthCount;
    private BigDecimal paidThisMonthTotal;
    private BigDecimal feedOutstandingTotal;
    private BigDecimal feedPurchasedThisMonthTotal;
}
