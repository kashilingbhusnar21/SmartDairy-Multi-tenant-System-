package com.smartdairy.service;

import com.smartdairy.dto.MilkCollectionRequest;
import com.smartdairy.dto.MilkCollectionResponse;
import com.smartdairy.dto.MilkCollectionStatsResponse;
import java.time.LocalDate;
import java.util.List;

public interface MilkCollectionService {

    MilkCollectionResponse create(MilkCollectionRequest request);

    MilkCollectionResponse update(Long id, MilkCollectionRequest request);

    void delete(Long id);

    List<MilkCollectionResponse> getDaily(LocalDate date);

    MilkCollectionResponse getById(Long id);

    List<MilkCollectionResponse> getByFarmer(Long farmerId);

    MilkCollectionStatsResponse getDailyStats(LocalDate date);
}

