package com.smartdairy.repository;

import com.smartdairy.dto.FarmerFinancialStatusDto;
import com.smartdairy.entity.FarmerFinancialTransaction;
import com.smartdairy.entity.Farmer;
import com.smartdairy.entity.User;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface FarmerFinancialTransactionRepository extends JpaRepository<FarmerFinancialTransaction, Long> {

    List<FarmerFinancialTransaction> findByAdmin(User admin);

    List<FarmerFinancialTransaction> findByAdminAndFarmer(User admin, Farmer farmer);

    List<FarmerFinancialTransaction> findByAdminAndFarmerOrderByTransactionDateDescCreatedAtDesc(
            User admin, Farmer farmer);

    List<FarmerFinancialTransaction> findByAdminAndTransactionDateBetweenOrderByTransactionDateDescCreatedAtDesc(
            User admin, LocalDate fromDate, LocalDate toDate);

    @Query("""
            select t from FarmerFinancialTransaction t
            where t.admin = :admin and t.farmer = :farmer
              and t.transactionDate between :fromDate and :toDate
            order by t.transactionDate asc, t.createdAt asc
            """)
    List<FarmerFinancialTransaction> findByAdminAndFarmerAndDateRange(
            @Param("admin") User admin,
            @Param("farmer") Farmer farmer,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate);

    @Query("""
            select t from FarmerFinancialTransaction t
            where t.admin = :admin and t.farmer = :farmer
            order by t.transactionDate desc, t.createdAt desc
            """)
    List<FarmerFinancialTransaction> findLatestByAdminAndFarmer(
            @Param("admin") User admin,
            @Param("farmer") Farmer farmer);

    @Query("SELECT SUM(t.amount) FROM FarmerFinancialTransaction t WHERE t.admin = :admin AND t.transactionType = 'ADVANCE_RECOVERED' AND t.transactionDate BETWEEN :from AND :to")
    BigDecimal sumAdvanceRecoveredByAdminAndDateRange(@Param("admin") User admin, @Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query("SELECT SUM(t.amount) FROM FarmerFinancialTransaction t WHERE t.admin = :admin AND t.transactionType = 'LOAN_RECOVERED' AND t.transactionDate BETWEEN :from AND :to")
    BigDecimal sumLoanRecoveredByAdminAndDateRange(@Param("admin") User admin, @Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query("SELECT SUM(t.amount) FROM FarmerFinancialTransaction t WHERE t.admin = :admin AND t.transactionType IN ('OTHER_RECOVERED', 'FEED_PURCHASE_RECOVERED') AND t.transactionDate BETWEEN :from AND :to")
    BigDecimal sumOtherRecoveredByAdminAndDateRange(@Param("admin") User admin, @Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query("SELECT SUM(t.amount) FROM FarmerFinancialTransaction t WHERE t.admin = :admin AND t.transactionType = 'PAYMENT_RELEASED' AND t.transactionDate BETWEEN :from AND :to")
    BigDecimal sumPaymentsReleasedByAdminAndDateRange(@Param("admin") User admin, @Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query("SELECT SUM(t.amount) FROM FarmerFinancialTransaction t WHERE t.admin = :admin AND t.farmer = :farmer AND t.transactionType = 'ADVANCE_RECOVERED' AND t.transactionDate BETWEEN :from AND :to")
    BigDecimal sumAdvanceRecoveredByAdminAndFarmerAndDateRange(@Param("admin") User admin, @Param("farmer") Farmer farmer, @Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query("SELECT SUM(t.amount) FROM FarmerFinancialTransaction t WHERE t.admin = :admin AND t.farmer = :farmer AND t.transactionType = 'LOAN_RECOVERED' AND t.transactionDate BETWEEN :from AND :to")
    BigDecimal sumLoanRecoveredByAdminAndFarmerAndDateRange(@Param("admin") User admin, @Param("farmer") Farmer farmer, @Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query("SELECT SUM(t.amount) FROM FarmerFinancialTransaction t WHERE t.admin = :admin AND t.farmer = :farmer AND t.transactionType IN ('OTHER_RECOVERED', 'FEED_PURCHASE_RECOVERED') AND t.transactionDate BETWEEN :from AND :to")
    BigDecimal sumOtherRecoveredByAdminAndFarmerAndDateRange(@Param("admin") User admin, @Param("farmer") Farmer farmer, @Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query("SELECT SUM(t.amount) FROM FarmerFinancialTransaction t WHERE t.admin = :admin AND t.farmer = :farmer AND t.transactionType = 'PAYMENT_RELEASED' AND t.transactionDate BETWEEN :from AND :to")
    BigDecimal sumPaymentsReleasedByAdminAndFarmerAndDateRange(@Param("admin") User admin, @Param("farmer") Farmer farmer, @Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query("SELECT t FROM FarmerFinancialTransaction t WHERE t.admin = :admin ORDER BY t.transactionDate DESC, t.createdAt DESC")
    List<FarmerFinancialTransaction> findLatestTransactionsByAdmin(@Param("admin") User admin);

    @Query("SELECT t FROM FarmerFinancialTransaction t WHERE t.admin = :admin ORDER BY t.transactionDate DESC, t.createdAt DESC")
    Page<FarmerFinancialTransaction> findLatestTransactionsByAdminPaginated(@Param("admin") User admin, Pageable pageable);

    @Query("""
            SELECT new com.smartdairy.dto.FarmerFinancialStatusDto(
                f.id,
                f.fullName,
                fa.pendingAdvance,
                fa.pendingLoan,
                fa.pendingOther,
                (SELECT MAX(t.transactionDate) FROM FarmerFinancialTransaction t WHERE t.admin = :admin AND t.farmer = f)
            )
            FROM FarmerFinancialAccount fa
            JOIN fa.farmer f
            WHERE fa.admin = :admin AND (fa.pendingAdvance > 0 OR fa.pendingLoan > 0 OR fa.pendingOther > 0)
            ORDER BY fa.pendingAdvance + fa.pendingLoan + fa.pendingOther DESC
            """)
    List<com.smartdairy.dto.FarmerFinancialStatusDto> findFarmerFinancialStatusByAdmin(@Param("admin") User admin);

    @Query("""
            SELECT new com.smartdairy.dto.FarmerFinancialStatusDto(
                f.id,
                f.fullName,
                fa.pendingAdvance,
                fa.pendingLoan,
                fa.pendingOther,
                (SELECT MAX(t.transactionDate) FROM FarmerFinancialTransaction t WHERE t.admin = :admin AND t.farmer = f)
            )
            FROM FarmerFinancialAccount fa
            JOIN fa.farmer f
            WHERE fa.admin = :admin AND (fa.pendingAdvance > 0 OR fa.pendingLoan > 0 OR fa.pendingOther > 0)
            ORDER BY fa.pendingAdvance + fa.pendingLoan + fa.pendingOther DESC
            """)
    Page<com.smartdairy.dto.FarmerFinancialStatusDto> findFarmerFinancialStatusByAdminPaginated(@Param("admin") User admin, Pageable pageable);

    boolean existsByAdminAndFarmerAndReferenceIdAndTransactionType(
            @Param("admin") User admin,
            @Param("farmer") Farmer farmer,
            @Param("referenceId") String referenceId,
            @Param("transactionType") FarmerFinancialTransaction.FinancialTransactionType transactionType);
}
