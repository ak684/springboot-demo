package io.ventureplatform.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PublicProfileCompanyRef {
  private Long id;
  private String name;
  private String logo;
  private String description;
}
