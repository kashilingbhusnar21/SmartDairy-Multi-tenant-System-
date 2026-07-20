package com.smartdairy.controller;

import com.smartdairy.dto.FarmerFinancialAccountResponse;
import com.smartdairy.dto.FarmerFinancialTransactionResponse;
import com.smartdairy.dto.FinancialAnalyticsResponse;
import com.smartdairy.dto.FinancialStatementDto;
import com.smartdairy.entity.FarmerFinancialAccount;
import com.smartdairy.service.FarmerFinancialAccountService;
import com.smartdairy.service.FarmerFinancialTransactionService;
import com.smartdairy.service.FinancialStatementExportService;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/financial-ledger")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class FinancialLedgerController {

    private final FarmerFinancialAccountService financialAccountService;
    private final FarmerFinancialTransactionService transactionService;
    private final FinancialStatementExportService statementExportService;

    @GetMapping("/account/{farmerId}")
    public ResponseEntity<FarmerFinancialAccountResponse> getFinancialAccount(@PathVariable Long farmerId) {
        FarmerFinancialAccount account = financialAccountService.getAccountByFarmerAndAdmin(farmerId);
        return ResponseEntity.ok(FarmerFinancialAccountResponse.fromEntity(account));
    }

    @GetMapping("/transactions/{farmerId}")
    public ResponseEntity<List<FarmerFinancialTransactionResponse>> getTransactions(@PathVariable Long farmerId) {
        return ResponseEntity.ok(transactionService.getTransactionsByFarmer(farmerId));
    }

    @PostMapping("/advance/add")
    public ResponseEntity<FarmerFinancialAccountResponse> addAdvance(@RequestBody FinancialOperationRequest request) {
        FarmerFinancialAccount account = financialAccountService.addAdvance(request.getFarmerId(), request.getAmount());
        return ResponseEntity.ok(FarmerFinancialAccountResponse.fromEntity(account));
    }

    @PostMapping("/advance/recover")
    public ResponseEntity<FarmerFinancialAccountResponse> recoverAdvance(@RequestBody FinancialOperationRequest request) {
        FarmerFinancialAccount account = financialAccountService.reduceAdvance(request.getFarmerId(), request.getAmount());
        return ResponseEntity.ok(FarmerFinancialAccountResponse.fromEntity(account));
    }

    @PostMapping("/loan/add")
    public ResponseEntity<FarmerFinancialAccountResponse> addLoan(@RequestBody FinancialOperationRequest request) {
        FarmerFinancialAccount account = financialAccountService.addLoan(request.getFarmerId(), request.getAmount());
        return ResponseEntity.ok(FarmerFinancialAccountResponse.fromEntity(account));
    }

    @PostMapping("/loan/recover")
    public ResponseEntity<FarmerFinancialAccountResponse> recoverLoan(@RequestBody FinancialOperationRequest request) {
        FarmerFinancialAccount account = financialAccountService.reduceLoan(request.getFarmerId(), request.getAmount());
        return ResponseEntity.ok(FarmerFinancialAccountResponse.fromEntity(account));
    }

    @PostMapping("/other/add")
    public ResponseEntity<FarmerFinancialAccountResponse> addOther(@RequestBody FinancialOperationRequest request) {
        FarmerFinancialAccount account = financialAccountService.addOtherDeduction(request.getFarmerId(), request.getAmount());
        return ResponseEntity.ok(FarmerFinancialAccountResponse.fromEntity(account));
    }

    @PostMapping("/other/recover")
    public ResponseEntity<FarmerFinancialAccountResponse> recoverOther(@RequestBody FinancialOperationRequest request) {
        FarmerFinancialAccount account = financialAccountService.reduceOtherDeduction(request.getFarmerId(), request.getAmount());
        return ResponseEntity.ok(FarmerFinancialAccountResponse.fromEntity(account));
    }

    @GetMapping("/analytics")
    public ResponseEntity<FinancialAnalyticsResponse> getAnalytics(
            @RequestParam(required = false) LocalDate from,
            @RequestParam(required = false) LocalDate to,
            @RequestParam(required = false, defaultValue = "0") int page,
            @RequestParam(required = false, defaultValue = "20") int size) {
        if (from == null) {
            from = LocalDate.now().withDayOfMonth(1);
        }
        if (to == null) {
            to = LocalDate.now();
        }
        return ResponseEntity.ok(transactionService.getFinancialAnalytics(from, to, page, size));
    }

    @GetMapping("/analytics/farmer/{farmerId}")
    public ResponseEntity<FinancialAnalyticsResponse> getAnalyticsByFarmer(
            @PathVariable Long farmerId,
            @RequestParam(required = false) LocalDate from,
            @RequestParam(required = false) LocalDate to,
            @RequestParam(required = false, defaultValue = "0") int page,
            @RequestParam(required = false, defaultValue = "20") int size) {
        if (from == null) {
            from = LocalDate.now().withDayOfMonth(1);
        }
        if (to == null) {
            to = LocalDate.now();
        }
        return ResponseEntity.ok(transactionService.getFinancialAnalyticsByFarmer(farmerId, from, to, page, size));
    }

    @GetMapping("/analytics/filter")
    public ResponseEntity<FinancialAnalyticsResponse> getAnalyticsWithFilters(
            @RequestParam(required = false) LocalDate from,
            @RequestParam(required = false) LocalDate to,
            @RequestParam(required = false) String pendingType,
            @RequestParam(required = false, defaultValue = "0") int page,
            @RequestParam(required = false, defaultValue = "20") int size) {
        if (from == null) {
            from = LocalDate.now().withDayOfMonth(1);
        }
        if (to == null) {
            to = LocalDate.now();
        }
        return ResponseEntity.ok(transactionService.getFinancialAnalyticsWithFilters(from, to, pendingType, page, size));
    }

    @GetMapping("/statement/{farmerId}")
    public ResponseEntity<FinancialStatementDto> getFinancialStatement(
            @PathVariable Long farmerId,
            @RequestParam LocalDate from,
            @RequestParam LocalDate to) {
        if (from.isAfter(to)) {
            throw new IllegalArgumentException("From date must be before or equal to to date");
        }
        return ResponseEntity.ok(statementExportService.generateFinancialStatement(farmerId, from, to));
    }

    @GetMapping("/statement/pdf/{farmerId}")
    public ResponseEntity<byte[]> exportFinancialStatementPdf(
            @PathVariable Long farmerId,
            @RequestParam LocalDate from,
            @RequestParam LocalDate to) {
        if (from.isAfter(to)) {
            throw new IllegalArgumentException("From date must be before or equal to to date");
        }
        return statementExportService.exportToPdf(farmerId, from, to);
    }

    @GetMapping("/statement/excel/{farmerId}")
    public ResponseEntity<byte[]> exportFinancialStatementExcel(
            @PathVariable Long farmerId,
            @RequestParam LocalDate from,
            @RequestParam LocalDate to) {
        if (from.isAfter(to)) {
            throw new IllegalArgumentException("From date must be before or equal to to date");
        }
        return statementExportService.exportToExcel(farmerId, from, to);
    }

    public static class FinancialOperationRequest {
        private Long farmerId;
        private BigDecimal amount;

        public Long getFarmerId() {
            return farmerId;
        }

        public void setFarmerId(Long farmerId) {
            this.farmerId = farmerId;
        }

        public BigDecimal getAmount() {
            return amount;
        }

        public void setAmount(BigDecimal amount) {
            this.amount = amount;
        }
    }
}
