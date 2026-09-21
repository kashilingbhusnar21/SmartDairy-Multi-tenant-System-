package com.smartdairy.controller;

import com.smartdairy.dto.EquipmentResponse;
import com.smartdairy.dto.VendorResponse;
import com.smartdairy.service.EquipmentService;
import com.smartdairy.service.VendorService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/vendors")
@RequiredArgsConstructor
public class VendorController {

    private final VendorService vendorService;
    private final EquipmentService equipmentService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','FARMER')")
    public ResponseEntity<List<VendorResponse>> getAllVendors() {
        return ResponseEntity.ok(vendorService.getAllVendors());
    }

    @GetMapping("/{vendorId}/equipment")
    @PreAuthorize("hasAnyRole('ADMIN','FARMER')")
    public ResponseEntity<List<EquipmentResponse>> getEquipmentByVendor(@PathVariable Long vendorId) {
        return ResponseEntity.ok(equipmentService.getEquipmentByVendor(vendorId));
    }
}
