package com.smartdairy.service;

import com.smartdairy.dto.DoctorRequest;
import com.smartdairy.dto.DoctorResponse;
import java.util.List;

public interface DoctorService {

    DoctorResponse createDoctor(DoctorRequest request);

    DoctorResponse updateDoctor(Long id, DoctorRequest request);

    void deleteDoctor(Long id);

    DoctorResponse getDoctorById(Long id);

    List<DoctorResponse> getAllDoctors();

    List<DoctorResponse> searchDoctors(String query);

    DoctorResponse deactivateDoctor(Long id);

    DoctorResponse activateDoctor(Long id);

    List<DoctorResponse> getInactiveDoctors();

    List<DoctorResponse> searchInactiveDoctors(String query);
}
