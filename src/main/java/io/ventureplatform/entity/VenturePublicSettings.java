package io.ventureplatform.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;
import lombok.experimental.Accessors;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.MapsId;
import javax.persistence.OneToOne;
import javax.persistence.Table;

@Entity
@Table(name = "venture_public_settings")
@Data
@Accessors(chain = true)
@NoArgsConstructor
@AllArgsConstructor
public class VenturePublicSettings {
  @Id
  private Long ventureId;

  @OneToOne
  @MapsId
  @JoinColumn(name = "venture_id")
  @EqualsAndHashCode.Exclude
  @ToString.Exclude
  private Venture venture;

  @Column(columnDefinition = "BOOLEAN default FALSE")
  private Boolean shared;
}
