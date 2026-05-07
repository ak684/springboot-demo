package io.ventureplatform.entity;

import io.ventureplatform.entity.enums.ImpactQuantificationType;
import io.ventureplatform.entity.enums.IndicatorPitchView;
import io.ventureplatform.entity.enums.IndicatorPublicView;
import io.ventureplatform.entity.enums.MeasurementUnit;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;
import lombok.experimental.Accessors;
import org.hibernate.annotations.Cascade;
import org.hibernate.annotations.CascadeType;
import org.hibernate.annotations.Fetch;
import org.hibernate.annotations.FetchMode;
import org.hibernate.annotations.Where;

import javax.persistence.Column;
import javax.persistence.ElementCollection;
import javax.persistence.Entity;
import javax.persistence.EnumType;
import javax.persistence.Enumerated;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.OneToMany;
import javax.persistence.OrderBy;
import javax.persistence.Table;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "impact_indicators")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Accessors(chain = true)
public class ImpactIndicator extends BaseEntity {
  @ManyToOne
  @JoinColumn(name = "impact_id")
  @EqualsAndHashCode.Exclude
  @ToString.Exclude
  private Impact impact;

  private String name;

  private Integer year;

  private ImpactQuantificationType quantificationType;
  private Double preInitial;
  private Double postInitial;
  private Integer duration;
  @Column(columnDefinition = "BOOLEAN default TRUE")
  private Boolean stable;
  @OneToMany(mappedBy = "indicator")
  @Fetch(FetchMode.SUBSELECT)
  @OrderBy("year")
  @Where(clause = "type = 'PRE'")
  private List<IndicatorQuantificationData> pre = new ArrayList<>();
  @OneToMany(mappedBy = "indicator")
  @Fetch(FetchMode.SUBSELECT)
  @OrderBy("year")
  @Where(clause = "type = 'POST'")
  private List<IndicatorQuantificationData> post = new ArrayList<>();
  @OneToMany(mappedBy = "indicator")
  @Fetch(FetchMode.SUBSELECT)
  @OrderBy("year")
  @Where(clause = "type = 'PRE_ACTUAL'")
  private List<QuantificationData> preActual = new ArrayList<>();
  @OneToMany(mappedBy = "indicator")
  @Fetch(FetchMode.SUBSELECT)
  @OrderBy("year")
  @Where(clause = "type = 'POST_ACTUAL'")
  private List<QuantificationData> postActual = new ArrayList<>();

  private Double deadweight;
  private String deadweightComment;
  private Double displacement;
  private String displacementComment;
  private Double attribution;
  private String attributionComment;
  @ElementCollection
  private List<Double> dropoff = new ArrayList<>();
  private String dropoffComment;

  @OneToMany(mappedBy = "indicator")
  @Fetch(FetchMode.SUBSELECT)
  @Cascade(CascadeType.ALL)
  private List<IndicatorScore> scores;
  @Column(columnDefinition = "BOOLEAN default TRUE")
  private Boolean pitchEnabled = true;
  private Integer pitchOrder;
  @Column(columnDefinition = "BOOLEAN default TRUE")
  private Boolean publicEnabled = true;
  private Double publicOrder;
  @Enumerated(EnumType.STRING)
  private IndicatorPitchView pitchView = IndicatorPitchView.NET_IMPACT;
  @Enumerated(EnumType.STRING)
  private IndicatorPublicView publicView = IndicatorPublicView.ABSOLUTE_IMPROVEMENT;
  @Enumerated(EnumType.STRING)
  private MeasurementUnit unit;
}
