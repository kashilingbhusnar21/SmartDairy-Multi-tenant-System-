package com.smartdairy.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DairyProfileResponse {
    private Long id;
    private String dairyName;
    private String ownerName;
    private String contactNumber;
    private String email;
    private String dairyAddress;
    private String dairyLogo;
    private String smsFooter;
}
