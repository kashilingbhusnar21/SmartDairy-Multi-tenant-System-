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
public class FinancialStatementDto {
    private Long farmerId;
    private String farmerName;
    private String dairyName;
    
    private LocalDate statementFromDate;
    private LocalDate statementToDate;
    private LocalDate generatedDate;
    
    private BigDecimal openingBalance;
    private BigDecimal currentPendingAdvance;
    private BigDecimal currentPendingLoan;
    private BigDecimal currentPendingOther;
    
    private BigDecimal totalAdvanceRecovered;
    private BigDecimal totalLoanRecovered;
    private BigDecimal totalOtherRecovered;
    private BigDecimal totalRecovered;
    
    private BigDecimal totalPaymentsReleased;
    
    private BigDecimal netPendingBalance;
    
    private List<TransactionDetailDto> transactions;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TransactionDetailDto {
        private LocalDate transactionDate;
        private String transactionType;
        private String description;
        private BigDecimal amount;
        private BigDecimal balanceAfter;
    }
}
