package com.smartdairy.service;

import com.smartdairy.dto.FarmerRequest;
import com.smartdairy.dto.FarmerResponse;
import java.util.List;

public interface FarmerService {

    FarmerResponse createFarmer(FarmerRequest request);

    FarmerResponse updateFarmer(Long id, FarmerRequest request);

    void deleteFarmer(Long id);

    FarmerResponse getFarmerById(Long id);

    FarmerResponse lookupFarmerById(Long id);

    List<FarmerResponse> getAllFarmers();

    List<FarmerResponse> searchFarmers(String query);
}
