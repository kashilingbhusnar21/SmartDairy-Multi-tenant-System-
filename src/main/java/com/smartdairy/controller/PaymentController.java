package com.smartdairy.controller;

import com.smartdairy.dto.MarkPaymentPaidRequest;
import com.smartdairy.dto.PaymentDashboardStatsResponse;
import com.smartdairy.dto.PaymentResponse;
import com.smartdairy.dto.PaymentSummaryResponse;
import com.smartdairy.entity.Payment.PaymentStatus;
import com.smartdairy.service.PaymentService;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN','FARMER')")
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/from-collection/{milkCollectionId}")
    public ResponseEntity<PaymentResponse> generateFromCollection(@PathVariable Long milkCollectionId) {
        return ResponseEntity.ok(paymentService.generateFromMilkCollection(milkCollectionId));
    }

    @PutMapping("/{id}/mark-paid")
    public ResponseEntity<PaymentResponse> markPaid(
            @PathVariable Long id, @Valid @RequestBody MarkPaymentPaidRequest request) {
        return ResponseEntity.ok(paymentService.markPaid(id, request));
    }

    @GetMapping("/pending")
    public ResponseEntity<List<PaymentResponse>> pending() {
        return ResponseEntity.ok(paymentService.listPending());
    }

    @GetMapping("/farmer/{farmerId}")
    public ResponseEntity<List<PaymentResponse>> byFarmer(@PathVariable Long farmerId) {
        return ResponseEntity.ok(paymentService.listByFarmer(farmerId));
    }

    @GetMapping
    public ResponseEntity<List<PaymentResponse>> list(
            @RequestParam(value = "status", required = false) PaymentStatus status) {
        return ResponseEntity.ok(paymentService.listAll(status));
    }

    @GetMapping("/summary/weekly")
    public ResponseEntity<PaymentSummaryResponse> weeklySummary(
            @RequestParam("from") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam("to") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(paymentService.weeklySummary(from, to));
    }

    @GetMapping("/summary/monthly")
    public ResponseEntity<PaymentSummaryResponse> monthlySummary(
            @RequestParam int year, @RequestParam int month) {
        return ResponseEntity.ok(paymentService.monthlySummary(year, month));
    }

    @GetMapping("/stats/dashboard")
    public ResponseEntity<PaymentDashboardStatsResponse> dashboardStats() {
        return ResponseEntity.ok(paymentService.dashboardStats());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PaymentResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(paymentService.getById(id));
    }

    @GetMapping("/{id}/receipt")
    public ResponseEntity<byte[]> receipt(@PathVariable Long id) {
        byte[] pdf = paymentService.generateReceiptPdf(id);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=payment-receipt-" + id + ".pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }
}
