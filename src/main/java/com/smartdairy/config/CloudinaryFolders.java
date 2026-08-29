package com.smartdairy.config;

/**
 * Centralized Cloudinary folder constants for organized file storage.
 * All PDF uploads should use these predefined folder paths.
 */
public final class CloudinaryFolders {

    private CloudinaryFolders() {
        // Utility class - prevent instantiation
    }

    public static final String PAYMENT_RECEIPTS = "smart-dairy/payment-receipts";
    public static final String FARMER_BILLS = "smart-dairy/farmer-bills";
    public static final String REPORTS = "smart-dairy/reports";
    public static final String FINANCIAL = "smart-dairy/financial";
}
