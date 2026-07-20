package com.smartdairy.service.impl;

import com.smartdairy.entity.FarmerFinancialAccount;
import com.smartdairy.repository.FeedPurchaseRepository;
import com.smartdairy.service.FarmerFinancialAccountService;
import com.smartdairy.service.FinancialCalculationService;
import com.smartdairy.util.FinancialMath;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class FinancialCalculationServiceImpl implements FinancialCalculationService {

    private final FarmerFinancialAccountService financialAccountService;
    private final FeedPurchaseRepository feedPurchaseRepository;

    @Override
    public BillCalculationResult calculateBill(
            Long farmerId,
            LocalDate fromDate,
            LocalDate toDate,
            BigDecimal milkBillAmount,
            BigDecimal manualAdvanceRecovery,
            BigDecimal manualLoanRecovery,
            BigDecimal manualOtherRecovery) {

        FarmerFinancialAccount account = financialAccountService.getOrCreateAccountByFarmer(farmerId);

        BigDecimal advanceRecovery = FinancialMath.scale(account.getPendingAdvance());
        BigDecimal loanRecovery = FinancialMath.scale(account.getPendingLoan());
        BigDecimal otherRecovery = FinancialMath.scale(account.getPendingOther());

        BigDecimal feedDeduction = FinancialMath.scale(
                feedPurchaseRepository.sumOutstandingBetweenForAdminAndFarmer(
                        account.getAdmin(), fromDate, toDate, farmerId));

        BigDecimal totalDeductions = advanceRecovery
                .add(loanRecovery)
                .add(otherRecovery)
                .setScale(2, RoundingMode.HALF_UP);

        BigDecimal netPayable = calculateNetPayable(
                milkBillAmount, feedDeduction, advanceRecovery, loanRecovery, otherRecovery);

        return new BillCalculationResult(
                FinancialMath.scale(milkBillAmount),
                feedDeduction,
                advanceRecovery,
                loanRecovery,
                otherRecovery,
                totalDeductions,
                netPayable,
                FinancialMath.scale(account.getPendingAdvance()),
                FinancialMath.scale(account.getPendingLoan()),
                FinancialMath.scale(account.getPendingOther())
        );
    }

    @Override
    public BigDecimal calculateNetPayable(
            BigDecimal milkBillAmount,
            BigDecimal feedDeduction,
            BigDecimal advanceRecovery,
            BigDecimal loanRecovery,
            BigDecimal otherRecovery) {

        BigDecimal totalDeductions = FinancialMath.scale(advanceRecovery)
                .add(FinancialMath.scale(loanRecovery))
                .add(FinancialMath.scale(otherRecovery))
                .setScale(2, RoundingMode.HALF_UP);

        return FinancialMath.scale(milkBillAmount)
                .subtract(totalDeductions)
                .setScale(2, RoundingMode.HALF_UP);
    }

    @Override
    public BigDecimal calculateTotalPendingBalance(FarmerFinancialAccount account) {
        return FinancialMath.totalPending(
                account.getPendingAdvance(),
                account.getPendingLoan(),
                account.getPendingOther());
    }
}
