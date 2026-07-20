package com.smartdairy.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
        name = "farmer_bills",
        indexes = {
                @Index(name = "idx_farmer_bills_admin_id", columnList = "admin_id"),
                @Index(name = "idx_farmer_bills_admin_farmer", columnList = "admin_id,farmer_id"),
                @Index(name = "idx_farmer_bills_date_range", columnList = "admin_id,farmer_id,from_date,to_date")
        })
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FarmerBill {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "admin_id", nullable = false)
    private User admin;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "farmer_id", nullable = false)
    private Farmer farmer;

    @Column(nullable = false)
    private LocalDate fromDate;

    @Column(nullable = false)
    private LocalDate toDate;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal totalAmount;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal feedDeduction;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal advancePayment;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal loanAmount;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal otherDeductions;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal finalPayableAmount;

    @Column(nullable = false)
    @Builder.Default
    private boolean finalized = false;

    private java.time.Instant finalizedAt;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void prePersist() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}
