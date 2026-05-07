package io.ventureplatform.entity;

import io.ventureplatform.entity.enums.Geography;
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
import java.time.LocalDate;

@Entity
@Table(name = "awards")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Accessors(chain = true)
public class Award extends BaseEntity {
  private String name;
  private LocalDate date;
  private Double amount;
  private String company;
  private String address;
  private String city;
  private String region;
  private String zipCode;
  @Enumerated(EnumType.STRING)
  private Geography country;
  private Double lat;
  private Double lng;

  @ManyToOne
  @JoinColumn(name = "venture_id")
  @EqualsAndHashCode.Exclude
  @ToString.Exclude
  private Venture venture;
}
