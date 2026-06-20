package com.smartdairy.service;

import com.smartdairy.dto.MilkRatePreviewResponse;
import com.smartdairy.dto.PricingSettingsResponse;
import com.smartdairy.dto.PricingSettingsUpdateRequest;
import com.smartdairy.entity.PricingSettings;
import java.math.BigDecimal;

public interface MilkPricingService {

    PricingSettings getCurrentEntity();

    PricingSettingsResponse getCurrent();

    PricingSettingsResponse update(PricingSettingsUpdateRequest request);

    MilkRatePreviewResponse preview(BigDecimal fatPercentage, BigDecimal snfPercentage, BigDecimal quantityLiters);

    MilkRatePreviewResponse compute(BigDecimal fatPercentage, BigDecimal snfPercentage, BigDecimal quantityLiters, PricingSettings settings);
}
