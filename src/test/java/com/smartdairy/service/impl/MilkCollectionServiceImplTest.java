package com.smartdairy.service.impl;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
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
import com.smartdairy.service.MilkPricingService;
import com.smartdairy.service.OperationalRecordDateValidator;
import com.smartdairy.service.UserService;
import java.math.BigDecimal;
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
class MilkCollectionServiceImplTest {

    @Mock
    private MilkCollectionRepository milkCollectionRepository;

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

    private User testAdmin;
    private Farmer testFarmer;
    private MilkCollectionRequest validRequest;
    private PricingSettings testPricingSettings;

    @BeforeEach
    void setUp() {
        testAdmin = User.builder()
                .id(1L)
                .email("admin@smartdairy.com")
                .password("secret")
                .build();

        testFarmer = Farmer.builder()
                .id(101L)
                .admin(testAdmin)
                .fullName("Rajesh Kumar")
                .mobileNumber("9876543210")
                .village("Rampur")
                .aadhaarNumber("123456789012")
                .bankAccountNumber("SBIN0001234")
                .ifscCode("SBIN0001234")
                .active(true)
                .build();

        validRequest = new MilkCollectionRequest();
        validRequest.setFarmerId(101L);
        validRequest.setDate(LocalDate.now());
        validRequest.setShift(Shift.MORNING);
        validRequest.setQuantityLiters(new BigDecimal("12.50"));
        validRequest.setFatPercentage(new BigDecimal("4.2"));
        validRequest.setSnfPercentage(new BigDecimal("8.8"));

        testPricingSettings = PricingSettings.builder()
                .id(1L)
                .admin(testAdmin)
                .defaultFat(new BigDecimal("3.5"))
                .defaultSnf(new BigDecimal("8.5"))
                .baseRatePerLiter(new BigDecimal("45.00"))
                .fatBonusPerPoint(new BigDecimal("4.00"))
                .snfBonusPerPoint(new BigDecimal("2.00"))
                .build();
    }

    @Test
    @DisplayName("create: Happy path saves collection, sends SMS, and returns response")
    void create_Success_SavesEntityAndSendsSmsAndReturnsResponse() {
        // Arrange
        when(userService.getLoggedInUser()).thenReturn(testAdmin);
        when(farmerRepository.findByIdAndAdmin(101L, testAdmin)).thenReturn(Optional.of(testFarmer));
        when(milkPricingService.getCurrentEntity()).thenReturn(testPricingSettings);
        when(milkPricingService.compute(any(), any(), any(), any())).thenReturn(
                MilkRatePreviewResponse.builder()
                        .ratePerLiter(new BigDecimal("48.40"))
                        .totalAmount(new BigDecimal("605.00"))
                        .build()
        );
        when(milkCollectionRepository.save(any(MilkCollection.class))).thenAnswer(invocation -> {
            MilkCollection saved = invocation.getArgument(0);
            saved.setId(501L);
            return saved;
        });

        // Act
        MilkCollectionResponse response = milkCollectionService.create(validRequest);

        // Assert
        assertNotNull(response);
        assertEquals(501L, response.getId());
        assertEquals(101L, response.getFarmerId());
        assertEquals("Rajesh Kumar", response.getFarmerName());
        assertEquals(new BigDecimal("48.40"), response.getRatePerLiter());
        assertEquals(new BigDecimal("605.00"), response.getTotalAmount());
        assertEquals(Shift.MORNING, response.getShift());

        verify(operationalRecordDateValidator, times(1)).validateCreateDate(validRequest.getDate());
        verify(milkCollectionRepository, times(1)).save(any(MilkCollection.class));
        verify(smsService, times(1)).sendSms(eq("9876543210"), contains("Milk Entry Saved"));
    }

    @Test
    @DisplayName("create: Throws ResourceNotFoundException when farmer does not belong to logged-in admin")
    void create_FarmerNotFoundForAdmin_ThrowsResourceNotFoundException() {
        when(userService.getLoggedInUser()).thenReturn(testAdmin);
        when(farmerRepository.findByIdAndAdmin(101L, testAdmin)).thenReturn(Optional.empty());

        ResourceNotFoundException ex = assertThrows(ResourceNotFoundException.class, () ->
                milkCollectionService.create(validRequest)
        );

        assertTrue(ex.getMessage().contains("Farmer not found with id: 101"));
        verify(milkCollectionRepository, never()).save(any());
        verify(smsService, never()).sendSms(any(), any());
    }

