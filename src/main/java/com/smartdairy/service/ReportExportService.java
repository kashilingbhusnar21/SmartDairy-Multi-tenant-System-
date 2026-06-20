package com.smartdairy.service;

import java.time.LocalDate;

public interface ReportExportService {

    byte[] exportDailyMilk(LocalDate date, String format);

    byte[] exportWeeklyMilk(LocalDate from, LocalDate to, String format);

    byte[] exportMonthlyMilk(int year, int month, String format);

    byte[] exportFarmerMilk(Long farmerId, LocalDate from, LocalDate to, String format);
}
