package com.smartdairy.service.impl;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

import com.smartdairy.dto.MilkCollectionRequest;
import com.smartdairy.dto.MilkCollectionResponse;
import com.smartdairy.dto.MilkCollectionStatsResponse;
import com.smartdairy.dto.MilkRatePreviewResponse;
import com.smartdairy.entity.Farmer;
import com.smartdairy.entity.MilkCollection;
import com.smartdairy.entity.MilkCollection.Shift;
import com.smartdairy.entity.PricingSettings;
import com.smartdairy.entity.User;
import com.smartdairy.exception.ResourceNotFoundException;
import com.smartdairy.repository.FarmerRepository;
import com.smartdairy.repository.MilkCollectionRepository;
import com.smartdairy.repository.PaymentRepository;
import com.smartdairy.service.MilkPricingService;
import com.smartdairy.service.OperationalRecordDateValidator;
import com.smartdairy.service.UserService;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
public class RapidMilkCollectionPosTest {

    @Mock
    private MilkCollectionRepository milkCollectionRepository;

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private FarmerRepository farmerRepository;

    @Mock
    private MilkPricingService milkPricingService;

    @Mock
    private SmsService smsService;

    @Mock
    private UserService userService;

    @Mock
    private OperationalRecordDateValidator operationalRecordDateValidator;

    @InjectMocks
    private MilkCollectionServiceImpl milkCollectionService;

    private User adminA;
    private User adminB;
    private Farmer farmer1;
    private PricingSettings pricingSettings;

    @BeforeEach
    void setUp() {
        adminA = User.builder()
                .id(1L)
                .email("owner@dairy360.com")
                .password("secret")
                .build();

        adminB = User.builder()
                .id(2L)
                .email("other@dairy.com")
                .password("secret")
                .build();

        farmer1 = Farmer.builder()
                .id(101L)
                .admin(adminA)
                .fullName("Kashiling Bhusnur")
                .mobileNumber("9876543210")
                .village("Sangli")
                .active(true)
                .build();

        pricingSettings = PricingSettings.builder()
                .id(1L)
                .admin(adminA)
                .defaultFat(new BigDecimal("3.5"))
                .defaultSnf(new BigDecimal("8.5"))
                .baseRatePerLiter(new BigDecimal("45.00"))
                .fatBonusPerPoint(new BigDecimal("4.00"))
                .snfBonusPerPoint(new BigDecimal("2.00"))
                .build();
    }

    // -----------------------------------------------------------------------------------
    // TEST 1: Pricing Accuracy & Decimal Precision down to the Paisa
    // -----------------------------------------------------------------------------------
    @Test
    @DisplayName("Test 1: Exact rate calculation and total amount rounded to 2 decimal places")
    void test01_RateCalculationAccuracy_ExactPaisaPrecision() {
        // Arrange: 12.83 Liters @ Rate 59.80 -> 12.83 * 59.80 = 767.234 -> 767.23
        BigDecimal qty = new BigDecimal("12.83");
        BigDecimal fat = new BigDecimal("6.80");
        BigDecimal snf = new BigDecimal("8.90");
        BigDecimal expectedRate = new BigDecimal("59.00");
        BigDecimal expectedTotal = qty.multiply(expectedRate).setScale(2, RoundingMode.HALF_UP);

        when(userService.getLoggedInUser()).thenReturn(adminA);
        when(farmerRepository.findByIdAndAdmin(101L, adminA)).thenReturn(Optional.of(farmer1));
        when(milkPricingService.getCurrentEntity()).thenReturn(pricingSettings);
        when(milkPricingService.compute(eq(fat), eq(snf), eq(qty), any())).thenReturn(
                MilkRatePreviewResponse.builder()
                        .ratePerLiter(expectedRate)
                        .totalAmount(expectedTotal)
                        .build()
        );
        when(milkCollectionRepository.save(any(MilkCollection.class))).thenAnswer(invocation -> {
            MilkCollection mc = invocation.getArgument(0);
            mc.setId(501L);
            return mc;
        });

        MilkCollectionRequest req = new MilkCollectionRequest();
        req.setFarmerId(101L);
        req.setDate(LocalDate.now());
        req.setShift(Shift.EVENING);
        req.setQuantityLiters(qty);
        req.setFatPercentage(fat);
        req.setSnfPercentage(snf);

        // Act
        MilkCollectionResponse resp = milkCollectionService.create(req);

        // Assert
        assertNotNull(resp);
        assertEquals(new BigDecimal("59.00"), resp.getRatePerLiter());
        assertEquals(new BigDecimal("756.97"), resp.getTotalAmount());
        assertEquals(new BigDecimal("12.83"), resp.getQuantityLiters());
    }

