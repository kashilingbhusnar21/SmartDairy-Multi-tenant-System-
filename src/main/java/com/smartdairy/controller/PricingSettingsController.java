package com.smartdairy.controller;

import com.smartdairy.dto.MilkRatePreviewResponse;
import com.smartdairy.dto.PricingSettingsResponse;
import com.smartdairy.dto.PricingSettingsUpdateRequest;
import com.smartdairy.service.MilkPricingService;
import jakarta.validation.Valid;
import java.math.BigDecimal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/pricing-settings")
@RequiredArgsConstructor
public class PricingSettingsController {

    private final MilkPricingService milkPricingService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','FARMER')")
    public ResponseEntity<PricingSettingsResponse> get() {
        return ResponseEntity.ok(milkPricingService.getCurrent());
    }

    @PutMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PricingSettingsResponse> update(@Valid @RequestBody PricingSettingsUpdateRequest request) {
        return ResponseEntity.ok(milkPricingService.update(request));
    }

    @GetMapping("/calculate")
    @PreAuthorize("hasAnyRole('ADMIN','FARMER')")
    public ResponseEntity<MilkRatePreviewResponse> calculate(
            @RequestParam BigDecimal fatPercentage,
            @RequestParam BigDecimal snfPercentage,
            @RequestParam BigDecimal quantityLiters) {
        return ResponseEntity.ok(milkPricingService.preview(fatPercentage, snfPercentage, quantityLiters));
    }
}
