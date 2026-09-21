package com.smartdairy.service;

import com.smartdairy.dto.VendorRequest;
import com.smartdairy.dto.VendorResponse;
import java.util.List;

public interface VendorService {

    VendorResponse createVendor(VendorRequest request);

    VendorResponse updateVendor(Long id, VendorRequest request);

    void deleteVendor(Long id);

    VendorResponse getVendorById(Long id);

    List<VendorResponse> getAllVendors();

    List<VendorResponse> searchVendors(String query);

    VendorResponse deactivateVendor(Long id);

    VendorResponse activateVendor(Long id);

    List<VendorResponse> getInactiveVendors();

    List<VendorResponse> searchInactiveVendors(String query);
}
