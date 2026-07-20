package com.smartdairy.dto;

import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdvancedMilkReportFarmerRow {
    private Long farmerId;
    private String farmerName;
    private BigDecimal totalMilkQuantity;
    private BigDecimal totalAmount;
    private BigDecimal feedDeductionAmount;
    private BigDecimal netAmountAfterFeed;
    private BigDecimal averageFat;
    private BigDecimal averageSnf;
    private BigDecimal averageRatePerLiter;
    
    private BigDecimal pendingAdvance;
    private BigDecimal pendingLoan;
    private BigDecimal pendingOther;
    private BigDecimal totalPending;
    
    private BigDecimal advanceRecovered;
    private BigDecimal loanRecovered;
    private BigDecimal otherRecovered;
    private BigDecimal totalRecovered;
    
    private BigDecimal finalPayableAmount;
}
