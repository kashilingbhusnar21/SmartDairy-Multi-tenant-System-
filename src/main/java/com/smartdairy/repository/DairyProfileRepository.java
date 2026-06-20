package com.smartdairy.repository;

import com.smartdairy.entity.DairyProfile;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DairyProfileRepository extends JpaRepository<DairyProfile, Long> {
    Optional<DairyProfile> findByUser_Id(Long userId);
}
