package io.ventureplatform.entity;

import io.ventureplatform.entity.enums.EmployeeType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;
import lombok.experimental.Accessors;

import javax.persistence.Entity;
import javax.persistence.EnumType;
import javax.persistence.Enumerated;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.Table;

@Entity
@Table(name = "team_members")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Accessors(chain = true)
public class TeamMember extends BaseEntity {
  private String name;
  private String lastName;
  private String email;
  private String position;
  private String avatar;
  private String linkedin;
  @Enumerated(EnumType.STRING)
  private EmployeeType type;
  private Integer sortOrder;

  @ManyToOne
  @JoinColumn(name = "venture_id")
  @EqualsAndHashCode.Exclude
  @ToString.Exclude
  private Venture venture;

  @ManyToOne
  @JoinColumn(name = "portfolio_id")
  @EqualsAndHashCode.Exclude
  @ToString.Exclude
  private Portfolio portfolio;
}
