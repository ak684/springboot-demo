package io.ventureplatform.entity;

import com.vladmihalcea.hibernate.type.json.JsonType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.Accessors;
import org.hibernate.annotations.Type;
import org.hibernate.annotations.TypeDef;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.PrePersist;
import javax.persistence.PreUpdate;
import javax.persistence.Table;
import java.math.BigDecimal;
import java.util.Date;
import java.util.Map;
import java.util.List;
import java.util.ArrayList;
import java.util.UUID;

/**
 * Entity to store company data extracted by the AI extraction pipeline.
 * Stores both structured fields and raw JSON data for flexibility.
 */
@Entity
@Table(name = "company_extraction_data")
@TypeDef(name = "json", typeClass = JsonType.class)
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Accessors(chain = true)
public class CompanyExtractionData extends BaseEntity {

  @Column(name = "company_url", nullable = false, length = 500)
  private String companyUrl;

  @Column(name = "domain", nullable = false)
  private String domain;

  @Column(name = "company_name")
  private String companyName;

  @Column(name = "company_description", columnDefinition = "TEXT")
  private String companyDescription;

  @Column(name = "company_description_en", columnDefinition = "TEXT")
  private String companyDescriptionEn;

  @Column(name = "company_description_de", columnDefinition = "TEXT")
  private String companyDescriptionDe;

  @Column(name = "company_description_en_auto_translated", nullable = false)
  private Boolean companyDescriptionEnAutoTranslated = false;

  @Column(name = "company_description_de_auto_translated", nullable = false)
  private Boolean companyDescriptionDeAutoTranslated = false;

  @Column(name = "industry_sectors", length = 500)
  private String industrySectors;

  @Column(name = "number_of_employees", length = 100)
  private String numberOfEmployees;

  @Column(name = "headquarter_address")
  private String headquarterAddress;

  @Column(name = "annual_sales_legacy", length = 100)
  private String annualSalesLegacy;

  // Annual sales by year
  @Column(name = "annual_sales_2022", precision = 15, scale = 2)
  private BigDecimal annualSales2022;

  @Column(name = "annual_sales_2023", precision = 15, scale = 2)
  private BigDecimal annualSales2023;

  @Column(name = "annual_sales_2024", precision = 15, scale = 2)
  private BigDecimal annualSales2024;

  // Currency for each year
  @Column(name = "currency_2022", length = 10)
  private String currency2022;

  @Column(name = "currency_2023", length = 10)
  private String currency2023;

  @Column(name = "currency_2024", length = 10)
  private String currency2024;

  // Data type for each year's sales (actual, estimate, or n.a.)
  @Column(name = "annual_sales_2022_type", length = 10)
  private String annualSales2022Type;

  @Column(name = "annual_sales_2023_type", length = 10)
  private String annualSales2023Type;

  @Column(name = "annual_sales_2024_type", length = 10)
  private String annualSales2024Type;

  @Column(name = "phone_number", length = 100)
  private String phoneNumber;

  @Column(name = "contact_email", length = 255)
  private String contactEmail;

  // Total funding amount
  @Column(name = "total_funding_amount", precision = 15, scale = 2)
  private BigDecimal totalFundingAmount;

  @Column(name = "funding_currency", length = 10)
  private String fundingCurrency;

  @Column(name = "total_funding_amount_type", length = 10)
  private String totalFundingAmountType;


  @Column(name = "patent_search_url", length = 1000)
  private String patentSearchUrl;
  
  @Column(name = "last_patent_check_at")
  private Date lastPatentCheckAt;

  @Column(name = "esg_rating", length = 50)
  private String esgRating;

  @Column(name = "esg_score", length = 50)
  private String esgScore;

  @Column(name = "sustainability_orientation")
  private String sustainabilityOrientation;

  @Column(name = "sustainability_impact_area")
  private String sustainabilityImpactArea;

  @Column(name = "sustainability_score", length = 50)
  private String sustainabilityScore;

  @Column(name = "theory_of_change", columnDefinition = "TEXT")
  private String theoryOfChange;

  @Column(name = "problem_description", columnDefinition = "TEXT")
  private String problemDescription;

  @Column(name = "innovation_description", columnDefinition = "TEXT")
  private String innovationDescription;

