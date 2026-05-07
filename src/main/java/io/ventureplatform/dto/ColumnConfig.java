package io.ventureplatform.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.Accessors;

/**
 * Configuration for table columns in aggregated view
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Accessors(chain = true)
public class ColumnConfig {
  private String id;
  private String label;
  private String group; // organization, impactChain, metrics
  private String dataType; // string, number, date, boolean
  private Boolean visible;
  private Boolean sortable;
  private Integer width;
  private String description;
}
