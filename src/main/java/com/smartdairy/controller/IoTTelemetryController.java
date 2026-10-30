package com.smartdairy.controller;

import com.smartdairy.dto.IoTTelemetryRequest;
import com.smartdairy.dto.IoTTelemetryResponse;
import com.smartdairy.entity.Farmer;
import com.smartdairy.entity.MilkCollection;
import com.smartdairy.entity.MilkCollection.Shift;
import com.smartdairy.entity.PricingSettings;
import com.smartdairy.entity.User;
import com.smartdairy.repository.FarmerRepository;
import com.smartdairy.repository.MilkCollectionRepository;
import com.smartdairy.repository.PricingSettingsRepository;
import com.smartdairy.repository.UserRepository;
import com.smartdairy.service.MilkPricingService;
import com.smartdairy.service.OperationalRecordDateValidator;
import com.smartdairy.service.impl.SmsService;
import com.smartdairy.service.impl.MilkPricingServiceImpl;
import jakarta.validation.Valid;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Autonomous IoT Telemetry Ingestion Controller.
 * Enables direct Machine-to-Machine (M2M) telemetry from 4G/Cellular Ekomilk
 * milk analyzers and weighing scales into Dairy360 Cloud without browser/POS dependencies.
 */
@Slf4j
@RestController
@RequestMapping("/api/iot")
@RequiredArgsConstructor
public class IoTTelemetryController {

    private final UserRepository userRepository;
    private final FarmerRepository farmerRepository;
    private final MilkCollectionRepository milkCollectionRepository;
    private final MilkPricingService milkPricingService;
    private final SmsService smsService;
    private final OperationalRecordDateValidator operationalRecordDateValidator;

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> checkHealth() {
        return ResponseEntity.ok(Map.of(
                "status", "ONLINE",
                "service", "Dairy360 4G IoT Gateway Ingestion Service",
                "protocol", "M2M HTTPS JSON Telemetry",
                "serverTime", Instant.now().toString()
        ));
    }

