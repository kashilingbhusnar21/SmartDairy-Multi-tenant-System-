package com.smartdairy.service.impl;

import com.smartdairy.dto.DoctorRequest;
import com.smartdairy.dto.DoctorResponse;
import com.smartdairy.entity.Doctor;
import com.smartdairy.entity.Farmer;
import com.smartdairy.entity.User;
import com.smartdairy.exception.ResourceNotFoundException;
import com.smartdairy.repository.DoctorRepository;
import com.smartdairy.repository.DoctorRatingRepository;
import com.smartdairy.repository.FarmerRepository;
import com.smartdairy.service.DoctorService;
import com.smartdairy.service.UserService;
import com.smartdairy.security.FarmerSecurityService;
import com.smartdairy.security.FarmerUserDetails;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class DoctorServiceImpl implements DoctorService {

    private final DoctorRepository doctorRepository;
    private final DoctorRatingRepository doctorRatingRepository;
    private final UserService userService;
    private final FarmerSecurityService farmerSecurityService;
    private final FarmerRepository farmerRepository;

    @Override
    @Transactional
    public DoctorResponse createDoctor(DoctorRequest request) {
        User admin = userService.getLoggedInUser();

        if (doctorRepository.existsByAdminAndMobileNumber(admin, request.getMobileNumber())) {
            throw new IllegalArgumentException("Doctor with this mobile number already exists");
        }

        Doctor doctor = mapToEntity(new Doctor(), request);
        doctor.setAdmin(admin);
        doctor.setActive(true);
        doctor = doctorRepository.save(doctor);

        return mapToResponse(doctor);
    }

    @Override
    @Transactional
    public DoctorResponse updateDoctor(Long id, DoctorRequest request) {
        User admin = userService.getLoggedInUser();
        Doctor existing = doctorRepository.findByIdAndAdmin(id, admin)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with id: " + id));

        if (!existing.getMobileNumber().equals(request.getMobileNumber()) 
                && doctorRepository.existsByAdminAndMobileNumber(admin, request.getMobileNumber())) {
            throw new IllegalArgumentException("Doctor with this mobile number already exists");
        }

        existing = mapToEntity(existing, request);
        existing = doctorRepository.save(existing);
        return mapToResponse(existing);
    }

    @Override
    @Transactional
    public void deleteDoctor(Long id) {
        User admin = userService.getLoggedInUser();
        Doctor existing = doctorRepository.findByIdAndAdmin(id, admin)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with id: " + id));
        doctorRepository.delete(existing);
    }

    @Override
    @Transactional(readOnly = true)
    public DoctorResponse getDoctorById(Long id) {
        User admin = getAdminFromContext();
        Doctor doctor = doctorRepository.findByIdAndAdmin(id, admin)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with id: " + id));
        return mapToResponse(doctor);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DoctorResponse> getAllDoctors() {
        User admin = getAdminFromContext();
        return doctorRepository.findByAdminOrderByFullNameAsc(admin).stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<DoctorResponse> searchDoctors(String query) {
        if (query == null || query.isBlank()) {
            return getAllDoctors();
        }

        User admin = getAdminFromContext();
        String trimmed = query.trim();

        if (trimmed.matches("\\d+")) {
            Optional<Doctor> exactMatch = doctorRepository.findByIdAndAdmin(Long.parseLong(trimmed), admin);
            if (exactMatch.isPresent()) {
                return List.of(mapToResponse(exactMatch.get()));
            }
        }

        return doctorRepository.searchByAdmin(admin, trimmed).stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional
    public DoctorResponse deactivateDoctor(Long id) {
        User admin = userService.getLoggedInUser();
        Doctor existing = doctorRepository.findByIdAndAdmin(id, admin)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with id: " + id));
        existing.setActive(false);
        existing = doctorRepository.save(existing);
        return mapToResponse(existing);
    }

    @Override
    @Transactional
    public DoctorResponse activateDoctor(Long id) {
        User admin = userService.getLoggedInUser();
        Doctor existing = doctorRepository.findByIdAndAdmin(id, admin)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with id: " + id));
        existing.setActive(true);
        existing = doctorRepository.save(existing);
        return mapToResponse(existing);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DoctorResponse> getInactiveDoctors() {
        User admin = userService.getLoggedInUser();
        return doctorRepository.findByAdminAndActiveOrderByFullNameAsc(admin, false).stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<DoctorResponse> searchInactiveDoctors(String query) {
        if (query == null || query.isBlank()) {
            return getInactiveDoctors();
        }

        User admin = userService.getLoggedInUser();
        String trimmed = query.trim();
        return doctorRepository.searchByAdminAndActive(admin, false, trimmed).stream()
                .map(this::mapToResponse)
                .toList();
    }

    private Doctor mapToEntity(Doctor doctor, DoctorRequest request) {
        doctor.setFullName(request.getFullName());
        doctor.setMobileNumber(request.getMobileNumber());
        doctor.setSpecialization(request.getSpecialization());
        doctor.setClinicAddress(request.getClinicAddress());
        return doctor;
    }

    private DoctorResponse mapToResponse(Doctor doctor) {
        Double averageRating = doctorRatingRepository.getAverageRatingByDoctor(doctor);
        Long totalRatings = doctorRatingRepository.countByDoctor(doctor);

        return DoctorResponse.builder()
                .id(doctor.getId())
                .fullName(doctor.getFullName())
                .mobileNumber(doctor.getMobileNumber())
                .specialization(doctor.getSpecialization())
                .clinicAddress(doctor.getClinicAddress())
                .active(doctor.getActive())
                .averageRating(averageRating != null ? averageRating : 0.0)
                .totalRatings(totalRatings != null ? totalRatings.intValue() : 0)
                .build();
    }

    private User getAdminFromContext() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        if (principal instanceof FarmerUserDetails) {
            FarmerUserDetails farmerUserDetails = (FarmerUserDetails) principal;
            Long farmerId = farmerUserDetails.getFarmerId();
            Long adminId = farmerUserDetails.getAdminId();

            Farmer farmer = farmerRepository.findByIdAndAdminIdWithAdmin(farmerId, adminId)
                    .orElseThrow(() -> new ResourceNotFoundException("Farmer not found"));
            return farmer.getAdmin();
        }

        return userService.getLoggedInUser();
    }
}