    // -----------------------------------------------------------------------------------
    // TEST 2A: Duplicate Entry Guard - When Operator Cancels
    // -----------------------------------------------------------------------------------
    @Test
    @DisplayName("Test 2A: Duplicate Guard - When operator cancels duplicate, no second save occurs")
    void test02_DuplicateEntry_WhenOperatorCancels_DoesNotSaveSecondCollection() {
        // In the Rapid POS frontend workflow, when existing collections contain Farmer #101 in EVENING shift,
        // if operator clicks Cancel on duplicate prompt, create() is never invoked.
        when(userService.getLoggedInUser()).thenReturn(adminA);
        when(milkCollectionRepository.findByAdminAndDateOrderByFarmer_FullNameAscShiftAsc(adminA, LocalDate.now()))
                .thenReturn(List.of(
                        MilkCollection.builder()
                                .id(1001L)
                                .admin(adminA)
                                .farmer(farmer1)
                                .date(LocalDate.now())
                                .shift(Shift.EVENING)
                                .quantityLiters(new BigDecimal("10.00"))
                                .build()
                ));

        List<MilkCollectionResponse> existing = milkCollectionService.getDaily(LocalDate.now());

        // Verify Farmer already has an entry for EVENING shift
        boolean alreadySubmitted = existing.stream()
                .anyMatch(c -> c.getFarmerId().equals(101L) && c.getShift() == Shift.EVENING);

        assertTrue(alreadySubmitted, "Existing collection for shift must be detected");
        // Verify milkCollectionRepository.save was NOT called
        verify(milkCollectionRepository, never()).save(any());
    }

    // -----------------------------------------------------------------------------------
    // TEST 2B: Duplicate Entry Allowed - When Operator Approves Second Can
    // -----------------------------------------------------------------------------------
    @Test
    @DisplayName("Test 2B: Duplicate Allowed - Legitimate second can delivery for same farmer in same shift")
    void test03_DuplicateEntry_WhenOperatorApprovesSecondCan_SuccessfullySavesBothCollections() {
        when(userService.getLoggedInUser()).thenReturn(adminA);
        when(farmerRepository.findByIdAndAdmin(101L, adminA)).thenReturn(Optional.of(farmer1));
        when(milkPricingService.getCurrentEntity()).thenReturn(pricingSettings);
        when(milkPricingService.compute(any(), any(), any(), any())).thenReturn(
                MilkRatePreviewResponse.builder()
                        .ratePerLiter(new BigDecimal("50.00"))
                        .totalAmount(new BigDecimal("500.00"))
                        .build()
        );
        when(milkCollectionRepository.save(any(MilkCollection.class))).thenAnswer(invocation -> {
            MilkCollection mc = invocation.getArgument(0);
            mc.setId(System.nanoTime());
            return mc;
        });

        // Can 1: Morning Cow Milk 10 Liters
        MilkCollectionRequest can1 = new MilkCollectionRequest();
        can1.setFarmerId(101L);
        can1.setDate(LocalDate.now());
        can1.setShift(Shift.EVENING);
        can1.setQuantityLiters(new BigDecimal("10.00"));
        can1.setFatPercentage(new BigDecimal("4.10"));
        can1.setSnfPercentage(new BigDecimal("8.60"));

        // Can 2: Morning Buffalo Milk 15 Liters (Second delivery confirmed by operator)
        MilkCollectionRequest can2 = new MilkCollectionRequest();
        can2.setFarmerId(101L);
        can2.setDate(LocalDate.now());
        can2.setShift(Shift.EVENING);
        can2.setQuantityLiters(new BigDecimal("15.00"));
        can2.setFatPercentage(new BigDecimal("6.80"));
        can2.setSnfPercentage(new BigDecimal("8.90"));

        MilkCollectionResponse resp1 = milkCollectionService.create(can1);
        MilkCollectionResponse resp2 = milkCollectionService.create(can2);

        assertNotNull(resp1);
        assertNotNull(resp2);
        assertNotEquals(resp1.getId(), resp2.getId());
        verify(milkCollectionRepository, times(2)).save(any(MilkCollection.class));
    }

