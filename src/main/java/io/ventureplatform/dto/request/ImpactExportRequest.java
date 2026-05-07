package io.ventureplatform.dto.request;

import io.ventureplatform.entity.enums.ImpactFilter;
import io.ventureplatform.entity.enums.ImpactSort;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

@Data
@NoArgsConstructor
public class ImpactExportRequest {
  private ImpactSort sort;
  private Set<ImpactFilter> filter;
  private String[] hide;
}
