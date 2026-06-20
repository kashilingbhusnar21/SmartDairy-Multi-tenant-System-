package com.smartdairy.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class HomeResponse {
    private String title;
    private String subtitle;
    private String description;
}
