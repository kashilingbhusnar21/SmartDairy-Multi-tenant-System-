package com.smartdairy.service;

import com.smartdairy.dto.FarmerBillResponse;
import java.math.BigDecimal;
import java.time.LocalDate;

public interface FarmerBillService {
    FarmerBillResponse preview(
            Long farmerId,
            LocalDate from,
            LocalDate to);

    FarmerBillResponse generateFinalBill(
            Long farmerId,
            LocalDate from,
            LocalDate to);

    byte[] export(
            Long farmerId,
            LocalDate from,
            LocalDate to,
            String format);
}
