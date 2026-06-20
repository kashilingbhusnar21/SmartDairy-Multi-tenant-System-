package com.smartdairy.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class FeedPurchaseResponse {
    private Long id;
    private Long farmerId;
    private String farmerName;
    private LocalDate feedDate;
    private String feedType;
    private String feedCompanyName;
    private BigDecimal feedQuantity;
    private String unitType;
    private BigDecimal ratePerUnit;
    private BigDecimal totalAmount;
    private BigDecimal remainingAmount;
    private String notes;
    private Long settledPaymentId;
    private Instant createdAt;
    private String smsNotification;
}
