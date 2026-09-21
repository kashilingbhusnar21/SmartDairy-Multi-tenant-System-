package com.smartdairy.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EquipmentResponse {

    private Long id;
    private String name;
    private String companyName;
    private BigDecimal price;
    private String description;
    private String imageUrl;
    private Long vendorId;
    private String vendorName;
    private String vendorPhone;
    private String vendorShopAddress;
    private Boolean active;
}
