package io.ventureplatform.entity.enums;

/**
 * Enum representing different types of counters.
 */
public enum CounterType {
    TARGET_BASED,    // Uses startValue, targetValue, targetDate
    RATE_BASED,      // Uses startValue, ratePerSecond  
    MANUAL           // Uses startValue only (admin updates manually)
}
