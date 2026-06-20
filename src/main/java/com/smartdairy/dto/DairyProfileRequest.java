package com.smartdairy.dto;

import lombok.Data;

@Data
public class DairyProfileRequest {
    private String dairyName;
    private String ownerName;
    private String contactNumber;
    private String email;
    private String dairyAddress;
    private String dairyLogo;
}
