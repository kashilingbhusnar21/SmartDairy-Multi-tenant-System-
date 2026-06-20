package com.smartdairy.controller;

import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/secure")
public class SecureController {

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> adminApi(Authentication authentication) {
        return ResponseEntity.ok(Map.of(
                "message", "Admin secure API accessed successfully",
                "user", authentication.getName()
        ));
    }

    @GetMapping("/farmer")
    @PreAuthorize("hasAnyRole('FARMER','ADMIN')")
    public ResponseEntity<Map<String, String>> farmerApi(Authentication authentication) {
        return ResponseEntity.ok(Map.of(
                "message", "Farmer secure API accessed successfully",
                "user", authentication.getName()
        ));
    }
}
