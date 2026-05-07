package io.ventureplatform.entity;

import io.ventureplatform.entity.enums.FollowerType;
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
import javax.persistence.Transient;

@Entity
@Table(name = "followers")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Accessors(chain = true)
public class Followers extends BaseEntity {
  private Long value;
  @Transient
  private Long change;

  @Enumerated(EnumType.STRING)
  private FollowerType type;

  @ManyToOne
  @JoinColumn(name = "venture_id")
  @EqualsAndHashCode.Exclude
  @ToString.Exclude
  private Venture venture;
}
