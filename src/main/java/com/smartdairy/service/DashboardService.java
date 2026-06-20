package com.smartdairy.service;

import com.smartdairy.dto.DashboardOverviewResponse;
import java.time.LocalDate;

public interface DashboardService {

    DashboardOverviewResponse getOverview(
            int milkYear,
            int milkMonth,
            LocalDate paymentWeekStart,
            LocalDate paymentWeekEnd,
            String farmerNameContains);
}
