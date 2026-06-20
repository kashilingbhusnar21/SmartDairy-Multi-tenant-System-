package com.smartdairy.service;

import com.smartdairy.dto.FarmerBillResponse;
import java.math.BigDecimal;
import java.time.LocalDate;

public interface FarmerBillService {
    FarmerBillResponse preview(
            Long farmerId,
            LocalDate from,
            LocalDate to,
            BigDecimal advancePayment,
            BigDecimal loanAmount,
            BigDecimal otherDeductions);

    byte[] export(
            Long farmerId,
            LocalDate from,
            LocalDate to,
            BigDecimal advancePayment,
            BigDecimal loanAmount,
            BigDecimal otherDeductions,
            String format);
}
