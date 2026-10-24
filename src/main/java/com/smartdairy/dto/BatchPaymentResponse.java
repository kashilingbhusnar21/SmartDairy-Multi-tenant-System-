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
public class BatchPaymentResponse {

    private int totalProcessed;
    private int successCount;
    private int skippedCount;
    private int failedCount;
    private List<Long> createdPaymentIds;
    private List<String> details;
}
