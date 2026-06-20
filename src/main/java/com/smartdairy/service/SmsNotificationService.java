package com.smartdairy.service;

import com.smartdairy.entity.FeedPurchase;

public interface SmsNotificationService {
    String sendFeedPurchaseNotification(FeedPurchase purchase);
}