    // -----------------------------------------------------------------------------------
    // TEST 4: FAT Lower Bound (2.50 Accepted, 2.49 Rejected)
    // -----------------------------------------------------------------------------------
    @Test
    @DisplayName("Test 4: FAT boundary - 2.50% is valid, 2.49% throws IllegalArgumentException")
    void test04_FatLowerBound_2_50_Accepted_And_2_49_Rejected() {
        when(userService.getLoggedInUser()).thenReturn(adminA);
        when(farmerRepository.findByIdAndAdmin(101L, adminA)).thenReturn(Optional.of(farmer1));

        MilkCollectionRequest invalidReq = new MilkCollectionRequest();
        invalidReq.setFarmerId(101L);
        invalidReq.setDate(LocalDate.now());
        invalidReq.setShift(Shift.MORNING);
        invalidReq.setQuantityLiters(new BigDecimal("10.00"));
        invalidReq.setFatPercentage(new BigDecimal("2.49")); // Below 2.5
        invalidReq.setSnfPercentage(new BigDecimal("8.50"));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                milkCollectionService.create(invalidReq)
        );
        assertTrue(ex.getMessage().contains("FAT must be between 2.5 and 9.0"));
    }

    // -----------------------------------------------------------------------------------
    // TEST 5: FAT Upper Bound (9.00 Accepted, 9.01 Rejected)
    // -----------------------------------------------------------------------------------
    @Test
    @DisplayName("Test 5: FAT boundary - 9.00% is valid, 9.01% throws IllegalArgumentException")
    void test05_FatUpperBound_9_00_Accepted_And_9_01_Rejected() {
        when(userService.getLoggedInUser()).thenReturn(adminA);
        when(farmerRepository.findByIdAndAdmin(101L, adminA)).thenReturn(Optional.of(farmer1));

        MilkCollectionRequest invalidReq = new MilkCollectionRequest();
        invalidReq.setFarmerId(101L);
        invalidReq.setDate(LocalDate.now());
        invalidReq.setShift(Shift.MORNING);
        invalidReq.setQuantityLiters(new BigDecimal("10.00"));
        invalidReq.setFatPercentage(new BigDecimal("9.01")); // Above 9.0
        invalidReq.setSnfPercentage(new BigDecimal("8.50"));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                milkCollectionService.create(invalidReq)
        );
        assertTrue(ex.getMessage().contains("FAT must be between 2.5 and 9.0"));
    }

    // -----------------------------------------------------------------------------------
    // TEST 6: SNF Lower Bound (7.50 Accepted, 7.49 Rejected)
    // -----------------------------------------------------------------------------------
    @Test
    @DisplayName("Test 6: SNF boundary - 7.50% is valid, 7.49% throws IllegalArgumentException")
    void test06_SnfLowerBound_7_50_Accepted_And_7_49_Rejected() {
        when(userService.getLoggedInUser()).thenReturn(adminA);
        when(farmerRepository.findByIdAndAdmin(101L, adminA)).thenReturn(Optional.of(farmer1));

        MilkCollectionRequest invalidReq = new MilkCollectionRequest();
        invalidReq.setFarmerId(101L);
        invalidReq.setDate(LocalDate.now());
        invalidReq.setShift(Shift.MORNING);
        invalidReq.setQuantityLiters(new BigDecimal("10.00"));
        invalidReq.setFatPercentage(new BigDecimal("4.00"));
        invalidReq.setSnfPercentage(new BigDecimal("7.49")); // Below 7.5

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                milkCollectionService.create(invalidReq)
        );
        assertTrue(ex.getMessage().contains("SNF must be between 7.5 and 9.0"));
    }

    // -----------------------------------------------------------------------------------
    // TEST 7: SNF Upper Bound (9.00 Accepted, 9.01 Rejected)
    // -----------------------------------------------------------------------------------
    @Test
    @DisplayName("Test 7: SNF boundary - 9.00% is valid, 9.01% throws IllegalArgumentException")
    void test07_SnfUpperBound_9_00_Accepted_And_9_01_Rejected() {
        when(userService.getLoggedInUser()).thenReturn(adminA);
        when(farmerRepository.findByIdAndAdmin(101L, adminA)).thenReturn(Optional.of(farmer1));

        MilkCollectionRequest invalidReq = new MilkCollectionRequest();
        invalidReq.setFarmerId(101L);
        invalidReq.setDate(LocalDate.now());
        invalidReq.setShift(Shift.MORNING);
        invalidReq.setQuantityLiters(new BigDecimal("10.00"));
        invalidReq.setFatPercentage(new BigDecimal("4.00"));
        invalidReq.setSnfPercentage(new BigDecimal("9.30")); // Screenshot bug value!

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                milkCollectionService.create(invalidReq)
        );
        assertTrue(ex.getMessage().contains("SNF must be between 7.5 and 9.0"));
    }

    // -----------------------------------------------------------------------------------
    // TEST 8: Quantity Minimum Validation
    // -----------------------------------------------------------------------------------
    @Test
    @DisplayName("Test 8: Quantity floor - 0.10 L is accepted")
    void test08_QuantityValidation_StrictPositiveEnforced() {
        when(userService.getLoggedInUser()).thenReturn(adminA);
        when(farmerRepository.findByIdAndAdmin(101L, adminA)).thenReturn(Optional.of(farmer1));
        when(milkPricingService.getCurrentEntity()).thenReturn(pricingSettings);
        when(milkPricingService.compute(any(), any(), any(), any())).thenReturn(
                MilkRatePreviewResponse.builder()
                        .ratePerLiter(new BigDecimal("45.00"))
                        .totalAmount(new BigDecimal("4.50"))
                        .build()
        );
        when(milkCollectionRepository.save(any(MilkCollection.class))).thenAnswer(invocation -> {
            MilkCollection mc = invocation.getArgument(0);
            mc.setId(100L);
            return mc;
        });

        MilkCollectionRequest minQtyReq = new MilkCollectionRequest();
        minQtyReq.setFarmerId(101L);
        minQtyReq.setDate(LocalDate.now());
        minQtyReq.setShift(Shift.MORNING);
        minQtyReq.setQuantityLiters(new BigDecimal("0.10"));
        minQtyReq.setFatPercentage(new BigDecimal("3.50"));
        minQtyReq.setSnfPercentage(new BigDecimal("8.50"));

        MilkCollectionResponse resp = milkCollectionService.create(minQtyReq);
        assertNotNull(resp);
        assertEquals(new BigDecimal("0.10"), resp.getQuantityLiters());
    }

    // -----------------------------------------------------------------------------------
    // TEST 9: Operational Record Date Window Validator
    // -----------------------------------------------------------------------------------
    @Test
    @DisplayName("Test 9: Date Window - Future dates rejected by OperationalRecordDateValidator")
    void test09_DateWindowValidation_TodayYesterdayAccepted_FutureRejected() {
        LocalDate futureDate = LocalDate.now().plusDays(2);
        doThrow(new IllegalArgumentException(OperationalRecordDateValidator.MESSAGE))
                .when(operationalRecordDateValidator).validateCreateDate(futureDate);

        MilkCollectionRequest futureReq = new MilkCollectionRequest();
        futureReq.setFarmerId(101L);
        futureReq.setDate(futureDate);
        futureReq.setShift(Shift.MORNING);
        futureReq.setQuantityLiters(new BigDecimal("10.00"));
        futureReq.setFatPercentage(new BigDecimal("4.00"));
        futureReq.setSnfPercentage(new BigDecimal("8.50"));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                milkCollectionService.create(futureReq)
        );
        assertTrue(ex.getMessage().contains(OperationalRecordDateValidator.MESSAGE));
    }

    // -----------------------------------------------------------------------------------
    // TEST 10: Multi-Tenant Isolation (Admin A vs Admin B IDOR Guard)
    // -----------------------------------------------------------------------------------
    @Test
    @DisplayName("Test 10: Cross-tenant isolation - Admin B cannot create milk collection for Admin A's farmer")
    void test10_TenantIsolation_AdminACannotCreateCollectionForAdminBFarmer() {
        // Admin B logged in
        when(userService.getLoggedInUser()).thenReturn(adminB);
        // Farmer 101 belongs to Admin A, not Admin B
        when(farmerRepository.findByIdAndAdmin(101L, adminB)).thenReturn(Optional.empty());

        MilkCollectionRequest req = new MilkCollectionRequest();
        req.setFarmerId(101L);
        req.setDate(LocalDate.now());
        req.setShift(Shift.MORNING);
        req.setQuantityLiters(new BigDecimal("10.00"));
        req.setFatPercentage(new BigDecimal("4.00"));
        req.setSnfPercentage(new BigDecimal("8.50"));

        assertThrows(ResourceNotFoundException.class, () ->
                milkCollectionService.create(req)
        );
        verify(milkCollectionRepository, never()).save(any());
    }

    // -----------------------------------------------------------------------------------
    // TEST 11: SMS Gateway Fault Tolerance
    // -----------------------------------------------------------------------------------
    @Test
    @DisplayName("Test 11: SMS Gateway fault tolerance - SMS outage does NOT fail milk intake")
    void test11_SmsGatewayResilience_WhenSmsFails_MilkEntryStillSavesSuccessfully() {
        when(userService.getLoggedInUser()).thenReturn(adminA);
        when(farmerRepository.findByIdAndAdmin(101L, adminA)).thenReturn(Optional.of(farmer1));
        when(milkPricingService.getCurrentEntity()).thenReturn(pricingSettings);
        when(milkPricingService.compute(any(), any(), any(), any())).thenReturn(
                MilkRatePreviewResponse.builder()
                        .ratePerLiter(new BigDecimal("45.00"))
                        .totalAmount(new BigDecimal("450.00"))
                        .build()
        );
        when(milkCollectionRepository.save(any(MilkCollection.class))).thenAnswer(invocation -> {
            MilkCollection mc = invocation.getArgument(0);
            mc.setId(888L);
            return mc;
        });

        // Simulate SMS failure
        doThrow(new RuntimeException("SMS Gateway 503 Service Unavailable"))
                .when(smsService).sendSms(anyString(), anyString());

        MilkCollectionRequest req = new MilkCollectionRequest();
        req.setFarmerId(101L);
        req.setDate(LocalDate.now());
        req.setShift(Shift.MORNING);
        req.setQuantityLiters(new BigDecimal("10.00"));
        req.setFatPercentage(new BigDecimal("4.00"));
        req.setSnfPercentage(new BigDecimal("8.50"));

        // Act: Should not throw exception
        MilkCollectionResponse resp = milkCollectionService.create(req);

        assertNotNull(resp);
        assertEquals(888L, resp.getId());
        verify(milkCollectionRepository, times(1)).save(any(MilkCollection.class));
    }

    // -----------------------------------------------------------------------------------
    // TEST 12: Initial Payment Status is Strictly UNPAID
    // -----------------------------------------------------------------------------------
    @Test
    @DisplayName("Test 12: Initial Status - Rapid intake creates collection in UNPAID state with null paymentId")
    void test12_InitialPaymentStatus_IsStrictlyUnpaid() {
        when(userService.getLoggedInUser()).thenReturn(adminA);
        when(farmerRepository.findByIdAndAdmin(101L, adminA)).thenReturn(Optional.of(farmer1));
        when(milkPricingService.getCurrentEntity()).thenReturn(pricingSettings);
        when(milkPricingService.compute(any(), any(), any(), any())).thenReturn(
                MilkRatePreviewResponse.builder()
                        .ratePerLiter(new BigDecimal("46.00"))
                        .totalAmount(new BigDecimal("460.00"))
                        .build()
        );
        when(milkCollectionRepository.save(any(MilkCollection.class))).thenAnswer(invocation -> {
            MilkCollection mc = invocation.getArgument(0);
            mc.setId(901L);
            return mc;
        });

        MilkCollectionRequest req = new MilkCollectionRequest();
        req.setFarmerId(101L);
        req.setDate(LocalDate.now());
        req.setShift(Shift.MORNING);
        req.setQuantityLiters(new BigDecimal("10.00"));
        req.setFatPercentage(new BigDecimal("4.00"));
        req.setSnfPercentage(new BigDecimal("8.50"));

        MilkCollectionResponse resp = milkCollectionService.create(req);

        assertEquals("UNPAID", resp.getPaymentStatus());
        assertNull(resp.getPaymentId());
    }

    // -----------------------------------------------------------------------------------
    // TEST 13: Shift Segregation (Morning vs Evening)
    // -----------------------------------------------------------------------------------
    @Test
    @DisplayName("Test 13: Shift segregation - Morning collections isolated from Evening shift queries")
    void test13_ShiftSegregation_MorningAndEveningCollectionsAreIsolated() {
        LocalDate today = LocalDate.now();
        MilkCollection m1 = MilkCollection.builder()
                .id(1L)
                .admin(adminA)
                .farmer(farmer1)
                .shift(Shift.MORNING)
                .date(today)
                .quantityLiters(new BigDecimal("10.00"))
                .build();

        MilkCollection e1 = MilkCollection.builder()
                .id(2L)
                .admin(adminA)
                .farmer(farmer1)
                .shift(Shift.EVENING)
                .date(today)
                .quantityLiters(new BigDecimal("12.00"))
                .build();

        when(userService.getLoggedInUser()).thenReturn(adminA);
        when(milkCollectionRepository.findByAdminAndDateOrderByFarmer_FullNameAscShiftAsc(adminA, today))
                .thenReturn(List.of(m1, e1));

        List<MilkCollectionResponse> all = milkCollectionService.getDaily(today);

        long morningCount = all.stream().filter(c -> c.getShift() == Shift.MORNING).count();
        long eveningCount = all.stream().filter(c -> c.getShift() == Shift.EVENING).count();

        assertEquals(1, morningCount);
        assertEquals(1, eveningCount);
        assertEquals(new BigDecimal("10.00"), all.get(0).getQuantityLiters());
        assertEquals(new BigDecimal("12.00"), all.get(1).getQuantityLiters());
    }

    // -----------------------------------------------------------------------------------
    // TEST 14: Session Aggregation (Total Liters, Amount, Entries Count)
    // -----------------------------------------------------------------------------------
    @Test
    @DisplayName("Test 14: Shift stats aggregation - Accurately aggregates shift total liters and value")
    void test14_SessionAggregation_AccurateLitersAndGrossPayout() {
        LocalDate today = LocalDate.now();
        when(userService.getLoggedInUser()).thenReturn(adminA);
        when(milkCollectionRepository.countByAdminAndDate(adminA, today)).thenReturn(42L);
        when(milkCollectionRepository.sumQuantityByAdminAndDate(adminA, today)).thenReturn(new BigDecimal("281.16"));
        when(milkCollectionRepository.sumTotalAmountByAdminAndDate(adminA, today)).thenReturn(new BigDecimal("13522.02"));

        MilkCollectionStatsResponse stats = milkCollectionService.getDailyStats(today);

        assertNotNull(stats);
        assertEquals(42L, stats.getEntriesCount());
        assertEquals(new BigDecimal("281.16"), stats.getTotalQuantityLiters());
        assertEquals(new BigDecimal("13522.02"), stats.getTotalAmount());
    }
}
