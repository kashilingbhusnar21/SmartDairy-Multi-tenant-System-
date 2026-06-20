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
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.math.BigDecimal;
import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(
        name = "pricing_settings",
        uniqueConstraints = @UniqueConstraint(name = "uk_pricing_settings_admin", columnNames = "admin_id"),
        indexes = @Index(name = "idx_pricing_settings_admin_id", columnList = "admin_id"))
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PricingSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "admin_id", nullable = false)
    private User admin;

    @Column(nullable = false, precision = 6, scale = 2)
    private BigDecimal defaultFat;

    @Column(nullable = false, precision = 6, scale = 2)
    private BigDecimal defaultSnf;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal baseRatePerLiter;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal fatBonusPerPoint;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal snfBonusPerPoint;

    @Column(nullable = false)
    private Instant updatedAt;
}
