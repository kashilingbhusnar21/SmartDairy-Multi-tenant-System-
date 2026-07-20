package com.smartdairy.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(
        name = "farmer_financial_transactions",
        indexes = {
                @Index(name = "idx_financial_transactions_admin_id", columnList = "admin_id"),
                @Index(name = "idx_financial_transactions_farmer_id", columnList = "farmer_id"),
                @Index(name = "idx_financial_transactions_account_id", columnList = "account_id"),
                @Index(name = "idx_financial_transactions_date", columnList = "transaction_date")
        })
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FarmerFinancialTransaction {

    public enum FinancialTransactionType {
        ADVANCE_ADDED,
        ADVANCE_RECOVERED,
        LOAN_ADDED,
        LOAN_RECOVERED,
        OTHER_ADDED,
        OTHER_RECOVERED,
        MANUAL_ADJUSTMENT,
        FEED_PURCHASE_ADDED,
        FEED_PURCHASE_RECOVERED,
        PAYMENT_RELEASED
    }

    public enum ReferenceType {
        BILL,
        PAYMENT,
        MANUAL,
        SYSTEM
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "account_id", nullable = false)
    private FarmerFinancialAccount account;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "farmer_id", nullable = false)
    private Farmer farmer;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "admin_id", nullable = false)
    private User admin;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private FinancialTransactionType transactionType;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private ReferenceType referenceType;

    @Column(length = 255)
    private String referenceId;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal balanceBefore;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal balanceAfter;

    @Column(length = 500)
    private String description;

    @Column(nullable = false)
    private LocalDate transactionDate;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void prePersist() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
        if (transactionDate == null) {
            transactionDate = LocalDate.now();
        }
    }
}
