package com.smartdairy.service;

import java.time.LocalDate;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class OperationalRecordDateValidatorTest {

    private OperationalRecordDateValidator validator;

    @BeforeEach
    void setUp() {
        validator = new OperationalRecordDateValidator();
    }

    @Test
    @DisplayName("validateCreateDate should accept today's date")
    void validateCreateDate_WhenToday_DoesNotThrowException() {
        LocalDate today = LocalDate.now();

        assertThatCode(() -> validator.validateCreateDate(today))
                .doesNotThrowAnyException();
    }

    @Test
    @DisplayName("validateCreateDate should accept yesterday's date")
    void validateCreateDate_WhenYesterday_DoesNotThrowException() {
        LocalDate yesterday = LocalDate.now().minusDays(1);

        assertThatCode(() -> validator.validateCreateDate(yesterday))
                .doesNotThrowAnyException();
    }

    @Test
    @DisplayName("validateCreateDate should accept two days ago (window boundary)")
    void validateCreateDate_WhenTwoDaysAgo_DoesNotThrowException() {
        LocalDate twoDaysAgo = LocalDate.now().minusDays(2);

        assertThatCode(() -> validator.validateCreateDate(twoDaysAgo))
                .doesNotThrowAnyException();
    }

    @Test
    @DisplayName("validateCreateDate should reject three days ago with exact error message")
    void validateCreateDate_WhenThreeDaysAgo_ThrowsIllegalArgumentException() {
        LocalDate threeDaysAgo = LocalDate.now().minusDays(3);

        assertThatThrownBy(() -> validator.validateCreateDate(threeDaysAgo))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage(OperationalRecordDateValidator.MESSAGE);
    }

    @Test
    @DisplayName("validateCreateDate should reject past dates far outside allowable window")
    void validateCreateDate_WhenThirtyDaysAgo_ThrowsIllegalArgumentException() {
        LocalDate thirtyDaysAgo = LocalDate.now().minusDays(30);

        assertThatThrownBy(() -> validator.validateCreateDate(thirtyDaysAgo))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage(OperationalRecordDateValidator.MESSAGE);
    }

    @Test
    @DisplayName("validateCreateDate should reject tomorrow (future date)")
    void validateCreateDate_WhenTomorrow_ThrowsIllegalArgumentException() {
        LocalDate tomorrow = LocalDate.now().plusDays(1);

        assertThatThrownBy(() -> validator.validateCreateDate(tomorrow))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage(OperationalRecordDateValidator.MESSAGE);
    }

    @Test
    @DisplayName("validateCreateDate should reject far future date")
    void validateCreateDate_WhenFarFuture_ThrowsIllegalArgumentException() {
        LocalDate farFuture = LocalDate.now().plusYears(1);

        assertThatThrownBy(() -> validator.validateCreateDate(farFuture))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage(OperationalRecordDateValidator.MESSAGE);
    }

    @Test
    @DisplayName("validateCreateDate should reject null date")
    void validateCreateDate_WhenNull_ThrowsIllegalArgumentException() {
        assertThatThrownBy(() -> validator.validateCreateDate(null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage(OperationalRecordDateValidator.MESSAGE);
    }
}
