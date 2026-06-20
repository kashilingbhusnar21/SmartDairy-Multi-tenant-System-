package com.smartdairy.dto;

import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FarmerMilkSliceDto {
    private Long farmerId;
    private String farmerName;
    private BigDecimal quantityLiters;
}
