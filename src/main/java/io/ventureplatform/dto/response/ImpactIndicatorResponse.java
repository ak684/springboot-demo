package io.ventureplatform.dto.response;

import io.ventureplatform.entity.enums.ImpactQuantificationType;
import io.ventureplatform.entity.enums.IndicatorPitchView;
import io.ventureplatform.entity.enums.IndicatorPublicView;
import io.ventureplatform.entity.enums.MeasurementUnit;
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
public class ImpactIndicatorResponse extends BaseResponse {
  private String name;
  private Integer year;
  private ImpactQuantificationType quantificationType;
  private Double preInitial;
  private Double postInitial;
  private Integer duration;
  private Boolean stable;
  private List<IndicatorQuantificationDataResponse> pre = new ArrayList<>();
  private List<IndicatorQuantificationDataResponse> post = new ArrayList<>();
  private List<QuantificationDataResponse> preActual = new ArrayList<>();
  private List<QuantificationDataResponse> postActual = new ArrayList<>();
  private Double deadweight;
  private String deadweightComment;
  private Double displacement;
  private String displacementComment;
  private Double attribution;
  private String attributionComment;
  private List<Double> dropoff = new ArrayList<>();
  private String dropoffComment;
  private Boolean pitchEnabled;
  private Integer pitchOrder;
  private Boolean publicEnabled;
  private Double publicOrder;
  private IndicatorPublicView publicView;
  private IndicatorPitchView pitchView;
  private MeasurementUnit unit;
}
