package com.smartdairy.dto;

import com.smartdairy.entity.FarmerFinancialAccount;
import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FarmerFinancialAccountResponse {
    private Long id;
    private Long farmerId;
    private String farmerName;
    private BigDecimal pendingAdvance;
    private BigDecimal pendingLoan;
    private BigDecimal pendingOther;
    private BigDecimal totalPending;

    public static FarmerFinancialAccountResponse fromEntity(FarmerFinancialAccount account) {
        BigDecimal advance = account.getPendingAdvance() != null ? account.getPendingAdvance() : BigDecimal.ZERO;
        BigDecimal loan = account.getPendingLoan() != null ? account.getPendingLoan() : BigDecimal.ZERO;
        BigDecimal other = account.getPendingOther() != null ? account.getPendingOther() : BigDecimal.ZERO;
        BigDecimal total = advance.add(loan).add(other);

        return FarmerFinancialAccountResponse.builder()
                .id(account.getId())
                .farmerId(account.getFarmer().getId())
                .farmerName(account.getFarmer().getFullName())
                .pendingAdvance(advance)
                .pendingLoan(loan)
                .pendingOther(other)
                .totalPending(total)
                .build();
    }
}
