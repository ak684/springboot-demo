package io.ventureplatform.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.Accessors;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.Table;
import javax.persistence.Index;

@Entity
@Table(name = "patent_events",
    indexes = {
      @Index(name = "idx_patent_events_company_id",
          columnList = "company_extraction_data_id"),
      @Index(name = "idx_patent_events_created_at",
          columnList = "created_at")
    }
)
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Accessors(chain = true)
public class PatentEvent extends BaseEntity {

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "company_extraction_data_id", nullable = false)
  private CompanyExtractionData companyExtractionData;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "company_patent_id", nullable = true)
  private CompanyPatent companyPatent;

  @Column(name = "event_type", nullable = false, length = 50)
  private String eventType;

  @Column(name = "old_value", length = 255)
  private String oldValue;

  @Column(name = "new_value", length = 255)
  private String newValue;
}