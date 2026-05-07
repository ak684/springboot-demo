package io.ventureplatform.dto.request;

import io.ventureplatform.entity.enums.Geography;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.validation.constraints.NotEmpty;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class InvestorRequest {
  @NotEmpty
  private String name;
  private String avatar;
  private String company;
  private Double amount;
  private String address;
  private String city;
  private String region;
  private String zipCode;
  private Geography country;
  private Double lat;
  private Double lng;
}
