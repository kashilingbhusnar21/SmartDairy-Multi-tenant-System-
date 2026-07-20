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
public class FinancialAnalyticsResponse {
    private LocalDate dateFrom;
    private LocalDate dateTo;
    
    private BigDecimal totalPendingAdvance;
    private BigDecimal totalPendingLoan;
    private BigDecimal totalPendingOther;
    private BigDecimal totalPendingBalance;
    
    private BigDecimal totalAdvanceRecovered;
    private BigDecimal totalLoanRecovered;
    private BigDecimal totalOtherRecovered;
    private BigDecimal totalRecovered;
    
    private BigDecimal totalPaymentsReleased;

    private BigDecimal totalBill;
    private BigDecimal totalPaid;
    private BigDecimal billPendingBalance;
    
    private Long farmersWithPendingBalances;
    private BigDecimal netFinancialExposure;
    
    private List<FarmerFinancialStatusRow> farmerStatusList;
    private List<RecentTransactionRow> recentTransactions;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FarmerFinancialStatusRow {
        private Long farmerId;
        private String farmerName;
        private BigDecimal pendingAdvance;
        private BigDecimal pendingLoan;
        private BigDecimal pendingOther;
        private BigDecimal totalPending;
        private LocalDate lastTransactionDate;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecentTransactionRow {
        private Long id;
        private LocalDate transactionDate;
        private String transactionType;
        private BigDecimal amount;
        private String description;
        private String farmerName;
    }
}
