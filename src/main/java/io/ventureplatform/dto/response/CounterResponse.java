package io.ventureplatform.dto.response;

import io.ventureplatform.entity.enums.CounterType;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Date;

@Data
@Builder
public class CounterResponse {
  private String id;
  private String name;
  private CounterType type;
  private BigDecimal startValue;
  private BigDecimal targetValue;
  private LocalDateTime targetDate;
  private Double ratePerSecond;
  private Boolean showDecimals;
  private String numberFormat;
  private Boolean isActive;
  private BigDecimal currentValue;
  private String formattedCurrentValue; // Pre-formatted value for display
  private String embedCode;
  private Date createdAt;
  private Date lastModifiedAt;
}
