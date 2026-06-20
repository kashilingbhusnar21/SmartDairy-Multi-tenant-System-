package com.smartdairy.dto;

import java.math.BigDecimal;
import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PricingSettingsResponse {
    private Long id;
    private BigDecimal defaultFat;
    private BigDecimal defaultSnf;
    private BigDecimal baseRatePerLiter;
    private BigDecimal fatBonusPerPoint;
    private BigDecimal snfBonusPerPoint;
    private Instant updatedAt;
}
