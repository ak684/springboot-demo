package io.ventureplatform.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;
import lombok.experimental.Accessors;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.Table;
import javax.persistence.UniqueConstraint;

/**
 * Entity for portfolio-scoped notes on companies in the URL extractor.
 * Each portfolio can have one note per company.
 */
@Entity
@Table(
  name = "company_notes",
  uniqueConstraints = @UniqueConstraint(
    columnNames = {"company_extraction_data_id", "portfolio_id"}))
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Accessors(chain = true)
public class CompanyNote extends BaseEntity {

  /**
   * The company this note is about.
   */
  @ManyToOne
  @JoinColumn(name = "company_extraction_data_id", nullable = false)
  @EqualsAndHashCode.Exclude
  @ToString.Exclude
  private CompanyExtractionData companyExtractionData;

  /**
   * The portfolio this note belongs to.
   */
  @ManyToOne
  @JoinColumn(name = "portfolio_id", nullable = false)
  @EqualsAndHashCode.Exclude
  @ToString.Exclude
  private Portfolio portfolio;

  /**
   * The note content.
   */
  @Column(columnDefinition = "TEXT")
  private String content;
}
