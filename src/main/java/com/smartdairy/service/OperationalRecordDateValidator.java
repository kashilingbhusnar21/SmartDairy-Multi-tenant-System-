package com.smartdairy.service;

import java.time.LocalDate;
import org.springframework.stereotype.Component;

@Component
public class OperationalRecordDateValidator {

    public static final String MESSAGE = "Records can only be created for Today, Yesterday, or the previous two days.";

    public void validateCreateDate(LocalDate date) {
        LocalDate today = LocalDate.now();
        if (date == null || date.isAfter(today) || date.isBefore(today.minusDays(2))) {
            throw new IllegalArgumentException(MESSAGE);
        }
    }
}
