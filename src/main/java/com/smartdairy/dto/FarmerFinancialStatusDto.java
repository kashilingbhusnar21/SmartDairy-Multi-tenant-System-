package com.smartdairy.dto;

import com.smartdairy.util.FinancialMath;
import java.math.BigDecimal;
import java.time.LocalDate;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FarmerFinancialStatusDto {
    private Long farmerId;
    private String farmerName;
    private BigDecimal pendingAdvance;
    private BigDecimal pendingLoan;
    private BigDecimal pendingOther;
    private LocalDate lastTransactionDate;
    
    public BigDecimal getTotalPending() {
        return FinancialMath.totalPending(pendingAdvance, pendingLoan, pendingOther);
    }
}
