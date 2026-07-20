package com.smartdairy.dto;

import com.smartdairy.entity.FarmerFinancialTransaction;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FarmerFinancialTransactionResponse {
    private Long id;
    private Long farmerId;
    private String farmerName;
    private LocalDate transactionDate;
    private String transactionType;
    private String referenceType;
    private String referenceId;
    private BigDecimal amount;
    private BigDecimal balanceBefore;
    private BigDecimal balanceAfter;
    private BigDecimal runningBalance;
    private String description;
    private Instant createdAt;

    public static FarmerFinancialTransactionResponse fromEntity(
            FarmerFinancialTransaction transaction,
            BigDecimal runningBalance) {
        return FarmerFinancialTransactionResponse.builder()
                .id(transaction.getId())
                .farmerId(transaction.getFarmer().getId())
                .farmerName(transaction.getFarmer().getFullName())
                .transactionDate(transaction.getTransactionDate())
                .transactionType(transaction.getTransactionType().name())
                .referenceType(transaction.getReferenceType() != null ? transaction.getReferenceType().name() : null)
                .referenceId(transaction.getReferenceId())
                .amount(transaction.getAmount())
                .balanceBefore(transaction.getBalanceBefore())
                .balanceAfter(transaction.getBalanceAfter())
                .runningBalance(runningBalance)
                .description(transaction.getDescription())
                .createdAt(transaction.getCreatedAt())
                .build();
    }
}
