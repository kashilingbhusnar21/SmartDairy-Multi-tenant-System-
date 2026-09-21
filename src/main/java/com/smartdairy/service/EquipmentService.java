package com.smartdairy.service;

import com.smartdairy.dto.EquipmentRequest;
import com.smartdairy.dto.EquipmentResponse;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

public interface EquipmentService {

    EquipmentResponse createEquipment(EquipmentRequest request);

    EquipmentResponse updateEquipment(Long id, EquipmentRequest request);

    void deleteEquipment(Long id);

    EquipmentResponse getEquipmentById(Long id);

    List<EquipmentResponse> getAllEquipment();

    List<EquipmentResponse> getEquipmentByVendor(Long vendorId);

    List<EquipmentResponse> searchEquipment(String query);

    EquipmentResponse deactivateEquipment(Long id);

    EquipmentResponse activateEquipment(Long id);

    List<EquipmentResponse> getInactiveEquipment();

    List<EquipmentResponse> searchInactiveEquipment(String query);

    String uploadEquipmentImage(MultipartFile file);
}
