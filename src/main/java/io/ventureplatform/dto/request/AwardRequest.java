package io.ventureplatform.dto.request;

import io.ventureplatform.entity.enums.Geography;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import javax.validation.constraints.NotEmpty;
import javax.validation.constraints.NotNull;
import java.time.LocalDate;

@EqualsAndHashCode(callSuper = true)
@Data
@AllArgsConstructor
@NoArgsConstructor
public class AwardRequest extends BaseRequest {
  @NotEmpty
  private String name;
  @NotNull
  private LocalDate date;
  @NotNull
  private Double amount;
  private String company;
  private String address;
  private String city;
  private String region;
  private String zipCode;
  private Geography country;
  private Double lat;
  private Double lng;
}
