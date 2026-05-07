package io.ventureplatform.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.Accessors;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Table;

@Entity
@Table(name = "ai_toc_usages")
@Data
@EqualsAndHashCode(callSuper = true)
@Accessors(chain = true)
@NoArgsConstructor
@AllArgsConstructor
public class AiTocUsage extends BaseEntity {
  private String ipAddress;
  private Double lat;
  private Double lng;
  private String country;
  private String city;
  private String type;
  @Column(columnDefinition = "TEXT")
  private String result;
}
