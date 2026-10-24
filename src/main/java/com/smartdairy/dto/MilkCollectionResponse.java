package com.smartdairy.dto;

import com.smartdairy.entity.MilkCollection.Shift;
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
public class MilkCollectionResponse {
    private Long id;
    private Long farmerId;
    private String farmerName;
    private LocalDate date;
    private Shift shift;
    private BigDecimal quantityLiters;
    private BigDecimal fatPercentage;
    private BigDecimal snfPercentage;
    private BigDecimal ratePerLiter;
    private BigDecimal totalAmount;
    private String paymentStatus; // "PAID", "PENDING", or "UNPAID"
    private Long paymentId;
}
