package com.smartdairy.controller;

import com.smartdairy.dto.FeedChartPointResponse;
import com.smartdairy.dto.FeedPurchaseRequest;
import com.smartdairy.dto.FeedPurchaseResponse;
import com.smartdairy.dto.FeedSummaryResponse;
import com.smartdairy.service.FeedPurchaseService;
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
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/feed-purchases")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN','FARMER')")
public class FeedPurchaseController {

    private final FeedPurchaseService feedPurchaseService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<FeedPurchaseResponse> create(@Valid @RequestBody FeedPurchaseRequest request) {
        return ResponseEntity.ok(feedPurchaseService.create(request));
    }

    @GetMapping
    public ResponseEntity<List<FeedPurchaseResponse>> list(
            @RequestParam(value = "farmerId", required = false) Long farmerId,
            @RequestParam(value = "from", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(value = "to", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(feedPurchaseService.list(farmerId, from, to));
    }

    @GetMapping("/summary")
    public ResponseEntity<FeedSummaryResponse> summary(
            @RequestParam("from") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam("to") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(feedPurchaseService.summary(from, to));
    }

    @GetMapping("/chart")
    public ResponseEntity<List<FeedChartPointResponse>> chart(
            @RequestParam("from") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam("to") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(feedPurchaseService.chart(from, to));
    }

    @GetMapping("/export")
    public ResponseEntity<byte[]> export(
            @RequestParam("from") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam("to") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(value = "farmerId", required = false) Long farmerId,
            @RequestParam(value = "format", defaultValue = "pdf") String format) {
        byte[] body = feedPurchaseService.export(from, to, farmerId, format);
        boolean pdf = format == null || format.isBlank() || format.equalsIgnoreCase("pdf");
        String ext = pdf ? "pdf" : "xlsx";
        String media = pdf
                ? MediaType.APPLICATION_PDF_VALUE
                : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=feed-purchases-" + from + "-to-" + to + "." + ext)
                .contentType(MediaType.parseMediaType(media))
                .body(body);
    }
}
