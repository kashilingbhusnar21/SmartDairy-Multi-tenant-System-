package com.smartdairy.service.impl;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.smartdairy.dto.FeedPurchaseRequest;
import com.smartdairy.dto.FeedPurchaseResponse;
import com.smartdairy.entity.Farmer;
import com.smartdairy.entity.FarmerFinancialAccount;
import com.smartdairy.entity.FeedPurchase;
import com.smartdairy.entity.User;
import com.smartdairy.exception.ResourceNotFoundException;
import com.smartdairy.repository.FarmerFinancialAccountRepository;
import com.smartdairy.repository.FarmerFinancialTransactionRepository;
import com.smartdairy.repository.FarmerRepository;
import com.smartdairy.repository.FeedPurchaseRepository;
import com.smartdairy.repository.PaymentRepository;
import com.smartdairy.service.DairyProfileService;
import com.smartdairy.service.OperationalRecordDateValidator;
import com.smartdairy.service.SmsNotificationService;
import com.smartdairy.service.UserService;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class FeedPurchaseServiceImplTest {

    @Mock
    private FeedPurchaseRepository feedPurchaseRepository;

    @Mock
    private FarmerRepository farmerRepository;

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private FarmerFinancialAccountRepository financialAccountRepository;

    @Mock
    private FarmerFinancialTransactionRepository financialTransactionRepository;

    @Mock
    private DairyProfileService dairyProfileService;

    @Mock
    private SmsNotificationService smsNotificationService;

    @Mock
    private UserService userService;

    @Mock
    private OperationalRecordDateValidator operationalRecordDateValidator;

    @InjectMocks
    private FeedPurchaseServiceImpl feedPurchaseService;

    private User testAdmin;
    private Farmer testFarmer;
    private FeedPurchaseRequest validRequest;

    @BeforeEach
    void setUp() {
        testAdmin = User.builder().id(1L).email("admin@dairy.com").build();
        testFarmer = Farmer.builder().id(10L).admin(testAdmin).fullName("Rajesh").build();

        validRequest = new FeedPurchaseRequest();
        validRequest.setFarmerId(10L);
        validRequest.setFeedDate(LocalDate.now());
        validRequest.setFeedType("PELLETS");
        validRequest.setFeedCompanyName("AMUL");
        validRequest.setFeedQuantity(new BigDecimal("2.00")); // 2 bags
        validRequest.setUnitType("BAG");
        validRequest.setRatePerUnit(new BigDecimal("1500.00")); // 1,500 INR / bag
        validRequest.setNotes("Monthly feed purchase on credit");
    }

    @Test
    @DisplayName("create: Happy path calculates total amount (2 * 1500 = 3000) and saves feed purchase")
    void create_Success_CalculatesTotalAndSavesFeedPurchase() {
        when(userService.getLoggedInUser()).thenReturn(testAdmin);
        when(farmerRepository.findByIdAndAdmin(10L, testAdmin)).thenReturn(Optional.of(testFarmer));
        when(feedPurchaseRepository.save(any(FeedPurchase.class))).thenAnswer(invocation -> {
            FeedPurchase fp = invocation.getArgument(0);
            fp.setId(101L);
            return fp;
        });
        when(financialAccountRepository.findByAdminAndFarmer(testAdmin, testFarmer))
                .thenReturn(Optional.of(FarmerFinancialAccount.builder().admin(testAdmin).farmer(testFarmer).build()));

        // Act
        FeedPurchaseResponse response = feedPurchaseService.create(validRequest);

        // Assert
        assertNotNull(response);
        assertEquals(101L, response.getId());
        assertEquals(new BigDecimal("3000.00"), response.getTotalAmount()); // 2 * 1500 = 3000
        assertEquals(new BigDecimal("3000.00"), response.getRemainingAmount());
        assertEquals("PELLETS", response.getFeedType());

        verify(operationalRecordDateValidator, times(1)).validateCreateDate(validRequest.getFeedDate());
        verify(feedPurchaseRepository, times(1)).save(any(FeedPurchase.class));
    }

    @Test
    @DisplayName("create: Rejects purchase if farmer does not belong to logged-in admin")
    void create_FarmerNotFound_ThrowsResourceNotFoundException() {
        when(userService.getLoggedInUser()).thenReturn(testAdmin);
        when(farmerRepository.findByIdAndAdmin(10L, testAdmin)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () ->
                feedPurchaseService.create(validRequest)
        );

        verify(feedPurchaseRepository, never()).save(any());
    }
}
