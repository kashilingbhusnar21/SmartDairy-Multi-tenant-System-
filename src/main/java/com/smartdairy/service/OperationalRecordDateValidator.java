package com.smartdairy.service;

import java.time.LocalDate;
import org.springframework.stereotype.Component;

@Component
public class OperationalRecordDateValidator {

    public static final String MESSAGE = "Records can only be created for Today or Yesterday (within 48 hours).";

    public void validateCreateDate(LocalDate date) {
        LocalDate today = LocalDate.now();
        if (date == null || date.isAfter(today) || date.isBefore(today.minusDays(1))) {
            throw new IllegalArgumentException(MESSAGE);
        }
    }
}
