package com.smartdairy.service;

import com.smartdairy.dto.AdvancedMilkReportResponse;
import java.time.LocalDate;

public interface AdvancedMilkReportService {

    AdvancedMilkReportResponse buildReport(LocalDate from, LocalDate to, Long farmerId);

    byte[] exportAdvancedReport(LocalDate from, LocalDate to, Long farmerId, String format);
}
