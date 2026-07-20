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
import com.smartdairy.service.FinancialCalculationService;
import com.smartdairy.service.FinancialRecoveryService;
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
public class FinancialRecoveryServiceImpl implements FinancialRecoveryService {

    private final FarmerFinancialAccountRepository accountRepository;
    private final FarmerFinancialTransactionRepository transactionRepository;
    private final FeedPurchaseRepository feedPurchaseRepository;
    private final FinancialCalculationService financialCalculationService;

    @Override
    @Transactional
    public void recoverBillDeductions(
            User admin,
            Farmer farmer,
            FarmerFinancialAccount account,
            FarmerBill bill) {

        String billRef = generateBillReferenceId(bill);

        if (bill.getFeedDeduction().compareTo(BigDecimal.ZERO) > 0) {
            recoverFeed(
                    admin,
                    farmer,
                    account,
                    bill.getFeedDeduction(),
                    bill.getFromDate(),
                    bill.getToDate(),
                    billRef,
                    "Feed deduction recovered from bill: " + bill.getFromDate() + " to " + bill.getToDate());
        }

        if (bill.getAdvancePayment().compareTo(BigDecimal.ZERO) > 0) {
            recoverAdvance(
                    admin,
                    farmer,
                    account,
                    bill.getAdvancePayment(),
                    billRef,
                    "Advance recovered from bill: " + bill.getFromDate() + " to " + bill.getToDate());
        }

        if (bill.getLoanAmount().compareTo(BigDecimal.ZERO) > 0) {
            recoverLoan(
                    admin,
                    farmer,
                    account,
                    bill.getLoanAmount(),
                    billRef,
                    "Loan recovered from bill: " + bill.getFromDate() + " to " + bill.getToDate());
        }

        if (bill.getOtherDeductions().compareTo(BigDecimal.ZERO) > 0) {
            recoverOther(
                    admin,
                    farmer,
                    account,
                    bill.getOtherDeductions(),
                    billRef,
                    "Other deduction recovered from bill: " + bill.getFromDate() + " to " + bill.getToDate());
        }

        accountRepository.save(account);
    }

    @Override
    @Transactional
    public void recoverAdvance(
            User admin,
            Farmer farmer,
            FarmerFinancialAccount account,
            BigDecimal amount,
            String referenceId,
            String description) {

        BigDecimal recoveryAmount = FinancialMath.scale(amount);
        if (recoveryAmount.compareTo(BigDecimal.ZERO) <= 0) {
            return;
        }

        if (transactionRepository.existsByAdminAndFarmerAndReferenceIdAndTransactionType(
                admin, farmer, referenceId, FarmerFinancialTransaction.FinancialTransactionType.ADVANCE_RECOVERED)) {
            return;
        }

        BigDecimal categoryBalanceBefore = FinancialMath.scale(account.getPendingAdvance());
        if (recoveryAmount.compareTo(categoryBalanceBefore) > 0) {
            throw new IllegalArgumentException(
                    "Advance recovery exceeds pending balance. Pending: " + categoryBalanceBefore + ", Attempted: " + recoveryAmount);
        }

        BigDecimal runningBalanceBefore = financialCalculationService.calculateTotalPendingBalance(account);
        account.setPendingAdvance(categoryBalanceBefore.subtract(recoveryAmount).setScale(2, RoundingMode.HALF_UP));
        BigDecimal runningBalanceAfter = financialCalculationService.calculateTotalPendingBalance(account);

        createTransaction(
                admin,
                farmer,
                account,
                FarmerFinancialTransaction.FinancialTransactionType.ADVANCE_RECOVERED,
                recoveryAmount,
                runningBalanceBefore,
                runningBalanceAfter,
                description,
                FarmerFinancialTransaction.ReferenceType.BILL,
                referenceId);
    }

    @Override
    @Transactional
    public void recoverLoan(
            User admin,
            Farmer farmer,
            FarmerFinancialAccount account,
            BigDecimal amount,
            String referenceId,
            String description) {

        BigDecimal recoveryAmount = FinancialMath.scale(amount);
        if (recoveryAmount.compareTo(BigDecimal.ZERO) <= 0) {
            return;
        }

        if (transactionRepository.existsByAdminAndFarmerAndReferenceIdAndTransactionType(
                admin, farmer, referenceId, FarmerFinancialTransaction.FinancialTransactionType.LOAN_RECOVERED)) {
            return;
        }

        BigDecimal categoryBalanceBefore = FinancialMath.scale(account.getPendingLoan());
        if (recoveryAmount.compareTo(categoryBalanceBefore) > 0) {
            throw new IllegalArgumentException(
                    "Loan recovery exceeds pending balance. Pending: " + categoryBalanceBefore + ", Attempted: " + recoveryAmount);
        }

        BigDecimal runningBalanceBefore = financialCalculationService.calculateTotalPendingBalance(account);
        account.setPendingLoan(categoryBalanceBefore.subtract(recoveryAmount).setScale(2, RoundingMode.HALF_UP));
        BigDecimal runningBalanceAfter = financialCalculationService.calculateTotalPendingBalance(account);

        createTransaction(
                admin,
                farmer,
                account,
                FarmerFinancialTransaction.FinancialTransactionType.LOAN_RECOVERED,
                recoveryAmount,
                runningBalanceBefore,
                runningBalanceAfter,
                description,
                FarmerFinancialTransaction.ReferenceType.BILL,
                referenceId);
    }

