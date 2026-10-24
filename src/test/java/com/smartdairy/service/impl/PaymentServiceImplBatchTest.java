package com.smartdairy.service.impl;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

import com.smartdairy.dto.BatchMarkPaidRequest;
import com.smartdairy.dto.BatchMarkPaidResponse;
import com.smartdairy.dto.BatchPaymentRequest;
import com.smartdairy.dto.BatchPaymentResponse;
import com.smartdairy.entity.Farmer;
import com.smartdairy.entity.MilkCollection;
import com.smartdairy.entity.MilkCollection.Shift;
import com.smartdairy.entity.Payment;
import com.smartdairy.entity.Payment.PaymentMethod;
import com.smartdairy.entity.Payment.PaymentStatus;
import com.smartdairy.entity.User;
import com.smartdairy.repository.MilkCollectionRepository;
import com.smartdairy.repository.PaymentRepository;
import com.smartdairy.service.UserService;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class PaymentServiceImplBatchTest {

    @Mock
    private MilkCollectionRepository milkCollectionRepository;

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private UserService userService;

    @Mock
    private PaymentBatchProcessor paymentBatchProcessor;

    @InjectMocks
    private PaymentServiceImpl paymentService;

    private User testAdmin;
    private Farmer farmer1;
    private Farmer farmer2;
    private MilkCollection col1;
    private MilkCollection col2;

    @BeforeEach
    void setUp() {
        testAdmin = User.builder().id(1L).email("admin@dairy.com").build();
        farmer1 = Farmer.builder().id(10L).admin(testAdmin).fullName("Farmer A").build();
        farmer2 = Farmer.builder().id(20L).admin(testAdmin).fullName("Farmer B").build();

        col1 = MilkCollection.builder()
                .id(101L)
                .admin(testAdmin)
                .farmer(farmer1)
                .date(LocalDate.of(2026, 10, 24))
                .shift(Shift.MORNING)
                .totalAmount(new BigDecimal("350.00"))
                .build();

        col2 = MilkCollection.builder()
                .id(102L)
                .admin(testAdmin)
                .farmer(farmer2)
                .date(LocalDate.of(2026, 10, 24))
                .shift(Shift.MORNING)
                .totalAmount(new BigDecimal("420.00"))
                .build();
    }

    @Test
    @DisplayName("generateBatchFromCollections: filters by date and shift, records success and skips")
    void generateBatchFromCollections_FiltersByShift_ProcessesIndependently() {
        LocalDate testDate = LocalDate.of(2026, 10, 24);
        BatchPaymentRequest request = BatchPaymentRequest.builder()
                .date(testDate)
                .shift(Shift.MORNING)
                .build();

        when(userService.getLoggedInUser()).thenReturn(testAdmin);
        when(milkCollectionRepository.findByAdminAndDateAndShiftOrderByFarmer_FullNameAsc(testAdmin, testDate, Shift.MORNING))
                .thenReturn(List.of(col1, col2));

        Payment p1 = Payment.builder().id(201L).amount(new BigDecimal("350.00")).build();
        when(paymentBatchProcessor.processSingleCollection(testAdmin, 101L)).thenReturn(p1);
        when(paymentBatchProcessor.processSingleCollection(testAdmin, 102L))
                .thenThrow(new IllegalArgumentException("Payment already exists for milk collection id: 102"));

        BatchPaymentResponse response = paymentService.generateBatchFromCollections(request);

        assertNotNull(response);
        assertEquals(2, response.getTotalProcessed());
        assertEquals(1, response.getSuccessCount());
        assertEquals(1, response.getSkippedCount());
        assertEquals(0, response.getFailedCount());
        assertEquals(List.of(201L), response.getCreatedPaymentIds());
        assertEquals(2, response.getDetails().size());
        assertTrue(response.getDetails().get(0).contains("Created payment #201"));
        assertTrue(response.getDetails().get(1).contains("Skipped - payment already exists"));
    }

    @Test
    @DisplayName("batchMarkPaid: executes independent settlements, tracks partial success and failures")
    void batchMarkPaid_ExecutesIndependentSettlements() {
        BatchMarkPaidRequest request = BatchMarkPaidRequest.builder()
                .paymentIds(List.of(201L, 202L))
                .paymentDate(LocalDate.of(2026, 10, 24))
                .paymentMethod(PaymentMethod.CASH)
                .remarks("Batch settlement")
                .build();

        when(userService.getLoggedInUser()).thenReturn(testAdmin);

        Payment settled1 = Payment.builder()
                .id(201L)
                .farmer(farmer1)
                .status(PaymentStatus.PAID)
                .amount(new BigDecimal("350.00"))
                .paymentMethod(PaymentMethod.CASH)
                .build();

        when(paymentBatchProcessor.processSingleMarkPaid(eq(testAdmin), eq(201L), any())).thenReturn(settled1);
        when(paymentBatchProcessor.processSingleMarkPaid(eq(testAdmin), eq(202L), any()))
                .thenThrow(new IllegalArgumentException("Only pending payments can be marked as paid"));

        BatchMarkPaidResponse response = paymentService.batchMarkPaid(request);

        assertNotNull(response);
        assertEquals(2, response.getTotalProcessed());
        assertEquals(1, response.getSuccessCount());
        assertEquals(1, response.getFailedCount());
        assertEquals(List.of(201L), response.getPaidPaymentIds());
        assertEquals(2, response.getDetails().size());
        assertTrue(response.getDetails().get(0).contains("Paid Rs.350.00"));
        assertTrue(response.getDetails().get(1).contains("Failed"));
    }
}
