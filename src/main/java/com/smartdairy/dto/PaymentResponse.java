package com.smartdairy.dto;

import com.smartdairy.entity.Payment.PaymentMethod;
import com.smartdairy.entity.Payment.PaymentStatus;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PaymentResponse {
    private Long id;
    private Long farmerId;
    private String farmerName;
    private Long milkCollectionId;
    private BigDecimal amount;
    private BigDecimal grossAmount;
    private BigDecimal feedDeductionAmount;
    private BigDecimal farmerOutstandingFeedBalance;
    private LocalDate paymentDate;
    private PaymentStatus status;
    private PaymentMethod paymentMethod;
    private String remarks;
    private Instant createdAt;
}
