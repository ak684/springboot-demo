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
 * Junction table entity for many-to-many relationship between portfolios and company extraction data.
 * Allows multiple portfolios to have access to the same company data without duplication.
 */
@Entity
@Table(
  name = "portfolio_company_extraction_access",
  uniqueConstraints = @UniqueConstraint(columnNames = {"company_extraction_data_id", "portfolio_id"}))
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Accessors(chain = true)
public class PortfolioCompanyExtractionAccess extends BaseEntity {

  @ManyToOne
  @JoinColumn(name = "company_extraction_data_id", nullable = false)
  @EqualsAndHashCode.Exclude
  @ToString.Exclude
  private CompanyExtractionData companyExtractionData;

  @ManyToOne
  @JoinColumn(name = "portfolio_id", nullable = false)
  @EqualsAndHashCode.Exclude
  @ToString.Exclude
  private Portfolio portfolio;
}