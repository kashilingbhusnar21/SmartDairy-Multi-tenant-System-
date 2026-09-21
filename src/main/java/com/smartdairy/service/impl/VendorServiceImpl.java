package com.smartdairy.service.impl;

import com.smartdairy.dto.VendorRequest;
import com.smartdairy.dto.VendorResponse;
import com.smartdairy.entity.Farmer;
import com.smartdairy.entity.User;
import com.smartdairy.entity.Vendor;
import com.smartdairy.exception.ResourceNotFoundException;
import com.smartdairy.repository.EquipmentRepository;
import com.smartdairy.repository.FarmerRepository;
import com.smartdairy.repository.VendorRepository;
import com.smartdairy.security.FarmerSecurityService;
import com.smartdairy.security.FarmerUserDetails;
import com.smartdairy.service.UserService;
import com.smartdairy.service.VendorService;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class VendorServiceImpl implements VendorService {

    private final VendorRepository vendorRepository;
    private final EquipmentRepository equipmentRepository;
    private final UserService userService;
    private final FarmerSecurityService farmerSecurityService;
    private final FarmerRepository farmerRepository;

    @Override
    @Transactional
    public VendorResponse createVendor(VendorRequest request) {
        User admin = userService.getLoggedInUser();

        if (vendorRepository.existsByAdminAndPhone(admin, request.getPhone())) {
            throw new IllegalArgumentException("Vendor with this phone number already exists");
        }

        Vendor vendor = mapToEntity(new Vendor(), request);
        vendor.setAdmin(admin);
        vendor.setActive(true);
        vendor = vendorRepository.save(vendor);

        return mapToResponse(vendor);
    }

    @Override
    @Transactional
    public VendorResponse updateVendor(Long id, VendorRequest request) {
        User admin = userService.getLoggedInUser();
        Vendor existing = vendorRepository.findByIdAndAdmin(id, admin)
                .orElseThrow(() -> new ResourceNotFoundException("Vendor not found with id: " + id));

        if (!existing.getPhone().equals(request.getPhone()) 
                && vendorRepository.existsByAdminAndPhone(admin, request.getPhone())) {
            throw new IllegalArgumentException("Vendor with this phone number already exists");
        }

        existing = mapToEntity(existing, request);
        existing = vendorRepository.save(existing);
        return mapToResponse(existing);
    }

    @Override
    @Transactional
    public void deleteVendor(Long id) {
        User admin = userService.getLoggedInUser();
        Vendor existing = vendorRepository.findByIdAndAdmin(id, admin)
                .orElseThrow(() -> new ResourceNotFoundException("Vendor not found with id: " + id));
        vendorRepository.delete(existing);
    }

    @Override
    @Transactional(readOnly = true)
    public VendorResponse getVendorById(Long id) {
        User admin = getAdminFromContext();
        Vendor vendor = vendorRepository.findByIdAndAdmin(id, admin)
                .orElseThrow(() -> new ResourceNotFoundException("Vendor not found with id: " + id));
        return mapToResponse(vendor);
    }

    @Override
    @Transactional(readOnly = true)
    public List<VendorResponse> getAllVendors() {
        User admin = getAdminFromContext();
        return vendorRepository.findByAdminOrderByNameAsc(admin).stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<VendorResponse> searchVendors(String query) {
        if (query == null || query.isBlank()) {
            return getAllVendors();
        }

        User admin = getAdminFromContext();
        String trimmed = query.trim();

        if (trimmed.matches("\\d+")) {
            Optional<Vendor> exactMatch = vendorRepository.findByIdAndAdmin(Long.parseLong(trimmed), admin);
            if (exactMatch.isPresent()) {
                return List.of(mapToResponse(exactMatch.get()));
            }
        }

        return vendorRepository.searchByAdmin(admin, trimmed).stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional
    public VendorResponse deactivateVendor(Long id) {
        User admin = userService.getLoggedInUser();
        Vendor existing = vendorRepository.findByIdAndAdmin(id, admin)
                .orElseThrow(() -> new ResourceNotFoundException("Vendor not found with id: " + id));
        existing.setActive(false);
        existing = vendorRepository.save(existing);
        return mapToResponse(existing);
    }

    @Override
    @Transactional
    public VendorResponse activateVendor(Long id) {
        User admin = userService.getLoggedInUser();
        Vendor existing = vendorRepository.findByIdAndAdmin(id, admin)
                .orElseThrow(() -> new ResourceNotFoundException("Vendor not found with id: " + id));
        existing.setActive(true);
        existing = vendorRepository.save(existing);
        return mapToResponse(existing);
    }

    @Override
    @Transactional(readOnly = true)
    public List<VendorResponse> getInactiveVendors() {
        User admin = userService.getLoggedInUser();
        return vendorRepository.findByAdminAndActiveOrderByNameAsc(admin, false).stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<VendorResponse> searchInactiveVendors(String query) {
        if (query == null || query.isBlank()) {
            return getInactiveVendors();
        }

        User admin = userService.getLoggedInUser();
        String trimmed = query.trim();
        return vendorRepository.searchByAdminAndActive(admin, false, trimmed).stream()
                .map(this::mapToResponse)
                .toList();
    }

    private Vendor mapToEntity(Vendor vendor, VendorRequest request) {
        vendor.setName(request.getName());
        vendor.setPhone(request.getPhone());
        vendor.setShopAddress(request.getShopAddress());
        return vendor;
    }

    private VendorResponse mapToResponse(Vendor vendor) {
        Integer equipmentCount = equipmentRepository.findByVendorAndActiveOrderByNameAsc(vendor, true).size();

        return VendorResponse.builder()
                .id(vendor.getId())
                .name(vendor.getName())
                .phone(vendor.getPhone())
                .shopAddress(vendor.getShopAddress())
                .active(vendor.getActive())
                .equipmentCount(equipmentCount)
                .build();
    }

    private User getAdminFromContext() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        if (principal instanceof FarmerUserDetails) {
            FarmerUserDetails farmerUserDetails = (FarmerUserDetails) principal;
            Long farmerId = farmerUserDetails.getFarmerId();
            Long adminId = farmerUserDetails.getAdminId();

            Farmer farmer = farmerRepository.findByIdAndAdminIdWithAdmin(farmerId, adminId)
                    .orElseThrow(() -> new ResourceNotFoundException("Farmer not found"));
            return farmer.getAdmin();
        }

        return userService.getLoggedInUser();
    }
}
