package com.smartdairy.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI smartDairyOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Smart Dairy API")
                        .description("REST API documentation for Smart Dairy")
                        .version("v1.0.0")
                        .contact(new Contact().name("Smart Dairy Team").email("team@smartdairy.local"))
                        .license(new License().name("MIT")));
    }
}
