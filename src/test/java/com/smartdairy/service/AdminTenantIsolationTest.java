package com.smartdairy.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.smartdairy.dto.FarmerRequest;
import com.smartdairy.dto.MilkCollectionRequest;
import com.smartdairy.entity.Farmer;
import com.smartdairy.entity.MilkCollection;
import com.smartdairy.entity.MilkCollection.Shift;
import com.smartdairy.entity.User;
import com.smartdairy.exception.ResourceNotFoundException;
import com.smartdairy.repository.FarmerRepository;
import com.smartdairy.repository.MilkCollectionRepository;
import com.smartdairy.service.impl.FarmerServiceImpl;
import com.smartdairy.service.impl.MilkCollectionServiceImpl;
import com.smartdairy.service.impl.SmsService;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Validates that Tenant A (Admin A) can NEVER read, modify, delete,
 * or record transactions for Tenant B's (Admin B) data via IDOR attacks.
 */
@ExtendWith(MockitoExtension.class)
class AdminTenantIsolationTest {

    @Mock
    private FarmerRepository farmerRepository;

    @Mock
    private MilkCollectionRepository milkCollectionRepository;

    @Mock
    private UserService userService;

    @Mock
    private SmsService smsService;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private MilkPricingService milkPricingService;

    @Mock
    private OperationalRecordDateValidator operationalRecordDateValidator;

    private FarmerServiceImpl farmerService;
    private MilkCollectionServiceImpl milkCollectionService;

    private User adminA;
    private User adminB;
    private Farmer farmerB;

    @BeforeEach
    void setUp() {
        farmerService = new FarmerServiceImpl(farmerRepository, smsService, userService, passwordEncoder);
        milkCollectionService = new MilkCollectionServiceImpl(
                milkCollectionRepository,
                farmerRepository,
                milkPricingService,
                smsService,
                userService,
                operationalRecordDateValidator
        );

        // Tenant 1: Amul Dairy Admin
        adminA = User.builder()
                .id(1L)
                .email("adminA@amul.com")
                .password("secretA")
                .build();

        // Tenant 2: Mother Dairy Admin
        adminB = User.builder()
                .id(2L)
                .email("adminB@motherdairy.com")
                .password("secretB")
                .build();

        // Farmer Rajesh belongs strictly to Tenant 2 (Admin B)
        farmerB = Farmer.builder()
                .id(99L)
                .admin(adminB)
                .fullName("Rajesh Patel")
                .mobileNumber("9876543210")
                .aadhaarNumber("111122223333")
                .active(true)
                .build();
    }

    @Test
    @DisplayName("Tenant Isolation 1: Admin A cannot READ Admin B's farmer by ID")
    void adminA_CannotRead_AdminB_Farmer() {
        // Arrange: Logged-in caller is Admin A
        when(userService.getLoggedInUser()).thenReturn(adminA);

        // Querying farmer 99 for Admin A returns empty because farmer 99 belongs to Admin B
        when(farmerRepository.findByIdAndAdmin(99L, adminA)).thenReturn(Optional.empty());

        // Act & Assert: Admin A attempting to view Farmer 99 is BLOCKED with 404
        ResourceNotFoundException ex = assertThrows(ResourceNotFoundException.class, () ->
                farmerService.getFarmerById(99L)
        );

        assertTrue(ex.getMessage().contains("Farmer not found with id: 99"));
    }

    @Test
    @DisplayName("Tenant Isolation 2: Admin A cannot UPDATE Admin B's farmer")
    void adminA_CannotUpdate_AdminB_Farmer() {
        FarmerRequest updateRequest = new FarmerRequest();
        updateRequest.setFullName("Hacked Name");
        updateRequest.setMobileNumber("9999999999");
        updateRequest.setVillage("Malicious Village");
        updateRequest.setAadhaarNumber("999988887777");

        when(userService.getLoggedInUser()).thenReturn(adminA);
        when(farmerRepository.findByIdAndAdmin(99L, adminA)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () ->
                farmerService.updateFarmer(99L, updateRequest)
        );

        // Verify database is never touched
        verify(farmerRepository, never()).save(any());
    }

    @Test
    @DisplayName("Tenant Isolation 3: Admin A cannot DELETE Admin B's farmer")
    void adminA_CannotDelete_AdminB_Farmer() {
        when(userService.getLoggedInUser()).thenReturn(adminA);
        when(farmerRepository.findByIdAndAdmin(99L, adminA)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () ->
                farmerService.deleteFarmer(99L)
        );

        verify(farmerRepository, never()).delete(any());
    }

    @Test
    @DisplayName("Tenant Isolation 4: Admin A cannot submit MILK INTAKE for Admin B's farmer")
    void adminA_CannotRecordMilk_For_AdminB_Farmer() {
        MilkCollectionRequest intakeRequest = new MilkCollectionRequest();
        intakeRequest.setFarmerId(99L); // Maliciously submitting Admin B's farmer ID
        intakeRequest.setDate(LocalDate.now());
        intakeRequest.setShift(Shift.MORNING);
        intakeRequest.setQuantityLiters(new BigDecimal("15.00"));
        intakeRequest.setFatPercentage(new BigDecimal("4.0"));
        intakeRequest.setSnfPercentage(new BigDecimal("8.5"));

        when(userService.getLoggedInUser()).thenReturn(adminA);
        when(farmerRepository.findByIdAndAdmin(99L, adminA)).thenReturn(Optional.empty());

        // Act & Assert: Rejected immediately before calculation or save
        assertThrows(ResourceNotFoundException.class, () ->
                milkCollectionService.create(intakeRequest)
        );

        verify(milkCollectionRepository, never()).save(any());
    }

    @Test
    @DisplayName("Tenant Isolation 5: Admin A cannot view or update Admin B's MILK COLLECTION records")
    void adminA_CannotAccess_AdminB_MilkCollection() {
        when(userService.getLoggedInUser()).thenReturn(adminA);
        // Collection 500 belongs to Admin B, so searching with adminA returns empty
        when(milkCollectionRepository.findByAdminAndId(adminA, 500L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () ->
                milkCollectionService.getById(500L)
        );

        verify(milkCollectionRepository, never()).delete(any());
    }
}
