package com.smartdairy.service.impl;

import com.smartdairy.dto.FarmerLoginRequest;
import com.smartdairy.dto.FarmerLoginResponse;
import com.smartdairy.entity.DairyProfile;
import com.smartdairy.entity.Farmer;
import com.smartdairy.entity.User;
import com.smartdairy.exception.ResourceNotFoundException;
import com.smartdairy.repository.DairyProfileRepository;
import com.smartdairy.repository.FarmerRepository;
import com.smartdairy.security.FarmerUserDetails;
import com.smartdairy.security.JwtService;
import com.smartdairy.service.FarmerAuthService;
import java.util.HashMap;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class FarmerAuthServiceImpl implements FarmerAuthService {

    private final DairyProfileRepository dairyProfileRepository;
    private final FarmerRepository farmerRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Override
    @Transactional(readOnly = true)
    public FarmerLoginResponse login(FarmerLoginRequest request) {
        // Find Dairy by dairyCode
        DairyProfile dairyProfile = dairyProfileRepository.findByDairyCode(request.getDairyCode())
                .orElseThrow(() -> new ResourceNotFoundException("Invalid dairy code"));

        User admin = dairyProfile.getUser();

        // Find Farmer by ID and verify it belongs to this Dairy's admin
        Farmer farmer = farmerRepository.findByIdAndAdmin(request.getFarmerId(), admin)
                .orElseThrow(() -> new ResourceNotFoundException("Invalid farmer ID or farmer does not belong to this dairy"));

        // Verify Farmer is active
        if (!farmer.getActive()) {
            throw new IllegalStateException("Farmer account is inactive");
        }

        // Verify password
        if (farmer.getPassword() == null || farmer.getPassword().isBlank()) {
            throw new IllegalStateException("Password not set for this farmer. Please contact admin.");
        }

        if (!passwordEncoder.matches(request.getPassword(), farmer.getPassword())) {
            throw new IllegalArgumentException("Invalid password");
        }

        // Generate JWT with extra claims
        Map<String, Object> extraClaims = new HashMap<>();
        extraClaims.put("farmerId", farmer.getId());
        extraClaims.put("adminId", admin.getId());
        extraClaims.put("role", "FARMER");

        System.out.println("=== FARMER LOGIN DEBUG ===");
        System.out.println("Farmer ID: " + farmer.getId());
        System.out.println("Farmer Name: " + farmer.getFullName());
        System.out.println("Farmer Mobile: " + farmer.getMobileNumber());
        System.out.println("Farmer Active: " + farmer.getActive());

        // Use farmer's mobile number as subject for JWT
        FarmerUserDetails userDetails = new FarmerUserDetails(farmer);
        String token = jwtService.generateToken(extraClaims, userDetails);

        System.out.println("JWT generated with subject: " + userDetails.getUsername());
        System.out.println("JWT role claim: " + extraClaims.get("role"));

        return FarmerLoginResponse.builder()
                .accessToken(token)
                .tokenType("Bearer")
                .farmerId(farmer.getId())
                .farmerName(farmer.getFullName())
                .build();
    }
}
