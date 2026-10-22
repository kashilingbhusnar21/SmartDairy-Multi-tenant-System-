package com.smartdairy.service.impl;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.smartdairy.dto.MarkPaymentPaidRequest;
import com.smartdairy.entity.Farmer;
import com.smartdairy.entity.FarmerFinancialAccount;
import com.smartdairy.entity.Payment;
import com.smartdairy.entity.Payment.PaymentMethod;
import com.smartdairy.entity.Payment.PaymentStatus;
import com.smartdairy.entity.User;
import com.smartdairy.repository.FarmerBillRepository;
import com.smartdairy.repository.FarmerFinancialAccountRepository;
import com.smartdairy.repository.FarmerFinancialTransactionRepository;
import com.smartdairy.repository.FeedPurchaseRepository;
import com.smartdairy.repository.PaymentRepository;
import com.smartdairy.service.FinancialCalculationService;
import com.smartdairy.service.FinancialRecoveryService;
import com.smartdairy.service.PaymentSettlementService.PaymentSettlementResult;
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
class PaymentSettlementServiceImplTest {

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private FarmerFinancialAccountRepository financialAccountRepository;

    @Mock
    private FarmerFinancialTransactionRepository financialTransactionRepository;

    @Mock
    private FarmerBillRepository farmerBillRepository;

    @Mock
    private FeedPurchaseRepository feedPurchaseRepository;

    @Mock
    private FinancialCalculationService financialCalculationService;

    @Mock
    private FinancialRecoveryService financialRecoveryService;

    @InjectMocks
    private PaymentSettlementServiceImpl paymentSettlementService;

    private User testAdmin;
    private Farmer testFarmer;
    private Payment testPayment;
    private FarmerFinancialAccount testAccount;
    private MarkPaymentPaidRequest markPaidRequest;

    @BeforeEach
    void setUp() {
        testAdmin = User.builder().id(1L).email("admin@dairy.com").build();
        testFarmer = Farmer.builder().id(10L).admin(testAdmin).fullName("Ramesh Patel").build();

        testPayment = Payment.builder()
                .id(100L)
                .admin(testAdmin)
                .farmer(testFarmer)
                .amount(new BigDecimal("10000.00")) // Gross payout: 10,000 INR
                .status(PaymentStatus.PENDING)
                .build();

        testAccount = FarmerFinancialAccount.builder()
                .admin(testAdmin)
                .farmer(testFarmer)
                .pendingAdvance(new BigDecimal("1500.00")) // 1,500 advance debt
                .pendingLoan(new BigDecimal("500.00"))      // 500 loan debt
                .pendingOther(BigDecimal.ZERO)
                .build();

        markPaidRequest = new MarkPaymentPaidRequest();
        markPaidRequest.setPaymentDate(LocalDate.now());
        markPaidRequest.setPaymentMethod(PaymentMethod.BANK_TRANSFER);
        markPaidRequest.setRemarks("Fortnightly settlement");
    }

    @Test
    @DisplayName("settlePayment: Deducts pending advance and loan debts from gross milk payout")
    void settlePayment_WithDebts_DeductsFromPaymentAmount() {
        // Arrange: 10,000 gross - (1,500 advance + 500 loan) = 8,000 net payout
        when(paymentRepository.findById(100L)).thenReturn(Optional.of(testPayment));
        when(financialAccountRepository.findByAdminAndFarmer(testAdmin, testFarmer)).thenReturn(Optional.of(testAccount));
        when(financialCalculationService.calculateTotalPendingBalance(testAccount)).thenReturn(new BigDecimal("2000.00"));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        PaymentSettlementResult result = paymentSettlementService.settlePayment(100L, markPaidRequest);

        // Assert
        assertTrue(result.success());
        Payment saved = result.payment();
        assertEquals(PaymentStatus.PAID, saved.getStatus());
        assertEquals(new BigDecimal("8000.00"), saved.getAmount()); // Net payout after deductions

        // Verify advance and loan recoveries were dispatched
        verify(financialRecoveryService, times(1)).recoverAdvance(eq(testAdmin), eq(testFarmer), eq(testAccount), eq(new BigDecimal("1500.00")), anyString(), anyString());
        verify(financialRecoveryService, times(1)).recoverLoan(eq(testAdmin), eq(testFarmer), eq(testAccount), eq(new BigDecimal("500.00")), anyString(), anyString());
    }

    @Test
    @DisplayName("settlePayment: Safety guard throws IllegalArgumentException when deductions exceed payment amount")
    void settlePayment_WhenDeductionsExceedAmount_ThrowsIllegalArgumentException() {
        // Arrange: Farmer only earned 1,000 but owes 2,000 in debts
        testPayment.setAmount(new BigDecimal("1000.00"));

        when(paymentRepository.findById(100L)).thenReturn(Optional.of(testPayment));
        when(financialAccountRepository.findByAdminAndFarmer(testAdmin, testFarmer)).thenReturn(Optional.of(testAccount));

        // Act & Assert: Must throw exception to prevent negative payout
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                paymentSettlementService.settlePayment(100L, markPaidRequest)
        );

        assertTrue(ex.getMessage().contains("Payment amount cannot be negative"));
        verify(paymentRepository, never()).save(any());
    }

    @Test
    @DisplayName("settlePayment: Returns failure result if payment is not in PENDING status")
    void settlePayment_WhenPaymentNotPending_ReturnsFailureResult() {
        testPayment.setStatus(PaymentStatus.PAID); // Already paid
        when(paymentRepository.findById(100L)).thenReturn(Optional.of(testPayment));

        PaymentSettlementResult result = paymentSettlementService.settlePayment(100L, markPaidRequest);

        assertFalse(result.success());
        assertEquals("Payment is not in PENDING status", result.message());
        verify(paymentRepository, never()).save(any());
    }
}
