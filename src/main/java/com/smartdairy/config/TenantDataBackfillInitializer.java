package com.smartdairy.config;

import com.smartdairy.service.TenantDataBackfillService;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;

@Configuration
@RequiredArgsConstructor
public class TenantDataBackfillInitializer {

    private final TenantDataBackfillService tenantDataBackfillService;

    @Bean
    @Order(5)
    CommandLineRunner backfillTenantOwnership() {
        return args -> tenantDataBackfillService.backfill();
    }
}
