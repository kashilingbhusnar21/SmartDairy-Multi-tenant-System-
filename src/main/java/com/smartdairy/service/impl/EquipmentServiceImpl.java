package com.smartdairy.service.impl;

import com.smartdairy.dto.EquipmentRequest;
import com.smartdairy.dto.EquipmentResponse;
import com.smartdairy.entity.Equipment;
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
import com.smartdairy.service.EquipmentService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.multipart.MultipartFile;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class EquipmentServiceImpl implements EquipmentService {

    private final EquipmentRepository equipmentRepository;
    private final VendorRepository vendorRepository;
    private final UserService userService;
    private final FarmerSecurityService farmerSecurityService;
    private final FarmerRepository farmerRepository;

    @Value("${equipment.upload.dir:uploads/equipment}")
    private String uploadDir;

    @Override
    @Transactional
    public EquipmentResponse createEquipment(EquipmentRequest request) {
        User admin = userService.getLoggedInUser();

        Vendor vendor = vendorRepository.findByIdAndAdmin(request.getVendorId(), admin)
                .orElseThrow(() -> new ResourceNotFoundException("Vendor not found with id: " + request.getVendorId()));

        Equipment equipment = mapToEntity(new Equipment(), request);
        equipment.setVendor(vendor);
        equipment.setAdmin(admin);
        equipment.setActive(true);
        equipment = equipmentRepository.save(equipment);

        return mapToResponse(equipment);
    }

    @Override
    @Transactional
    public EquipmentResponse updateEquipment(Long id, EquipmentRequest request) {
        User admin = userService.getLoggedInUser();
        Equipment existing = equipmentRepository.findByIdAndAdmin(id, admin)
                .orElseThrow(() -> new ResourceNotFoundException("Equipment not found with id: " + id));

        Vendor vendor = vendorRepository.findByIdAndAdmin(request.getVendorId(), admin)
                .orElseThrow(() -> new ResourceNotFoundException("Vendor not found with id: " + request.getVendorId()));

        existing = mapToEntity(existing, request);
        existing.setVendor(vendor);
        existing = equipmentRepository.save(existing);
        return mapToResponse(existing);
    }

    @Override
    @Transactional
    public void deleteEquipment(Long id) {
        User admin = userService.getLoggedInUser();
        Equipment existing = equipmentRepository.findByIdAndAdmin(id, admin)
                .orElseThrow(() -> new ResourceNotFoundException("Equipment not found with id: " + id));
        equipmentRepository.delete(existing);
    }

    @Override
    @Transactional(readOnly = true)
    public EquipmentResponse getEquipmentById(Long id) {
        User admin = getAdminFromContext();
        Equipment equipment = equipmentRepository.findByIdAndAdminIdWithVendorAndAdmin(id, admin.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Equipment not found with id: " + id));
        return mapToResponse(equipment);
    }

    @Override
    @Transactional(readOnly = true)
    public List<EquipmentResponse> getAllEquipment() {
        User admin = getAdminFromContext();
        return equipmentRepository.findByAdminOrderByNameAsc(admin).stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<EquipmentResponse> getEquipmentByVendor(Long vendorId) {
        User admin = getAdminFromContext();
        return equipmentRepository.findByVendorIdAndAdminIdWithVendor(vendorId, admin.getId()).stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<EquipmentResponse> searchEquipment(String query) {
        if (query == null || query.isBlank()) {
            return getAllEquipment();
        }

        User admin = getAdminFromContext();
        String trimmed = query.trim();

        if (trimmed.matches("\\d+")) {
            Optional<Equipment> exactMatch = equipmentRepository.findByIdAndAdmin(Long.parseLong(trimmed), admin);
            if (exactMatch.isPresent()) {
                return List.of(mapToResponse(exactMatch.get()));
            }
        }

        return equipmentRepository.searchByAdmin(admin, trimmed).stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional
    public EquipmentResponse deactivateEquipment(Long id) {
        User admin = userService.getLoggedInUser();
        Equipment existing = equipmentRepository.findByIdAndAdmin(id, admin)
                .orElseThrow(() -> new ResourceNotFoundException("Equipment not found with id: " + id));
        existing.setActive(false);
        existing = equipmentRepository.save(existing);
        return mapToResponse(existing);
    }

    @Override
    @Transactional
    public EquipmentResponse activateEquipment(Long id) {
        User admin = userService.getLoggedInUser();
        Equipment existing = equipmentRepository.findByIdAndAdmin(id, admin)
                .orElseThrow(() -> new ResourceNotFoundException("Equipment not found with id: " + id));
        existing.setActive(true);
        existing = equipmentRepository.save(existing);
        return mapToResponse(existing);
    }

    @Override
    @Transactional(readOnly = true)
    public List<EquipmentResponse> getInactiveEquipment() {
        User admin = userService.getLoggedInUser();
        return equipmentRepository.findByAdminAndActiveOrderByNameAsc(admin, false).stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<EquipmentResponse> searchInactiveEquipment(String query) {
        if (query == null || query.isBlank()) {
            return getInactiveEquipment();
        }

        User admin = userService.getLoggedInUser();
        String trimmed = query.trim();
        return equipmentRepository.searchByAdminAndActive(admin, false, trimmed).stream()
                .map(this::mapToResponse)
                .toList();
    }

    private Equipment mapToEntity(Equipment equipment, EquipmentRequest request) {
        equipment.setName(request.getName());
        equipment.setCompanyName(request.getCompanyName());
        equipment.setPrice(request.getPrice());
        equipment.setDescription(request.getDescription());
        equipment.setImageUrl(request.getImageUrl());
        return equipment;
    }

    private EquipmentResponse mapToResponse(Equipment equipment) {
        return EquipmentResponse.builder()
                .id(equipment.getId())
                .name(equipment.getName())
                .companyName(equipment.getCompanyName())
                .price(equipment.getPrice())
                .description(equipment.getDescription())
                .imageUrl(equipment.getImageUrl())
                .vendorId(equipment.getVendor().getId())
                .vendorName(equipment.getVendor().getName())
                .vendorPhone(equipment.getVendor().getPhone())
                .vendorShopAddress(equipment.getVendor().getShopAddress())
                .active(equipment.getActive())
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

    @Override
    public String uploadEquipmentImage(MultipartFile file) {
        try {
            String originalFilename = file.getOriginalFilename();
            String extension = originalFilename != null && originalFilename.contains(".")
                ? originalFilename.substring(originalFilename.lastIndexOf("."))
                : "";
            String uniqueFilename = UUID.randomUUID().toString() + extension;

            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            Path filePath = uploadPath.resolve(uniqueFilename);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            return "/uploads/equipment/" + uniqueFilename;
        } catch (IOException e) {
            throw new RuntimeException("Failed to upload image: " + e.getMessage(), e);
        }
    }

    private String getBaseUrl() {
        // Return the base URL for serving images
        return "";
    }
}
