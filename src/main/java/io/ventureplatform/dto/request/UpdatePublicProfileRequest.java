package io.ventureplatform.dto.request;

import lombok.Data;

import java.util.List;
import java.util.Map;

import javax.validation.constraints.Size;

/**
 * Request DTO for updating public company profile fields.
 * Only includes fields shown on the public company overview
 * page. All fields are optional — only non-null fields
 * are applied.
 */
@Data
public class UpdatePublicProfileRequest {

  /**
   * Editor language for this save: "en" or "de". Determines
   * which language column receives the bilingual fields
   * (currently only company_description). Defaults to "en"
   * when null/missing. Strict whitelist enforced server-side.
   */
  @Size(max = 4, message = "Language code too long")
  private String language;

  /** Company display name. */
  @Size(max = 500, message = "Company name too long")
  private String companyName;

  /** Company description text (active-language variant). */
  private String companyDescription;

  /** URL to the company logo image. */
  @Size(max = 1000, message = "Logo URL too long")
  private String companyLogo;

  /** Company website URL. */
  @Size(max = 500, message = "Website URL too long")
  private String companyUrl;

  /** Headquarters address. */
  private String headquarterAddress;

  /** Comma-separated industry sectors. */
  @Size(max = 500, message = "Industry sectors too long")
  private String industrySectors;

  /** CEO or founders name. */
  private String ceoName;

  /** Legal form (e.g. GmbH, AG). */
  private String legalForm;

  /** Formation date or year. */
  @Size(max = 100, message = "Formation date too long")
  private String legalEntityFormationDate;

  /** Number of employees (text, e.g. "51-100"). */
  @Size(max = 100, message = "Employee count too long")
  private String numberOfEmployees;

  /** Contact email address. */
  @Size(max = 255, message = "Email too long")
  private String contactEmail;

  /** Primary certification name. */
  @Size(max = 500, message = "Certification name too long")
  private String certificationName;

  /** Primary certification link. */
  @Size(max = 1000, message = "Certification link too long")
  private String certificationLink;

  /** First prize/award name. */
  @Size(max = 500, message = "Award name too long")
  private String prizeAwardName1;

  /** First prize/award link. */
  @Size(max = 1000, message = "Award link too long")
  private String prizeAwardLink1;

  /** Second prize/award name. */
  @Size(max = 500, message = "Award name too long")
  private String prizeAwardName2;

  /** Second prize/award link. */
  @Size(max = 1000, message = "Award link too long")
  private String prizeAwardLink2;

  /** Whether ESG impact report exists. */
  private Boolean esgImpactReport;

  /** ESG report year. */
  @Size(max = 10, message = "Report year too long")
  private String esgReportYear;

  /** ESG report link. */
  @Size(max = 1000, message = "Report link too long")
  private String esgReportLink;

  /** Core products/services JSON structure. */
  private Map<String, Object> coreProductsServices;

  /** Social media links JSON structure. */
  private Map<String, Object> socialMediaLinks;

  /**
   * Map of hidden list items on the public profile, keyed
   * by stable per-item identifier (not array index). Shape:
   * {"sections": [...], "products": ["uuid-a"], "reports":
   * ["portfolioHighlight", "esg"], "sdg": [&lt;int SDG&gt;],
   * "certifications": ["primary", "award1", "award2"]}.
   */
  private Map<String, Object> hiddenProfileElements;

  /**
   * Keys of column-backed profile items the user deleted.
   * Backend clears the underlying columns (and nothing
   * renders when empty). Supported keys: "esgReport",
   * "certPrimary", "certAward1", "certAward2".
   */
  private List<String> clearedFields;
}
