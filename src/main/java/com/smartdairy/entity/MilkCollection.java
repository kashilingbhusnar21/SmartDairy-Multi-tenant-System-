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
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDate;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(
        name = "milk_collections",
        indexes = {
                @Index(name = "idx_milk_collections_admin_id", columnList = "admin_id"),
                @Index(name = "idx_milk_collections_admin_date", columnList = "admin_id,date"),
                @Index(name = "idx_milk_collections_admin_farmer", columnList = "admin_id,farmer_id")
        })
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MilkCollection {

    public enum Shift {
        MORNING,
        EVENING
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

    @Column(nullable = false)
    private LocalDate date;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private Shift shift;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal quantityLiters;

    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal fatPercentage;

    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal snfPercentage;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal ratePerLiter;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal totalAmount;
}
