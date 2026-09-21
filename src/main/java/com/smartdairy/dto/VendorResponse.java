package com.smartdairy.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VendorResponse {

    private Long id;
    private String name;
    private String phone;
    private String shopAddress;
    private Boolean active;
    private Integer equipmentCount;
}
