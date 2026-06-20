package com.smartdairy.service;

import com.smartdairy.dto.DairyProfileRequest;
import com.smartdairy.dto.DairyProfileResponse;

public interface DairyProfileService {
    DairyProfileResponse getCurrentUserProfile();

    DairyProfileResponse upsertCurrentAdminProfile(DairyProfileRequest request);
}