  @Column(name = "sdgs", length = 500)
  private String sdgs;

  @Column(name = "target_stakeholders", length = 500)
  private String targetStakeholders;

  @Column(name = "geography_of_impact", length = 500)
  private String geographyOfImpact;

  @Column(name = "latitude")
  private Double latitude;

  @Column(name = "longitude")
  private Double longitude;

  @Column(name = "cluster_assignment")
  private String clusterAssignment;

  @Column(name = "cluster_justification", columnDefinition = "TEXT")
  private String clusterJustification;

  @Column(name = "is_fintech")
  private Boolean isFintech;

  @Column(name = "fintech_explanation", columnDefinition = "TEXT")
  private String fintechExplanation;

  @Column(name = "fintech_confidence_score", precision = 5, scale = 2)
  private BigDecimal fintechConfidenceScore;

  // Carbon emissions data
  @Column(name = "total_carbon_emissions", length = 50)
  private String totalCarbonEmissions;

  @Column(name = "scope1_emissions", length = 50)
  private String scope1Emissions;

  @Column(name = "scope2_emissions", length = 50)
  private String scope2Emissions;

  @Column(name = "scope3_emissions", length = 50)
  private String scope3Emissions;

  // ESG Risk Scores
  @Column(name = "esg_risk_environmental_inherent", precision = 3, scale = 1)
  private BigDecimal esgRiskEnvironmentalInherent;

  @Column(name = "esg_risk_environmental_adjusted", precision = 3, scale = 1)
  private BigDecimal esgRiskEnvironmentalAdjusted;

  @Column(name = "esg_risk_social_inherent", precision = 3, scale = 1)
  private BigDecimal esgRiskSocialInherent;

  @Column(name = "esg_risk_social_adjusted", precision = 3, scale = 1)
  private BigDecimal esgRiskSocialAdjusted;

  @Column(name = "esg_risk_governance_inherent", precision = 3, scale = 1)
  private BigDecimal esgRiskGovernanceInherent;

  @Column(name = "esg_risk_governance_adjusted", precision = 3, scale = 1)
  private BigDecimal esgRiskGovernanceAdjusted;

  @Column(name = "esg_risk_total_inherent", precision = 3, scale = 1)
  private BigDecimal esgRiskTotalInherent;

  @Column(name = "esg_risk_total_adjusted", precision = 3, scale = 1)
  private BigDecimal esgRiskTotalAdjusted;

  // ESG Foresight Scores (8-year projection)
  @Column(name = "esg_risk_environmental_foresight", precision = 3, scale = 1)
  private BigDecimal esgRiskEnvironmentalForesight;

  @Column(name = "esg_risk_social_foresight", precision = 3, scale = 1)
  private BigDecimal esgRiskSocialForesight;

  @Column(name = "esg_risk_governance_foresight", precision = 3, scale = 1)
  private BigDecimal esgRiskGovernanceForesight;

  @Column(name = "esg_risk_total_foresight", precision = 4, scale = 1)
  private BigDecimal esgRiskTotalForesight;

  @Column(name = "esg_foresight_qualified")
  private Boolean esgForesightQualified;

  // Note: Foresight details, explanations, drivers, HSRIs and mitigation
  // are stored in rawExtractionData JSONB following existing pattern

  @Column(name = "is_large_cap_mode")
  private Boolean isLargeCapMode;

  @Column(name = "large_cap_threshold_reason", length = 100)
  private String largeCapThresholdReason;

  // SBMO (Sustainability Business Model Orientation) Scores
  @Column(name = "sbmo_criteria_a_score", precision = 3, scale = 1)
  private BigDecimal sbmoCriteriaAScore;

  @Column(name = "sbmo_criteria_b_score", precision = 3, scale = 1)
  private BigDecimal sbmoCriteriaBScore;

  @Column(name = "sbmo_criteria_c_score", precision = 3, scale = 1)
  private BigDecimal sbmoCriteriaCScore;

  @Column(name = "sbmo_criteria_d_score", precision = 3, scale = 1)
  private BigDecimal sbmoCriteriaDScore;

  @Column(name = "sbmo_total_score", precision = 5, scale = 2)
  private BigDecimal sbmoTotalScore;

