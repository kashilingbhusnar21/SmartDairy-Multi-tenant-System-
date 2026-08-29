package com.smartdairy.security;

import com.smartdairy.entity.Farmer;
import com.smartdairy.exception.ResourceNotFoundException;
import com.smartdairy.repository.FarmerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class FarmerSecurityService {

    private final FarmerRepository farmerRepository;

    public Farmer getLoggedInFarmer() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        if (principal instanceof FarmerUserDetails) {
            FarmerUserDetails farmerUserDetails = (FarmerUserDetails) principal;
            Long farmerId = farmerUserDetails.getFarmerId();
            Long adminId = farmerUserDetails.getAdminId();

            return farmerRepository.findByIdAndAdminIdWithAdmin(farmerId, adminId)
                    .orElseThrow(() -> new ResourceNotFoundException("Farmer not found"));
        }

        throw new IllegalStateException("User is not authenticated as a farmer");
    }
}
