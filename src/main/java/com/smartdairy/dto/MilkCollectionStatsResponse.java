package com.smartdairy.dto;

import java.math.BigDecimal;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class MilkCollectionStatsResponse {
    private long entriesCount;
    private BigDecimal totalQuantityLiters;
    private BigDecimal totalAmount;
}

