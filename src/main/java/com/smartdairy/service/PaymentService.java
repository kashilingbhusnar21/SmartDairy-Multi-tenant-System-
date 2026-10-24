package com.smartdairy.service;

import com.smartdairy.dto.BatchMarkPaidRequest;
import com.smartdairy.dto.BatchMarkPaidResponse;
import com.smartdairy.dto.BatchPaymentRequest;
import com.smartdairy.dto.BatchPaymentResponse;
import com.smartdairy.dto.MarkPaymentPaidRequest;
import com.smartdairy.dto.PaymentDashboardStatsResponse;
import com.smartdairy.dto.PaymentResponse;
import com.smartdairy.dto.PaymentSummaryResponse;
import com.smartdairy.entity.Payment.PaymentStatus;
import java.time.LocalDate;
import java.util.List;

public interface PaymentService {

    PaymentResponse generateFromMilkCollection(Long milkCollectionId);

    BatchPaymentResponse generateBatchFromCollections(BatchPaymentRequest request);

    PaymentResponse markPaid(Long paymentId, MarkPaymentPaidRequest request);

    BatchMarkPaidResponse batchMarkPaid(BatchMarkPaidRequest request);

    List<PaymentResponse> listPending();

    List<PaymentResponse> listByFarmer(Long farmerId);

    List<PaymentResponse> listAll(PaymentStatus status);

    PaymentSummaryResponse weeklySummary(LocalDate weekStart, LocalDate weekEnd);

    PaymentSummaryResponse monthlySummary(int year, int month);

    PaymentDashboardStatsResponse dashboardStats();

    PaymentResponse getById(Long id);

    byte[] generateReceiptPdf(Long paymentId);
}
