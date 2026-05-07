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
import javax.persistence.ManyToOne;
import javax.persistence.MapsId;
import javax.persistence.OneToOne;
import javax.persistence.Table;

@Entity
@Table(name = "venture_pitch_settings")
@Data
@Accessors(chain = true)
@NoArgsConstructor
@AllArgsConstructor
public class VenturePitchSettings {
  @Id
  private Long ventureId;

  @OneToOne
  @MapsId
  @JoinColumn(name = "venture_id")
  @EqualsAndHashCode.Exclude
  @ToString.Exclude
  private Venture venture;

  @Column(columnDefinition = "BOOLEAN default TRUE")
  private Boolean showInstagram;
  @Column(columnDefinition = "BOOLEAN default TRUE")
  private Boolean showTwitter;
  @Column(columnDefinition = "BOOLEAN default TRUE")
  private Boolean showLinkedin;
  @Column(columnDefinition = "BOOLEAN default TRUE")
  private Boolean showYoutube;
  @Column(columnDefinition = "BOOLEAN default TRUE")
  private Boolean showFacebook;

  @Column(columnDefinition = "BOOLEAN default TRUE")
  private Boolean showCertification;
  @Column(columnDefinition = "BOOLEAN default TRUE")
  private Boolean showWebsite;
  @Column(columnDefinition = "VARCHAR(1000)")
  private String introSubtitle = "Impact Management System & 5-year Impact Forecast";
  private String introImage;
  private String missionImage;
  private String descriptionImage;

  @Column(columnDefinition = "TEXT")
  private String description;
  private String pitchId;
  private String theme;
  private String color;
  @Column(columnDefinition = "BOOLEAN default FALSE")
  private Boolean shared;
  @Column(columnDefinition = "BOOLEAN default FALSE")
  private Boolean allowDownloadFiles;
  @ManyToOne
  @JoinColumn(name = "founder_id")
  @EqualsAndHashCode.Exclude
  @ToString.Exclude
  private User founder;
}
