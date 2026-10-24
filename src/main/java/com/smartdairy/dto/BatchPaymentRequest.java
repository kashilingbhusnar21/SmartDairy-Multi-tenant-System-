package com.smartdairy.dto;

import com.smartdairy.entity.MilkCollection.Shift;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BatchPaymentRequest {

    @NotNull(message = "Date is required")
    private LocalDate date;

    private Shift shift; // Optional: MORNING, EVENING, or null for ALL
}
