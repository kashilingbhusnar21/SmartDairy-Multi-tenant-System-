package com.smartdairy.controller;

import com.smartdairy.dto.EquipmentRequest;
import com.smartdairy.dto.EquipmentResponse;
import com.smartdairy.service.EquipmentService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/admin/equipment")
@RequiredArgsConstructor
public class AdminEquipmentController {

    private final EquipmentService equipmentService;

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<EquipmentResponse> updateEquipment(
            @PathVariable Long id, @Valid @RequestBody EquipmentRequest request) {
        return ResponseEntity.ok(equipmentService.updateEquipment(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteEquipment(@PathVariable Long id) {
        equipmentService.deleteEquipment(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/deactivate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<EquipmentResponse> deactivateEquipment(@PathVariable Long id) {
        return ResponseEntity.ok(equipmentService.deactivateEquipment(id));
    }

    @PatchMapping("/{id}/activate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<EquipmentResponse> activateEquipment(@PathVariable Long id) {
        return ResponseEntity.ok(equipmentService.activateEquipment(id));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<EquipmentResponse>> getAllEquipment(
            @RequestParam(value = "q", required = false) String query) {
        return ResponseEntity.ok(equipmentService.searchEquipment(query));
    }

    @GetMapping("/inactive")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<EquipmentResponse>> getInactiveEquipment(
            @RequestParam(value = "q", required = false) String query) {
        return ResponseEntity.ok(equipmentService.searchInactiveEquipment(query));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<EquipmentResponse> getEquipmentById(@PathVariable Long id) {
        return ResponseEntity.ok(equipmentService.getEquipmentById(id));
    }

    @PostMapping("/upload-image")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> uploadImage(@RequestParam("file") MultipartFile file) {
        String imageUrl = equipmentService.uploadEquipmentImage(file);
        return ResponseEntity.ok(imageUrl);
    }
}
