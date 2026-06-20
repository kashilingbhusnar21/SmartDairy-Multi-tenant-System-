package com.smartdairy.service.impl;

import com.smartdairy.entity.FeedPurchase;
import com.smartdairy.service.SmsNotificationService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class SmsNotificationServiceImpl implements SmsNotificationService {

    @Override
    public String sendFeedPurchaseNotification(FeedPurchase purchase) {
        String msg = "Feed purchase recorded for " + purchase.getFarmer().getFullName()
                + ": ₹ " + purchase.getTotalAmount() + " on " + purchase.getFeedDate();
        log.info("SMS (stub): {}", msg);
        return "SMS notification queued";
    }
}
