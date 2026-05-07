package io.ventureplatform.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;
import lombok.experimental.Accessors;

import javax.persistence.Entity;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.Table;

@Entity
@Table(name = "portfolio_employees_records")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Accessors(chain = true)
public class PortfolioEmployeesRecord extends BaseEntity {
  @ManyToOne
  @JoinColumn(name = "portfolio_id", nullable = false)
  @EqualsAndHashCode.Exclude
  @ToString.Exclude
  private Portfolio portfolio;

  private Integer count;
}
