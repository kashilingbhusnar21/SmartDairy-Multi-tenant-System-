package com.smartdairy.controller;

import com.smartdairy.dto.EquipmentRequest;
import com.smartdairy.dto.EquipmentResponse;
import com.smartdairy.dto.VendorRequest;
import com.smartdairy.dto.VendorResponse;
import com.smartdairy.service.EquipmentService;
import com.smartdairy.service.VendorService;
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
@RequestMapping("/api/admin/vendors")
@RequiredArgsConstructor
public class AdminVendorController {

    private final VendorService vendorService;
    private final EquipmentService equipmentService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<VendorResponse> createVendor(
            @Valid @RequestBody VendorRequest request) {
        VendorResponse response = vendorService.createVendor(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<VendorResponse> updateVendor(
            @PathVariable Long id, @Valid @RequestBody VendorRequest request) {
        return ResponseEntity.ok(vendorService.updateVendor(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteVendor(@PathVariable Long id) {
        vendorService.deleteVendor(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/deactivate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<VendorResponse> deactivateVendor(@PathVariable Long id) {
        return ResponseEntity.ok(vendorService.deactivateVendor(id));
    }

    @PatchMapping("/{id}/activate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<VendorResponse> activateVendor(@PathVariable Long id) {
        return ResponseEntity.ok(vendorService.activateVendor(id));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<VendorResponse>> getAllVendors(
            @RequestParam(value = "q", required = false) String query) {
        return ResponseEntity.ok(vendorService.searchVendors(query));
    }

    @GetMapping("/inactive")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<VendorResponse>> getInactiveVendors(
            @RequestParam(value = "q", required = false) String query) {
        return ResponseEntity.ok(vendorService.searchInactiveVendors(query));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<VendorResponse> getVendorById(@PathVariable Long id) {
        return ResponseEntity.ok(vendorService.getVendorById(id));
    }

    @PostMapping("/{vendorId}/equipment")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<EquipmentResponse> createEquipment(
            @PathVariable Long vendorId, @Valid @RequestBody EquipmentRequest request) {
        request.setVendorId(vendorId);
        EquipmentResponse response = equipmentService.createEquipment(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }
}
