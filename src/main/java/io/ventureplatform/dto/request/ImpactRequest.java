package io.ventureplatform.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import javax.validation.Valid;
import javax.validation.constraints.NotEmpty;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;
import java.util.ArrayList;
import java.util.List;

@EqualsAndHashCode(callSuper = true)
@Data
@AllArgsConstructor
@NoArgsConstructor
public class ImpactRequest extends BaseRequest {
  @NotEmpty
  @Size(max = 60)
  private String name;
  @Size(max = 100)
  private String statusQuo;
  @Size(max = 100)
  private String innovation;
  @Size(max = 100)
  private String stakeholders;
  @Size(max = 100)
  private String change;
  @Size(max = 100)
  private String outputUnits;
  @NotNull
  private Boolean positive;
  @Valid
  private List<QuantificationDataRequest> productsData = new ArrayList<>();
  @Valid
  private List<QuantificationDataRequest> productsDataActual = new ArrayList<>();
  @Valid
  private List<QuantificationDataRequest> stakeholdersData = new ArrayList<>();
  @Valid
  private List<QuantificationDataRequest> stakeholdersDataActual = new ArrayList<>();
  @Valid
  private List<ImpactIndicatorRequest> indicators;
  private String image;
  private String pitchDescription;
  private String pitchInspiration;
  private Boolean pitchEnabled;
  private Integer pitchOrder;
  private Boolean publicEnabled;
  private Double publicOrder;
  private Boolean impactCalculationTotal;
}
