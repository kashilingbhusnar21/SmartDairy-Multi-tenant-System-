package com.smartdairy.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdvancedMilkReportResponse {
    private LocalDate dateFrom;
    private LocalDate dateTo;
    private int farmerCount;
    private BigDecimal totalMilkQuantity;
    private BigDecimal totalAmount;
    private BigDecimal totalFeedDeduction;
    private BigDecimal netAmountAfterFeed;
    private BigDecimal averageFat;
    private BigDecimal averageSnf;
    private BigDecimal averageRatePerLiter;
    private List<AdvancedMilkReportFarmerRow> farmers;
    /** Sum of all entry totalAmount in range (DB); should match sum of farmer row totals */
    private BigDecimal checksumTotalFromEntries;
    private boolean totalsMatch;
}
