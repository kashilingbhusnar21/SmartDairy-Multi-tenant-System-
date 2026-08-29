package com.smartdairy.controller;

import com.smartdairy.dto.FarmerLoginRequest;
import com.smartdairy.dto.FarmerLoginResponse;
import com.smartdairy.service.FarmerAuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/farmer/auth")
@RequiredArgsConstructor
public class FarmerAuthController {

    private final FarmerAuthService farmerAuthService;

    @PostMapping("/login")
    public ResponseEntity<FarmerLoginResponse> login(@Valid @RequestBody FarmerLoginRequest request) {
        FarmerLoginResponse response = farmerAuthService.login(request);
        return ResponseEntity.ok(response);
    }
}
