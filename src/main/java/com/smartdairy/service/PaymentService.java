package com.smartdairy.service;

import com.smartdairy.dto.MarkPaymentPaidRequest;
import com.smartdairy.dto.PaymentDashboardStatsResponse;
import com.smartdairy.dto.PaymentResponse;
import com.smartdairy.dto.PaymentSummaryResponse;
import com.smartdairy.entity.Payment.PaymentStatus;
import java.time.LocalDate;
import java.util.List;

public interface PaymentService {

    PaymentResponse generateFromMilkCollection(Long milkCollectionId);

    PaymentResponse markPaid(Long paymentId, MarkPaymentPaidRequest request);

    List<PaymentResponse> listPending();

    List<PaymentResponse> listByFarmer(Long farmerId);

    List<PaymentResponse> listAll(PaymentStatus status);

    PaymentSummaryResponse weeklySummary(LocalDate weekStart, LocalDate weekEnd);

    PaymentSummaryResponse monthlySummary(int year, int month);

    PaymentDashboardStatsResponse dashboardStats();

    PaymentResponse getById(Long id);

    byte[] generateReceiptPdf(Long paymentId);
}
