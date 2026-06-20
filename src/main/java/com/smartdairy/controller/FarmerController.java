package com.smartdairy.controller;

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
@PreAuthorize("hasAnyRole('ADMIN','FARMER')")
public class FarmerController {

    private final FarmerService farmerService;

    @PostMapping
    public ResponseEntity<FarmerResponse> createFarmer(@Valid @RequestBody FarmerRequest request) {
        FarmerResponse response = farmerService.createFarmer(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<FarmerResponse> updateFarmer(
            @PathVariable Long id, @Valid @RequestBody FarmerRequest request) {
        return ResponseEntity.ok(farmerService.updateFarmer(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFarmer(@PathVariable Long id) {
        farmerService.deleteFarmer(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public ResponseEntity<List<FarmerResponse>> getAllFarmers(
            @RequestParam(value = "q", required = false) String query) {
        return ResponseEntity.ok(farmerService.searchFarmers(query));
    }

    @GetMapping("/{id}")
    public ResponseEntity<FarmerResponse> getFarmerById(@PathVariable Long id) {
        return ResponseEntity.ok(farmerService.getFarmerById(id));
    }

    @GetMapping("/lookup/by-id/{id}")
    public ResponseEntity<FarmerResponse> lookupFarmerById(@PathVariable Long id) {
        return ResponseEntity.ok(farmerService.lookupFarmerById(id));
    }
}