  @Column(name = "sbmo_criteria_a_explanation", columnDefinition = "TEXT")
  private String sbmoCriteriaAExplanation;

  @Column(name = "sbmo_criteria_b_explanation", columnDefinition = "TEXT")
  private String sbmoCriteriaBExplanation;

  @Column(name = "sbmo_criteria_c_explanation", columnDefinition = "TEXT")
  private String sbmoCriteriaCExplanation;

  @Column(name = "sbmo_criteria_d_explanation", columnDefinition = "TEXT")
  private String sbmoCriteriaDExplanation;

  // Fields extracted from raw_extraction_data for performance (lite endpoint)
  @Column(name = "legal_form")
  private String legalForm;

  @Column(name = "legal_entity_formation_date", length = 100)
  private String legalEntityFormationDate;

  @Column(name = "ceo_name")
  private String ceoName;

  @Column(name = "company_logo", length = 1000)
  private String companyLogo;

  @Column(name = "cluster_confidence_score", precision = 5, scale = 2)
  private BigDecimal clusterConfidenceScore;

  @Column(name = "overall_impact_potential_score", precision = 5, scale = 2)
  private BigDecimal overallImpactPotentialScore;

  @Column(name = "impact_magnitude_5_year", precision = 5, scale = 2)
  private BigDecimal impactMagnitude5Year;

  @Column(name = "impact_magnitude_5_year_negative", precision = 5, scale = 2)
  private BigDecimal impactMagnitude5YearNegative;

  @Column(name = "impact_magnitude_5_year_net", precision = 10, scale = 2)
  private BigDecimal impactMagnitude5YearNet;

  @Column(name = "impact_likelihood", precision = 5, scale = 2)
  private BigDecimal impactLikelihood;

  // Highest ABC classification from theory of change impact chains (A, B, or C)
  @Column(name = "highest_abc_classification", length = 1)
  private String highestAbcClassification;

  @Column(name = "stakeholder_geography_summary", columnDefinition = "TEXT")
  private String stakeholderGeographySummary;

  @Column(name = "growth_media_reach_score", precision = 5, scale = 2)
  private BigDecimal growthMediaReachScore;

  @Column(name = "growth_sentiment_score", precision = 5, scale = 2)
  private BigDecimal growthSentimentScore;

  @Column(name = "growth_innovation_visibility_score", precision = 5, scale = 2)
  private BigDecimal growthInnovationVisibilityScore;

  @Column(name = "growth_team_strength_score", precision = 5, scale = 2)
  private BigDecimal growthTeamStrengthScore;

  @Column(name = "growth_funding_velocity_score", precision = 5, scale = 2)
  private BigDecimal growthFundingVelocityScore;

  @Column(name = "growth_company_age_score", precision = 5, scale = 2)
  private BigDecimal growthCompanyAgeScore;

  @Column(name = "growth_composite_score", precision = 5, scale = 2)
  private BigDecimal growthCompositeScore;
  @Column(name = "certification_name", length = 500)
  private String certificationName;

  @Column(name = "certification_link", length = 1000)
  private String certificationLink;

  @Column(name = "esg_impact_report")
  private Boolean esgImpactReport;

  @Column(name = "esg_report_year", length = 10)
  private String esgReportYear;

  @Column(name = "esg_report_link", length = 1000)
  private String esgReportLink;

  @Column(name = "prize_award_name_1", length = 500)
  private String prizeAwardName1;

  @Column(name = "prize_award_link_1", length = 1000)
  private String prizeAwardLink1;

  @Column(name = "prize_award_name_2", length = 500)
  private String prizeAwardName2;

  @Column(name = "prize_award_link_2", length = 1000)
  private String prizeAwardLink2;

  @Column(name = "primary_industry_standard")
  private String primaryIndustryStandard;

  @Column(name = "secondary_industry_standard")
  private String secondaryIndustryStandard;

  @Column(name = "geographic_scope_estimated")
  private String geographicScopeEstimated;

  // ESG Materiality Scores (calculated from esg_materiality_analysis for table display)
  @Column(name = "esg_sb_scores_sum", precision = 10, scale = 2)
  private BigDecimal esgSbScoresSum;

