package com.smartdairy.service.impl;

import com.smartdairy.dto.FarmerFinancialStatusDto;
import com.smartdairy.dto.FarmerFinancialTransactionResponse;
import com.smartdairy.dto.FinancialAnalyticsResponse;
import com.smartdairy.entity.Farmer;
import com.smartdairy.entity.FarmerFinancialAccount;
import com.smartdairy.entity.FarmerFinancialTransaction;
import com.smartdairy.entity.Payment.PaymentStatus;
import com.smartdairy.entity.User;
import com.smartdairy.exception.ResourceNotFoundException;
import com.smartdairy.repository.FarmerFinancialAccountRepository;
import com.smartdairy.repository.FarmerFinancialTransactionRepository;
import com.smartdairy.repository.FarmerRepository;
import com.smartdairy.repository.MilkCollectionRepository;
import com.smartdairy.repository.PaymentRepository;
import com.smartdairy.service.FarmerFinancialAccountService;
import com.smartdairy.service.FarmerFinancialTransactionService;
import com.smartdairy.service.UserService;
import com.smartdairy.util.FinancialMath;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class FarmerFinancialTransactionServiceImpl implements FarmerFinancialTransactionService {

    private final FarmerFinancialTransactionRepository transactionRepository;
    private final FarmerRepository farmerRepository;
    private final FarmerFinancialAccountRepository financialAccountRepository;
    private final FarmerFinancialAccountService financialAccountService;
    private final MilkCollectionRepository milkCollectionRepository;
    private final PaymentRepository paymentRepository;
    private final UserService userService;

    @Override
    @Transactional(readOnly = true)
    public List<FarmerFinancialTransactionResponse> getTransactionsByFarmer(Long farmerId) {
        User admin = userService.getLoggedInUser();
        Farmer farmer = findFarmerForAdmin(farmerId, admin);

        List<FarmerFinancialTransaction> transactions =
                transactionRepository.findByAdminAndFarmerOrderByTransactionDateDescCreatedAtDesc(admin, farmer);
        return mapToResponses(transactions);
    }

    @Override
    @Transactional(readOnly = true)
    public List<FarmerFinancialTransactionResponse> getTransactionsByFarmerAndDateRange(
            Long farmerId, LocalDate fromDate, LocalDate toDate) {
        User admin = userService.getLoggedInUser();
        Farmer farmer = findFarmerForAdmin(farmerId, admin);

        List<FarmerFinancialTransaction> transactions =
                transactionRepository.findByAdminAndFarmerAndDateRange(admin, farmer, fromDate, toDate);
        return mapToResponses(transactions);
    }

    @Override
    @Transactional(readOnly = true)
    public List<FarmerFinancialTransactionResponse> getLatestTransactionsByFarmer(Long farmerId) {
        User admin = userService.getLoggedInUser();
        Farmer farmer = findFarmerForAdmin(farmerId, admin);

        List<FarmerFinancialTransaction> transactions =
                transactionRepository.findLatestByAdminAndFarmer(admin, farmer);
        return mapToResponses(transactions);
    }

    @Override
    @Transactional(readOnly = true)
    public List<FarmerFinancialTransaction> getAllTransactionsByAdmin() {
        User admin = userService.getLoggedInUser();
        return transactionRepository.findByAdmin(admin);
    }

    @Override
    @Transactional(readOnly = true)
    public List<FarmerFinancialTransaction> getTransactionsByAdminAndDateRange(LocalDate fromDate, LocalDate toDate) {
        User admin = userService.getLoggedInUser();
        return transactionRepository.findByAdminAndTransactionDateBetweenOrderByTransactionDateDescCreatedAtDesc(admin, fromDate, toDate);
    }

    @Override
    @Transactional(readOnly = true)
    public FinancialAnalyticsResponse getFinancialAnalytics(LocalDate from, LocalDate to) {
        return getFinancialAnalytics(from, to, 0, 20);
    }

    @Override
    @Transactional(readOnly = true)
    public FinancialAnalyticsResponse getFinancialAnalytics(LocalDate from, LocalDate to, int page, int size) {
        User admin = userService.getLoggedInUser();

        LedgerTotals ledgerTotals = calculateLedgerTotalsForAdmin(admin);
        BigDecimal totalPendingAdvance = ledgerTotals.pendingAdvance();
        BigDecimal totalPendingLoan = ledgerTotals.pendingLoan();
        BigDecimal totalPendingOther = ledgerTotals.pendingOther();
        BigDecimal totalPendingBalance = FinancialMath.totalPending(
                totalPendingAdvance, totalPendingLoan, totalPendingOther);

        RecoveryTotals recoveries = loadAdminRecoveries(admin, from, to);
        BigDecimal totalPaymentsReleased = recoveries.paymentsReleased();
        BigDecimal totalBill = FinancialMath.scale(
                milkCollectionRepository.sumTotalAmountBetweenForAdmin(admin, from, to));
        BigDecimal totalPaid = FinancialMath.scale(
                paymentRepository.sumAmountByAdminAndStatusAndPaymentDateBetween(
                        admin, PaymentStatus.PAID, from, to));

        Long farmersWithPendingBalances = financialAccountRepository.countFarmersWithPendingBalances(admin);
        if (farmersWithPendingBalances == null) {
            farmersWithPendingBalances = 0L;
        }

        Pageable pageable = PageRequest.of(page, size);
        Page<FarmerFinancialStatusDto> farmerStatusPage =
                transactionRepository.findFarmerFinancialStatusByAdminPaginated(admin, pageable);

        return buildAnalyticsResponse(
                from,
                to,
                totalPendingAdvance,
                totalPendingLoan,
                totalPendingOther,
                totalPendingBalance,
                recoveries,
                totalPaymentsReleased,
                totalBill,
                totalPaid,
                farmersWithPendingBalances,
                mapFarmerStatusRows(farmerStatusPage.getContent()),
                mapRecentTransactions(transactionRepository.findLatestTransactionsByAdmin(admin), 10));
    }

    @Override
    @Transactional(readOnly = true)
    public FinancialAnalyticsResponse getFinancialAnalyticsByFarmer(Long farmerId, LocalDate from, LocalDate to) {
        return getFinancialAnalyticsByFarmer(farmerId, from, to, 0, 20);
    }

    @Override
    @Transactional(readOnly = true)
    public FinancialAnalyticsResponse getFinancialAnalyticsByFarmer(
            Long farmerId, LocalDate from, LocalDate to, int page, int size) {
        User admin = userService.getLoggedInUser();
        Farmer farmer = findFarmerForAdmin(farmerId, admin);
        FarmerFinancialAccount account = financialAccountService.findAccountOrDefault(farmerId);

        LedgerTotals ledgerTotals = calculateLedgerTotalsForFarmer(admin, farmer);
        BigDecimal totalPendingAdvance = ledgerTotals.pendingAdvance();
        BigDecimal totalPendingLoan = ledgerTotals.pendingLoan();
        BigDecimal totalPendingOther = ledgerTotals.pendingOther();
        BigDecimal totalPendingBalance = FinancialMath.totalPending(
                totalPendingAdvance, totalPendingLoan, totalPendingOther);

        RecoveryTotals recoveries = loadFarmerRecoveries(admin, farmer, from, to);
        BigDecimal totalPaymentsReleased = recoveries.paymentsReleased();
        BigDecimal totalBill = FinancialMath.scale(
                milkCollectionRepository.sumTotalAmountBetweenForAdminAndFarmer(admin, from, to, farmerId));
        BigDecimal totalPaid = FinancialMath.scale(
                paymentRepository.sumAmountByAdminAndFarmerAndStatusAndPaymentDateBetween(
                        admin, farmerId, PaymentStatus.PAID, from, to));

        Long farmersWithPendingBalances = totalPendingBalance.compareTo(BigDecimal.ZERO) > 0 ? 1L : 0L;

        FinancialAnalyticsResponse.FarmerFinancialStatusRow farmerStatus =
                buildFarmerStatusRowFromLedger(admin, farmer, ledgerTotals);

        List<FarmerFinancialTransaction> farmerTransactions =
                transactionRepository.findLatestByAdminAndFarmer(admin, farmer);

        return buildAnalyticsResponse(
                from,
                to,
                totalPendingAdvance,
                totalPendingLoan,
                totalPendingOther,
                totalPendingBalance,
                recoveries,
                totalPaymentsReleased,
                totalBill,
                totalPaid,
                farmersWithPendingBalances,
                List.of(farmerStatus),
                mapRecentTransactions(farmerTransactions, 10));
    }

    @Override
    @Transactional(readOnly = true)
    public FinancialAnalyticsResponse getFinancialAnalyticsWithFilters(
            LocalDate from, LocalDate to, String pendingType) {
        return getFinancialAnalyticsWithFilters(from, to, pendingType, 0, 20);
    }

    @Override
    @Transactional(readOnly = true)
    public FinancialAnalyticsResponse getFinancialAnalyticsWithFilters(
            LocalDate from, LocalDate to, String pendingType, int page, int size) {
        User admin = userService.getLoggedInUser();

        List<FarmerFinancialAccount> filteredAccounts = resolveFilteredAccounts(admin, pendingType);

        BigDecimal totalPendingAdvance = filteredAccounts.stream()
                .map(account -> FinancialMath.scale(account.getPendingAdvance()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalPendingLoan = filteredAccounts.stream()
                .map(account -> FinancialMath.scale(account.getPendingLoan()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalPendingOther = filteredAccounts.stream()
                .map(account -> FinancialMath.scale(account.getPendingOther()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalPendingBalance = FinancialMath.totalPending(
                totalPendingAdvance, totalPendingLoan, totalPendingOther);

        RecoveryTotals recoveries = loadAdminRecoveries(admin, from, to);
        BigDecimal totalPaymentsReleased = recoveries.paymentsReleased();
        BigDecimal totalBill = FinancialMath.scale(
                milkCollectionRepository.sumTotalAmountBetweenForAdmin(admin, from, to));
        BigDecimal totalPaid = FinancialMath.scale(
                paymentRepository.sumAmountByAdminAndStatusAndPaymentDateBetween(
                        admin, PaymentStatus.PAID, from, to));

        Long farmersWithPendingBalances = (long) filteredAccounts.size();

        int startIndex = page * size;
        List<FarmerFinancialAccount> paginatedAccounts;
        if (startIndex >= filteredAccounts.size()) {
            paginatedAccounts = List.of();
        } else {
            int endIndex = Math.min(startIndex + size, filteredAccounts.size());
            paginatedAccounts = filteredAccounts.subList(startIndex, endIndex);
        }

        List<FinancialAnalyticsResponse.FarmerFinancialStatusRow> farmerStatusList = paginatedAccounts.stream()
                .map(account -> buildFarmerStatusRow(admin, account.getFarmer(), account))
                .collect(Collectors.toList());

        Pageable pageable = PageRequest.of(page, size);
        Page<FarmerFinancialTransaction> transactionsPage =
                transactionRepository.findLatestTransactionsByAdminPaginated(admin, pageable);

        return buildAnalyticsResponse(
                from,
                to,
                totalPendingAdvance,
                totalPendingLoan,
                totalPendingOther,
                totalPendingBalance,
                recoveries,
                totalPaymentsReleased,
                totalBill,
                totalPaid,
                farmersWithPendingBalances,
                farmerStatusList,
                mapRecentTransactions(transactionsPage.getContent(), transactionsPage.getContent().size()));
    }

    private Farmer findFarmerForAdmin(Long farmerId, User admin) {
        return farmerRepository.findByIdAndAdmin(farmerId, admin)
                .orElseThrow(() -> new ResourceNotFoundException("Farmer not found with id: " + farmerId));
    }

    private List<FarmerFinancialAccount> resolveFilteredAccounts(User admin, String pendingType) {
        if ("advance".equalsIgnoreCase(pendingType)) {
            return financialAccountRepository.findByAdminWithPendingAdvance(admin);
        }
        if ("loan".equalsIgnoreCase(pendingType)) {
            return financialAccountRepository.findByAdminWithPendingLoan(admin);
        }
        if ("other".equalsIgnoreCase(pendingType)) {
            return financialAccountRepository.findByAdminWithPendingOther(admin);
        }
        return financialAccountRepository.findFarmersWithPendingBalances(admin);
    }

    private RecoveryTotals loadAdminRecoveries(User admin, LocalDate from, LocalDate to) {
        BigDecimal advance = FinancialMath.scale(
                transactionRepository.sumAdvanceRecoveredByAdminAndDateRange(admin, from, to));
        BigDecimal loan = FinancialMath.scale(
                transactionRepository.sumLoanRecoveredByAdminAndDateRange(admin, from, to));
        BigDecimal other = FinancialMath.scale(
                transactionRepository.sumOtherRecoveredByAdminAndDateRange(admin, from, to));
        BigDecimal payments = FinancialMath.scale(
                transactionRepository.sumPaymentsReleasedByAdminAndDateRange(admin, from, to));
        return new RecoveryTotals(advance, loan, other, payments);
    }

    private RecoveryTotals loadFarmerRecoveries(User admin, Farmer farmer, LocalDate from, LocalDate to) {
        BigDecimal advance = FinancialMath.scale(
                transactionRepository.sumAdvanceRecoveredByAdminAndFarmerAndDateRange(admin, farmer, from, to));
        BigDecimal loan = FinancialMath.scale(
                transactionRepository.sumLoanRecoveredByAdminAndFarmerAndDateRange(admin, farmer, from, to));
        BigDecimal other = FinancialMath.scale(
                transactionRepository.sumOtherRecoveredByAdminAndFarmerAndDateRange(admin, farmer, from, to));
        BigDecimal payments = FinancialMath.scale(
                transactionRepository.sumPaymentsReleasedByAdminAndFarmerAndDateRange(admin, farmer, from, to));
        return new RecoveryTotals(advance, loan, other, payments);
    }

    private FinancialAnalyticsResponse buildAnalyticsResponse(
            LocalDate from,
            LocalDate to,
            BigDecimal totalPendingAdvance,
            BigDecimal totalPendingLoan,
            BigDecimal totalPendingOther,
            BigDecimal totalPendingBalance,
            RecoveryTotals recoveries,
            BigDecimal totalPaymentsReleased,
            BigDecimal totalBill,
            BigDecimal totalPaid,
            Long farmersWithPendingBalances,
            List<FinancialAnalyticsResponse.FarmerFinancialStatusRow> farmerStatusList,
            List<FinancialAnalyticsResponse.RecentTransactionRow> recentTransactions) {
        BigDecimal billPendingBalance = FinancialMath.scale(totalBill
                .subtract(totalPaid)
                .subtract(recoveries.advance())
                .subtract(recoveries.loan())
                .subtract(recoveries.other()));

        BigDecimal netFinancialExposure = FinancialMath.scale(totalPendingBalance);

        return FinancialAnalyticsResponse.builder()
                .dateFrom(from)
                .dateTo(to)
                .totalPendingAdvance(totalPendingAdvance)
                .totalPendingLoan(totalPendingLoan)
                .totalPendingOther(totalPendingOther)
                .totalPendingBalance(totalPendingBalance)
                .totalAdvanceRecovered(recoveries.advance())
                .totalLoanRecovered(recoveries.loan())
                .totalOtherRecovered(recoveries.other())
                .totalRecovered(recoveries.totalRecovered())
                .totalPaymentsReleased(totalPaymentsReleased)
                .totalBill(totalBill)
                .totalPaid(totalPaid)
                .billPendingBalance(billPendingBalance)
                .farmersWithPendingBalances(farmersWithPendingBalances)
                .netFinancialExposure(netFinancialExposure)
                .farmerStatusList(farmerStatusList)
                .recentTransactions(recentTransactions)
                .build();
    }

    private List<FinancialAnalyticsResponse.FarmerFinancialStatusRow> mapFarmerStatusRows(
            List<FarmerFinancialStatusDto> dtos) {
        return dtos.stream()
                .map(dto -> FinancialAnalyticsResponse.FarmerFinancialStatusRow.builder()
                        .farmerId(dto.getFarmerId())
                        .farmerName(dto.getFarmerName())
                        .pendingAdvance(FinancialMath.scale(dto.getPendingAdvance()))
                        .pendingLoan(FinancialMath.scale(dto.getPendingLoan()))
                        .pendingOther(FinancialMath.scale(dto.getPendingOther()))
                        .totalPending(dto.getTotalPending())
                        .lastTransactionDate(dto.getLastTransactionDate())
                        .build())
                .collect(Collectors.toList());
    }

    private FinancialAnalyticsResponse.FarmerFinancialStatusRow buildFarmerStatusRow(
            User admin, Farmer farmer, FarmerFinancialAccount account) {
        return FinancialAnalyticsResponse.FarmerFinancialStatusRow.builder()
                .farmerId(farmer.getId())
                .farmerName(farmer.getFullName())
                .pendingAdvance(FinancialMath.scale(account.getPendingAdvance()))
                .pendingLoan(FinancialMath.scale(account.getPendingLoan()))
                .pendingOther(FinancialMath.scale(account.getPendingOther()))
                .totalPending(FinancialMath.totalPending(
                        account.getPendingAdvance(), account.getPendingLoan(), account.getPendingOther()))
                .lastTransactionDate(transactionRepository.findLatestByAdminAndFarmer(admin, farmer).stream()
                        .findFirst()
                        .map(FarmerFinancialTransaction::getTransactionDate)
                        .orElse(null))
                .build();
    }

    private FinancialAnalyticsResponse.FarmerFinancialStatusRow buildFarmerStatusRowFromLedger(
            User admin, Farmer farmer, LedgerTotals ledgerTotals) {
        return FinancialAnalyticsResponse.FarmerFinancialStatusRow.builder()
                .farmerId(farmer.getId())
                .farmerName(farmer.getFullName())
                .pendingAdvance(ledgerTotals.pendingAdvance())
                .pendingLoan(ledgerTotals.pendingLoan())
                .pendingOther(ledgerTotals.pendingOther())
                .totalPending(FinancialMath.totalPending(
                        ledgerTotals.pendingAdvance(), ledgerTotals.pendingLoan(), ledgerTotals.pendingOther()))
                .lastTransactionDate(transactionRepository.findLatestByAdminAndFarmer(admin, farmer).stream()
                        .findFirst()
                        .map(FarmerFinancialTransaction::getTransactionDate)
                        .orElse(null))
                .build();
    }

    private LedgerTotals calculateLedgerTotalsForAdmin(User admin) {
        List<FarmerFinancialTransaction> allTransactions = transactionRepository.findByAdmin(admin);
        return calculateLedgerTotalsFromTransactions(allTransactions);
    }

    private LedgerTotals calculateLedgerTotalsForFarmer(User admin, Farmer farmer) {
        List<FarmerFinancialTransaction> transactions = transactionRepository.findByAdminAndFarmer(admin, farmer);
        return calculateLedgerTotalsFromTransactions(transactions);
    }

    private LedgerTotals calculateLedgerTotalsFromTransactions(List<FarmerFinancialTransaction> transactions) {
        BigDecimal pendingAdvance = BigDecimal.ZERO;
        BigDecimal pendingLoan = BigDecimal.ZERO;
        BigDecimal pendingOther = BigDecimal.ZERO;

        for (FarmerFinancialTransaction transaction : transactions) {
            BigDecimal amount = FinancialMath.scale(transaction.getAmount());
            switch (transaction.getTransactionType()) {
                case ADVANCE_ADDED -> pendingAdvance = pendingAdvance.add(amount);
                case ADVANCE_RECOVERED -> pendingAdvance = pendingAdvance.subtract(amount);
                case LOAN_ADDED -> pendingLoan = pendingLoan.add(amount);
                case LOAN_RECOVERED -> pendingLoan = pendingLoan.subtract(amount);
                case OTHER_ADDED, FEED_PURCHASE_ADDED -> pendingOther = pendingOther.add(amount);
                case OTHER_RECOVERED, FEED_PURCHASE_RECOVERED -> pendingOther = pendingOther.subtract(amount);
                case PAYMENT_RELEASED, MANUAL_ADJUSTMENT -> {
                }
            }
        }

        return new LedgerTotals(
                FinancialMath.scale(pendingAdvance),
                FinancialMath.scale(pendingLoan),
                FinancialMath.scale(pendingOther));
    }

    private record LedgerTotals(
            BigDecimal pendingAdvance,
            BigDecimal pendingLoan,
            BigDecimal pendingOther
    ) {}

    private List<FinancialAnalyticsResponse.RecentTransactionRow> mapRecentTransactions(
            List<FarmerFinancialTransaction> transactions, int limit) {
        return transactions.stream()
                .limit(limit)
                .map(t -> FinancialAnalyticsResponse.RecentTransactionRow.builder()
                        .id(t.getId())
                        .transactionDate(t.getTransactionDate())
                        .transactionType(t.getTransactionType().name())
                        .amount(t.getAmount())
                        .description(t.getDescription())
                        .farmerName(t.getFarmer().getFullName())
                        .build())
                .collect(Collectors.toList());
    }

    private List<FarmerFinancialTransactionResponse> mapToResponses(List<FarmerFinancialTransaction> transactions) {
        if (transactions.isEmpty()) {
            return List.of();
        }

        List<FarmerFinancialTransaction> chronological = new ArrayList<>(transactions);
        chronological.sort(Comparator
                .comparing(FarmerFinancialTransaction::getTransactionDate)
                .thenComparing(FarmerFinancialTransaction::getCreatedAt));

        Map<Long, BigDecimal> runningBalanceById = new HashMap<>();
        BigDecimal advance = BigDecimal.ZERO;
        BigDecimal loan = BigDecimal.ZERO;
        BigDecimal other = BigDecimal.ZERO;

        for (FarmerFinancialTransaction transaction : chronological) {
            BigDecimal amount = FinancialMath.scale(transaction.getAmount());
            switch (transaction.getTransactionType()) {
                case ADVANCE_ADDED -> advance = advance.add(amount);
                case ADVANCE_RECOVERED -> advance = advance.subtract(amount);
                case LOAN_ADDED -> loan = loan.add(amount);
                case LOAN_RECOVERED -> loan = loan.subtract(amount);
                case OTHER_ADDED, FEED_PURCHASE_ADDED -> other = other.add(amount);
                case OTHER_RECOVERED, FEED_PURCHASE_RECOVERED -> other = other.subtract(amount);
                case PAYMENT_RELEASED, MANUAL_ADJUSTMENT -> {
                    // Payment does not change outstanding advance/loan/other balances.
                }
            }
            runningBalanceById.put(transaction.getId(), FinancialMath.totalPending(advance, loan, other));
        }

        return transactions.stream()
                .map(transaction -> FarmerFinancialTransactionResponse.fromEntity(
                        transaction,
                        runningBalanceById.getOrDefault(transaction.getId(), BigDecimal.ZERO)))
                .collect(Collectors.toList());
    }

    private record RecoveryTotals(
            BigDecimal advance,
            BigDecimal loan,
            BigDecimal other,
            BigDecimal paymentsReleased) {

        BigDecimal totalRecovered() {
            return FinancialMath.scale(advance.add(loan).add(other));
        }
    }
}
