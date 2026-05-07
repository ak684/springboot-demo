package io.ventureplatform.dto.request;

import io.ventureplatform.entity.enums.Geography;
import io.ventureplatform.entity.enums.Industry;
import io.ventureplatform.entity.enums.MeasurementUnit;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import javax.validation.constraints.NotEmpty;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@EqualsAndHashCode(callSuper = true)
@Data
@AllArgsConstructor
@NoArgsConstructor
public class VentureRequest extends BaseRequest {
  @NotEmpty
  private String name;
  private String description;
  private Boolean legalEntityFormed;
  private Geography country;
  private Date formationDate;
  private String profitOrientation;
  private String legalForm;
  private String address;
  private String city;
  private String region;
  private String zipCode;
  private Double lat;
  private Double lng;
  private String phone;
  private Integer employees;
  private Integer volunteers;
  private String website;
  private String instagram;
  private String twitter;
  private String linkedin;
  private String youtube;
  private String facebook;
  private String reportingPeriod;
  private MeasurementUnit currency;
  private String logo;
  private String streetImage;
  private List<Industry> industries = new ArrayList<>();
  private List<String> hashtags = new ArrayList<>();
  private List<ImpactRequest> impacts;
  private VenturePitchSettingsRequest pitchSettings;
  private VenturePublicSettingsRequest publicSettings;
}
