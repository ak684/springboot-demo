package io.ventureplatform.dto.response;

import io.ventureplatform.entity.enums.Geography;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@EqualsAndHashCode(callSuper = true)
@Data
@AllArgsConstructor
@NoArgsConstructor
public class AccelerationRecordResponse extends BaseResponse {
  private String name;
  private LocalDate start;
  private LocalDate finish;
  private String address;
  private String city;
  private String region;
  private String zipCode;
  private Geography country;
  private Double lat;
  private Double lng;
  private String website;
}
