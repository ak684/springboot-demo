package io.ventureplatform.dto.response;

import io.ventureplatform.entity.enums.Geography;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@EqualsAndHashCode(callSuper = true)
@Data
@AllArgsConstructor
@NoArgsConstructor
public class ImpactResponse extends BaseResponse {
  private String name;
  private String statusQuo;
  private String innovation;
  private String stakeholders;
  private String change;
  private String outputUnits;
  private Boolean positive;
  private List<ImpactGoalResponse> goals;
  private List<ImpactIndicatorResponse> indicators;
  // toDO: Replace with the last known score?
  private List<ImpactScoreResponse> scoring;
  private Boolean draft;
  private List<Geography> geography;
  private List<String> geographyCustom;
  private List<QuantificationDataResponse> productsData = new ArrayList<>();
  private List<QuantificationDataResponse> productsDataActual = new ArrayList<>();
  private List<QuantificationDataResponse> stakeholdersData = new ArrayList<>();
  private List<QuantificationDataResponse> stakeholdersDataActual = new ArrayList<>();
  private String image;
  private String pitchDescription;
  private String pitchInspiration;
  private Boolean pitchEnabled;
  private Integer pitchOrder;
  private Boolean publicEnabled;
  private Double publicOrder;
  private Boolean impactCalculationTotal;
}