  @Column(name = "esg_environmental_score", precision = 10, scale = 2)
  private BigDecimal esgEnvironmentalScore;

  @Column(name = "esg_social_score", precision = 10, scale = 2)
  private BigDecimal esgSocialScore;

  @Column(name = "esg_governance_score", precision = 10, scale = 2)
  private BigDecimal esgGovernanceScore;

  @Type(type = "json")
  @Column(name = "social_media_links", columnDefinition = "jsonb")
  private Map<String, String> socialMediaLinks;

  @Type(type = "json")
  @Column(name = "social_media_follower_counts", columnDefinition = "jsonb")
  private Map<String, Long> socialMediaFollowerCounts;

  // Website Traffic Data - Complete 24 months (Aug 2023 - Aug 2025)
  // 2023 months
  @Column(name = "traffic_aug_2023")
  private Long trafficAug2023;
  
  @Column(name = "traffic_sep_2023")
  private Long trafficSep2023;
  
  @Column(name = "traffic_oct_2023")
  private Long trafficOct2023;
  
  @Column(name = "traffic_nov_2023")
  private Long trafficNov2023;
  
  @Column(name = "traffic_dec_2023")
  private Long trafficDec2023;
  
  // 2024 months
  @Column(name = "traffic_jan_2024")
  private Long trafficJan2024;
  
  @Column(name = "traffic_feb_2024")
  private Long trafficFeb2024;
  
  @Column(name = "traffic_mar_2024")
  private Long trafficMar2024;
  
  @Column(name = "traffic_apr_2024")
  private Long trafficApr2024;
  
  @Column(name = "traffic_may_2024")
  private Long trafficMay2024;
  
  @Column(name = "traffic_jun_2024")
  private Long trafficJun2024;
  
  @Column(name = "traffic_jul_2024")
  private Long trafficJul2024;
  
  @Column(name = "traffic_aug_2024")
  private Long trafficAug2024;
  
  @Column(name = "traffic_sep_2024")
  private Long trafficSep2024;
  
  @Column(name = "traffic_oct_2024")
  private Long trafficOct2024;
  
  @Column(name = "traffic_nov_2024")
  private Long trafficNov2024;
  
  @Column(name = "traffic_dec_2024")
  private Long trafficDec2024;
  
  // 2025 months
  @Column(name = "traffic_jan_2025")
  private Long trafficJan2025;
  
  @Column(name = "traffic_feb_2025")
  private Long trafficFeb2025;

  @Column(name = "traffic_mar_2025")
  private Long trafficMar2025;

  @Column(name = "traffic_apr_2025")
  private Long trafficApr2025;

  @Column(name = "traffic_may_2025")
  private Long trafficMay2025;

  @Column(name = "traffic_jun_2025")
  private Long trafficJun2025;

  @Column(name = "traffic_jul_2025")
  private Long trafficJul2025;
  
  @Column(name = "traffic_aug_2025")
  private Long trafficAug2025;

  @Column(name = "traffic_sep_2025")
  private Long trafficSep2025;

  @Column(name = "traffic_oct_2025")
  private Long trafficOct2025;

  @Column(name = "traffic_nov_2025")
  private Long trafficNov2025;

  @Column(name = "traffic_dec_2025")
  private Long trafficDec2025;

  // Growth Trend Calculations
  @Column(name = "monthly_growth_trend", precision = 5, scale = 2)
  private BigDecimal monthlyGrowthTrend;

  @Column(name = "three_month_growth_trend", precision = 5, scale = 2)
  private BigDecimal threeMonthGrowthTrend;

  @Column(name = "six_month_growth_trend", precision = 5, scale = 2)
  private BigDecimal sixMonthGrowthTrend;
  
  @Column(name = "one_month_growth", precision = 10, scale = 2)
  private BigDecimal oneMonthGrowth;
  
  @Column(name = "one_year_growth", precision = 10, scale = 2)
  private BigDecimal oneYearGrowth;
  
  @Column(name = "two_year_growth", precision = 10, scale = 2)
  private BigDecimal twoYearGrowth;
  
  @Column(name = "latest_traffic_month", length = 20)
  private String latestTrafficMonth;
  
