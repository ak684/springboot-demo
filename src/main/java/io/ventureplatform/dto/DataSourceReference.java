package io.ventureplatform.dto;

import io.ventureplatform.entity.enums.ImpactQuantificationType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.Accessors;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Accessors(chain = true)
public class DataSourceReference {
  private DataSourceType type; // Enum: PRODUCT, STAKEHOLDER, INDICATOR
  private Long ventureId;
  private Long impactId;
  private String impactName;
  private String sourceName; // Display name from DB fields
  private Long indicatorId; // Only for indicators
  private ImpactQuantificationType quantificationType; // Only for indicators

  public enum DataSourceType {
    PRODUCT, STAKEHOLDER, INDICATOR, COMPANY_EXTRACTOR
  }
}
