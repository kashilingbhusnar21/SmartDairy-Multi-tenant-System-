package com.smartdairy.dto;

import com.smartdairy.entity.Payment.PaymentMethod;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import lombok.Data;

@Data
public class MarkPaymentPaidRequest {

    @NotNull
    private LocalDate paymentDate;

    @NotNull
    private PaymentMethod paymentMethod;

    private String remarks;
}
