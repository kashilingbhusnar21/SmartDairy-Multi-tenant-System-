package com.smartdairy.service.impl;

import com.smartdairy.dto.MarkPaymentPaidRequest;
import com.smartdairy.entity.Farmer;
import com.smartdairy.entity.FarmerBill;
import com.smartdairy.entity.FarmerFinancialAccount;
import com.smartdairy.entity.FarmerFinancialTransaction;
import com.smartdairy.entity.Payment;
import com.smartdairy.entity.Payment.PaymentStatus;
import com.smartdairy.entity.User;
import com.smartdairy.exception.ResourceNotFoundException;
import com.smartdairy.repository.FarmerBillRepository;
import com.smartdairy.repository.FarmerFinancialAccountRepository;
import com.smartdairy.repository.FarmerFinancialTransactionRepository;
import com.smartdairy.repository.FeedPurchaseRepository;
import com.smartdairy.repository.PaymentRepository;
import com.smartdairy.service.FinancialCalculationService;
import com.smartdairy.service.FinancialRecoveryService;
import com.smartdairy.service.PaymentSettlementService;
import com.smartdairy.util.FinancialMath;
import java.math.BigDecimal;
import java.math.RoundingMode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PaymentSettlementServiceImpl implements PaymentSettlementService {

    private final PaymentRepository paymentRepository;
    private final FarmerFinancialAccountRepository financialAccountRepository;
    private final FarmerFinancialTransactionRepository financialTransactionRepository;
    private final FarmerBillRepository farmerBillRepository;
    private final FeedPurchaseRepository feedPurchaseRepository;
    private final FinancialCalculationService financialCalculationService;
    private final FinancialRecoveryService financialRecoveryService;

    @Override
    @Transactional
    public PaymentSettlementService.PaymentSettlementResult settlePayment(Long paymentId, MarkPaymentPaidRequest request) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found with id: " + paymentId));

        if (payment.getStatus() != PaymentStatus.PENDING) {
            return new PaymentSettlementService.PaymentSettlementResult(payment, false, "Payment is not in PENDING status");
        }

        User admin = payment.getAdmin();
        Farmer farmer = payment.getFarmer();

        FarmerFinancialAccount account = financialAccountRepository
                .findByAdminAndFarmer(admin, farmer)
                .orElseGet(() -> financialAccountRepository.save(FarmerFinancialAccount.builder()
                        .admin(admin)
                        .farmer(farmer)
                        .pendingAdvance(BigDecimal.ZERO)
                        .pendingLoan(BigDecimal.ZERO)
                        .pendingOther(BigDecimal.ZERO)
                        .build()));

        BigDecimal totalPendingBefore = financialCalculationService.calculateTotalPendingBalance(account);

        BigDecimal pendingAdvance = FinancialMath.scale(account.getPendingAdvance());
        BigDecimal pendingLoan = FinancialMath.scale(account.getPendingLoan());
        BigDecimal pendingOther = FinancialMath.scale(account.getPendingOther());

        // Feed is already deducted during Payment Generation.
        // Therefore only manual other deductions should be deducted here.

        BigDecimal manualOther = pendingOther;

        BigDecimal totalDeductions = pendingAdvance
                .add(pendingLoan)
                .add(manualOther);

        BigDecimal finalPaymentAmount = payment.getAmount()
                .subtract(totalDeductions)
                .setScale(2, RoundingMode.HALF_UP);

        if (finalPaymentAmount.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException(
                    "Total deductions (" + totalDeductions + ") exceed payment amount (" + payment.getAmount() + "). " +
                    "Payment amount cannot be negative. Please adjust pending balances or payment amount.");
        }

        payment.setStatus(PaymentStatus.PAID);
        payment.setPaymentDate(request.getPaymentDate());
        payment.setPaymentMethod(request.getPaymentMethod());
        payment.setRemarks(request.getRemarks());
        payment.setAmount(finalPaymentAmount);
        payment = paymentRepository.save(payment);

        String paymentRef = "PAYMENT-" + payment.getId();

        if (pendingAdvance.compareTo(BigDecimal.ZERO) > 0) {
            financialRecoveryService.recoverAdvance(
                    admin,
                    farmer,
                    account,
                    pendingAdvance,
                    paymentRef,
                    "Advance recovered via payment settlement");
        }

        if (pendingLoan.compareTo(BigDecimal.ZERO) > 0) {
            financialRecoveryService.recoverLoan(
                    admin,
                    farmer,
                    account,
                    pendingLoan,
                    paymentRef,
                    "Loan recovered via payment settlement");
        }

        if (manualOther.compareTo(BigDecimal.ZERO) > 0) {
            financialRecoveryService.recoverOther(
                    admin,
                    farmer,
                    account,
                    manualOther,
                    paymentRef,
                    "Other deduction recovered via payment settlement");
        }

        financialAccountRepository.save(account);

        BigDecimal totalPendingAfter = financialCalculationService.calculateTotalPendingBalance(account);

        FarmerFinancialTransaction transaction = FarmerFinancialTransaction.builder()
                .account(account)
                .farmer(farmer)
                .admin(admin)
                .transactionType(FarmerFinancialTransaction.FinancialTransactionType.PAYMENT_RELEASED)
                .amount(payment.getAmount())
                .balanceBefore(totalPendingBefore)
                .balanceAfter(totalPendingAfter)
                .transactionDate(payment.getPaymentDate())
                .description("Payment released for milk collection - Method: " + payment.getPaymentMethod())
                .referenceType(FarmerFinancialTransaction.ReferenceType.PAYMENT)
                .referenceId(paymentRef)
                .build();
        financialTransactionRepository.save(transaction);

        return new PaymentSettlementService.PaymentSettlementResult(payment, true, "Payment settled successfully");
    }
}
