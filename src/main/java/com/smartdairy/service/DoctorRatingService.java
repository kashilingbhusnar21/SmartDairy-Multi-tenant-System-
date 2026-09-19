package com.smartdairy.service;

import com.smartdairy.dto.DoctorRatingRequest;
import com.smartdairy.dto.DoctorRatingResponse;
import java.util.List;

public interface DoctorRatingService {

    DoctorRatingResponse createRating(Long doctorId, DoctorRatingRequest request);

    DoctorRatingResponse updateRating(Long ratingId, DoctorRatingRequest request);

    void deleteRating(Long ratingId);

    DoctorRatingResponse getRatingById(Long ratingId);

    List<DoctorRatingResponse> getRatingsByDoctor(Long doctorId);

    List<DoctorRatingResponse> getMyRatings();

    DoctorRatingResponse getMyRatingForDoctor(Long doctorId);
}
