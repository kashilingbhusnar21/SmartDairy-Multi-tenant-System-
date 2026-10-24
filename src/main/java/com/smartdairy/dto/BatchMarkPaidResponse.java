package com.smartdairy.dto;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BatchMarkPaidResponse {

    private int totalProcessed;
    private int successCount;
    private int failedCount;
    private List<Long> paidPaymentIds;
    private List<String> details;
}
