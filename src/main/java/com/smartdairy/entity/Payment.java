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
import jakarta.persistence.OneToOne;
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
        name = "payments",
        indexes = {
                @Index(name = "idx_payments_admin_id", columnList = "admin_id"),
                @Index(name = "idx_payments_admin_status", columnList = "admin_id,status"),
                @Index(name = "idx_payments_admin_farmer", columnList = "admin_id,farmer_id")
        })
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Payment {

    public enum PaymentStatus {
        PENDING,
        PAID
    }

    public enum PaymentMethod {
        CASH,
        BANK_TRANSFER,
        UPI,
        CHEQUE,
        OTHER
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "admin_id", nullable = false)
    private User admin;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "farmer_id", nullable = false)
    private Farmer farmer;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "milk_collection_id", nullable = false, unique = true)
    private MilkCollection milkCollection;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal grossAmount;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal feedDeductionAmount;

    @Column
    private LocalDate paymentDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PaymentStatus status;

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private PaymentMethod paymentMethod;

    @Column(length = 500)
    private String remarks;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void prePersist() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}
