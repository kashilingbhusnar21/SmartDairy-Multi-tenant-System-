package com.smartdairy.dto;

import java.math.BigDecimal;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardOverviewResponse {
    private long totalFarmers;
    private BigDecimal milkCollectedTodayLiters;
    private long pendingPaymentsCount;
    private BigDecimal pendingPaymentsTotal;
    private List<TimeSeriesMilkDto> monthlyMilkByDay;
    private List<FarmerMilkSliceDto> farmerMilkCollection;
    private List<TimeSeriesPaymentDto> weeklyPaymentByDay;
}
