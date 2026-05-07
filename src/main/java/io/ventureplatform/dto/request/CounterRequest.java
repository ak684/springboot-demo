package io.ventureplatform.dto.request;

import io.ventureplatform.entity.enums.CounterType;
import lombok.Data;

import javax.validation.constraints.AssertTrue;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class CounterRequest {
  @NotBlank
  private String name;
  
  @NotNull
  private CounterType type;
  
  @NotNull
  private BigDecimal startValue;
  
  // Optional fields based on counter type
  private BigDecimal targetValue;
  private LocalDateTime targetDate;
  private Double ratePerSecond;
  
  // Formatting options
  private Boolean showDecimals = false;
  private String numberFormat; // "US", "EU", or null for browser locale
  
  @AssertTrue(message = "TARGET_BASED requires targetValue and targetDate")
  public boolean isValidTargetBased() {
    if (type != CounterType.TARGET_BASED) {
      return true;
    }
    return targetValue != null && targetDate != null && targetDate.isAfter(LocalDateTime.now());
  }
  
  @AssertTrue(message = "RATE_BASED requires ratePerSecond")
  public boolean isValidRateBased() {
    if (type != CounterType.RATE_BASED) {
      return true;
    }
    return ratePerSecond != null && ratePerSecond > 0;
  }
}
