package io.ventureplatform.entity;

import io.ventureplatform.entity.enums.Geography;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.Accessors;

import javax.persistence.Embeddable;
import javax.persistence.EnumType;
import javax.persistence.Enumerated;

@Embeddable
@Data
@NoArgsConstructor
@AllArgsConstructor
@Accessors(chain = true)
public class Investor {
  private String name;
  private String avatar;
  private String company;
  private Double amount;
  private String address;
  private String city;
  private String region;
  private String zipCode;
  @Enumerated(EnumType.STRING)
  private Geography country;
  private Double lat;
  private Double lng;
}
