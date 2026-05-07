package io.ventureplatform.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@EqualsAndHashCode(callSuper = true)
@Data
@AllArgsConstructor
@NoArgsConstructor
public class VenturePitchSettingsResponse extends BaseResponse {
  private Boolean showInstagram;
  private Boolean showTwitter;
  private Boolean showLinkedin;
  private Boolean showYoutube;
  private Boolean showFacebook;
  private String description;
  private String pitchId;
  private String theme;
  private String color;
  private Boolean shared;
  private Boolean showCertification;
  private Boolean showWebsite;
  private String introSubtitle;
  private String introImage;
  private String missionImage;
  private String descriptionImage;
  private UserResponse founder;
  private Boolean allowDownloadFiles;
}
