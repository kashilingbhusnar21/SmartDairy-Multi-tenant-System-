package com.smartdairy.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class FeedChartPointResponse {
    private LocalDate date;
    private BigDecimal amount;
}
