package com.smartdairy.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FarmerLoginResponse {
    private String accessToken;
    private String tokenType;
    private Long farmerId;
    private String farmerName;
}
