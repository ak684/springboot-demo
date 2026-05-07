package io.ventureplatform.projection;

import java.math.BigDecimal;
import java.util.Date;
import java.util.List;
import java.util.Map;

/**
 * Interface-based projection for CompanyExtractionData that excludes large JSONB fields.
 * This projection is used for the lite endpoint to significantly improve database performance
 * by not fetching rawExtractionData (~100KB per row) and other heavy JSONB columns.
 *
 * <p>Spring Data JPA will generate optimized SQL that only selects these columns.
 */
public interface CompanyExtractionDataLiteProjection {

  Long getId();

  Date getCreatedAt();

  Date getLastModifiedAt();

  String getCompanyUrl();

  String getDomain();

  String getCompanyName();

  String getCompanyDescription();

  String getIndustrySectors();

  String getNumberOfEmployees();

  String getHeadquarterAddress();

  String getPhoneNumber();

  String getContactEmail();

  String getCeoName();

  String getCompanyLogo();

  String getLegalForm();

  String getLegalEntityFormationDate();

  Boolean getTrackNews();

  BigDecimal getTotalFundingAmount();

  String getFundingCurrency();

  String getTotalFundingAmountType();

  BigDecimal getAnnualSales2022();

  BigDecimal getAnnualSales2023();

  BigDecimal getAnnualSales2024();

  String getCurrency2022();

  String getCurrency2023();

  String getCurrency2024();

  String getAnnualSales2022Type();

  String getAnnualSales2023Type();

  String getAnnualSales2024Type();

  Integer getTotalPatents();

  Integer getGrantedPatents();

  Integer getPatentApplications();

  Date getLastPatentCheckAt();

  String getClusterAssignment();

  BigDecimal getClusterConfidenceScore();

  String getClusterJustification();

  Boolean getIsFintech();

  String getFintechExplanation();

  BigDecimal getFintechConfidenceScore();

  BigDecimal getOverallImpactPotentialScore();

  BigDecimal getImpactMagnitude5Year();

  BigDecimal getImpactMagnitude5YearNegative();

  BigDecimal getImpactMagnitude5YearNet();

  BigDecimal getImpactLikelihood();

  String getHighestAbcClassification();

  String getStakeholderGeographySummary();

  Map<String, Object> getPublicImpactSummary();

  BigDecimal getGrowthMediaReachScore();

  BigDecimal getGrowthSentimentScore();

  BigDecimal getGrowthInnovationVisibilityScore();

  BigDecimal getGrowthTeamStrengthScore();

  BigDecimal getGrowthFundingVelocityScore();

  BigDecimal getGrowthCompanyAgeScore();

  BigDecimal getGrowthCompositeScore();

  BigDecimal getEsgRiskEnvironmentalInherent();

  BigDecimal getEsgRiskEnvironmentalAdjusted();

  BigDecimal getEsgRiskSocialInherent();

  BigDecimal getEsgRiskSocialAdjusted();

  BigDecimal getEsgRiskGovernanceInherent();

  BigDecimal getEsgRiskGovernanceAdjusted();

  BigDecimal getEsgRiskTotalInherent();

  BigDecimal getEsgRiskTotalAdjusted();

  BigDecimal getEsgRiskEnvironmentalForesight();

  BigDecimal getEsgRiskSocialForesight();

  BigDecimal getEsgRiskGovernanceForesight();

  BigDecimal getEsgRiskTotalForesight();

  Boolean getEsgForesightQualified();

  Boolean getIsLargeCapMode();

  String getLargeCapThresholdReason();

  BigDecimal getSbmoCriteriaAScore();

  BigDecimal getSbmoCriteriaBScore();

  BigDecimal getSbmoCriteriaCScore();

  BigDecimal getSbmoCriteriaDScore();

  BigDecimal getSbmoTotalScore();

  String getSbmoCriteriaAExplanation();

  String getSbmoCriteriaBExplanation();

  String getSbmoCriteriaCExplanation();

  String getSbmoCriteriaDExplanation();

  String getTotalCarbonEmissions();

  String getScope1Emissions();

  String getScope2Emissions();

  String getScope3Emissions();

  Map<String, String> getSocialMediaLinks();

  Map<String, Long> getSocialMediaFollowerCounts();

  String getCertificationName();

  String getCertificationLink();

  Boolean getEsgImpactReport();

  String getEsgReportYear();

  String getEsgReportLink();

  String getPrizeAwardName1();

  String getPrizeAwardLink1();

  String getPrizeAwardName2();

  String getPrizeAwardLink2();

  String getPrimaryIndustryStandard();

  String getSecondaryIndustryStandard();

  String getGeographicScopeEstimated();

  BigDecimal getEsgSbScoresSum();

  BigDecimal getEsgEnvironmentalScore();

  BigDecimal getEsgSocialScore();

  BigDecimal getEsgGovernanceScore();

  Long getTrafficAug2023();

  Long getTrafficSep2023();

  Long getTrafficOct2023();

  Long getTrafficNov2023();

  Long getTrafficDec2023();

  Long getTrafficJan2024();

  Long getTrafficFeb2024();

  Long getTrafficMar2024();

  Long getTrafficApr2024();

  Long getTrafficMay2024();

  Long getTrafficJun2024();

  Long getTrafficJul2024();

  Long getTrafficAug2024();

  Long getTrafficSep2024();

  Long getTrafficOct2024();

  Long getTrafficNov2024();

  Long getTrafficDec2024();

  Long getTrafficJan2025();

  Long getTrafficFeb2025();

  Long getTrafficMar2025();

  Long getTrafficApr2025();

  Long getTrafficMay2025();

  Long getTrafficJun2025();

  Long getTrafficJul2025();

  Long getTrafficAug2025();

  Long getTrafficSep2025();

  Long getTrafficOct2025();

  Long getTrafficNov2025();

  Long getTrafficDec2025();

  BigDecimal getOneMonthGrowth();

  BigDecimal getThreeMonthGrowthTrend();

  BigDecimal getSixMonthGrowthTrend();

  BigDecimal getOneYearGrowth();

  BigDecimal getTwoYearGrowth();

  Double getLatitude();

  Double getLongitude();

  List<String> getTags();

  /**
   * Get linked venture ID.
   * @return venture ID or null
   */
  Long getVentureId();

  // TODO: theoryOfChange and sdgs columns may be NULL for
  // existing rows due to a Jackson serialization bug (asText()
  // on arrays returns ""). New extractions will populate these
  // correctly, but a backfill migration is needed for
  // historical data. See CompanyExtractionDataService
  // getTextValue() for the fix.

  /**
   * Get theory of change JSON.
   * @return theory of change text
   */
  String getTheoryOfChange();

  /**
   * Get SDGs string.
   * @return SDGs
   */
  String getSdgs();

  /**
   * Get geography of impact.
   * @return geography of impact
   */
  String getGeographyOfImpact();
}
