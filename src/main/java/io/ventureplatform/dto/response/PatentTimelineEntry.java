package io.ventureplatform.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Per-year aggregate of granted patents and applications for a single company.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PatentTimelineEntry {
  private int year;
  private int granted;
  private int applications;
}
