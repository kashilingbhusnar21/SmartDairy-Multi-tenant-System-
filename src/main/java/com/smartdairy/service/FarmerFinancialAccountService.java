package com.smartdairy.service;

import com.smartdairy.entity.FarmerFinancialAccount;
import java.math.BigDecimal;

public interface FarmerFinancialAccountService {

    FarmerFinancialAccount createAccountForFarmer(Long farmerId);

    FarmerFinancialAccount getAccountByFarmerAndAdmin(Long farmerId);

    FarmerFinancialAccount findAccountOrDefault(Long farmerId);

    FarmerFinancialAccount getOrCreateAccountByFarmer(Long farmerId);

    FarmerFinancialAccount addAdvance(Long farmerId, BigDecimal amount);

    FarmerFinancialAccount reduceAdvance(Long farmerId, BigDecimal amount);

    FarmerFinancialAccount addLoan(Long farmerId, BigDecimal amount);

    FarmerFinancialAccount reduceLoan(Long farmerId, BigDecimal amount);

    FarmerFinancialAccount addOtherDeduction(Long farmerId, BigDecimal amount);

    FarmerFinancialAccount reduceOtherDeduction(Long farmerId, BigDecimal amount);
}
