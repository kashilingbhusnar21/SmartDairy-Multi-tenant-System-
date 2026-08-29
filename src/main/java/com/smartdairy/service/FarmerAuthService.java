package com.smartdairy.service;

import com.smartdairy.dto.FarmerLoginRequest;
import com.smartdairy.dto.FarmerLoginResponse;

public interface FarmerAuthService {
    FarmerLoginResponse login(FarmerLoginRequest request);
}
