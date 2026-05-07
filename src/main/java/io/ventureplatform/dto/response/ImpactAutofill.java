package io.ventureplatform.dto.response;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.HashSet;
import java.util.Set;

@Data
@NoArgsConstructor
public class ImpactAutofill {
  private Set<String> statusQuo = new HashSet<>();
  private Set<String> innovation = new HashSet<>();
  private Set<String> stakeholders = new HashSet<>();
  private Set<String> change = new HashSet<>();
  private Set<String> outputUnits = new HashSet<>();
}