    @PostMapping("/milk-intake")
    @Transactional
    public ResponseEntity<IoTTelemetryResponse> ingestMilkTelemetry(
            @RequestHeader(value = "X-Device-Key", defaultValue = "EKOMILK_BOOTH_01") String deviceKey,
            @Valid @RequestBody IoTTelemetryRequest request) {

        log.info("Received IoT Telemetry from Device [{}]: FarmerId={}, Qty={}, FAT={}, SNF={}",
                deviceKey, request.getFarmerId(), request.getQuantityLiters(),
                request.getFatPercentage(), request.getSnfPercentage());

        // 1. Resolve & Authenticate Tenant from Device Key
        User admin = resolveAdminFromDeviceKey(deviceKey);

        // 2. Strict Multi-Tenant Farmer Ownership Validation
        Farmer farmer = farmerRepository.findByIdAndAdmin(request.getFarmerId(), admin)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Security Violation: Farmer ID #" + request.getFarmerId()
                                + " does not belong to dairy tenant [" + admin.getEmail() + "]"));

        // 3. Resolve Effective Date & Date Window Guard
        LocalDate effectiveDate = request.getDate() != null ? request.getDate() : LocalDate.now();
        operationalRecordDateValidator.validateCreateDate(effectiveDate);

        // 4. Resolve Shift (Auto-detect if omitted by hardware)
        Shift effectiveShift = request.getShift();
        if (effectiveShift == null) {
            effectiveShift = (LocalTime.now().getHour() < 13) ? Shift.MORNING : Shift.EVENING;
        }

        // 5. Compute Rate and Payout using Tenant's Pricing Settings (Cached via Redis)
        PricingSettings ps = milkPricingService.getPricingSettingsForAdmin(admin);

        var ratePreview = milkPricingService.compute(
                request.getFatPercentage(),
                request.getSnfPercentage(),
                request.getQuantityLiters(),
                ps
        );

        // 6. Persist MilkCollection Entity
        MilkCollection entity = new MilkCollection();
        entity.setAdmin(admin);
        entity.setFarmer(farmer);
        entity.setDate(effectiveDate);
        entity.setShift(effectiveShift);
        entity.setQuantityLiters(request.getQuantityLiters());
        entity.setFatPercentage(request.getFatPercentage());
        entity.setSnfPercentage(request.getSnfPercentage());
        entity.setRatePerLiter(ratePreview.getRatePerLiter());
        entity.setTotalAmount(ratePreview.getTotalAmount());

        entity = milkCollectionRepository.save(entity);

        // 7. Fault-Tolerant SMS Notification Dispatch
        boolean smsDispatched = false;
        try {
            if (farmer.getMobileNumber() != null && !farmer.getMobileNumber().isBlank()) {
                smsService.sendSms(
                        farmer.getMobileNumber(),
                        "Dear " + farmer.getFullName()
                                + "\n[IoT Milk Ingested]"
                                + "\nQty: " + entity.getQuantityLiters() + " L"
                                + "\nFat: " + entity.getFatPercentage() + "%"
                                + "\nSNF: " + entity.getSnfPercentage() + "%"
                                + "\nRate: Rs." + entity.getRatePerLiter() + "/L"
                                + "\nTotal: Rs." + entity.getTotalAmount()
                                + "\nDevice: " + deviceKey);
                smsDispatched = true;
            }
        } catch (Exception e) {
            log.warn("IoT SMS notification skipped for Farmer {}: {}", farmer.getId(), e.getMessage());
        }

        // 8. Build & Return IoT Telemetry Response
        IoTTelemetryResponse response = IoTTelemetryResponse.builder()
                .status("SUCCESS")
                .deviceKey(deviceKey)
                .tenantId(admin.getId())
                .tenantEmail(admin.getEmail())
                .collectionId(entity.getId())
                .farmerId(farmer.getId())
                .farmerName(farmer.getFullName())
                .date(entity.getDate())
                .shift(entity.getShift())
                .quantityLiters(entity.getQuantityLiters())
                .fatPercentage(entity.getFatPercentage())
                .snfPercentage(entity.getSnfPercentage())
                .clr(request.getClr() != null ? request.getClr() : BigDecimal.valueOf(28.0))
                .ratePerLiter(entity.getRatePerLiter())
                .totalAmount(entity.getTotalAmount())
                .paymentStatus("UNPAID")
                .smsDispatched(smsDispatched)
                .ingestedAt(Instant.now())
                .build();

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    private User resolveAdminFromDeviceKey(String deviceKey) {
        if (deviceKey == null || deviceKey.isBlank()) {
            throw new IllegalArgumentException("Security Header 'X-Device-Key' is required for IoT ingestion");
        }

        // Direct email binding (e.g., admin@smartdairy.com)
        if (deviceKey.contains("@")) {
            return userRepository.findByEmail(deviceKey.trim())
                    .orElseThrow(() -> new IllegalArgumentException("Unknown dairy tenant email in device key: " + deviceKey));
        }

        // Tenant ID format binding (e.g., DEV_ADMIN_1)
        if (deviceKey.toUpperCase().startsWith("DEV_ADMIN_")) {
            try {
                Long id = Long.parseLong(deviceKey.substring("DEV_ADMIN_".length()));
                return userRepository.findById(id)
                        .orElseThrow(() -> new IllegalArgumentException("No dairy tenant found for ID: " + id));
            } catch (NumberFormatException ignored) {}
        }

        // Default binding: Primary Admin
        return userRepository.findByEmail("admin@smartdairy.com")
                .orElseGet(() -> userRepository.findAll().stream()
                        .filter(u -> u.getRole() != null &&
                                ("ROLE_ADMIN".equalsIgnoreCase(u.getRole().getName()) || "ADMIN".equalsIgnoreCase(u.getRole().getName())))
                        .findFirst()
                        .orElseThrow(() -> new IllegalStateException("No active dairy admin registered in system to bind IoT device")));
    }
}
