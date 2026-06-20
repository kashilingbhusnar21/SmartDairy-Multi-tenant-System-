package com.smartdairy.service.impl;

import com.smartdairy.entity.Farmer;
import com.smartdairy.entity.FeedPurchase;
import com.smartdairy.entity.MilkCollection;
import com.smartdairy.entity.Payment;
import com.smartdairy.entity.PricingSettings;
import com.smartdairy.entity.User;
import com.smartdairy.repository.FarmerRepository;
import com.smartdairy.repository.FeedPurchaseRepository;
import com.smartdairy.repository.MilkCollectionRepository;
import com.smartdairy.repository.PaymentRepository;
import com.smartdairy.repository.PricingSettingsRepository;
import com.smartdairy.repository.UserRepository;
import com.smartdairy.service.TenantDataBackfillService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class TenantDataBackfillServiceImpl implements TenantDataBackfillService {

    private final UserRepository userRepository;
    private final FarmerRepository farmerRepository;
    private final MilkCollectionRepository milkCollectionRepository;
    private final PaymentRepository paymentRepository;
    private final FeedPurchaseRepository feedPurchaseRepository;
    private final PricingSettingsRepository pricingSettingsRepository;

    @Override
    @Transactional
    public void backfill() {
        List<User> admins = userRepository.findAllWithRole().stream()
                .filter(user -> user.getRole() != null && "ADMIN".equalsIgnoreCase(user.getRole().getName()))
                .toList();
        if (admins.isEmpty()) {
            log.warn("Tenant backfill skipped: no ADMIN users found");
            return;
        }

        User fallbackAdmin = admins.get(0);
        int updated = 0;

        for (Farmer farmer : farmerRepository.findAll()) {
            if (farmer.getAdmin() == null) {
                farmer.setAdmin(fallbackAdmin);
                farmerRepository.save(farmer);
                updated++;
            }
        }

        for (MilkCollection collection : milkCollectionRepository.findAllWithFarmer()) {
            if (collection.getAdmin() == null) {
                User owner = collection.getFarmer().getAdmin() != null
                        ? collection.getFarmer().getAdmin()
                        : fallbackAdmin;
                collection.setAdmin(owner);
                milkCollectionRepository.save(collection);
                updated++;
            }
        }

        for (Payment payment : paymentRepository.findAllWithFarmer()) {
            if (payment.getAdmin() == null) {
                User owner = payment.getFarmer().getAdmin() != null
                        ? payment.getFarmer().getAdmin()
                        : fallbackAdmin;
                payment.setAdmin(owner);
                paymentRepository.save(payment);
                updated++;
            }
        }

        for (FeedPurchase purchase : feedPurchaseRepository.findAllWithFarmer()) {
            if (purchase.getAdmin() == null) {
                User owner = purchase.getFarmer().getAdmin() != null
                        ? purchase.getFarmer().getAdmin()
                        : fallbackAdmin;
                purchase.setAdmin(owner);
                feedPurchaseRepository.save(purchase);
                updated++;
            }
        }

        List<PricingSettings> legacyPricing = pricingSettingsRepository.findAllWithoutAdmin();
        if (!legacyPricing.isEmpty()) {
            PricingSettings template = legacyPricing.get(0);
            for (User admin : admins) {
                if (pricingSettingsRepository.findByAdmin(admin).isEmpty()) {
                    pricingSettingsRepository.save(PricingSettings.builder()
                            .admin(admin)
                            .defaultFat(template.getDefaultFat())
                            .defaultSnf(template.getDefaultSnf())
                            .baseRatePerLiter(template.getBaseRatePerLiter())
                            .fatBonusPerPoint(template.getFatBonusPerPoint())
                            .snfBonusPerPoint(template.getSnfBonusPerPoint())
                            .updatedAt(template.getUpdatedAt())
                            .build());
                    updated++;
                }
            }
            pricingSettingsRepository.deleteAll(legacyPricing);
        }

        for (User admin : admins) {
            if (pricingSettingsRepository.findByAdmin(admin).isEmpty()) {
                pricingSettingsRepository.save(MilkPricingServiceImpl.createDefaultForAdmin(admin));
                updated++;
            }
        }

        if (updated > 0) {
            log.info("Tenant backfill completed: {} record(s) updated", updated);
        }
    }
}
