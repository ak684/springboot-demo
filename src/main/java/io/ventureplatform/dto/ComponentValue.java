package io.ventureplatform.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ComponentValue {
  private String name;        // Display name
  private Double value;       // Calculated value
  private Long ventureId;
  private Long impactId;
  private String type;        // PRODUCT, STAKEHOLDER, INDICATOR
}
