package com.smartdairy.service.impl;

import com.smartdairy.entity.Farmer;
import com.smartdairy.entity.FarmerBill;
import com.smartdairy.entity.FarmerFinancialAccount;
import com.smartdairy.entity.FarmerFinancialTransaction;
import com.smartdairy.entity.FeedPurchase;
import com.smartdairy.entity.User;
import com.smartdairy.repository.FarmerFinancialAccountRepository;
import com.smartdairy.repository.FarmerFinancialTransactionRepository;
import com.smartdairy.repository.FeedPurchaseRepository;
import com.smartdairy.service.FarmerFinancialSettlementService;
import com.smartdairy.util.FinancialMath;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class FarmerFinancialSettlementServiceImpl implements FarmerFinancialSettlementService {

    private final FeedPurchaseRepository feedPurchaseRepository;
    private final FarmerFinancialAccountRepository accountRepository;
    private final FarmerFinancialTransactionRepository transactionRepository;

    @Override
    @Transactional
    public void settleBillDeductions(User admin, Farmer farmer, FarmerFinancialAccount account, FarmerBill bill) {
        String billRef = billReferenceId(bill);

        if (bill.getFeedDeduction().compareTo(BigDecimal.ZERO) > 0) {
            recoverFeed(
                    admin,
                    farmer,
                    account,
                    bill.getFeedDeduction(),
                    bill.getFromDate(),
                    bill.getToDate(),
                    FarmerFinancialTransaction.ReferenceType.BILL,
                    billRef,
                    "Feed recovered from bill: " + bill.getFromDate() + " to " + bill.getToDate());
        }

        recoverFromAccount(
                admin,
                farmer,
                account,
                FarmerFinancialTransaction.FinancialTransactionType.ADVANCE_RECOVERED,
                bill.getAdvancePayment(),
                account.getPendingAdvance(),
                billRef,
                "Advance recovered from bill: " + bill.getFromDate() + " to " + bill.getToDate(),
                (before, after) -> account.setPendingAdvance(after));

        recoverFromAccount(
                admin,
                farmer,
                account,
                FarmerFinancialTransaction.FinancialTransactionType.LOAN_RECOVERED,
                bill.getLoanAmount(),
                account.getPendingLoan(),
                billRef,
                "Loan recovered from bill: " + bill.getFromDate() + " to " + bill.getToDate(),
                (before, after) -> account.setPendingLoan(after));

        recoverFromAccount(
                admin,
                farmer,
                account,
                FarmerFinancialTransaction.FinancialTransactionType.OTHER_RECOVERED,
                bill.getOtherDeductions(),
                account.getPendingOther(),
                billRef,
                "Other deduction recovered from bill: " + bill.getFromDate() + " to " + bill.getToDate(),
                (before, after) -> account.setPendingOther(after));

        accountRepository.save(account);
    }

    @Override
    @Transactional
    public BigDecimal recoverFeedForPayment(
            User admin,
            Farmer farmer,
            FarmerFinancialAccount account,
            BigDecimal amount,
            Long paymentId) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }

        String paymentRef = "PAYMENT-" + paymentId;
        if (transactionRepository.existsByAdminAndFarmerAndReferenceIdAndTransactionType(
                admin, farmer, paymentRef, FarmerFinancialTransaction.FinancialTransactionType.FEED_PURCHASE_RECOVERED)) {
            return BigDecimal.ZERO;
        }

        BigDecimal recoveryAmount = FinancialMath.scale(amount);
        BigDecimal balanceBefore = FinancialMath.scale(account.getPendingOther());
        if (recoveryAmount.compareTo(balanceBefore) > 0) {
            throw new IllegalArgumentException(
                    "Feed recovery exceeds pending other balance. Pending: " + balanceBefore + ", Attempted: " + recoveryAmount);
        }
        BigDecimal balanceAfter = balanceBefore.subtract(recoveryAmount).setScale(2, RoundingMode.HALF_UP);
        account.setPendingOther(balanceAfter);

        FarmerFinancialTransaction transaction = FarmerFinancialTransaction.builder()
                .account(account)
                .farmer(farmer)
                .admin(admin)
                .transactionType(FarmerFinancialTransaction.FinancialTransactionType.FEED_PURCHASE_RECOVERED)
                .amount(recoveryAmount)
                .balanceBefore(balanceBefore)
                .balanceAfter(balanceAfter)
                .description("Feed recovered via payment settlement")
                .referenceType(FarmerFinancialTransaction.ReferenceType.PAYMENT)
                .referenceId(paymentRef)
                .build();
        transactionRepository.save(transaction);
        accountRepository.save(account);
        return recoveryAmount;
    }

    @Override
    @Transactional(readOnly = true)
    public BigDecimal sumOutstandingFeedInPeriod(User admin, Long farmerId, LocalDate from, LocalDate to) {
        return FinancialMath.scale(
                feedPurchaseRepository.sumOutstandingBetweenForAdminAndFarmer(admin, from, to, farmerId));
    }

    private BigDecimal recoverFeed(
            User admin,
            Farmer farmer,
            FarmerFinancialAccount account,
            BigDecimal requestedAmount,
            LocalDate from,
            LocalDate to,
            FarmerFinancialTransaction.ReferenceType referenceType,
            String referenceId,
            String description) {
        BigDecimal amount = FinancialMath.scale(requestedAmount);
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }

        if (transactionRepository.existsByAdminAndFarmerAndReferenceIdAndTransactionType(
                admin, farmer, referenceId, FarmerFinancialTransaction.FinancialTransactionType.FEED_PURCHASE_RECOVERED)) {
            return BigDecimal.ZERO;
        }

        List<FeedPurchase> outstanding = from != null && to != null
                ? feedPurchaseRepository.findOutstandingByAdminAndFarmerInDateRange(admin, farmer.getId(), from, to)
                : feedPurchaseRepository.findOutstandingByAdminAndFarmer(admin, farmer.getId());

        BigDecimal remainingToRecover = amount;
        BigDecimal totalRecovered = BigDecimal.ZERO;

        for (FeedPurchase feed : outstanding) {
            if (remainingToRecover.compareTo(BigDecimal.ZERO) <= 0) {
                break;
            }
            BigDecimal canSettle = feed.getRemainingAmount().min(remainingToRecover).setScale(2, RoundingMode.HALF_UP);
            if (canSettle.compareTo(BigDecimal.ZERO) <= 0) {
                continue;
            }
            feed.setRemainingAmount(feed.getRemainingAmount().subtract(canSettle).setScale(2, RoundingMode.HALF_UP));
            feedPurchaseRepository.save(feed);
            remainingToRecover = remainingToRecover.subtract(canSettle);
            totalRecovered = totalRecovered.add(canSettle);
        }

        if (totalRecovered.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }

        BigDecimal balanceBefore = FinancialMath.scale(account.getPendingOther());
        BigDecimal balanceAfter = balanceBefore.subtract(totalRecovered).setScale(2, RoundingMode.HALF_UP);
        if (balanceAfter.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException(
                    "Feed recovery exceeds pending other balance. Pending: " + balanceBefore + ", Attempted: " + totalRecovered);
        }
        account.setPendingOther(balanceAfter);

        FarmerFinancialTransaction transaction = FarmerFinancialTransaction.builder()
                .account(account)
                .farmer(farmer)
                .admin(admin)
                .transactionType(FarmerFinancialTransaction.FinancialTransactionType.FEED_PURCHASE_RECOVERED)
                .amount(totalRecovered)
                .balanceBefore(balanceBefore)
                .balanceAfter(balanceAfter)
                .description(description)
                .referenceType(referenceType)
                .referenceId(referenceId)
                .build();
        transactionRepository.save(transaction);
        return totalRecovered;
    }

    private void recoverFromAccount(
            User admin,
            Farmer farmer,
            FarmerFinancialAccount account,
            FarmerFinancialTransaction.FinancialTransactionType type,
            BigDecimal amount,
            BigDecimal currentBalance,
            String billRef,
            String description,
            BalanceUpdater updater) {
        BigDecimal recoveryAmount = FinancialMath.scale(amount);
        if (recoveryAmount.compareTo(BigDecimal.ZERO) <= 0) {
            return;
        }

        if (transactionRepository.existsByAdminAndFarmerAndReferenceIdAndTransactionType(admin, farmer, billRef, type)) {
            return;
        }

        BigDecimal balanceBefore = FinancialMath.scale(currentBalance);
        if (recoveryAmount.compareTo(balanceBefore) > 0) {
            throw new IllegalArgumentException(
                    type + " recovery exceeds pending balance. Pending: " + balanceBefore + ", Attempted: " + recoveryAmount);
        }

        BigDecimal balanceAfter = balanceBefore.subtract(recoveryAmount).setScale(2, RoundingMode.HALF_UP);
        updater.apply(balanceBefore, balanceAfter);

        FarmerFinancialTransaction transaction = FarmerFinancialTransaction.builder()
                .account(account)
                .farmer(farmer)
                .admin(admin)
                .transactionType(type)
                .amount(recoveryAmount)
                .balanceBefore(balanceBefore)
                .balanceAfter(balanceAfter)
                .description(description)
                .referenceType(FarmerFinancialTransaction.ReferenceType.BILL)
                .referenceId(billRef)
                .build();
        transactionRepository.save(transaction);
    }

    private String billReferenceId(FarmerBill bill) {
        return "BILL-" + bill.getFarmer().getId() + "-"
                + bill.getFromDate().toString().replace("-", "") + "-"
                + bill.getToDate().toString().replace("-", "");
    }

    @FunctionalInterface
    private interface BalanceUpdater {
        void apply(BigDecimal balanceBefore, BigDecimal balanceAfter);
    }
}
