package com.smartdairy.service;

import com.smartdairy.entity.FarmerFinancialAccount;
import java.math.BigDecimal;
import java.time.LocalDate;

public interface FinancialCalculationService {

    BillCalculationResult calculateBill(
            Long farmerId,
            LocalDate fromDate,
            LocalDate toDate,
            BigDecimal milkBillAmount,
            BigDecimal manualAdvanceRecovery,
            BigDecimal manualLoanRecovery,
            BigDecimal manualOtherRecovery);

    BigDecimal calculateNetPayable(
            BigDecimal milkBillAmount,
            BigDecimal feedDeduction,
            BigDecimal advanceRecovery,
            BigDecimal loanRecovery,
            BigDecimal otherRecovery);

    BigDecimal calculateTotalPendingBalance(FarmerFinancialAccount account);

    record BillCalculationResult(
            BigDecimal milkBillAmount,
            BigDecimal feedDeduction,
            BigDecimal advanceRecovery,
            BigDecimal loanRecovery,
            BigDecimal otherRecovery,
            BigDecimal totalDeductions,
            BigDecimal netPayable,
            BigDecimal pendingAdvanceBefore,
            BigDecimal pendingLoanBefore,
            BigDecimal pendingOtherBefore
    ) {}
}
