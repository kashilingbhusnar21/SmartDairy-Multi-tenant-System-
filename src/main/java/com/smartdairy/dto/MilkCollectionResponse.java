package com.smartdairy.dto;

import com.smartdairy.entity.MilkCollection.Shift;
import java.math.BigDecimal;
import java.time.LocalDate;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
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
}