  @Column(name = "traffic_data_updated_at")
  private Date trafficDataUpdatedAt;

  @Column(name = "portfolio_strengths_text", columnDefinition = "TEXT")
  private String portfolioStrengthsText;

  @Column(name = "portfolio_weaknesses_text", columnDefinition = "TEXT")
  private String portfolioWeaknessesText;

  @Column(name = "portfolio_impact_text", columnDefinition = "TEXT")
  private String portfolioImpactText;

  @Column(name = "portfolio_potential_needs_text", columnDefinition = "TEXT")
  private String portfolioPotentialNeedsText;

  @Column(name = "portfolio_narrative_generated_at")
  private Date portfolioNarrativeGeneratedAt;

  @Type(type = "json")
  @Column(name = "confidence_scores", columnDefinition = "jsonb")
  private Map<String, Object> confidenceScores;

  @Type(type = "json")
  @Column(name = "raw_extraction_data", columnDefinition = "jsonb")
  private Map<String, Object> rawExtractionData;

  @Type(type = "json")
  @Column(name = "extraction_phases_completed", columnDefinition = "jsonb")
  private Map<String, Object> extractionPhasesCompleted;

  @Type(type = "json")
  @Column(name = "tags", columnDefinition = "jsonb")
  private List<String> tags = new ArrayList<>();

  @Type(type = "json")
  @Column(name = "core_products_services", columnDefinition = "jsonb")
  private Map<String, Object> coreProductsServices;

  @Type(type = "json")
  @Column(name = "public_impact_summary", columnDefinition = "jsonb")
  private Map<String, Object> publicImpactSummary;

  @Type(type = "json")
  @Column(name = "hidden_profile_elements", columnDefinition = "jsonb")
  private Map<String, Object> hiddenProfileElements;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "venture_id")
  private Venture venture;

  @Column(name = "venture_id", insertable = false, updatable = false)
  private Long ventureId;

  // Patent count fields
  @Column(name = "total_patents")
  private Integer totalPatents;

  @Column(name = "granted_patents")
  private Integer grantedPatents;

  @Column(name = "patent_applications")
  private Integer patentApplications;

  /**
   * Whether to track news articles for this company.
   * When enabled, the scheduled job will scrape and save news events.
   */
  @Column(name = "track_news")
  private Boolean trackNews = true;

  /**
   * Timestamp of when news was last scraped for this company.
   * Used to determine if we should scrape news again.
   */
  @Column(name = "last_news_scraped_at")
  private Date lastNewsScrapedAt;

  // Note: createdBy and lastModifiedBy are handled by BaseEntity as Long values
  // They represent user IDs and are automatically populated by Spring Data JPA auditing

  /**
   * Stamp every product item in coreProductsServices with a
   * server-issued UUID on any insert/update, so downstream
   * features (e.g. per-item hide state, #486) can reference a
   * stable id regardless of which write path produced the data
   * (editor PATCH, extraction pipeline, backfills, etc).
   *
   * <p>Matching ids across a full re-extraction is out of scope
   * here — re-extraction replaces the items and they get fresh
   * ids, which intentionally resets any per-item state tied to
   * the previous identity.
   */
  @PrePersist
  @PreUpdate
  @SuppressWarnings("unchecked")
  protected void stampProductIds() {
    stampProductIdsIn(coreProductsServices);
    if (rawExtractionData != null) {
      Object nested = rawExtractionData.get(
          "core_products_services");
      if (nested instanceof Map) {
        stampProductIdsIn((Map<String, Object>) nested);
      }
    }
  }

  @SuppressWarnings("unchecked")
  private static void stampProductIdsIn(
      final Map<String, Object> products) {
    if (products == null) {
      return;
    }
    Object itemsObj = products.get("items");
    if (!(itemsObj instanceof List)) {
      return;
    }
    for (Object item : (List<Object>) itemsObj) {
      if (!(item instanceof Map)) {
        continue;
      }
      Map<String, Object> productMap = (Map<String, Object>) item;
      Object existing = productMap.get("id");
      if (!(existing instanceof String)
          || ((String) existing).isBlank()) {
        productMap.put("id", UUID.randomUUID().toString());
      }
    }
  }
}
