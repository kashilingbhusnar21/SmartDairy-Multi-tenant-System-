package com.smartdairy.dto;

public enum FeedType {
    CATTLE_FEED,
    SILAGE,
    GREEN_FODDER,
    DRY_FODDER,
    MINERAL_MIX,
    CONCENTRATE_FEED,
    CALF_STARTER,
    PROTEIN_SUPPLEMENT;

    public static boolean isValid(String value) {
        if (value == null || value.trim().isEmpty()) {
            return false;
        }
        for (FeedType type : FeedType.values()) {
            if (type.name().equals(value.trim().toUpperCase())) {
                return true;
            }
        }
        return false;
    }
}
