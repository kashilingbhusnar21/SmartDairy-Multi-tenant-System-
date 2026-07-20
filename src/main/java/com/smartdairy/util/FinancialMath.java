package com.smartdairy.util;

import java.math.BigDecimal;
import java.math.RoundingMode;

public final class FinancialMath {

    private FinancialMath() {
    }

    public static BigDecimal zeroIfNull(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    public static BigDecimal scale(BigDecimal value) {
        return zeroIfNull(value).setScale(2, RoundingMode.HALF_UP);
    }

    public static BigDecimal totalPending(BigDecimal advance, BigDecimal loan, BigDecimal other) {
        return scale(advance).add(scale(loan)).add(scale(other));
    }
}
