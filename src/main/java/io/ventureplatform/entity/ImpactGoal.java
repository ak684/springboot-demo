package io.ventureplatform.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.ventureplatform.entity.enums.SustainableDevelopmentGoal;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;
import lombok.experimental.Accessors;

import javax.persistence.Entity;
import javax.persistence.EnumType;
import javax.persistence.Enumerated;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.Table;
import javax.persistence.Transient;

@Entity
@Table(name = "impact_goals")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Accessors(chain = true)
public class ImpactGoal extends BaseEntity {
  @ManyToOne
  @JoinColumn(name = "impact_id")
  @EqualsAndHashCode.Exclude
  @ToString.Exclude
  private Impact impact;

  @Enumerated(value = EnumType.STRING)
  private SustainableDevelopmentGoal goal;

  private Integer rate;

  @Transient
  @JsonProperty
  @Getter(AccessLevel.NONE)
  private String shortName;

  public String getShortName() {
    return goal.getShortName();
  }
}
