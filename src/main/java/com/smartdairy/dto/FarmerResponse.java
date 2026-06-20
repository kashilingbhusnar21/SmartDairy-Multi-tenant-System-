package com.smartdairy.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class FarmerResponse {
    private Long id;
    private String fullName;
    private String mobileNumber;
    private String village;
    private String address;
    private String aadhaarNumber;
    private String bankAccountNumber;
    private String ifscCode;
}
