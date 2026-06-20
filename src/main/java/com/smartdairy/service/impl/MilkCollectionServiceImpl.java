package com.smartdairy.service.impl;

import com.smartdairy.dto.MilkCollectionRequest;
import com.smartdairy.dto.MilkCollectionResponse;
import com.smartdairy.dto.MilkCollectionStatsResponse;
import com.smartdairy.entity.Farmer;
import com.smartdairy.entity.MilkCollection;
import com.smartdairy.entity.User;
import com.smartdairy.exception.ResourceNotFoundException;
import com.smartdairy.repository.FarmerRepository;
import com.smartdairy.repository.MilkCollectionRepository;
import com.smartdairy.service.MilkCollectionService;
import com.smartdairy.service.MilkPricingService;
import com.smartdairy.service.UserService;
import java.time.LocalDate;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class MilkCollectionServiceImpl implements MilkCollectionService {

    private final MilkCollectionRepository milkCollectionRepository;
    private final FarmerRepository farmerRepository;
    private final MilkPricingService milkPricingService;
    private final SmsService smsService;
    private final UserService userService;

    @Override
    @Transactional
    public MilkCollectionResponse create(MilkCollectionRequest request) {
        User admin = userService.getLoggedInUser();
        Farmer farmer = findFarmerForAdmin(request.getFarmerId(), admin);

        MilkCollection entity = new MilkCollection();
        entity.setAdmin(admin);
        applyRequest(entity, farmer, request);
        calculateRateAndTotal(entity);
        entity = milkCollectionRepository.save(entity);

        try {
            smsService.sendSms(
                    farmer.getMobileNumber(),
                    "Dear " + farmer.getFullName()
                            + "\nMilk Entry Saved"
                            + "\nQty: " + entity.getQuantityLiters() + " L"
                            + "\nFat: " + entity.getFatPercentage() + "%"
                            + "\nSNF: " + entity.getSnfPercentage() + "%"
                            + "\nRate: Rs." + entity.getRatePerLiter() + "/L"
                            + "\nTotal: Rs." + entity.getTotalAmount()
                            + "\nThank you for using Smart Dairy.");
        } catch (Exception e) {
            System.out.println("SMS failed " + e.getMessage());
        }

        return toResponse(entity);
    }

    @Override
    @Transactional
    public MilkCollectionResponse update(Long id, MilkCollectionRequest request) {
        User admin = userService.getLoggedInUser();
        MilkCollection existing = findCollectionForAdmin(id, admin);
        Farmer farmer = findFarmerForAdmin(request.getFarmerId(), admin);

        applyRequest(existing, farmer, request);
        calculateRateAndTotal(existing);
        existing = milkCollectionRepository.save(existing);
        return toResponse(existing);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        User admin = userService.getLoggedInUser();
        MilkCollection existing = findCollectionForAdmin(id, admin);
        milkCollectionRepository.delete(existing);
    }

    @Override
    @Transactional(readOnly = true)
    public List<MilkCollectionResponse> getDaily(LocalDate date) {
        User admin = userService.getLoggedInUser();
        return milkCollectionRepository.findByAdminAndDateOrderByFarmer_FullNameAscShiftAsc(admin, date).stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public MilkCollectionResponse getById(Long id) {
        User admin = userService.getLoggedInUser();
        return toResponse(findCollectionForAdmin(id, admin));
    }

    @Override
    @Transactional(readOnly = true)
    public List<MilkCollectionResponse> getByFarmer(Long farmerId) {
        User admin = userService.getLoggedInUser();
        findFarmerForAdmin(farmerId, admin);
        return milkCollectionRepository.findByAdminAndFarmer_Id(admin, farmerId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public MilkCollectionStatsResponse getDailyStats(LocalDate date) {
        User admin = userService.getLoggedInUser();
        return MilkCollectionStatsResponse.builder()
                .entriesCount(milkCollectionRepository.countByAdminAndDate(admin, date))
                .totalQuantityLiters(milkCollectionRepository.sumQuantityByAdminAndDate(admin, date))
                .totalAmount(milkCollectionRepository.sumTotalAmountByAdminAndDate(admin, date))
                .build();
    }

    private Farmer findFarmerForAdmin(Long id, User admin) {
        return farmerRepository.findByIdAndAdmin(id, admin)
                .orElseThrow(() -> new ResourceNotFoundException("Farmer not found with id: " + id));
    }

    private MilkCollection findCollectionForAdmin(Long id, User admin) {
        return milkCollectionRepository.findByAdminAndId(admin, id)
                .orElseThrow(() -> new ResourceNotFoundException("Milk collection not found with id: " + id));
    }

    private void applyRequest(MilkCollection entity, Farmer farmer, MilkCollectionRequest request) {
        entity.setFarmer(farmer);
        entity.setDate(request.getDate());
        entity.setShift(request.getShift());
        entity.setQuantityLiters(request.getQuantityLiters());
        entity.setFatPercentage(request.getFatPercentage());
        entity.setSnfPercentage(request.getSnfPercentage());
    }

    private void calculateRateAndTotal(MilkCollection entity) {
        var preview = milkPricingService.compute(
                entity.getFatPercentage(),
                entity.getSnfPercentage(),
                entity.getQuantityLiters(),
                milkPricingService.getCurrentEntity());
        entity.setRatePerLiter(preview.getRatePerLiter());
        entity.setTotalAmount(preview.getTotalAmount());
    }

    private MilkCollectionResponse toResponse(MilkCollection entity) {
        return MilkCollectionResponse.builder()
                .id(entity.getId())
                .farmerId(entity.getFarmer().getId())
                .farmerName(entity.getFarmer().getFullName())
                .date(entity.getDate())
                .shift(entity.getShift())
                .quantityLiters(entity.getQuantityLiters())
                .fatPercentage(entity.getFatPercentage())
                .snfPercentage(entity.getSnfPercentage())
                .ratePerLiter(entity.getRatePerLiter())
                .totalAmount(entity.getTotalAmount())
                .build();
    }
}
