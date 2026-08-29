package com.smartdairy.controller;

import com.smartdairy.dto.FarmerPasswordResetRequest;
import com.smartdairy.dto.FarmerRequest;
import com.smartdairy.dto.FarmerResponse;
import com.smartdairy.service.FarmerService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/farmers")
@RequiredArgsConstructor
public class FarmerController {

    private final FarmerService farmerService;

    // ✅ ADMIN ONLY (WRITE)
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<FarmerResponse> createFarmer(
            @Valid @RequestBody FarmerRequest request) {
        FarmerResponse response = farmerService.createFarmer(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    // ✅ ADMIN ONLY (WRITE)
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<FarmerResponse> updateFarmer(
            @PathVariable Long id, @Valid @RequestBody FarmerRequest request) {
        return ResponseEntity.ok(farmerService.updateFarmer(id, request));
    }

    // ✅ ADMIN ONLY (WRITE)
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteFarmer(@PathVariable Long id) {
        farmerService.deleteFarmer(id);
        return ResponseEntity.noContent().build();
    }

    // ✅ ADMIN ONLY
    @PatchMapping("/{id}/deactivate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<FarmerResponse> deactivateFarmer(@PathVariable Long id) {
        return ResponseEntity.ok(farmerService.deactivateFarmer(id));
    }

    // ✅ ADMIN ONLY
    @PatchMapping("/{id}/activate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<FarmerResponse> activateFarmer(@PathVariable Long id) {
        return ResponseEntity.ok(farmerService.activateFarmer(id));
    }

    // ✅ ADMIN + FARMER (READ)
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','FARMER')")
    public ResponseEntity<List<FarmerResponse>> getAllFarmers(
            @RequestParam(value = "q", required = false) String query) {
        return ResponseEntity.ok(farmerService.searchFarmers(query));
    }

    // ✅ ADMIN ONLY
    @GetMapping("/inactive")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<FarmerResponse>> getInactiveFarmers(
            @RequestParam(value = "q", required = false) String query) {
        return ResponseEntity.ok(farmerService.searchInactiveFarmers(query));
    }

    // ✅ ADMIN + FARMER (READ)
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','FARMER')")
    public ResponseEntity<FarmerResponse> getFarmerById(@PathVariable Long id) {
        return ResponseEntity.ok(farmerService.getFarmerById(id));
    }

    // ✅ ADMIN ONLY
    @GetMapping("/lookup/by-id/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<FarmerResponse> lookupFarmerById(@PathVariable Long id) {
        return ResponseEntity.ok(farmerService.lookupFarmerById(id));
    }

    // ✅ ADMIN ONLY
    @PostMapping("/{id}/reset-password")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> resetFarmerPassword(
            @PathVariable Long id, @Valid @RequestBody FarmerPasswordResetRequest request) {
        farmerService.resetFarmerPassword(id, request.getPassword());
        return ResponseEntity.noContent().build();
    }
}