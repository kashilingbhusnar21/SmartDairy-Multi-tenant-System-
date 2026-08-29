package com.smartdairy.controller;

import com.smartdairy.dto.MilkCollectionResponse;
import com.smartdairy.entity.Farmer;
import com.smartdairy.repository.MilkCollectionRepository;
import com.smartdairy.security.FarmerSecurityService;
import java.time.LocalDate;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PathVariable;

@RestController
@RequestMapping("/api/farmer/milk-collections")
@RequiredArgsConstructor
@PreAuthorize("hasRole('FARMER')")
public class FarmerMilkCollectionController {

    private final FarmerSecurityService farmerSecurityService;
    private final MilkCollectionRepository milkCollectionRepository;

    @GetMapping
    public ResponseEntity<List<MilkCollectionResponse>> getMyCollections(
            @RequestParam(value = "from", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(value = "to", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        Farmer farmer = farmerSecurityService.getLoggedInFarmer();
        List<MilkCollectionResponse> collections;
        
        if (from != null && to != null) {
            collections = milkCollectionRepository.findDetailedForAdminAndFarmerBetween(
                    farmer.getAdmin(), farmer.getId(), from, to).stream()
                    .map(this::toResponse)
                    .toList();
        } else {
            collections = milkCollectionRepository.findByAdminAndFarmerIdWithFarmer(
                    farmer.getAdmin(), farmer.getId()).stream()
                    .map(this::toResponse)
                    .toList();
        }
        
        return ResponseEntity.ok(collections);
    }

    @GetMapping("/{id}")
    public ResponseEntity<MilkCollectionResponse> getCollectionById(@PathVariable Long id) {
        Farmer farmer = farmerSecurityService.getLoggedInFarmer();
        return milkCollectionRepository.findByAdminAndId(farmer.getAdmin(), id)
                .filter(mc -> mc.getFarmer().getId().equals(farmer.getId()))
                .map(this::toResponse)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    private MilkCollectionResponse toResponse(com.smartdairy.entity.MilkCollection mc) {
        return MilkCollectionResponse.builder()
                .id(mc.getId())
                .farmerId(mc.getFarmer().getId())
                .farmerName(mc.getFarmer().getFullName())
                .date(mc.getDate())
                .shift(mc.getShift())
                .quantityLiters(mc.getQuantityLiters())
                .fatPercentage(mc.getFatPercentage())
                .snfPercentage(mc.getSnfPercentage())
                .ratePerLiter(mc.getRatePerLiter())
                .totalAmount(mc.getTotalAmount())
                .build();
    }
}
