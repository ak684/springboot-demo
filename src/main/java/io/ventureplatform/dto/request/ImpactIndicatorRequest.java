package io.ventureplatform.dto.request;

import io.ventureplatform.entity.enums.ImpactQuantificationType;
import io.ventureplatform.entity.enums.IndicatorPitchView;
import io.ventureplatform.entity.enums.IndicatorPublicView;
import io.ventureplatform.entity.enums.MeasurementUnit;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import javax.validation.Valid;
import javax.validation.constraints.Max;
import javax.validation.constraints.Min;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;
import java.util.ArrayList;
import java.util.List;

@EqualsAndHashCode(callSuper = true)
@Data
@AllArgsConstructor
@NoArgsConstructor
public class ImpactIndicatorRequest extends BaseRequest {
  @NotNull
  @Size(max = 100)
  private String name;

  @NotNull
  @Min(2000)
  private Integer year;

  private ImpactQuantificationType quantificationType;
  @Min(0)
  private Double preInitial;
  @Min(0)
  private Double postInitial;
  private Integer duration;
  private Boolean stable;
  @Valid
  private List<IndicatorQuantificationDataRequest> pre = new ArrayList<>();
  @Valid
  private List<IndicatorQuantificationDataRequest> post = new ArrayList<>();
  @Valid
  private List<QuantificationDataRequest> preActual = new ArrayList<>();
  @Valid
  private List<QuantificationDataRequest> postActual = new ArrayList<>();
  @Min(0)
  @Max(100)
  private Double deadweight;
  private String deadweightComment;
  @Min(0)
  @Max(100)
  private Double displacement;
  private String displacementComment;
  @Min(0)
  @Max(100)
  private Double attribution;
  private String attributionComment;
  @Valid
  private List<@Min(0) @Max(100) Double> dropoff = new ArrayList<>();
  private String dropoffComment;
  private Boolean pitchEnabled;
  private Integer pitchOrder;
  private Boolean publicEnabled;
  private Double publicOrder;
  private IndicatorPitchView pitchView;
  private IndicatorPublicView publicView;
  private MeasurementUnit unit;
}
