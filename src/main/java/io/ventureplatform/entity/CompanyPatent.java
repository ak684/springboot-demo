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
import javax.persistence.UniqueConstraint;
import javax.persistence.Index;
import java.util.Date;

/**
 * Entity to store patent data scraped from Google Patents for companies.
 * Each record represents a single patent associated with a company.
 */
@Entity
@Table(name = "company_patents",
    uniqueConstraints = {
      @UniqueConstraint(name = "unique_company_patent",
          columnNames = {"company_extraction_data_id",
            "patent_number"})
    },
    indexes = {
      @Index(name = "idx_company_patents_company_id",
          columnList = "company_extraction_data_id"),
      @Index(name = "idx_company_patents_patent_number",
          columnList = "patent_number"),
      @Index(name = "idx_company_patents_is_granted",
          columnList = "is_granted"),
      @Index(name = "idx_company_patents_scraped_at",
          columnList = "scraped_at")
    }
)
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Accessors(chain = true)
public class CompanyPatent extends BaseEntity {

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "company_extraction_data_id", nullable = false)
  private CompanyExtractionData companyExtractionData;

  @Column(name = "patent_number", nullable = false,
      length = 100)
  private String patentNumber;

  @Column(name = "title", columnDefinition = "TEXT")
  private String title;

  @Column(name = "inventor", columnDefinition = "TEXT")
  private String inventor;

  @Column(name = "assignee", columnDefinition = "TEXT")
  private String assignee;

  @Column(name = "publication_date")
  private String publicationDate;

  @Column(name = "filed_date")
  private String filedDate;

  @Column(name = "priority_date")
  private String priorityDate;

  @Column(name = "abstract_text", columnDefinition = "TEXT")
  private String abstractText;

  @Column(name = "patent_url", length = 1000)
  private String patentUrl;

  @Column(name = "pdf_url", length = 1000)
  private String pdfUrl;

  @Column(name = "is_granted")
  private Boolean isGranted = false;

  @Column(name = "patent_jurisdictions", columnDefinition = "TEXT")
  private String patentJurisdictions;

  @Column(name = "scraped_at", nullable = false)
  private Date scrapedAt = new Date();

  @Column(name = "cited_by_count")
  private Integer citedByCount;

  @Column(name = "citations_count")
  private Integer citationsCount;

  @Column(name = "patent_status", length = 100)
  private String patentStatus;

  @Column(name = "primary_cpc_code", length = 50)
  private String primaryCpcCode;

  @Column(name = "details_scraped_at")
  private Date detailsScrapedAt;

  @Column(name = "grant_date", length = 20)
  private String grantDate;

  @Column(name = "expiration_date", length = 20)
  private String expirationDate;

  @Column(name = "patent_family_id", length = 100)
  private String patentFamilyId;
}
