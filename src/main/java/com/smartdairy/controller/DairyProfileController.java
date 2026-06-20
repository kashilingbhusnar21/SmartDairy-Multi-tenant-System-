package com.smartdairy.controller;

import com.smartdairy.dto.DairyProfileRequest;
import com.smartdairy.dto.DairyProfileResponse;
import com.smartdairy.service.DairyProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dairy-profile")
@RequiredArgsConstructor
public class DairyProfileController {

    private final DairyProfileService dairyProfileService;

    @GetMapping("/me")
    @PreAuthorize("hasAnyRole('ADMIN','FARMER')")
    public ResponseEntity<DairyProfileResponse> getMyProfile() {
        return ResponseEntity.ok(dairyProfileService.getCurrentUserProfile());
    }

    @PutMapping("/me")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<DairyProfileResponse> upsertMyProfile(@RequestBody DairyProfileRequest request) {
        return ResponseEntity.ok(dairyProfileService.upsertCurrentAdminProfile(request));
    }
}
