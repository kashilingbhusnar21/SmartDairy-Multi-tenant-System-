package com.smartdairy.controller;

import com.smartdairy.dto.IoTTelemetryRequest;
import com.smartdairy.dto.IoTTelemetryResponse;
import com.smartdairy.dto.MilkRatePreviewResponse;
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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class IoTTelemetryControllerTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private FarmerRepository farmerRepository;

    @Mock
    private MilkCollectionRepository milkCollectionRepository;

    @Mock
    private PricingSettingsRepository pricingSettingsRepository;

    @Mock
    private MilkPricingService milkPricingService;

    @Mock
    private SmsService smsService;

    @Mock
    private OperationalRecordDateValidator operationalRecordDateValidator;

    @InjectMocks
    private IoTTelemetryController controller;

    private User mockAdmin;
    private Farmer mockFarmer;
    private PricingSettings mockPricing;

    @BeforeEach
    void setUp() {
        mockAdmin = User.builder()
                .id(1L)
                .email("admin@smartdairy.com")
                .build();

        mockFarmer = Farmer.builder()
                .id(101L)
                .fullName("Ramesh Patil")
                .mobileNumber("9876543210")
                .admin(mockAdmin)
                .build();

        mockPricing = PricingSettings.builder()
                .id(1L)
                .admin(mockAdmin)
                .baseRatePerLiter(new BigDecimal("45.00"))
                .defaultFat(new BigDecimal("3.50"))
                .defaultSnf(new BigDecimal("8.50"))
                .fatBonusPerPoint(new BigDecimal("6.50"))
                .snfBonusPerPoint(new BigDecimal("4.20"))
                .build();
    }

    @Test
    @DisplayName("IoT Ingestion: Successful M2M telemetry creates collection and calculates payout")
    void testSuccessfulTelemetryIngestion() {
        IoTTelemetryRequest req = IoTTelemetryRequest.builder()
                .farmerId(101L)
                .quantityLiters(new BigDecimal("12.50"))
                .fatPercentage(new BigDecimal("4.20"))
                .snfPercentage(new BigDecimal("8.80"))
                .shift(Shift.MORNING)
                .date(LocalDate.now())
                .build();

        when(userRepository.findByEmail("admin@smartdairy.com")).thenReturn(Optional.of(mockAdmin));
        when(farmerRepository.findByIdAndAdmin(101L, mockAdmin)).thenReturn(Optional.of(mockFarmer));
        when(pricingSettingsRepository.findByAdmin(mockAdmin)).thenReturn(Optional.of(mockPricing));

        MilkRatePreviewResponse preview = MilkRatePreviewResponse.builder()
                .ratePerLiter(new BigDecimal("50.81"))
                .totalAmount(new BigDecimal("635.13"))
                .build();

        when(milkPricingService.compute(any(), any(), any(), any())).thenReturn(preview);

        when(milkCollectionRepository.save(any(MilkCollection.class))).thenAnswer(invocation -> {
            MilkCollection mc = invocation.getArgument(0);
            mc.setId(999L);
            return mc;
        });

        ResponseEntity<IoTTelemetryResponse> response = controller.ingestMilkTelemetry("EKOMILK_BOOTH_01", req);

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("SUCCESS", response.getBody().getStatus());
        assertEquals(999L, response.getBody().getCollectionId());
        assertEquals(101L, response.getBody().getFarmerId());
        assertEquals("Ramesh Patil", response.getBody().getFarmerName());
        assertEquals(new BigDecimal("12.50"), response.getBody().getQuantityLiters());
        assertEquals(new BigDecimal("50.81"), response.getBody().getRatePerLiter());
        assertEquals(new BigDecimal("635.13"), response.getBody().getTotalAmount());
        assertEquals("UNPAID", response.getBody().getPaymentStatus());

        verify(smsService, times(1)).sendSms(eq("9876543210"), anyString());
    }

    @Test
    @DisplayName("IoT Ingestion: Rejects telemetry when farmer does not belong to dairy tenant")
    void testRejectsUnauthorizedFarmerForTenant() {
        IoTTelemetryRequest req = IoTTelemetryRequest.builder()
                .farmerId(999L)
                .quantityLiters(new BigDecimal("10.00"))
                .fatPercentage(new BigDecimal("4.00"))
                .snfPercentage(new BigDecimal("8.50"))
                .build();

        when(userRepository.findByEmail("admin@smartdairy.com")).thenReturn(Optional.of(mockAdmin));
        when(farmerRepository.findByIdAndAdmin(999L, mockAdmin)).thenReturn(Optional.empty());

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                controller.ingestMilkTelemetry("EKOMILK_BOOTH_01", req));

        assertTrue(ex.getMessage().contains("Security Violation"));
        verify(milkCollectionRepository, never()).save(any());
    }

    @Test
    @DisplayName("IoT Ingestion: Auto-detects shift when shift is omitted by hardware")
    void testAutoDetectsShiftWhenOmitted() {
        IoTTelemetryRequest req = IoTTelemetryRequest.builder()
                .farmerId(101L)
                .quantityLiters(new BigDecimal("15.00"))
                .fatPercentage(new BigDecimal("4.10"))
                .snfPercentage(new BigDecimal("8.60"))
                .shift(null) // omitted by hardware
                .build();

        when(userRepository.findByEmail("admin@smartdairy.com")).thenReturn(Optional.of(mockAdmin));
        when(farmerRepository.findByIdAndAdmin(101L, mockAdmin)).thenReturn(Optional.of(mockFarmer));
        when(pricingSettingsRepository.findByAdmin(mockAdmin)).thenReturn(Optional.of(mockPricing));

        MilkRatePreviewResponse preview = MilkRatePreviewResponse.builder()
                .ratePerLiter(new BigDecimal("48.50"))
                .totalAmount(new BigDecimal("727.50"))
                .build();
        when(milkPricingService.compute(any(), any(), any(), any())).thenReturn(preview);
        when(milkCollectionRepository.save(any(MilkCollection.class))).thenAnswer(inv -> inv.getArgument(0));

        ResponseEntity<IoTTelemetryResponse> response = controller.ingestMilkTelemetry("EKOMILK_BOOTH_01", req);

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertNotNull(response.getBody().getShift()); // Either MORNING or EVENING auto-assigned
    }

    @Test
    @DisplayName("IoT Health Check: Returns 200 OK with online status")
    void testHealthCheck() {
        var response = controller.checkHealth();
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("ONLINE", response.getBody().get("status"));
    }
}
