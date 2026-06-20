package com.smartdairy.controller;

import com.smartdairy.dto.AdvancedMilkReportResponse;
import com.smartdairy.dto.FarmerBillResponse;
import com.smartdairy.service.AdvancedMilkReportService;
import com.smartdairy.service.FarmerBillService;
import com.smartdairy.service.ReportExportService;
import java.math.BigDecimal;
import java.time.LocalDate;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reports/milk")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class ReportController {

    private final ReportExportService reportExportService;
    private final AdvancedMilkReportService advancedMilkReportService;
    private final FarmerBillService farmerBillService;

    @GetMapping("/daily")
    public ResponseEntity<byte[]> daily(
            @RequestParam("date") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(value = "format", defaultValue = "pdf") String format) {
        return fileResponse(
                reportExportService.exportDailyMilk(date, format),
                format,
                "milk-daily-" + date);
    }

    @GetMapping("/weekly")
    public ResponseEntity<byte[]> weekly(
            @RequestParam("from") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam("to") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(value = "format", defaultValue = "pdf") String format) {
        return fileResponse(
                reportExportService.exportWeeklyMilk(from, to, format),
                format,
                "milk-weekly-" + from + "-to-" + to);
    }

    @GetMapping("/monthly")
    public ResponseEntity<byte[]> monthly(
            @RequestParam int year,
            @RequestParam int month,
            @RequestParam(value = "format", defaultValue = "pdf") String format) {
        return fileResponse(
                reportExportService.exportMonthlyMilk(year, month, format),
                format,
                "milk-monthly-" + year + "-" + month);
    }

    @GetMapping("/farmer")
    public ResponseEntity<byte[]> farmer(
            @RequestParam Long farmerId,
            @RequestParam("from") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam("to") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(value = "format", defaultValue = "pdf") String format) {
        return fileResponse(
                reportExportService.exportFarmerMilk(farmerId, from, to, format),
                format,
                "milk-farmer-" + farmerId + "-" + from + "-to-" + to);
    }

    @GetMapping("/advanced/summary")
    public ResponseEntity<AdvancedMilkReportResponse> advancedSummary(
            @RequestParam("from") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam("to") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(value = "farmerId", required = false) Long farmerId) {
        return ResponseEntity.ok(advancedMilkReportService.buildReport(from, to, farmerId));
    }

    @GetMapping("/advanced/export")
    public ResponseEntity<byte[]> advancedExport(
            @RequestParam("from") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam("to") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(value = "farmerId", required = false) Long farmerId,
            @RequestParam(value = "format", defaultValue = "pdf") String format) {
        byte[] body = advancedMilkReportService.exportAdvancedReport(from, to, farmerId, format);
        String base = "milk-advanced-" + from + "-to-" + to;
        return fileResponse(body, format, base);
    }

    @GetMapping("/farmer-bill/preview")
    public ResponseEntity<FarmerBillResponse> farmerBillPreview(
            @RequestParam Long farmerId,
            @RequestParam("from") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam("to") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(value = "advancePayment", required = false) BigDecimal advancePayment,
            @RequestParam(value = "loanAmount", required = false) BigDecimal loanAmount,
            @RequestParam(value = "otherDeductions", required = false) BigDecimal otherDeductions) {
        return ResponseEntity.ok(farmerBillService.preview(
                farmerId, from, to, advancePayment, loanAmount, otherDeductions));
    }

    @GetMapping("/farmer-bill/export")
    public ResponseEntity<byte[]> farmerBillExport(
            @RequestParam Long farmerId,
            @RequestParam("from") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam("to") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(value = "advancePayment", required = false) BigDecimal advancePayment,
            @RequestParam(value = "loanAmount", required = false) BigDecimal loanAmount,
            @RequestParam(value = "otherDeductions", required = false) BigDecimal otherDeductions,
            @RequestParam(value = "format", defaultValue = "pdf") String format) {
        byte[] body = farmerBillService.export(
                farmerId, from, to, advancePayment, loanAmount, otherDeductions, format);
        String base = "farmer-bill-" + farmerId + "-" + from + "-to-" + to;
        return fileResponse(body, format, base);
    }

    private static ResponseEntity<byte[]> fileResponse(byte[] body, String format, String baseName) {
        boolean pdf = format == null || format.isBlank() || format.equalsIgnoreCase("pdf");
        String ext = pdf ? "pdf" : "xlsx";
        String media =
                pdf ? MediaType.APPLICATION_PDF_VALUE
                        : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + baseName + "." + ext)
                .contentType(MediaType.parseMediaType(media))
                .body(body);
    }
}
