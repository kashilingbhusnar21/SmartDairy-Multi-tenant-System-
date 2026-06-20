package com.smartdairy.service.impl;

import com.smartdairy.dto.FarmerRequest;
import com.smartdairy.dto.FarmerResponse;
import com.smartdairy.entity.Farmer;
import com.smartdairy.entity.User;
import com.smartdairy.exception.ResourceNotFoundException;
import com.smartdairy.repository.FarmerRepository;
import com.smartdairy.service.FarmerService;
import com.smartdairy.service.UserService;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class FarmerServiceImpl implements FarmerService {

    private final FarmerRepository farmerRepository;
    private final SmsService smsService;
    private final UserService userService;

    @Override
    @Transactional
    public FarmerResponse createFarmer(FarmerRequest request) {
        User admin = userService.getLoggedInUser();

        Farmer farmer = mapToEntity(new Farmer(), request);
        farmer.setAdmin(admin);
        farmer = farmerRepository.save(farmer);

        try {
            smsService.sendSms(
                    farmer.getMobileNumber(),
                    "Welcome " + farmer.getFullName()
                            + " to Smart Dairy. Your account has been created successfully.");
        } catch (Exception e) {
            System.out.println("Farmer registration SMS failed");
        }
        return mapToResponse(farmer);
    }

    @Override
    @Transactional
    public FarmerResponse updateFarmer(Long id, FarmerRequest request) {
        User admin = userService.getLoggedInUser();
        Farmer existing = farmerRepository.findByIdAndAdmin(id, admin)
                .orElseThrow(() -> new ResourceNotFoundException("Farmer not found with id: " + id));
        existing = mapToEntity(existing, request);
        existing = farmerRepository.save(existing);
        return mapToResponse(existing);
    }

    @Override
    @Transactional
    public void deleteFarmer(Long id) {
        User admin = userService.getLoggedInUser();
        Farmer existing = farmerRepository.findByIdAndAdmin(id, admin)
                .orElseThrow(() -> new ResourceNotFoundException("Farmer not found with id: " + id));
        farmerRepository.delete(existing);
    }

    @Override
    @Transactional(readOnly = true)
    public FarmerResponse getFarmerById(Long id) {
        User admin = userService.getLoggedInUser();
        Farmer farmer = farmerRepository.findByIdAndAdmin(id, admin)
                .orElseThrow(() -> new ResourceNotFoundException("Farmer not found with id: " + id));
        return mapToResponse(farmer);
    }

    @Override
    @Transactional(readOnly = true)
    public FarmerResponse lookupFarmerById(Long id) {
        User admin = userService.getLoggedInUser();
        Farmer farmer = farmerRepository.findLookupByIdAndAdmin(id, admin)
                .orElseThrow(() -> new ResourceNotFoundException("Farmer not found with id: " + id));
        return mapToResponse(farmer);
    }

    @Override
    @Transactional(readOnly = true)
    public List<FarmerResponse> getAllFarmers() {
        User admin = userService.getLoggedInUser();
        return farmerRepository.findByAdminOrderByFullNameAsc(admin).stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<FarmerResponse> searchFarmers(String query) {
        if (query == null || query.isBlank()) {
            return getAllFarmers();
        }

        User admin = userService.getLoggedInUser();
        String trimmed = query.trim();

        if (trimmed.matches("\\d+")) {
            Optional<Farmer> exactMatch = farmerRepository.findByIdAndAdmin(Long.parseLong(trimmed), admin);
            if (exactMatch.isPresent()) {
                return List.of(mapToResponse(exactMatch.get()));
            }
        }

        return farmerRepository.searchByAdmin(admin, trimmed).stream()
                .map(this::mapToResponse)
                .toList();
    }

    private Farmer mapToEntity(Farmer farmer, FarmerRequest request) {
        farmer.setFullName(request.getFullName());
        farmer.setMobileNumber(request.getMobileNumber());
        farmer.setVillage(request.getVillage());
        farmer.setAddress(request.getAddress());
        farmer.setAadhaarNumber(request.getAadhaarNumber());
        farmer.setBankAccountNumber(request.getBankAccountNumber());
        farmer.setIfscCode(request.getIfscCode());
        return farmer;
    }

    private FarmerResponse mapToResponse(Farmer farmer) {
        return FarmerResponse.builder()
                .id(farmer.getId())
                .fullName(farmer.getFullName())
                .mobileNumber(farmer.getMobileNumber())
                .village(farmer.getVillage())
                .address(farmer.getAddress())
                .aadhaarNumber(farmer.getAadhaarNumber())
                .bankAccountNumber(farmer.getBankAccountNumber())
                .ifscCode(farmer.getIfscCode())
                .build();
    }
}
