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
@Table(name = "venture_employees_records")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Accessors(chain = true)
public class VentureEmployeesRecord extends BaseEntity {
  @ManyToOne
  @JoinColumn(name = "venture_id", nullable = false)
  @EqualsAndHashCode.Exclude
  @ToString.Exclude
  private Venture venture;

  private Integer count;
}
