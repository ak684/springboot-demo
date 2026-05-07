package io.ventureplatform.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.Accessors;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.Index;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.Table;
import java.util.Date;

/**
 * Entity to track URL validation events for company websites.
 * Notifies users when URLs are updated or have issues.
 */
@Entity
@Table(name = "url_validation_events",
  indexes = {
    @Index(name = "idx_url_validation_events_company_id",
      columnList = "company_extraction_data_id"),
    @Index(name = "idx_url_validation_events_created_at",
      columnList = "created_at")
  }
)
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Accessors(chain = true)
public class UrlValidationEvent extends BaseEntity {

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "company_extraction_data_id", nullable = false)
  private CompanyExtractionData companyExtractionData;

  @Column(name = "event_type", nullable = false, length = 50)
  private String eventType;

  @Column(name = "old_url", length = 500)
  private String oldUrl;

  @Column(name = "new_url", length = 500)
  private String newUrl;

  @Column(name = "status_code")
  private Integer statusCode;

  @Column(name = "error_message", columnDefinition = "TEXT")
  private String errorMessage;

  @Column(name = "approval_status", length = 50)
  private String approvalStatus;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "reviewed_by")
  private User reviewedBy;

  @Column(name = "reviewed_at")
  private Date reviewedAt;
}
