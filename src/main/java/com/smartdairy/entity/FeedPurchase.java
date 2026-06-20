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
        name = "feed_purchases",
        indexes = {
                @Index(name = "idx_feed_purchases_admin_id", columnList = "admin_id"),
                @Index(name = "idx_feed_purchases_admin_date", columnList = "admin_id,feed_date"),
                @Index(name = "idx_feed_purchases_admin_farmer", columnList = "admin_id,farmer_id")
        })
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FeedPurchase {

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
    private LocalDate feedDate;

    @Column(nullable = false, length = 80)
    private String feedType;

    @Column(nullable = false, length = 120)
    private String feedCompanyName;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal feedQuantity;

    @Column(nullable = false, length = 20)
    private String unitType;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal ratePerUnit;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal totalAmount;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal remainingAmount;

    @Column(length = 500)
    private String notes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "settled_payment_id")
    private Payment settledInPayment;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void prePersist() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}
