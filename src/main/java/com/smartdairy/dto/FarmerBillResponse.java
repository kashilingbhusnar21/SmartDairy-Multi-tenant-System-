package com.smartdairy.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class FarmerBillResponse {
    private String invoiceNumber;
    private LocalDate from;
    private LocalDate to;
    private Long farmerId;
    private String farmerName;

    private String dairyName;
    private String ownerName;
    private String dairyAddress;
    private String contactNumber;
    private String dairyLogo;

    private List<FarmerBillLineItemResponse> items;

    private BigDecimal totalMilkQuantity;
    private BigDecimal averageFat;
    private BigDecimal averageSnf;
    private BigDecimal averageRate;
    private BigDecimal totalAmount;

    private BigDecimal feedDeduction;
    private BigDecimal advancePayment;
    private BigDecimal loanAmount;
    private BigDecimal otherDeductions;

    //private BigDecimal finalPayableAmount;
    private BigDecimal remainingBalance;

}
