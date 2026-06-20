package com.smartdairy.config;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;

@Configuration
@RequiredArgsConstructor
public class PricingSettingsInitializer {

    @Bean
    @Order(20)
    CommandLineRunner seedPricingSettings() {
        // Per-admin pricing is created on registration or first access via MilkPricingServiceImpl.
        return args -> {};
    }
}
