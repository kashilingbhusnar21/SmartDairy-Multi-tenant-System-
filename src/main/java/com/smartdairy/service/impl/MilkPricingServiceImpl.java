package com.smartdairy.service.impl;

import com.smartdairy.dto.MilkRatePreviewResponse;
import com.smartdairy.dto.PricingSettingsResponse;
import com.smartdairy.dto.PricingSettingsUpdateRequest;
import com.smartdairy.entity.PricingSettings;
import com.smartdairy.entity.User;
import com.smartdairy.repository.PricingSettingsRepository;
import com.smartdairy.service.MilkPricingService;
import com.smartdairy.service.UserService;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class MilkPricingServiceImpl implements MilkPricingService {

    private static final BigDecimal MIN_RATE_PER_LITER = new BigDecimal("0.10");

    private final PricingSettingsRepository pricingSettingsRepository;
    private final UserService userService;

    @Override
    @Transactional(readOnly = true)
    public PricingSettings getCurrentEntity() {
        return getOrCreateForCurrentAdmin();
    }

    @Override
    @Transactional(readOnly = true)
    public PricingSettingsResponse getCurrent() {
        return toResponse(getCurrentEntity());
    }

    @Override
    @Transactional
    public PricingSettingsResponse update(PricingSettingsUpdateRequest request) {
        User admin = userService.getLoggedInUser();
        PricingSettings settings = pricingSettingsRepository.findByAdmin(admin)
                .orElseGet(() -> createDefaultForAdmin(admin));
        settings.setDefaultFat(request.getDefaultFat());
        settings.setDefaultSnf(request.getDefaultSnf());
        settings.setBaseRatePerLiter(request.getBaseRatePerLiter());
        settings.setFatBonusPerPoint(request.getFatBonusPerPoint());
        settings.setSnfBonusPerPoint(request.getSnfBonusPerPoint());
        settings.setUpdatedAt(Instant.now());
        pricingSettingsRepository.save(settings);
        return toResponse(settings);
    }

    @Override
    @Transactional(readOnly = true)
    public MilkRatePreviewResponse preview(BigDecimal fatPercentage, BigDecimal snfPercentage, BigDecimal quantityLiters) {
        return compute(fatPercentage, snfPercentage, quantityLiters, getCurrentEntity());
    }

    @Override
    public MilkRatePreviewResponse compute(
            BigDecimal fatPercentage, BigDecimal snfPercentage, BigDecimal quantityLiters, PricingSettings ps) {

        BigDecimal extraFat = fatPercentage.subtract(ps.getDefaultFat());
        BigDecimal extraSnf = snfPercentage.subtract(ps.getDefaultSnf());
        BigDecimal fatBonus = extraFat.multiply(ps.getFatBonusPerPoint());
        BigDecimal snfBonus = extraSnf.multiply(ps.getSnfBonusPerPoint());
        BigDecimal rate = ps.getBaseRatePerLiter()
                .add(fatBonus)
                .add(snfBonus)
                .setScale(2, RoundingMode.HALF_UP);
        if (rate.compareTo(MIN_RATE_PER_LITER) < 0) {
            rate = MIN_RATE_PER_LITER;
        }
        BigDecimal total = rate.multiply(quantityLiters).setScale(2, RoundingMode.HALF_UP);
        return MilkRatePreviewResponse.builder().ratePerLiter(rate).totalAmount(total).build();
    }

    public static PricingSettings createDefaultForAdmin(User admin) {
        return PricingSettings.builder()
                .admin(admin)
                .defaultFat(new BigDecimal("3.5"))
                .defaultSnf(new BigDecimal("8.5"))
                .baseRatePerLiter(new BigDecimal("45"))
                .fatBonusPerPoint(new BigDecimal("4"))
                .snfBonusPerPoint(new BigDecimal("2"))
                .updatedAt(Instant.now())
                .build();
    }

    private PricingSettings getOrCreateForCurrentAdmin() {
        User admin = userService.getLoggedInUser();
        return pricingSettingsRepository.findByAdmin(admin)
                .orElseGet(() -> pricingSettingsRepository.save(createDefaultForAdmin(admin)));
    }

    private static PricingSettingsResponse toResponse(PricingSettings s) {
        return PricingSettingsResponse.builder()
                .id(s.getId())
                .defaultFat(s.getDefaultFat())
                .defaultSnf(s.getDefaultSnf())
                .baseRatePerLiter(s.getBaseRatePerLiter())
                .fatBonusPerPoint(s.getFatBonusPerPoint())
                .snfBonusPerPoint(s.getSnfBonusPerPoint())
                .updatedAt(s.getUpdatedAt())
                .build();
    }
}
