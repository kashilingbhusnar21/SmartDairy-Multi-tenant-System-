package com.smartdairy.dto;

import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DoctorResponse {

    private Long id;
    private String fullName;
    private String mobileNumber;
    private String specialization;
    private String clinicAddress;
    private Boolean active;
    private Double averageRating;
    private Integer totalRatings;
}
