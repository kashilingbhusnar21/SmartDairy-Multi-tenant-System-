package com.smartdairy.service;

import com.smartdairy.dto.FinancialStatementDto;
import org.springframework.http.ResponseEntity;

import java.time.LocalDate;

public interface FinancialStatementExportService {
    FinancialStatementDto generateFinancialStatement(Long farmerId, LocalDate from, LocalDate to);
    ResponseEntity<byte[]> exportToPdf(Long farmerId, LocalDate from, LocalDate to);
    ResponseEntity<byte[]> exportToExcel(Long farmerId, LocalDate from, LocalDate to);
}
