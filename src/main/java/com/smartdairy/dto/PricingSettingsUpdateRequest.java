package com.smartdairy.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import lombok.Data;

@Data
public class PricingSettingsUpdateRequest {

    @NotNull
    @DecimalMin(value = "0.0", inclusive = true)
    private BigDecimal defaultFat;

    @NotNull
    @DecimalMin(value = "0.0", inclusive = true)
    private BigDecimal defaultSnf;

    @NotNull
    @DecimalMin(value = "0.01")
    private BigDecimal baseRatePerLiter;

    @NotNull
    private BigDecimal fatBonusPerPoint;

    @NotNull
    private BigDecimal snfBonusPerPoint;
}
