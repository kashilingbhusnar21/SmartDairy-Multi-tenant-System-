package com.smartdairy.service.impl;

import com.smartdairy.dto.MarkPaymentPaidRequest;
import com.smartdairy.entity.FarmerFinancialAccount;
import com.smartdairy.entity.MilkCollection;
import com.smartdairy.entity.Payment;
import com.smartdairy.entity.Payment.PaymentStatus;
import com.smartdairy.entity.User;
import com.smartdairy.exception.ResourceNotFoundException;
import com.smartdairy.repository.MilkCollectionRepository;
import com.smartdairy.repository.PaymentRepository;
import com.smartdairy.service.FarmerFinancialAccountService;
import com.smartdairy.service.FarmerFinancialSettlementService;
import com.smartdairy.service.FeedPurchaseService;
import com.smartdairy.service.PaymentSettlementService;
import java.math.BigDecimal;
import java.math.RoundingMode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class PaymentBatchProcessor {

    private final PaymentRepository paymentRepository;
    private final MilkCollectionRepository milkCollectionRepository;
    private final FeedPurchaseService feedPurchaseService;
    private final FarmerFinancialAccountService financialAccountService;
    private final FarmerFinancialSettlementService financialSettlementService;
    private final PaymentSettlementService paymentSettlementService;
    private final SmsService smsService;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public Payment processSingleCollection(User admin, Long milkCollectionId) {
        MilkCollection collection = milkCollectionRepository.findByAdminAndId(admin, milkCollectionId)
                .orElseThrow(() -> new ResourceNotFoundException("Milk collection not found with id: " + milkCollectionId));

        if (paymentRepository.findByAdminAndMilkCollection_Id(admin, milkCollectionId).isPresent()) {
            throw new IllegalArgumentException("Payment already exists for milk collection id: " + milkCollectionId);
        }

        Payment payment = Payment.builder()
                .admin(admin)
                .farmer(collection.getFarmer())
                .milkCollection(collection)
                .amount(collection.getTotalAmount())
                .grossAmount(collection.getTotalAmount())
                .feedDeductionAmount(BigDecimal.ZERO.setScale(2))
                .status(PaymentStatus.PENDING)
                .build();
        payment = paymentRepository.save(payment);

        BigDecimal deducted = feedPurchaseService.applyOutstandingDeductionForPayment(
                collection.getFarmer().getId(), collection.getTotalAmount(), payment.getId());
        payment.setFeedDeductionAmount(deducted);
        payment.setAmount(collection.getTotalAmount().subtract(deducted).setScale(2, RoundingMode.HALF_UP));

        if (deducted.compareTo(BigDecimal.ZERO) > 0) {
            FarmerFinancialAccount financialAccount = financialAccountService.getOrCreateAccountByFarmer(
                    collection.getFarmer().getId());
            financialSettlementService.recoverFeedForPayment(
                    admin,
                    collection.getFarmer(),
                    financialAccount,
                    deducted,
                    payment.getId());
        }

        return paymentRepository.save(payment);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public Payment processSingleMarkPaid(User admin, Long paymentId, MarkPaymentPaidRequest request) {
        Payment payment = paymentRepository.findByAdminAndId(admin, paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found with id: " + paymentId));

        if (payment.getStatus() != PaymentStatus.PENDING) {
            throw new IllegalArgumentException("Only pending payments can be marked as paid. Payment " + paymentId + " status is " + payment.getStatus());
        }

        var settlementResult = paymentSettlementService.settlePayment(paymentId, request);
        if (!settlementResult.success()) {
            throw new IllegalStateException(settlementResult.message());
        }

        Payment settled = settlementResult.payment();

        try {
            smsService.sendSms(
                    settled.getFarmer().getMobileNumber(),
                    "Dear " + settled.getFarmer().getFullName()
                            + "\nPayment Successful"
                            + "\nAmount: Rs." + settled.getAmount()
                            + "\nMethod: " + settled.getPaymentMethod()
                            + "\nStatus: " + settled.getStatus()
                            + "\nDate: " + settled.getPaymentDate()
                            + "\nThank you for using Smart Dairy.");
        } catch (Exception e) {
            // Keep going even if SMS fails
        }

        return settled;
    }
}
