package com.smartdairy.controller;

import com.smartdairy.dto.MilkCollectionRequest;
import com.smartdairy.dto.MilkCollectionResponse;
import com.smartdairy.dto.MilkCollectionStatsResponse;
import com.smartdairy.service.MilkCollectionService;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/milk-collections")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN','FARMER')")
public class MilkCollectionController {

    private final MilkCollectionService milkCollectionService;

    @PostMapping
    public ResponseEntity<MilkCollectionResponse> create
            (@Valid @RequestBody MilkCollectionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(milkCollectionService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<MilkCollectionResponse> update(
            @PathVariable Long id, @Valid @RequestBody MilkCollectionRequest request) {
        return ResponseEntity.ok(milkCollectionService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        milkCollectionService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public ResponseEntity<List<MilkCollectionResponse>> getDaily(
            @RequestParam("date") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(milkCollectionService.getDaily(date));
    }

    @GetMapping("/{id}")
    public ResponseEntity<MilkCollectionResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(milkCollectionService.getById(id));
    }

    @GetMapping("/farmer/{farmerId}")
    public ResponseEntity<List<MilkCollectionResponse>> getByFarmer(@PathVariable Long farmerId) {
        return ResponseEntity.ok(milkCollectionService.getByFarmer(farmerId));
    }

    @GetMapping("/stats/daily")
    public ResponseEntity<MilkCollectionStatsResponse> getDailyStats(
            @RequestParam("date") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(milkCollectionService.getDailyStats(date));
    }
}

