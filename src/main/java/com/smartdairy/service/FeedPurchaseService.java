package com.smartdairy.service;

import com.smartdairy.dto.FeedChartPointResponse;
import com.smartdairy.dto.FeedPurchaseRequest;
import com.smartdairy.dto.FeedPurchaseResponse;
import com.smartdairy.dto.FeedSummaryResponse;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface FeedPurchaseService {
    FeedPurchaseResponse create(FeedPurchaseRequest request);

    List<FeedPurchaseResponse> list(Long farmerId, LocalDate from, LocalDate to);

    FeedSummaryResponse summary(LocalDate from, LocalDate to);

    List<FeedChartPointResponse> chart(LocalDate from, LocalDate to);

    byte[] export(LocalDate from, LocalDate to, Long farmerId, String format);

    BigDecimal applyOutstandingDeductionForPayment(Long farmerId, BigDecimal availableAmount, Long paymentId);

    BigDecimal getOutstandingByFarmer(Long farmerId);
}
