package com.smartdairy.controller;

import com.smartdairy.dto.PaymentResponse;
import com.smartdairy.entity.Farmer;
import com.smartdairy.entity.Payment;
import com.smartdairy.repository.PaymentRepository;
import com.smartdairy.security.FarmerSecurityService;
import com.smartdairy.service.FeedPurchaseService;
import com.smartdairy.service.PaymentReceiptPdfService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/farmer/payments")
@RequiredArgsConstructor
@PreAuthorize("hasRole('FARMER')")
public class FarmerPaymentController {

    private final FarmerSecurityService farmerSecurityService;
    private final PaymentRepository paymentRepository;
    private final FeedPurchaseService feedPurchaseService;
    private final PaymentReceiptPdfService paymentReceiptPdfService;

    @GetMapping
    public ResponseEntity<List<PaymentResponse>> getMyPayments() {
        Farmer farmer = farmerSecurityService.getLoggedInFarmer();
        List<PaymentResponse> payments = paymentRepository
                .findByAdminAndFarmerIdWithDetailsOrderByCreatedAtDesc(
                        farmer.getAdmin(), farmer.getId()).stream()
                .map(payment -> toResponse(payment, farmer))
                .toList();
        return ResponseEntity.ok(payments);
    }

    @GetMapping("/{id}")
    public ResponseEntity<PaymentResponse> getPaymentById(@PathVariable Long id) {
        Farmer farmer = farmerSecurityService.getLoggedInFarmer();
        return paymentRepository.findByAdminAndIdWithDetails(farmer.getAdmin(), id)
                .filter(payment -> payment.getFarmer().getId().equals(farmer.getId()))
                .map(payment -> toResponse(payment, farmer))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/receipt")
    public ResponseEntity<byte[]> getPaymentReceipt(@PathVariable Long id) {
        Farmer farmer = farmerSecurityService.getLoggedInFarmer();
        Payment payment = paymentRepository.findByAdminAndIdWithDetails(farmer.getAdmin(), id)
                .filter(p -> p.getFarmer().getId().equals(farmer.getId()))
                .orElse(null);
        
        if (payment == null) {
            return ResponseEntity.notFound().build();
        }
        
        byte[] pdfBytes = paymentReceiptPdfService.buildReceipt(payment);
        return ResponseEntity.ok()
                .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, 
                        "attachment; filename=payment-receipt-" + id + ".pdf")
                .contentType(org.springframework.http.MediaType.APPLICATION_PDF)
                .body(pdfBytes);
    }

    private PaymentResponse toResponse(Payment p, Farmer loggedInFarmer) {
        return PaymentResponse.builder()
                .id(p.getId())
                .farmerId(p.getFarmer().getId())
                .farmerName(p.getFarmer().getFullName())
                .milkCollectionId(p.getMilkCollection().getId())
                .amount(p.getAmount())
                .grossAmount(p.getGrossAmount())
                .feedDeductionAmount(p.getFeedDeductionAmount())
                .farmerOutstandingFeedBalance(
                        feedPurchaseService.getOutstandingForAdminAndFarmer(
                                loggedInFarmer.getAdmin(), loggedInFarmer.getId()))
                .paymentDate(p.getPaymentDate())
                .status(p.getStatus())
                .paymentMethod(p.getPaymentMethod())
                .remarks(p.getRemarks())
                .createdAt(p.getCreatedAt())
                .build();
    }
}
