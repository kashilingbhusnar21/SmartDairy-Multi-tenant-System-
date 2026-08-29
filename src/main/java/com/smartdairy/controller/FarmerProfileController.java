package com.smartdairy.controller;

import com.smartdairy.dto.FarmerResponse;
import com.smartdairy.entity.Farmer;
import com.smartdairy.security.FarmerSecurityService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/farmer/profile")
@RequiredArgsConstructor
@PreAuthorize("hasRole('FARMER')")
public class FarmerProfileController {

    private final FarmerSecurityService farmerSecurityService;

    @GetMapping
    public ResponseEntity<FarmerResponse> getMyProfile() {
        Farmer farmer = farmerSecurityService.getLoggedInFarmer();
        FarmerResponse response = FarmerResponse.builder()
                .id(farmer.getId())
                .fullName(farmer.getFullName())
                .mobileNumber(farmer.getMobileNumber())
                .village(farmer.getVillage())
                .address(farmer.getAddress())
                .aadhaarNumber(farmer.getAadhaarNumber())
                .bankAccountNumber(farmer.getBankAccountNumber())
                .ifscCode(farmer.getIfscCode())
                .active(farmer.getActive())
                .build();
        return ResponseEntity.ok(response);
    }
}