    @Override
    @Transactional
    public void recoverOther(
            User admin,
            Farmer farmer,
            FarmerFinancialAccount account,
            BigDecimal amount,
            String referenceId,
            String description) {

        BigDecimal recoveryAmount = FinancialMath.scale(amount);
        if (recoveryAmount.compareTo(BigDecimal.ZERO) <= 0) {
            return;
        }

        if (transactionRepository.existsByAdminAndFarmerAndReferenceIdAndTransactionType(
                admin, farmer, referenceId, FarmerFinancialTransaction.FinancialTransactionType.OTHER_RECOVERED)) {
            return;
        }

        BigDecimal categoryBalanceBefore = FinancialMath.scale(account.getPendingOther());
        if (recoveryAmount.compareTo(categoryBalanceBefore) > 0) {
            throw new IllegalArgumentException(
                    "Other recovery exceeds pending balance. Pending: " + categoryBalanceBefore + ", Attempted: " + recoveryAmount);
        }

        BigDecimal runningBalanceBefore = financialCalculationService.calculateTotalPendingBalance(account);
        account.setPendingOther(categoryBalanceBefore.subtract(recoveryAmount).setScale(2, RoundingMode.HALF_UP));
        BigDecimal runningBalanceAfter = financialCalculationService.calculateTotalPendingBalance(account);

        createTransaction(
                admin,
                farmer,
                account,
                FarmerFinancialTransaction.FinancialTransactionType.OTHER_RECOVERED,
                recoveryAmount,
                runningBalanceBefore,
                runningBalanceAfter,
                description,
                FarmerFinancialTransaction.ReferenceType.BILL,
                referenceId);
    }

    @Override
    @Transactional
    public void recoverFeed(
            User admin,
            Farmer farmer,
            FarmerFinancialAccount account,
            BigDecimal amount,
            LocalDate fromDate,
            LocalDate toDate,
            String referenceId,
            String description) {

        BigDecimal recoveryAmount = FinancialMath.scale(amount);
        if (recoveryAmount.compareTo(BigDecimal.ZERO) <= 0) {
            return;
        }

        if (transactionRepository.existsByAdminAndFarmerAndReferenceIdAndTransactionType(
                admin, farmer, referenceId, FarmerFinancialTransaction.FinancialTransactionType.FEED_PURCHASE_RECOVERED)) {
            return;
        }

        List<FeedPurchase> outstanding = fromDate != null && toDate != null
                ? feedPurchaseRepository.findOutstandingByAdminAndFarmerInDateRange(admin, farmer.getId(), fromDate, toDate)
                : feedPurchaseRepository.findOutstandingByAdminAndFarmer(admin, farmer.getId());

        BigDecimal remainingToRecover = recoveryAmount;
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
            return;
        }

        BigDecimal categoryBalanceBefore = FinancialMath.scale(account.getPendingOther());
        if (totalRecovered.compareTo(categoryBalanceBefore) > 0) {
            throw new IllegalArgumentException(
                    "Feed recovery exceeds pending other balance. Pending: " + categoryBalanceBefore + ", Attempted: " + totalRecovered);
        }

        BigDecimal runningBalanceBefore = financialCalculationService.calculateTotalPendingBalance(account);
        account.setPendingOther(categoryBalanceBefore.subtract(totalRecovered).setScale(2, RoundingMode.HALF_UP));
        BigDecimal runningBalanceAfter = financialCalculationService.calculateTotalPendingBalance(account);

        createTransaction(
                admin,
                farmer,
                account,
                FarmerFinancialTransaction.FinancialTransactionType.FEED_PURCHASE_RECOVERED,
                totalRecovered,
                runningBalanceBefore,
                runningBalanceAfter,
                description,
                FarmerFinancialTransaction.ReferenceType.BILL,
                referenceId);
    }

    private void createTransaction(
            User admin,
            Farmer farmer,
            FarmerFinancialAccount account,
            FarmerFinancialTransaction.FinancialTransactionType transactionType,
            BigDecimal amount,
            BigDecimal balanceBefore,
            BigDecimal balanceAfter,
            String description,
            FarmerFinancialTransaction.ReferenceType referenceType,
            String referenceId) {

        FarmerFinancialTransaction transaction = FarmerFinancialTransaction.builder()
                .account(account)
                .farmer(farmer)
                .admin(admin)
                .transactionType(transactionType)
                .amount(amount)
                .balanceBefore(balanceBefore)
                .balanceAfter(balanceAfter)
                .description(description)
                .referenceType(referenceType)
                .referenceId(referenceId)
                .build();
        transactionRepository.save(transaction);
    }

    private String generateBillReferenceId(FarmerBill bill) {
        return "BILL-" + bill.getFarmer().getId() + "-"
                + bill.getFromDate().toString().replace("-", "") + "-"
                + bill.getToDate().toString().replace("-", "");
    }
}
