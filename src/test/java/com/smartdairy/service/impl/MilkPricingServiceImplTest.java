package com.smartdairy.service.impl;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.smartdairy.dto.MilkRatePreviewResponse;
import com.smartdairy.dto.PricingSettingsResponse;
import com.smartdairy.dto.PricingSettingsUpdateRequest;
import com.smartdairy.entity.PricingSettings;
import com.smartdairy.entity.User;
import com.smartdairy.repository.PricingSettingsRepository;
import com.smartdairy.service.UserService;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class MilkPricingServiceImplTest {

    @Mock
    private PricingSettingsRepository pricingSettingsRepository;

    @Mock
    private UserService userService;

    @InjectMocks
    private MilkPricingServiceImpl milkPricingService;

    private User testAdmin;
    private PricingSettings defaultSettings;

    @BeforeEach
    void setUp() {
        testAdmin = User.builder()
                .id(1L)
                .email("admin@smartdairy.com")
                .password("encodedPassword")
                .build();

        defaultSettings = PricingSettings.builder()
                .id(10L)
                .admin(testAdmin)
                .defaultFat(new BigDecimal("3.5"))
                .defaultSnf(new BigDecimal("8.5"))
                .baseRatePerLiter(new BigDecimal("45.00"))
                .fatBonusPerPoint(new BigDecimal("4.00"))
                .snfBonusPerPoint(new BigDecimal("2.00"))
                .updatedAt(Instant.now())
                .build();
    }

    @Test
    @DisplayName("compute: When Fat and SNF equal defaults, rate should equal baseRate")
    void compute_WithStandardFatAndSnf_ReturnsExactBaseRate() {
        BigDecimal fat = new BigDecimal("3.5");
        BigDecimal snf = new BigDecimal("8.5");
        BigDecimal qty = new BigDecimal("10.0");

        MilkRatePreviewResponse result = milkPricingService.compute(fat, snf, qty, defaultSettings);

        assertNotNull(result);
        assertEquals(new BigDecimal("45.00"), result.getRatePerLiter());
        assertEquals(new BigDecimal("450.00"), result.getTotalAmount());
    }

    @Test
    @DisplayName("compute: When Fat and SNF are higher than defaults, positive bonuses are added")
    void compute_WithHigherFatAndSnf_AddsBonusesCorrectly() {
        // Extra Fat = 4.2 - 3.5 = +0.7 -> Bonus = 0.7 * 4.00 = +2.80
        // Extra SNF = 8.8 - 8.5 = +0.3 -> Bonus = 0.3 * 2.00 = +0.60
        // Expected Rate = 45.00 + 2.80 + 0.60 = 48.40
        // Expected Total = 48.40 * 12.50 = 605.00
        BigDecimal fat = new BigDecimal("4.2");
        BigDecimal snf = new BigDecimal("8.8");
        BigDecimal qty = new BigDecimal("12.50");

        MilkRatePreviewResponse result = milkPricingService.compute(fat, snf, qty, defaultSettings);

        assertNotNull(result);
        assertEquals(new BigDecimal("48.40"), result.getRatePerLiter());
        assertEquals(new BigDecimal("605.00"), result.getTotalAmount());
    }

    @Test
    @DisplayName("compute: When Fat and SNF are below defaults, penalties are deducted")
    void compute_WithLowerFatAndSnf_AppliesDeductionsCorrectly() {
        // Extra Fat = 3.0 - 3.5 = -0.5 -> Penalty = -0.5 * 4.00 = -2.00
        // Extra SNF = 8.0 - 8.5 = -0.5 -> Penalty = -0.5 * 2.00 = -1.00
        // Expected Rate = 45.00 - 2.00 - 1.00 = 42.00
        // Expected Total = 42.00 * 10.00 = 420.00
        BigDecimal fat = new BigDecimal("3.0");
        BigDecimal snf = new BigDecimal("8.0");
        BigDecimal qty = new BigDecimal("10.00");

        MilkRatePreviewResponse result = milkPricingService.compute(fat, snf, qty, defaultSettings);

        assertNotNull(result);
        assertEquals(new BigDecimal("42.00"), result.getRatePerLiter());
        assertEquals(new BigDecimal("420.00"), result.getTotalAmount());
    }

    @Test
    @DisplayName("compute: Severely substandard milk must not drop below minimum floor rate of 0.10 INR")
    void compute_SeverelySubstandardMilk_EnforcesFloorRateOfTenPaise() {
        // Setting low base rate and extreme negative deviations
        PricingSettings lowBaseSettings = PricingSettings.builder()
                .admin(testAdmin)
                .defaultFat(new BigDecimal("3.5"))
                .defaultSnf(new BigDecimal("8.5"))
                .baseRatePerLiter(new BigDecimal("10.00"))
                .fatBonusPerPoint(new BigDecimal("4.00"))
                .snfBonusPerPoint(new BigDecimal("2.00"))
                .build();

        // Extra Fat = 1.0 - 3.5 = -2.5 -> -10.00
        // Extra SNF = 5.0 - 8.5 = -3.5 -> -7.00
        // Raw Rate = 10.00 - 10.00 - 7.00 = -7.00 (Negative!)
        // Enforces floor: 0.10
        BigDecimal fat = new BigDecimal("1.0");
        BigDecimal snf = new BigDecimal("5.0");
        BigDecimal qty = new BigDecimal("50.00");

        MilkRatePreviewResponse result = milkPricingService.compute(fat, snf, qty, lowBaseSettings);

        assertNotNull(result);
        assertEquals(new BigDecimal("0.10"), result.getRatePerLiter());
        assertEquals(new BigDecimal("5.00"), result.getTotalAmount());
    }

    @Test
    @DisplayName("getCurrentEntity: When settings exist in DB for admin, returns existing entity")
    void getCurrentEntity_WhenSettingsExistForAdmin_ReturnsExistingSettings() {
        when(userService.getLoggedInUser()).thenReturn(testAdmin);
        when(pricingSettingsRepository.findByAdmin(testAdmin)).thenReturn(Optional.of(defaultSettings));

        PricingSettings result = milkPricingService.getCurrentEntity();

        assertNotNull(result);
        assertEquals(10L, result.getId());
        assertEquals(new BigDecimal("45.00"), result.getBaseRatePerLiter());
        verify(pricingSettingsRepository, never()).save(any());
    }

    @Test
    @DisplayName("getCurrentEntity: When settings do not exist for admin, creates and saves default settings")
    void getCurrentEntity_WhenSettingsDoNotExist_CreatesAndSavesDefaultSettings() {
        when(userService.getLoggedInUser()).thenReturn(testAdmin);
        when(pricingSettingsRepository.findByAdmin(testAdmin)).thenReturn(Optional.empty());
        when(pricingSettingsRepository.save(any(PricingSettings.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PricingSettings result = milkPricingService.getCurrentEntity();

        assertNotNull(result);
        assertEquals(new BigDecimal("3.5"), result.getDefaultFat());
        assertEquals(new BigDecimal("8.5"), result.getDefaultSnf());
        assertEquals(new BigDecimal("45"), result.getBaseRatePerLiter());
        verify(pricingSettingsRepository, times(1)).save(any(PricingSettings.class));
    }

    @Test
    @DisplayName("update: Updates pricing settings and returns response DTO")
    void update_UpdatesSettingsAndPersists() {
        PricingSettingsUpdateRequest request = new PricingSettingsUpdateRequest();
        request.setDefaultFat(new BigDecimal("4.0"));
        request.setDefaultSnf(new BigDecimal("9.0"));
        request.setBaseRatePerLiter(new BigDecimal("50.00"));
        request.setFatBonusPerPoint(new BigDecimal("5.00"));
        request.setSnfBonusPerPoint(new BigDecimal("3.00"));

        when(userService.getLoggedInUser()).thenReturn(testAdmin);
        when(pricingSettingsRepository.findByAdmin(testAdmin)).thenReturn(Optional.of(defaultSettings));
        when(pricingSettingsRepository.save(any(PricingSettings.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PricingSettingsResponse response = milkPricingService.update(request);

        assertNotNull(response);
        assertEquals(new BigDecimal("4.0"), response.getDefaultFat());
        assertEquals(new BigDecimal("9.0"), response.getDefaultSnf());
        assertEquals(new BigDecimal("50.00"), response.getBaseRatePerLiter());
        assertEquals(new BigDecimal("5.00"), response.getFatBonusPerPoint());
        assertEquals(new BigDecimal("3.00"), response.getSnfBonusPerPoint());
        verify(pricingSettingsRepository, times(1)).save(defaultSettings);
    }

    @Test
    @DisplayName("preview: Uses current admin settings to compute rate and total")
    void preview_UsesCurrentAdminSettings() {
        when(userService.getLoggedInUser()).thenReturn(testAdmin);
        when(pricingSettingsRepository.findByAdmin(testAdmin)).thenReturn(Optional.of(defaultSettings));

        MilkRatePreviewResponse response = milkPricingService.preview(
                new BigDecimal("4.2"),
                new BigDecimal("8.8"),
                new BigDecimal("10.0")
        );

        assertNotNull(response);
        assertEquals(new BigDecimal("48.40"), response.getRatePerLiter());
        assertEquals(new BigDecimal("484.00"), response.getTotalAmount());
    }
}