    @Test
    @DisplayName("create: Throws IllegalArgumentException when FAT is below 2.5")
    void create_FatBelowLowerBound_ThrowsIllegalArgumentException() {
        validRequest.setFatPercentage(new BigDecimal("2.4")); // Below 2.5
        when(userService.getLoggedInUser()).thenReturn(testAdmin);
        when(farmerRepository.findByIdAndAdmin(101L, testAdmin)).thenReturn(Optional.of(testFarmer));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                milkCollectionService.create(validRequest)
        );

        assertEquals("FAT must be between 2.5 and 9.0", ex.getMessage());
        verify(milkCollectionRepository, never()).save(any());
    }

    @Test
    @DisplayName("create: Throws IllegalArgumentException when FAT is above 9.0")
    void create_FatAboveUpperBound_ThrowsIllegalArgumentException() {
        validRequest.setFatPercentage(new BigDecimal("9.1")); // Above 9.0
        when(userService.getLoggedInUser()).thenReturn(testAdmin);
        when(farmerRepository.findByIdAndAdmin(101L, testAdmin)).thenReturn(Optional.of(testFarmer));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                milkCollectionService.create(validRequest)
        );

        assertEquals("FAT must be between 2.5 and 9.0", ex.getMessage());
        verify(milkCollectionRepository, never()).save(any());
    }

    @Test
    @DisplayName("create: Throws IllegalArgumentException when SNF is below 7.5")
    void create_SnfBelowLowerBound_ThrowsIllegalArgumentException() {
        validRequest.setSnfPercentage(new BigDecimal("7.4")); // Below 7.5
        when(userService.getLoggedInUser()).thenReturn(testAdmin);
        when(farmerRepository.findByIdAndAdmin(101L, testAdmin)).thenReturn(Optional.of(testFarmer));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                milkCollectionService.create(validRequest)
        );

        assertEquals("SNF must be between 7.5 and 9.0", ex.getMessage());
        verify(milkCollectionRepository, never()).save(any());
    }

    @Test
    @DisplayName("create: Throws IllegalArgumentException when SNF is above 9.0")
    void create_SnfAboveUpperBound_ThrowsIllegalArgumentException() {
        validRequest.setSnfPercentage(new BigDecimal("9.2")); // Above 9.0
        when(userService.getLoggedInUser()).thenReturn(testAdmin);
        when(farmerRepository.findByIdAndAdmin(101L, testAdmin)).thenReturn(Optional.of(testFarmer));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                milkCollectionService.create(validRequest)
        );

        assertEquals("SNF must be between 7.5 and 9.0", ex.getMessage());
        verify(milkCollectionRepository, never()).save(any());
    }

    @Test
    @DisplayName("create: When SMS service throws exception, milk entry is still saved and response returned successfully")
    void create_WhenSmsServiceThrowsException_EntryStillSavedAndReturnedSuccessfully() {
        when(userService.getLoggedInUser()).thenReturn(testAdmin);
        when(farmerRepository.findByIdAndAdmin(101L, testAdmin)).thenReturn(Optional.of(testFarmer));
        when(milkPricingService.getCurrentEntity()).thenReturn(testPricingSettings);
        when(milkPricingService.compute(any(), any(), any(), any())).thenReturn(
                MilkRatePreviewResponse.builder()
                        .ratePerLiter(new BigDecimal("48.40"))
                        .totalAmount(new BigDecimal("605.00"))
                        .build()
        );
        when(milkCollectionRepository.save(any(MilkCollection.class))).thenAnswer(invocation -> {
            MilkCollection saved = invocation.getArgument(0);
            saved.setId(502L);
            return saved;
        });

        // Simulate Twilio / SMS provider failure
        doThrow(new RuntimeException("Twilio Network Timeout")).when(smsService).sendSms(any(), any());

        // Act - should NOT throw exception because SMS is wrapped in try/catch
        MilkCollectionResponse response = assertDoesNotThrow(() -> milkCollectionService.create(validRequest));

        assertNotNull(response);
        assertEquals(502L, response.getId());
        verify(milkCollectionRepository, times(1)).save(any(MilkCollection.class));
    }

    @Test
    @DisplayName("update: Throws ResourceNotFoundException when collection does not belong to logged-in admin")
    void update_CollectionNotFoundForAdmin_ThrowsResourceNotFoundException() {
        when(userService.getLoggedInUser()).thenReturn(testAdmin);
        when(milkCollectionRepository.findByAdminAndId(testAdmin, 999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () ->
                milkCollectionService.update(999L, validRequest)
        );
    }

    @Test
    @DisplayName("update: Successfully updates collection record and recomputes pricing")
    void update_Success_UpdatesAndSavesCollection() {
        MilkCollection existing = MilkCollection.builder()
                .id(200L)
                .admin(testAdmin)
                .farmer(testFarmer)
                .date(LocalDate.now().minusDays(1))
                .shift(Shift.EVENING)
                .quantityLiters(new BigDecimal("10.00"))
                .fatPercentage(new BigDecimal("3.5"))
                .snfPercentage(new BigDecimal("8.5"))
                .ratePerLiter(new BigDecimal("45.00"))
                .totalAmount(new BigDecimal("450.00"))
                .build();

        when(userService.getLoggedInUser()).thenReturn(testAdmin);
        when(milkCollectionRepository.findByAdminAndId(testAdmin, 200L)).thenReturn(Optional.of(existing));
        when(farmerRepository.findByIdAndAdmin(101L, testAdmin)).thenReturn(Optional.of(testFarmer));
        when(milkPricingService.getCurrentEntity()).thenReturn(testPricingSettings);
        when(milkPricingService.compute(any(), any(), any(), any())).thenReturn(
                MilkRatePreviewResponse.builder()
                        .ratePerLiter(new BigDecimal("48.40"))
                        .totalAmount(new BigDecimal("605.00"))
                        .build()
        );
        when(milkCollectionRepository.save(existing)).thenReturn(existing);

        MilkCollectionResponse response = milkCollectionService.update(200L, validRequest);

        assertNotNull(response);
        assertEquals(200L, response.getId());
        assertEquals(new BigDecimal("12.50"), response.getQuantityLiters());
        assertEquals(new BigDecimal("48.40"), response.getRatePerLiter());
        assertEquals(new BigDecimal("605.00"), response.getTotalAmount());
        verify(milkCollectionRepository, times(1)).save(existing);
    }

    @Test
    @DisplayName("delete: Successfully deletes existing collection owned by admin")
    void delete_Success_DeletesEntity() {
        MilkCollection existing = MilkCollection.builder()
                .id(300L)
                .admin(testAdmin)
                .build();

        when(userService.getLoggedInUser()).thenReturn(testAdmin);
        when(milkCollectionRepository.findByAdminAndId(testAdmin, 300L)).thenReturn(Optional.of(existing));

        milkCollectionService.delete(300L);

        verify(milkCollectionRepository, times(1)).delete(existing);
    }

    @Test
    @DisplayName("getDaily: Returns collection responses for current admin and date")
    void getDaily_ReturnsListOfResponses() {
        MilkCollection c1 = MilkCollection.builder()
                .id(1L)
                .admin(testAdmin)
                .farmer(testFarmer)
                .date(LocalDate.now())
                .shift(Shift.MORNING)
                .quantityLiters(new BigDecimal("10.0"))
                .fatPercentage(new BigDecimal("4.0"))
                .snfPercentage(new BigDecimal("8.5"))
                .ratePerLiter(new BigDecimal("47.00"))
                .totalAmount(new BigDecimal("470.00"))
                .build();

        when(userService.getLoggedInUser()).thenReturn(testAdmin);
        when(milkCollectionRepository.findByAdminAndDateOrderByFarmer_FullNameAscShiftAsc(testAdmin, LocalDate.now()))
                .thenReturn(List.of(c1));

        List<MilkCollectionResponse> results = milkCollectionService.getDaily(LocalDate.now());

        assertNotNull(results);
        assertEquals(1, results.size());
        assertEquals(1L, results.get(0).getId());
        assertEquals("Rajesh Kumar", results.get(0).getFarmerName());
    }

    @Test
    @DisplayName("getById: Returns collection response if owned by current admin")
    void getById_Success_ReturnsResponse() {
        MilkCollection c1 = MilkCollection.builder()
                .id(400L)
                .admin(testAdmin)
                .farmer(testFarmer)
                .date(LocalDate.now())
                .shift(Shift.MORNING)
                .quantityLiters(new BigDecimal("10.0"))
                .fatPercentage(new BigDecimal("4.0"))
                .snfPercentage(new BigDecimal("8.5"))
                .ratePerLiter(new BigDecimal("47.00"))
                .totalAmount(new BigDecimal("470.00"))
                .build();

        when(userService.getLoggedInUser()).thenReturn(testAdmin);
        when(milkCollectionRepository.findByAdminAndId(testAdmin, 400L)).thenReturn(Optional.of(c1));

        MilkCollectionResponse result = milkCollectionService.getById(400L);

        assertNotNull(result);
        assertEquals(400L, result.getId());
        assertEquals("Rajesh Kumar", result.getFarmerName());
    }

    @Test
    @DisplayName("getByFarmer: Validates farmer belongs to admin and returns collection list")
    void getByFarmer_WhenFarmerBelongsToAdmin_ReturnsCollections() {
        MilkCollection c1 = MilkCollection.builder()
                .id(1L)
                .admin(testAdmin)
                .farmer(testFarmer)
                .date(LocalDate.now())
                .shift(Shift.MORNING)
                .quantityLiters(new BigDecimal("10.0"))
                .fatPercentage(new BigDecimal("4.0"))
                .snfPercentage(new BigDecimal("8.5"))
                .ratePerLiter(new BigDecimal("47.00"))
                .totalAmount(new BigDecimal("470.00"))
                .build();

        when(userService.getLoggedInUser()).thenReturn(testAdmin);
        when(farmerRepository.findByIdAndAdmin(101L, testAdmin)).thenReturn(Optional.of(testFarmer));
        when(milkCollectionRepository.findByAdminAndFarmer_Id(testAdmin, 101L)).thenReturn(List.of(c1));

        List<MilkCollectionResponse> results = milkCollectionService.getByFarmer(101L);

        assertNotNull(results);
        assertEquals(1, results.size());
        verify(farmerRepository, times(1)).findByIdAndAdmin(101L, testAdmin);
    }

    @Test
    @DisplayName("getByFarmer: Throws ResourceNotFoundException if farmer does not belong to admin (IDOR protection)")
    void getByFarmer_WhenFarmerNotFoundForAdmin_ThrowsResourceNotFoundException() {
        when(userService.getLoggedInUser()).thenReturn(testAdmin);
        when(farmerRepository.findByIdAndAdmin(999L, testAdmin)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () ->
                milkCollectionService.getByFarmer(999L)
        );

        verify(milkCollectionRepository, never()).findByAdminAndFarmer_Id(any(), any());
    }

    @Test
    @DisplayName("getDailyStats: Aggregates entry count, total liters, and total amount")
    void getDailyStats_ReturnsAggregatedStats() {
        LocalDate date = LocalDate.now();
        when(userService.getLoggedInUser()).thenReturn(testAdmin);
        when(milkCollectionRepository.countByAdminAndDate(testAdmin, date)).thenReturn(25L);
        when(milkCollectionRepository.sumQuantityByAdminAndDate(testAdmin, date)).thenReturn(new BigDecimal("350.50"));
        when(milkCollectionRepository.sumTotalAmountByAdminAndDate(testAdmin, date)).thenReturn(new BigDecimal("16824.00"));

        MilkCollectionStatsResponse stats = milkCollectionService.getDailyStats(date);

        assertNotNull(stats);
        assertEquals(25L, stats.getEntriesCount());
        assertEquals(new BigDecimal("350.50"), stats.getTotalQuantityLiters());
        assertEquals(new BigDecimal("16824.00"), stats.getTotalAmount());
    }
}
