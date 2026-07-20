package com.smartdairy.service;

import com.smartdairy.dto.FarmerFinancialTransactionResponse;
import com.smartdairy.dto.FinancialAnalyticsResponse;
import com.smartdairy.entity.FarmerFinancialTransaction;
import com.smartdairy.entity.Farmer;
import java.time.LocalDate;
import java.util.List;

public interface FarmerFinancialTransactionService {

    List<FarmerFinancialTransactionResponse> getTransactionsByFarmer(Long farmerId);

    List<FarmerFinancialTransactionResponse> getTransactionsByFarmerAndDateRange(Long farmerId, LocalDate fromDate, LocalDate toDate);

    List<FarmerFinancialTransactionResponse> getLatestTransactionsByFarmer(Long farmerId);

    List<FarmerFinancialTransaction> getAllTransactionsByAdmin();

    List<FarmerFinancialTransaction> getTransactionsByAdminAndDateRange(LocalDate fromDate, LocalDate toDate);

    FinancialAnalyticsResponse getFinancialAnalytics(LocalDate from, LocalDate to);

    FinancialAnalyticsResponse getFinancialAnalytics(LocalDate from, LocalDate to, int page, int size);

    FinancialAnalyticsResponse getFinancialAnalyticsByFarmer(Long farmerId, LocalDate from, LocalDate to);

    FinancialAnalyticsResponse getFinancialAnalyticsByFarmer(Long farmerId, LocalDate from, LocalDate to, int page, int size);

    FinancialAnalyticsResponse getFinancialAnalyticsWithFilters(LocalDate from, LocalDate to, String pendingType);

    FinancialAnalyticsResponse getFinancialAnalyticsWithFilters(LocalDate from, LocalDate to, String pendingType, int page, int size);
}
