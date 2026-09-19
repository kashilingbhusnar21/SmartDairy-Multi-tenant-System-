package com.smartdairy.controller;

import com.smartdairy.dto.DoctorRatingRequest;
import com.smartdairy.dto.DoctorRatingResponse;
import com.smartdairy.service.DoctorRatingService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/doctor-ratings")
@RequiredArgsConstructor
public class DoctorRatingController {

    private final DoctorRatingService doctorRatingService;

    @PostMapping("/doctor/{doctorId}")
    @PreAuthorize("hasRole('FARMER')")
    public ResponseEntity<DoctorRatingResponse> createRating(
            @PathVariable Long doctorId,
            @Valid @RequestBody DoctorRatingRequest request) {
        DoctorRatingResponse response = doctorRatingService.createRating(doctorId, request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('FARMER')")
    public ResponseEntity<DoctorRatingResponse> updateRating(
            @PathVariable Long id,
            @Valid @RequestBody DoctorRatingRequest request) {
        return ResponseEntity.ok(doctorRatingService.updateRating(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('FARMER')")
    public ResponseEntity<Void> deleteRating(@PathVariable Long id) {
        doctorRatingService.deleteRating(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<DoctorRatingResponse> getRatingById(@PathVariable Long id) {
        return ResponseEntity.ok(doctorRatingService.getRatingById(id));
    }

    @GetMapping("/doctor/{doctorId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<DoctorRatingResponse>> getRatingsByDoctor(@PathVariable Long doctorId) {
        return ResponseEntity.ok(doctorRatingService.getRatingsByDoctor(doctorId));
    }

    @GetMapping("/my-ratings")
    @PreAuthorize("hasRole('FARMER')")
    public ResponseEntity<List<DoctorRatingResponse>> getMyRatings() {
        return ResponseEntity.ok(doctorRatingService.getMyRatings());
    }

    @GetMapping("/my-rating/doctor/{doctorId}")
    @PreAuthorize("hasRole('FARMER')")
    public ResponseEntity<DoctorRatingResponse> getMyRatingForDoctor(@PathVariable Long doctorId) {
        return ResponseEntity.ok(doctorRatingService.getMyRatingForDoctor(doctorId));
    }
}
