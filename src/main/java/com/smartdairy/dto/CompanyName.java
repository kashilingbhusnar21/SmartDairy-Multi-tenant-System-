package com.smartdairy.dto;

public enum CompanyName {
    AMUL,
    NANDINI,
    GODREJ_AGROVET,
    KMF,
    SKM_FEEDS,
    SUGUNA_FEEDS,
    ANF_FEEDS,
    CP_FEEDS,
    LOCAL;

    public static boolean isValid(String value) {
        if (value == null || value.trim().isEmpty()) {
            return false;
        }
        for (CompanyName company : CompanyName.values()) {
            if (company.name().equals(value.trim().toUpperCase())) {
                return true;
            }
        }
        return false;
    }
}
