package com.smartdairy.service;

import com.smartdairy.entity.FarmerBill;
import com.smartdairy.entity.Payment;
import com.smartdairy.dto.MarkPaymentPaidRequest;

public interface PaymentSettlementService {

    PaymentSettlementResult settlePayment(
            Long paymentId,
            MarkPaymentPaidRequest request);

    record PaymentSettlementResult(
            Payment payment,
            boolean success,
            String message
    ) {}
}
