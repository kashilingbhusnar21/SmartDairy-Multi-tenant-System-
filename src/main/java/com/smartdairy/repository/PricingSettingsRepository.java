package com.smartdairy.repository;

import com.smartdairy.entity.PricingSettings;
import com.smartdairy.entity.User;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface PricingSettingsRepository extends JpaRepository<PricingSettings, Long> {

    Optional<PricingSettings> findByAdmin(User admin);

    boolean existsByAdmin(User admin);

    @Query("select ps from PricingSettings ps where ps.admin is null")
    List<PricingSettings> findAllWithoutAdmin();
}
