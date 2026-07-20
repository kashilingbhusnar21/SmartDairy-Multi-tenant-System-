package com.smartdairy.service;

import com.smartdairy.entity.Farmer;
import com.smartdairy.entity.FarmerBill;
import com.smartdairy.entity.FarmerFinancialAccount;
import com.smartdairy.entity.User;
import java.math.BigDecimal;
import java.time.LocalDate;

public interface FarmerFinancialSettlementService {

    void settleBillDeductions(User admin, Farmer farmer, FarmerFinancialAccount account, FarmerBill bill);

    BigDecimal recoverFeedForPayment(
            User admin,
            Farmer farmer,
            FarmerFinancialAccount account,
            BigDecimal amount,
            Long paymentId);

    BigDecimal sumOutstandingFeedInPeriod(User admin, Long farmerId, LocalDate from, LocalDate to);
}
