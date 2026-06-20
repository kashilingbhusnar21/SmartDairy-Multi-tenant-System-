package com.smartdairy.controller;

import com.smartdairy.dto.DashboardOverviewResponse;
import com.smartdairy.service.DashboardService;
import java.time.DayOfWeek;
import java.time.LocalDate;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/overview")
    public ResponseEntity<DashboardOverviewResponse> overview(
            @RequestParam(value = "milkYear", required = false) Integer milkYear,
            @RequestParam(value = "milkMonth", required = false) Integer milkMonth,
            @RequestParam(value = "paymentWeekStart", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
                    LocalDate paymentWeekStart,
            @RequestParam(value = "paymentWeekEnd", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
                    LocalDate paymentWeekEnd,
            @RequestParam(value = "farmerNameContains", required = false) String farmerNameContains) {

        LocalDate today = LocalDate.now();
        int year = milkYear != null ? milkYear : today.getYear();
        int month = milkMonth != null ? milkMonth : today.getMonthValue();

        LocalDate weekStart = paymentWeekStart;
        LocalDate weekEnd = paymentWeekEnd;
        if (weekStart == null || weekEnd == null) {
            weekStart = today.with(DayOfWeek.MONDAY);
            weekEnd = today.with(DayOfWeek.SUNDAY);
        }

        return ResponseEntity.ok(
                dashboardService.getOverview(year, month, weekStart, weekEnd, farmerNameContains));
    }
}
