package com.smartdairy.service.impl;

import com.smartdairy.dto.HomeResponse;
import com.smartdairy.service.HomeService;
import org.springframework.stereotype.Service;

@Service
public class HomeServiceImpl implements HomeService {

    @Override
    public HomeResponse getHomeContent() {
        return new HomeResponse(
                "Smart Dairy",
                "Fresh dairy management made easy",
                "Track inventory, users, and dairy operations with a modern full stack setup."
        );
    }
}
