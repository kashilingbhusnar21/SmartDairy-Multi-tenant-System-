package com.smartdairy.util;

import java.math.BigDecimal;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class FinancialMathTest {

    @Test
    @DisplayName("zeroIfNull should return BigDecimal.ZERO when input is null")
    void zeroIfNull_WhenNull_ReturnsZero() {
        BigDecimal result = FinancialMath.zeroIfNull(null);

        assertThat(result).isNotNull();
        assertThat(result).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    @DisplayName("zeroIfNull should return same value when input is non-null")
    void zeroIfNull_WhenNonNull_ReturnsSameValue() {
        BigDecimal input = new BigDecimal("45.50");
        BigDecimal result = FinancialMath.zeroIfNull(input);

        assertThat(result).isSameAs(input);
        assertThat(result).isEqualByComparingTo(new BigDecimal("45.50"));
    }

    @Test
    @DisplayName("scale should return 0.00 with scale 2 when input is null")
    void scale_WhenNull_ReturnsZeroWithScaleTwo() {
        BigDecimal result = FinancialMath.scale(null);

        assertThat(result).isNotNull();
        assertThat(result.scale()).isEqualTo(2);
        assertThat(result).isEqualTo(new BigDecimal("0.00"));
    }

    @Test
    @DisplayName("scale should round HALF_UP to two decimal places when rounding up")
    void scale_WhenNeedsRoundingUp_RoundsHalfUp() {
        BigDecimal input = new BigDecimal("10.555");
        BigDecimal result = FinancialMath.scale(input);

        assertThat(result.scale()).isEqualTo(2);
        assertThat(result).isEqualTo(new BigDecimal("10.56"));
    }

    @Test
    @DisplayName("scale should round HALF_UP to two decimal places when rounding down")
    void scale_WhenNeedsRoundingDown_RoundsHalfUp() {
        BigDecimal input = new BigDecimal("10.554");
        BigDecimal result = FinancialMath.scale(input);

        assertThat(result.scale()).isEqualTo(2);
        assertThat(result).isEqualTo(new BigDecimal("10.55"));
    }

    @Test
    @DisplayName("scale should preserve exact value when already having two decimal places")
    void scale_WhenAlreadyTwoDecimals_PreservesValue() {
        BigDecimal input = new BigDecimal("250.75");
        BigDecimal result = FinancialMath.scale(input);

        assertThat(result.scale()).isEqualTo(2);
        assertThat(result).isEqualTo(new BigDecimal("250.75"));
    }

    @Test
    @DisplayName("scale should handle negative numbers correctly with HALF_UP rounding")
    void scale_WhenNegative_RoundsCorrectly() {
        BigDecimal input = new BigDecimal("-15.675");
        BigDecimal result = FinancialMath.scale(input);

        assertThat(result.scale()).isEqualTo(2);
        assertThat(result).isEqualTo(new BigDecimal("-15.68"));
    }

    @Test
    @DisplayName("totalPending should sum advance, loan, and other correctly with scale 2")
    void totalPending_WhenAllNonNull_ReturnsAccurateSum() {
        BigDecimal advance = new BigDecimal("100.50");
        BigDecimal loan = new BigDecimal("250.25");
        BigDecimal other = new BigDecimal("49.25");

        BigDecimal total = FinancialMath.totalPending(advance, loan, other);

        assertThat(total.scale()).isEqualTo(2);
        assertThat(total).isEqualTo(new BigDecimal("400.00"));
    }

    @Test
    @DisplayName("totalPending should treat null parameters as zero")
    void totalPending_WhenSomeNull_TreatsNullAsZero() {
        BigDecimal advance = null;
        BigDecimal loan = new BigDecimal("150.00");
        BigDecimal other = null;

        BigDecimal total = FinancialMath.totalPending(advance, loan, other);

        assertThat(total.scale()).isEqualTo(2);
        assertThat(total).isEqualTo(new BigDecimal("150.00"));
    }

    @Test
    @DisplayName("totalPending should return 0.00 when all parameters are null")
    void totalPending_WhenAllNull_ReturnsZeroScaled() {
        BigDecimal total = FinancialMath.totalPending(null, null, null);

        assertThat(total.scale()).isEqualTo(2);
        assertThat(total).isEqualTo(new BigDecimal("0.00"));
    }
}
