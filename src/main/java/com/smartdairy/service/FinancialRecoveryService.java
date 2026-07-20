package com.smartdairy.service;

import com.smartdairy.entity.Farmer;
import com.smartdairy.entity.FarmerBill;
import com.smartdairy.entity.FarmerFinancialAccount;
import com.smartdairy.entity.User;
import java.math.BigDecimal;
import java.time.LocalDate;

public interface FinancialRecoveryService {

    void recoverBillDeductions(
            User admin,
            Farmer farmer,
            FarmerFinancialAccount account,
            FarmerBill bill);

    void recoverAdvance(
            User admin,
            Farmer farmer,
            FarmerFinancialAccount account,
            BigDecimal amount,
            String referenceId,
            String description);

    void recoverLoan(
            User admin,
            Farmer farmer,
            FarmerFinancialAccount account,
            BigDecimal amount,
            String referenceId,
            String description);

    void recoverOther(
            User admin,
            Farmer farmer,
            FarmerFinancialAccount account,
            BigDecimal amount,
            String referenceId,
            String description);

    void recoverFeed(
            User admin,
            Farmer farmer,
            FarmerFinancialAccount account,
            BigDecimal amount,
            LocalDate fromDate,
            LocalDate toDate,
            String referenceId,
            String description);
}
