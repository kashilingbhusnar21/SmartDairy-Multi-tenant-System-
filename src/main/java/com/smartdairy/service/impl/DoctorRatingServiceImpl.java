package com.smartdairy.service.impl;

import com.smartdairy.dto.DoctorRatingRequest;
import com.smartdairy.dto.DoctorRatingResponse;
import com.smartdairy.entity.Doctor;
import com.smartdairy.entity.DoctorRating;
import com.smartdairy.entity.Farmer;
import com.smartdairy.entity.User;
import com.smartdairy.exception.ResourceNotFoundException;
import com.smartdairy.repository.DoctorRatingRepository;
import com.smartdairy.repository.DoctorRepository;
import com.smartdairy.repository.FarmerRepository;
import com.smartdairy.service.DoctorRatingService;
import com.smartdairy.service.UserService;
import com.smartdairy.security.FarmerSecurityService;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class DoctorRatingServiceImpl implements DoctorRatingService {

    private final DoctorRatingRepository doctorRatingRepository;
    private final DoctorRepository doctorRepository;
    private final FarmerRepository farmerRepository;
    private final UserService userService;
    private final FarmerSecurityService farmerSecurityService;

    @Override
    @Transactional
    public DoctorRatingResponse createRating(Long doctorId, DoctorRatingRequest request) {
        Farmer farmer = farmerSecurityService.getLoggedInFarmer();
        
        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with id: " + doctorId));

        if (doctorRatingRepository.findByDoctorAndFarmer(doctor, farmer).isPresent()) {
            throw new IllegalArgumentException("You have already rated this doctor");
        }

        DoctorRating rating = DoctorRating.builder()
                .doctor(doctor)
                .farmer(farmer)
                .rating(request.getRating())
                .comment(request.getComment())
                .createdAt(Instant.now())
                .build();

        rating = doctorRatingRepository.save(rating);
        return mapToResponse(rating);
    }

    @Override
    @Transactional
    public DoctorRatingResponse updateRating(Long ratingId, DoctorRatingRequest request) {
        Farmer farmer = farmerSecurityService.getLoggedInFarmer();
        
        DoctorRating existing = doctorRatingRepository.findById(ratingId)
                .orElseThrow(() -> new ResourceNotFoundException("Rating not found with id: " + ratingId));

        if (!existing.getFarmer().getId().equals(farmer.getId())) {
            throw new IllegalArgumentException("You can only update your own ratings");
        }

        existing.setRating(request.getRating());
        existing.setComment(request.getComment());
        existing = doctorRatingRepository.save(existing);
        return mapToResponse(existing);
    }

    @Override
    @Transactional
    public void deleteRating(Long ratingId) {
        Farmer farmer = farmerSecurityService.getLoggedInFarmer();
        
        DoctorRating existing = doctorRatingRepository.findById(ratingId)
                .orElseThrow(() -> new ResourceNotFoundException("Rating not found with id: " + ratingId));

        if (!existing.getFarmer().getId().equals(farmer.getId())) {
            throw new IllegalArgumentException("You can only delete your own ratings");
        }

        doctorRatingRepository.delete(existing);
    }

    @Override
    @Transactional(readOnly = true)
    public DoctorRatingResponse getRatingById(Long ratingId) {
        User admin = userService.getLoggedInUser();
        DoctorRating rating = doctorRatingRepository.findById(ratingId)
                .orElseThrow(() -> new ResourceNotFoundException("Rating not found with id: " + ratingId));

        if (!rating.getDoctor().getAdmin().getId().equals(admin.getId())) {
            throw new ResourceNotFoundException("Rating not found with id: " + ratingId);
        }

        return mapToResponse(rating);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DoctorRatingResponse> getRatingsByDoctor(Long doctorId) {
        User admin = userService.getLoggedInUser();
        
        Doctor doctor = doctorRepository.findByIdAndAdminIdWithAdmin(doctorId, admin.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with id: " + doctorId));

        return doctorRatingRepository.findByDoctorIdAndAdminIdOrderByCreatedAtDesc(doctorId, admin.getId()).stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<DoctorRatingResponse> getMyRatings() {
        Farmer farmer = farmerSecurityService.getLoggedInFarmer();
        return doctorRatingRepository.findByFarmerOrderByCreatedAtDesc(farmer).stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public DoctorRatingResponse getMyRatingForDoctor(Long doctorId) {
        Farmer farmer = farmerSecurityService.getLoggedInFarmer();
        
        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with id: " + doctorId));

        Optional<DoctorRating> rating = doctorRatingRepository.findByDoctorAndFarmer(doctor, farmer);
        return rating.map(this::mapToResponse).orElse(null);
    }

    private DoctorRatingResponse mapToResponse(DoctorRating rating) {
        return DoctorRatingResponse.builder()
                .id(rating.getId())
                .doctorId(rating.getDoctor().getId())
                .doctorName(rating.getDoctor().getFullName())
                .farmerId(rating.getFarmer().getId())
                .farmerName(rating.getFarmer().getFullName())
                .rating(rating.getRating())
                .comment(rating.getComment())
                .createdAt(rating.getCreatedAt())
                .build();
    }
}
