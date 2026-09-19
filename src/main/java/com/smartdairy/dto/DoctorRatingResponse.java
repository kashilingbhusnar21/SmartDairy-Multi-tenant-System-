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
public class DoctorRatingResponse {

    private Long id;
    private Long doctorId;
    private String doctorName;
    private Long farmerId;
    private String farmerName;
    private Integer rating;
    private String comment;
    private Instant createdAt;
}
