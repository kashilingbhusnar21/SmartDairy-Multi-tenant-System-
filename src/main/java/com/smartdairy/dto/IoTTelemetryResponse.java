package com.smartdairy.dto;

import com.smartdairy.entity.MilkCollection.Shift;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IoTTelemetryResponse {
    private String status;
    private String deviceKey;
    private Long tenantId;
    private String tenantEmail;
    private Long collectionId;
    private Long farmerId;
    private String farmerName;
    private LocalDate date;
    private Shift shift;
    private BigDecimal quantityLiters;
    private BigDecimal fatPercentage;
    private BigDecimal snfPercentage;
    private BigDecimal clr;
    private BigDecimal ratePerLiter;
    private BigDecimal totalAmount;
    private String paymentStatus;
    private boolean smsDispatched;
    private Instant ingestedAt;
}
