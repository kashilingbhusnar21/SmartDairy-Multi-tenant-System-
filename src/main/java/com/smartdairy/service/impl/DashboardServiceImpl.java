package com.smartdairy.service.impl;

import com.smartdairy.dto.DashboardOverviewResponse;
import com.smartdairy.dto.FarmerMilkSliceDto;
import com.smartdairy.dto.TimeSeriesMilkDto;
import com.smartdairy.dto.TimeSeriesPaymentDto;
import com.smartdairy.entity.Payment.PaymentStatus;
import com.smartdairy.entity.User;
import com.smartdairy.repository.FarmerRepository;
import com.smartdairy.repository.MilkCollectionRepository;
import com.smartdairy.repository.PaymentRepository;
import com.smartdairy.service.DashboardService;
import com.smartdairy.service.UserService;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.Locale;
import java.util.stream.Stream;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {

    private final FarmerRepository farmerRepository;
    private final MilkCollectionRepository milkCollectionRepository;
    private final PaymentRepository paymentRepository;
    private final UserService userService;

    @Override
    @Transactional(readOnly = true)
    public DashboardOverviewResponse getOverview(
            int milkYear,
            int milkMonth,
            LocalDate paymentWeekStart,
            LocalDate paymentWeekEnd,
            String farmerNameContains) {

        User admin = userService.getLoggedInUser();
        LocalDate today = LocalDate.now();
        YearMonth ym = YearMonth.of(milkYear, milkMonth);
        LocalDate monthStart = ym.atDay(1);
        LocalDate monthEnd = ym.atEndOfMonth();

        List<TimeSeriesMilkDto> milkByDay =
                milkCollectionRepository.sumQuantityAndAmountGroupedByDateForAdmin(admin, monthStart, monthEnd).stream()
                        .map(row -> TimeSeriesMilkDto.builder()
                                .date((LocalDate) row[0])
                                .quantityLiters(toBigDecimal(row[1]))
                                .totalAmount(toBigDecimal(row[2]))
                                .build())
                        .toList();

        Stream<FarmerMilkSliceDto> farmerStream =
                milkCollectionRepository.sumQuantityGroupedByFarmerForAdmin(admin, monthStart, monthEnd).stream()
                        .map(row -> FarmerMilkSliceDto.builder()
                                .farmerId(((Number) row[0]).longValue())
                                .farmerName((String) row[1])
                                .quantityLiters(toBigDecimal(row[2]))
                                .build());

        if (farmerNameContains != null && !farmerNameContains.isBlank()) {
            String needle = farmerNameContains.trim().toLowerCase(Locale.ROOT);
            farmerStream = farmerStream.filter(f -> f.getFarmerName().toLowerCase(Locale.ROOT).contains(needle));
        }

        List<FarmerMilkSliceDto> farmerMilk = farmerStream.limit(25).toList();

        List<TimeSeriesPaymentDto> paymentByDay = paymentRepository
                .sumPaidAmountGroupedByPaymentDateForAdmin(
                        admin, PaymentStatus.PAID, paymentWeekStart, paymentWeekEnd)
                .stream()
                .map(row -> TimeSeriesPaymentDto.builder()
                        .date((LocalDate) row[0])
                        .amount(toBigDecimal(row[1]))
                        .build())
                .toList();

        return DashboardOverviewResponse.builder()
                .totalFarmers(farmerRepository.countByAdmin(admin))
                .milkCollectedTodayLiters(milkCollectionRepository.sumQuantityByAdminAndDate(admin, today))
                .pendingPaymentsCount(paymentRepository.countByAdminAndStatus(admin, PaymentStatus.PENDING))
                .pendingPaymentsTotal(paymentRepository.sumAmountByAdminAndStatus(admin, PaymentStatus.PENDING))
                .monthlyMilkByDay(milkByDay)
                .farmerMilkCollection(farmerMilk)
                .weeklyPaymentByDay(paymentByDay)
                .build();
    }

    private static BigDecimal toBigDecimal(Object o) {
        if (o == null) {
            return BigDecimal.ZERO;
        }
        if (o instanceof BigDecimal bd) {
            return bd;
        }
        if (o instanceof Number n) {
            return BigDecimal.valueOf(n.doubleValue());
        }
        return new BigDecimal(o.toString());
    }
}
