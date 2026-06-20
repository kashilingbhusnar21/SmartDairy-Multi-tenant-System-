package com.smartdairy.controller;

import com.smartdairy.dto.HomeResponse;
import com.smartdairy.service.HomeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/home")
@RequiredArgsConstructor
public class HomeController {

    private final HomeService homeService;

    @GetMapping("/public")
    public ResponseEntity<HomeResponse> getPublicHome() {
        return ResponseEntity.ok(homeService.getHomeContent());
    }

    @GetMapping("/private")
    public ResponseEntity<String> getPrivateHome(Authentication authentication) {
        return ResponseEntity.ok("Welcome " + authentication.getName() + " to Smart Dairy private dashboard");
    }
}
