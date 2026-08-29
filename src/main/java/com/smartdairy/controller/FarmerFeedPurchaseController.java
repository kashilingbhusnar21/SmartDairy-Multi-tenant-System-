package com.smartdairy.controller;

import com.smartdairy.dto.FeedPurchaseResponse;
import com.smartdairy.entity.Farmer;
import com.smartdairy.repository.FeedPurchaseRepository;
import com.smartdairy.security.FarmerSecurityService;
import com.smartdairy.service.FeedPurchaseService;
import java.time.LocalDate;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/farmer/feed-purchases")
@RequiredArgsConstructor
@PreAuthorize("hasRole('FARMER')")
public class FarmerFeedPurchaseController {

    private final FarmerSecurityService farmerSecurityService;
    private final FeedPurchaseRepository feedPurchaseRepository;
    private final FeedPurchaseService feedPurchaseService;

    @GetMapping
    public ResponseEntity<List<FeedPurchaseResponse>> getMyFeedPurchases(
            @RequestParam(value = "from", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(value = "to", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        Farmer farmer = farmerSecurityService.getLoggedInFarmer();
        List<FeedPurchaseResponse> purchases;
        
        if (from != null && to != null) {
            purchases = feedPurchaseRepository.findByAdminAndFarmer_IdAndFeedDateBetweenOrderByFeedDateDescCreatedAtDesc(
                    farmer.getAdmin(), farmer.getId(), from, to).stream()
                    .map(fp -> toResponse(fp, null))
                    .toList();
        } else {
            purchases = feedPurchaseRepository.findByAdminAndFarmer_IdOrderByFeedDateDescCreatedAtDesc(
                    farmer.getAdmin(), farmer.getId()).stream()
                    .map(fp -> toResponse(fp, null))
                    .toList();
        }
        
        return ResponseEntity.ok(purchases);
    }

    @GetMapping("/outstanding")
    public ResponseEntity<java.math.BigDecimal> getMyOutstandingBalance() {
        Farmer farmer = farmerSecurityService.getLoggedInFarmer();
        java.math.BigDecimal outstanding = feedPurchaseService.getOutstandingForAdminAndFarmer(
                farmer.getAdmin(), farmer.getId());
        return ResponseEntity.ok(outstanding);
    }

    private FeedPurchaseResponse toResponse(com.smartdairy.entity.FeedPurchase f, String smsNotification) {
        return FeedPurchaseResponse.builder()
                .id(f.getId())
                .farmerId(f.getFarmer().getId())
                .farmerName(f.getFarmer().getFullName())
                .feedDate(f.getFeedDate())
                .feedType(f.getFeedType())
                .feedCompanyName(f.getFeedCompanyName())
                .feedQuantity(f.getFeedQuantity())
                .unitType(f.getUnitType())
                .ratePerUnit(f.getRatePerUnit())
                .totalAmount(f.getTotalAmount())
                .remainingAmount(f.getRemainingAmount())
                .notes(f.getNotes())
                .settledPaymentId(f.getSettledInPayment() != null ? f.getSettledInPayment().getId() : null)
                .createdAt(f.getCreatedAt())
                .smsNotification(smsNotification)
                .build();
    }
}
