package com.smartdairy.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "dairy_profiles")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DairyProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(length = 150)
    private String dairyName;

    @Column(length = 120)
    private String ownerName;

    @Column(length = 30)
    private String contactNumber;

    @Column(length = 120)
    private String email;

    @Column(length = 400)
    private String dairyAddress;

    @Column(columnDefinition = "TEXT")
    private String dairyLogo;

    @Column(nullable = false)
    private Instant updatedAt;
}
