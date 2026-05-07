package io.ventureplatform.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.ventureplatform.entity.CompanyExtractionData;
import io.ventureplatform.entity.Portfolio;
import io.ventureplatform.entity.User;
import io.ventureplatform.projection.CompanyExtractionDataLiteProjection;
import io.ventureplatform.repository.CompanyExtractionDataRepository;
import io.ventureplatform.repository.CompanyPatentRepository;
import io.ventureplatform.repository.NewsEventRepository;
import io.ventureplatform.repository.PatentEventRepository;
import io.ventureplatform.repository.PortfolioCompanyExtractionAccessRepository;
import io.ventureplatform.repository.UrlValidationEventRepository;
import io.ventureplatform.service.CompanyPolarChartService.PortfolioRankSnapshot;
import io.ventureplatform.service.translation.PublicProfileLanguage;
import io.ventureplatform.service.translation.PublicProfileTranslationEvent;
import io.ventureplatform.util.DomainExtractionUtil;
import io.ventureplatform.util.ProjectionMapper;
import io.ventureplatform.util.SalesValueParser;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

import javax.persistence.EntityManager;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Arrays;
import java.util.List;
import java.util.ArrayList;
import java.util.Set;
import java.util.Comparator;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import java.util.regex.Pattern;
import java.util.regex.Matcher;

/**
 * Service for managing CompanyExtractionData persistence.
 * Handles saving and updating extraction results to the database.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CompanyExtractionDataService {

  private static final double PORTFOLIO_RANK_EPSILON = 1e-9;

  private static final Map<Integer, String[]> SDG_DATA = Map.ofEntries(
      Map.entry(1, new String[]{"No Poverty", "#E5243B"}),
      Map.entry(2, new String[]{"Zero Hunger", "#DDA63A"}),
      Map.entry(3, new String[]{"Good Health and Well-being", "#4C9F38"}),
      Map.entry(4, new String[]{"Quality Education", "#C5192D"}),
      Map.entry(5, new String[]{"Gender Equality", "#FF3A21"}),
      Map.entry(6, new String[]{"Clean Water and Sanitation", "#26BDE2"}),
      Map.entry(7, new String[]{"Affordable and Clean Energy", "#FCC30B"}),
      Map.entry(8, new String[]{"Decent Work and Economic Growth", "#A21942"}),
      Map.entry(9, new String[]{"Industry, Innovation and Infrastructure", "#FD6925"}),
      Map.entry(10, new String[]{"Reduced Inequalities", "#DD1367"}),
      Map.entry(11, new String[]{"Sustainable Cities and Communities", "#FD9D24"}),
      Map.entry(12, new String[]{"Responsible Consumption and Production", "#BF8B2E"}),
      Map.entry(13, new String[]{"Climate Action", "#3F7E44"}),
      Map.entry(14, new String[]{"Life Below Water", "#0A97D9"}),
      Map.entry(15, new String[]{"Life on Land", "#56C02B"}),
      Map.entry(16, new String[]{"Peace, Justice and Strong Institutions", "#00689D"}),
      Map.entry(17, new String[]{"Partnerships for the Goals", "#19486A"})
  );

  private final CompanyExtractionDataRepository repository;
  private final ObjectMapper objectMapper;
  private final GeocodingService geocodingService;
  private final SecurityService securityService;
  private final PortfolioCompanyExtractionAccessRepository portfolioCompanyAccessRepository;
  private final CompanyPortfolioNarrativeService companyPortfolioNarrativeService;
  private final CompanyPolarChartService companyPolarChartService;
  private final NewsEventRepository newsEventRepository;
  private final PatentEventRepository patentEventRepository;
  private final UrlValidationEventRepository urlValidationEventRepository;
  private final CompanyPatentRepository companyPatentRepository;
  private final EntityManager entityManager;
  private final ApplicationEventPublisher eventPublisher;

  /**
   * Find existing extraction data by domain.
   *
   * @param domain The domain to search for
   * @return The CompanyExtractionData entity if found, null otherwise
   */
  public CompanyExtractionData findByDomain(String domain) {
    if (domain == null || domain.trim().isEmpty()) {
      return null;
    }
    return repository.findByDomain(domain).orElse(null);
  }

  /**
   * Save or update an existing CompanyExtractionData entity.
   *
   * @param entity The entity to save
   * @return The saved entity
   */
  @Transactional
  public CompanyExtractionData save(CompanyExtractionData entity) {
    return repository.save(entity);
  }

  /**
   * Save or update extraction data from the pipeline result.
   *
   * @param companyUrl The URL that was extracted
   * @param extractionResult The JSON result from the extraction pipeline
   * @return The saved CompanyExtractionData entity
   */
  @Transactional
  public CompanyExtractionData saveExtractionData(String companyUrl, String extractionResult) {
    return saveExtractionData(companyUrl, extractionResult, null);
  }
  
  /**
   * Save or update extraction data from the pipeline result with portfolio assignment.
   *
   * @param companyUrl The URL that was extracted
   * @param extractionResult The JSON result from the extraction pipeline
   * @param portfolioId The portfolio ID to assign the company to (optional)
   * @return The saved CompanyExtractionData entity
   */
  @Transactional
  public CompanyExtractionData saveExtractionData(String companyUrl, String extractionResult, Long portfolioId) {
    try {
      // Parse the JSON result
      JsonNode resultNode = objectMapper.readTree(extractionResult);
      
      // Extract domain first (required field)
      String domain = DomainExtractionUtil.extractRootDomain(companyUrl);
      if (domain == null) {
        throw new IllegalArgumentException("Could not extract domain from URL: " + companyUrl);
      }
      
      // Check if we already have data for this domain (primary lookup strategy)
      CompanyExtractionData existingData = repository.findByDomain(domain).orElse(null);
      
      CompanyExtractionData extractionData;
      if (existingData != null) {
        // Update existing record
        extractionData = existingData;
        // Update URL in case it's different (e.g., www.tesla.com vs tesla.com/about)
        extractionData.setCompanyUrl(companyUrl);
        log.info("Updating existing extraction data for domain '{}' with URL: {}", domain, companyUrl);
      } else {
        // Create new record
        extractionData = new CompanyExtractionData();
        extractionData.setTrackNews(true);
        extractionData.setCompanyUrl(companyUrl);
        extractionData.setDomain(domain);
        log.info("Creating new extraction data for domain '{}' with URL: {}", domain, companyUrl);
      }

      // Portfolio association is now handled via junction table
      
      // Note: createdBy and lastModifiedBy are automatically handled by Spring Data JPA auditing
      // through the BaseEntity and @CreatedBy/@LastModifiedBy annotations

      // Map JSON fields to entity fields
      mapJsonToEntity(resultNode, extractionData);

      // Store the complete raw JSON for future reference
      Map<String, Object> rawData = objectMapper.convertValue(resultNode, Map.class);
      extractionData.setRawExtractionData(rawData);

      // Automatically add technology cluster as a tag if it exists
      addClusterAsTag(resultNode, extractionData);

      // Save to database
      CompanyExtractionData savedData = repository.save(extractionData);
      log.info("Successfully saved extraction data with ID: {}", savedData.getId());

      if (TransactionSynchronizationManager.isSynchronizationActive()) {
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
          @Override
          public void afterCommit() {
            companyPortfolioNarrativeService.generateNarrativeAsync(savedData.getId());
          }
        });
      } else {
        companyPortfolioNarrativeService.generateNarrativeAsync(savedData.getId());
      }
      
      return savedData;
      
    } catch (Exception e) {
      log.error("Error saving extraction data for URL: {}", companyUrl, e);
      throw new RuntimeException("Failed to save extraction data: " + e.getMessage(), e);
    }
  }
  
  /**
   * Map JSON fields to entity fields.
   */
  private void mapJsonToEntity(JsonNode json, CompanyExtractionData entity) {
    // Basic company info
    entity.setCompanyName(getTextValue(json, "company_name"));
    String extractedDescription = getTextValue(json, "company_description");
    entity.setCompanyDescription(extractedDescription);
    // Mirror extraction-time description to the English bilingual
    // column so the inline editor (which uses no-fallback reads)
    // displays the AI-extracted text in the EN tab. The editor
    // saves overwrite this on first user edit and flip the auto
    // flag, so this only matters until the user touches it.
    if (extractedDescription != null) {
      entity.setCompanyDescriptionEn(extractedDescription);
    }
    entity.setIndustrySectors(getTextValue(json, "industry_sectors"));
    entity.setNumberOfEmployees(getTextValue(json, "number_of_employees"));

    // Set headquarter address
    String headquarterAddress = getTextValue(json, "headquarter_address");
    entity.setHeadquarterAddress(headquarterAddress);
    log.debug("Mapping headquarter address: '{}'", headquarterAddress);
    
    // Geocode the address if we have one
    if (headquarterAddress != null && !headquarterAddress.trim().isEmpty()) {
      try {
        GeocodingService.Coordinates coords = geocodingService.geocodeAddress(headquarterAddress);
        if (coords != null) {
          entity.setLatitude(coords.latitude);
          entity.setLongitude(coords.longitude);
          log.debug("Geocoded '{}' to lat: {}, lng: {}", headquarterAddress, coords.latitude, coords.longitude);
        } else {
          log.debug("Could not geocode address: {}", headquarterAddress);
        }
      } catch (Exception e) {
        log.warn("Error geocoding address '{}': {}", headquarterAddress, e.getMessage());
        // Continue without coordinates - we don't want geocoding failures to stop the extraction
      }
    }

    // Financial info - legacy field
    entity.setAnnualSalesLegacy(getTextValue(json, "annual_sales"));
    
    // Annual sales by year - using smart parsing
    mapAnnualSalesData(json, entity, "2022");
    mapAnnualSalesData(json, entity, "2023");
    mapAnnualSalesData(json, entity, "2024");
    
    // Contact info
    entity.setPhoneNumber(getTextValue(json, "phone_number"));
    entity.setContactEmail(getTextValue(json, "contact_email"));

    // Funding info - using smart parsing similar to sales data
    mapFundingData(json, entity);

    // Patent info
    entity.setTotalPatents(getIntegerValue(json, "total_patents"));
    entity.setGrantedPatents(getIntegerValue(json, "granted_patents"));
    entity.setPatentApplications(getIntegerValue(json, "patent_applications"));
    entity.setPatentSearchUrl(getTextValue(json, "patent_search_url"));
    
    // ESG/Sustainability info
    entity.setEsgRating(getTextValue(json, "esg_rating"));
    entity.setEsgScore(getTextValue(json, "esg_score"));
    entity.setSustainabilityOrientation(getTextValue(json, "sustainability_orientation"));
    entity.setSustainabilityImpactArea(getTextValue(json, "sustainability_impact_area"));
    entity.setSustainabilityScore(getTextValue(json, "sustainability_score"));
    
    // Theory of change info
    entity.setTheoryOfChange(getTextValue(json, "theory_of_change"));
    entity.setProblemDescription(getTextValue(json, "problem"));
    entity.setInnovationDescription(getTextValue(json, "innovation"));
    entity.setSdgs(getTextValue(json, "sdgs"));
    entity.setTargetStakeholders(getTextValue(json, "target_stakeholders"));
    entity.setGeographyOfImpact(getTextValue(json, "geography"));
    entity.setPublicImpactSummary(buildPublicImpactSummary(json));

    // Cluster info
    entity.setClusterAssignment(getTextValue(json, "technology_cluster"));
    entity.setClusterJustification(getTextValue(json, "cluster_reasoning"));

    // FinTech classification
    entity.setIsFintech(getBooleanValue(json, "is_fintech"));
    entity.setFintechExplanation(getTextValue(json, "fintech_explanation"));
    entity.setFintechConfidenceScore(getBigDecimalValue(json, "fintech_confidence_score"));

    // Carbon emissions data
    entity.setTotalCarbonEmissions(getTextValue(json, "total_carbon_emissions"));
    entity.setScope1Emissions(getTextValue(json, "scope1_emissions"));
    entity.setScope2Emissions(getTextValue(json, "scope2_emissions"));
    entity.setScope3Emissions(getTextValue(json, "scope3_emissions"));
    
    // ESG Risk Scores
    entity.setEsgRiskEnvironmentalInherent(getBigDecimalValue(json, "esg_risk_environmental_inherent"));
    entity.setEsgRiskEnvironmentalAdjusted(getBigDecimalValue(json, "esg_risk_environmental_adjusted"));
    entity.setEsgRiskSocialInherent(getBigDecimalValue(json, "esg_risk_social_inherent"));
    entity.setEsgRiskSocialAdjusted(getBigDecimalValue(json, "esg_risk_social_adjusted"));
    entity.setEsgRiskGovernanceInherent(getBigDecimalValue(json, "esg_risk_governance_inherent"));
    entity.setEsgRiskGovernanceAdjusted(getBigDecimalValue(json, "esg_risk_governance_adjusted"));
    entity.setEsgRiskTotalInherent(getBigDecimalValue(json, "esg_risk_total_inherent"));
    entity.setEsgRiskTotalAdjusted(getBigDecimalValue(json, "esg_risk_total_adjusted"));

    // ESG Foresight Scores (8-year projection) - Phase 11
    entity.setEsgRiskEnvironmentalForesight(getBigDecimalValue(json, "esg_risk_environmental_foresight"));
    entity.setEsgRiskSocialForesight(getBigDecimalValue(json, "esg_risk_social_foresight"));
    entity.setEsgRiskGovernanceForesight(getBigDecimalValue(json, "esg_risk_governance_foresight"));
    entity.setEsgRiskTotalForesight(getBigDecimalValue(json, "esg_risk_total_foresight"));
    entity.setEsgForesightQualified(getBooleanValue(json, "esg_foresight_qualified"));
    entity.setIsLargeCapMode(getBooleanValue(json, "is_large_cap_mode"));
    entity.setLargeCapThresholdReason(getTextValue(json, "large_cap_threshold_reason"));
    
    // SBMO (Sustainability Business Model Orientation) Scores
    entity.setSbmoCriteriaAScore(getBigDecimalValue(json, "sbmo_criteria_a_score"));
    entity.setSbmoCriteriaBScore(getBigDecimalValue(json, "sbmo_criteria_b_score"));
    entity.setSbmoCriteriaCScore(getBigDecimalValue(json, "sbmo_criteria_c_score"));
    entity.setSbmoCriteriaDScore(getBigDecimalValue(json, "sbmo_criteria_d_score"));
    entity.setSbmoTotalScore(getBigDecimalValue(json, "sbmo_total_score"));
    
    // SBMO Explanations
    entity.setSbmoCriteriaAExplanation(getTextValue(json, "sbmo_criteria_a_explanation"));
    entity.setSbmoCriteriaBExplanation(getTextValue(json, "sbmo_criteria_b_explanation"));
    entity.setSbmoCriteriaCExplanation(getTextValue(json, "sbmo_criteria_c_explanation"));
    entity.setSbmoCriteriaDExplanation(getTextValue(json, "sbmo_criteria_d_explanation"));

    // NEW FIELDS FOR PERFORMANCE - Map from JSON to entity fields
    entity.setLegalForm(getTextValue(json, "legal_form"));
    entity.setLegalEntityFormationDate(getTextValue(json, "legal_entity_formation_date"));
    entity.setCeoName(getTextValue(json, "ceo_name"));
    entity.setCompanyLogo(getTextValue(json, "company_logo"));

    // Scoring fields
    entity.setClusterConfidenceScore(getBigDecimalValue(json, "cluster_confidence_score"));
    entity.setOverallImpactPotentialScore(getBigDecimalValue(json, "overall_impact_potential_score"));
    entity.setImpactMagnitude5Year(getBigDecimalValue(json, "impact_magnitude_5_year"));
    entity.setImpactMagnitude5YearNegative(getBigDecimalValue(json, "impact_magnitude_5_year_negative"));
    entity.setImpactMagnitude5YearNet(getBigDecimalValue(json, "impact_magnitude_5_year_net"));
    entity.setImpactLikelihood(getBigDecimalValue(json, "impact_likelihood"));
    entity.setHighestAbcClassification(calculateHighestAbcClassification(json));
    entity.setGrowthMediaReachScore(getBigDecimalValue(json, "growth_media_reach_score"));
    entity.setGrowthSentimentScore(getBigDecimalValue(json, "growth_sentiment_score"));
    entity.setGrowthInnovationVisibilityScore(getBigDecimalValue(json, "growth_innovation_visibility_score"));
    entity.setGrowthTeamStrengthScore(getBigDecimalValue(json, "growth_team_strength_score"));
    entity.setGrowthFundingVelocityScore(getBigDecimalValue(json, "growth_funding_velocity_score"));
    entity.setGrowthCompanyAgeScore(getBigDecimalValue(json, "growth_company_age_score"));
    entity.setGrowthCompositeScore(getBigDecimalValue(json, "growth_composite_score"));

    // Evidence/certification fields
    entity.setCertificationName(getTextValue(json, "certification_name"));
    entity.setCertificationLink(getTextValue(json, "certification_link"));
    entity.setEsgImpactReport(getBooleanValue(json, "esg_impact_report"));
    entity.setEsgReportYear(getTextValue(json, "esg_report_year"));
    entity.setEsgReportLink(getTextValue(json, "esg_report_link"));
    entity.setPrizeAwardName1(getTextValue(json, "prize_award_name_1"));
    entity.setPrizeAwardLink1(getTextValue(json, "prize_award_link_1"));
    entity.setPrizeAwardName2(getTextValue(json, "prize_award_name_2"));
    entity.setPrizeAwardLink2(getTextValue(json, "prize_award_link_2"));

    // Industry/geographic fields
    entity.setPrimaryIndustryStandard(getTextValue(json, "primary_industry_standard"));
    entity.setSecondaryIndustryStandard(getTextValue(json, "secondary_industry_standard"));
    entity.setGeographicScopeEstimated(getTextValue(json, "geographic_scope_estimated"));

    // ESG Materiality Scores - Calculate from esg_materiality_analysis if available
    calculateAndSetEsgScores(json, entity);

    // Social media links (JSON object)
    if (json.has("social_media_links") && !json.get("social_media_links").isNull()) {
      Map<String, String> socialMediaLinks = new HashMap<>();
      json.get("social_media_links").fields().forEachRemaining(entry -> {
        socialMediaLinks.put(entry.getKey(), entry.getValue().asText());
      });
      entity.setSocialMediaLinks(socialMediaLinks);
    }
    
    // Social media follower counts (JSON object)
    if (json.has("social_media_follower_counts") && !json.get("social_media_follower_counts").isNull()) {
      Map<String, Long> followerCounts = new HashMap<>();
      json.get("social_media_follower_counts").fields().forEachRemaining(entry -> {
        followerCounts.put(entry.getKey(), entry.getValue().asLong());
      });
      entity.setSocialMediaFollowerCounts(followerCounts);
    }
    
    // Website Traffic Data (Feb - July 2025)
    entity.setTrafficFeb2025(getLongValue(json, "traffic_feb_2025"));
    entity.setTrafficMar2025(getLongValue(json, "traffic_mar_2025"));
    entity.setTrafficApr2025(getLongValue(json, "traffic_apr_2025"));
    entity.setTrafficMay2025(getLongValue(json, "traffic_may_2025"));
    entity.setTrafficJun2025(getLongValue(json, "traffic_jun_2025"));
    entity.setTrafficJul2025(getLongValue(json, "traffic_jul_2025"));
    
    // Growth Trend Calculations
    entity.setMonthlyGrowthTrend(getBigDecimalValue(json, "monthly_growth_trend"));
    entity.setThreeMonthGrowthTrend(getBigDecimalValue(json, "three_month_growth_trend"));
    entity.setSixMonthGrowthTrend(getBigDecimalValue(json, "six_month_growth_trend"));
    
    // Confidence scores (JSON object)
    if (json.has("confidence_scores") && !json.get("confidence_scores").isNull()) {
      Map<String, Object> confidenceScores = objectMapper.convertValue(
          json.get("confidence_scores"), Map.class);
      entity.setConfidenceScores(confidenceScores);
    }
    
    // Core products/services (JSON object)
    if (json.has("core_products_services") && !json.get("core_products_services").isNull()) {
      Map<String, Object> coreProductsServices = objectMapper.convertValue(
          json.get("core_products_services"), Map.class);
      entity.setCoreProductsServices(coreProductsServices);
    }

    entity.setPortfolioStrengthsText(null);
    entity.setPortfolioWeaknessesText(null);
    entity.setPortfolioImpactText(null);
    entity.setPortfolioPotentialNeedsText(null);
    entity.setPortfolioNarrativeGeneratedAt(null);

    // Stakeholder geography summary (AI-generated claims)
    entity.setStakeholderGeographySummary(getTextValue(json, "stakeholder_geography_summary"));

    // Track extraction phases completed
    Map<String, Object> phasesCompleted = new HashMap<>();
    phasesCompleted.put("extraction_timestamp", System.currentTimeMillis());
    phasesCompleted.put("phases_run", "all"); // For now, we assume all phases were run
    entity.setExtractionPhasesCompleted(phasesCompleted);
  }
  
  /**
   * Helper method to safely get BigDecimal value from JsonNode.
   */
  private BigDecimal getBigDecimalValue(JsonNode node, String fieldName) {
    if (node.has(fieldName) && !node.get(fieldName).isNull()) {
      try {
        return new BigDecimal(node.get(fieldName).asText());
      } catch (NumberFormatException e) {
        log.warn("Could not parse BigDecimal value for field {}: {}", fieldName, node.get(fieldName).asText());
        return null;
      }
    }
    return null;
  }
  
  /**
   * Helper method to safely get text value from JsonNode.
   */
  private String getTextValue(JsonNode node, String fieldName) {
    if (node.has(fieldName) && !node.get(fieldName).isNull()) {
      JsonNode fieldNode = node.get(fieldName);

      // Special handling for industry_sectors which can be an array
      if ("industry_sectors".equals(fieldName) && fieldNode.isArray()) {
        List<String> sectors = new ArrayList<>();
        for (JsonNode sectorNode : fieldNode) {
          if (!sectorNode.isNull() && !sectorNode.asText().trim().isEmpty()) {
            sectors.add(sectorNode.asText().trim());
          }
        }
        return sectors.isEmpty() ? null : String.join(", ", sectors);
      }

      // TODO: This is a workaround for the SDG/theory_of_change data
      // problem. Jackson's asText() returns "" for arrays/objects, so
      // fields like theory_of_change (JSON array) and sdgs never got
      // persisted to their DB columns. This fix serializes them as JSON
      // strings, but ideally we should:
      // 1. Backfill theory_of_change and sdgs columns from
      //    raw_extraction_data for existing rows
      // 2. Consider whether these columns should be JSONB instead
      //    of VARCHAR so we don't lose structure
      // 3. Review all fields in mapJsonToEntity() for similar
      //    array/object fields that may have been silently dropped
      if (fieldNode.isArray() || fieldNode.isObject()) {
        return fieldNode.toString();
      }

      return fieldNode.asText();
    }
    return null;
  }

  /**
   * Helper method to safely get Boolean value from JsonNode.
   */
  private Boolean getBooleanValue(JsonNode node, String fieldName) {
    if (node.has(fieldName) && !node.get(fieldName).isNull()) {
      return node.get(fieldName).asBoolean();
    }
    return null;
  }

  /**
   * Calculate the highest ABC classification from theory_of_change array.
   * Priority: C (Contribute) > B (Benefit) > A (Avoid Harm)
   */
  private String calculateHighestAbcClassification(JsonNode node) {
    if (!node.has("theory_of_change") || node.get("theory_of_change").isNull()) {
      return null;
    }

    JsonNode tocArray = node.get("theory_of_change");
    if (!tocArray.isArray() || tocArray.size() == 0) {
      return null;
    }

    boolean hasC = false;
    boolean hasB = false;
    boolean hasA = false;

    for (JsonNode impact : tocArray) {
      if (impact.has("abc_classification") && !impact.get("abc_classification").isNull()) {
        JsonNode abcNode = impact.get("abc_classification");
        if (abcNode.has("classification") && !abcNode.get("classification").isNull()) {
          String classification = abcNode.get("classification").asText().toUpperCase();
          if ("C".equals(classification)) {
            hasC = true;
          } else if ("B".equals(classification)) {
            hasB = true;
          } else if ("A".equals(classification)) {
            hasA = true;
          }
        }
      }
    }

    if (hasC) {
      return "C";
    }
    if (hasB) {
      return "B";
    }
    if (hasA) {
      return "A";
    }
    return null;
  }

  /**
   * Helper method to safely get Long value from JsonNode.
   */
  private Long getLongValue(JsonNode node, String fieldName) {
    if (node.has(fieldName) && !node.get(fieldName).isNull()) {
      try {
        return node.get(fieldName).asLong();
      } catch (Exception e) {
        log.warn("Could not parse Long value for field {}: {}", fieldName, node.get(fieldName).asText());
        return null;
      }
    }
    return null;
  }
  
  private Integer getIntegerValue(JsonNode node, String fieldName) {
    if (node.has(fieldName) && !node.get(fieldName).isNull()) {
      try {
        return node.get(fieldName).asInt();
      } catch (Exception e) {
        log.warn("Could not parse Integer value for field {}: {}", fieldName, node.get(fieldName).asText());
        return null;
      }
    }
    return null;
  }

  /**
   * Calculate and set ESG materiality scores from esg_materiality_analysis JSON.
   */
  private void calculateAndSetEsgScores(JsonNode json, CompanyExtractionData entity) {
    if (!json.has("esg_materiality_analysis") || json.get("esg_materiality_analysis").isNull()) {
      return;
    }

    JsonNode esgAnalysis = json.get("esg_materiality_analysis");
    if (!esgAnalysis.has("topics") || !esgAnalysis.get("topics").isArray()) {
      return;
    }

    double sbSum = 0.0;
    double envScore = 0.0;
    double socScore = 0.0;
    double govScore = 0.0;

    for (JsonNode topic : esgAnalysis.get("topics")) {
      double stakeholderVal = 0.0;
      double businessVal = 0.0;

      // Get stakeholder importance score
      if (topic.has("stakeholder_importance") && !topic.get("stakeholder_importance").isNull()) {
        try {
          stakeholderVal = topic.get("stakeholder_importance").asDouble();
        } catch (Exception e) { /* Skip invalid scores */ }
      }

      // Get business importance score (try multiple field names)
      if (topic.has("business_importance") && !topic.get("business_importance").isNull()) {
        try {
          businessVal = topic.get("business_importance").asDouble();
        } catch (Exception e) { /* Skip invalid scores */ }
      } else if (topic.has("sustainability_business_score") && !topic.get("sustainability_business_score").isNull()) {
        try {
          businessVal = topic.get("sustainability_business_score").asDouble();
        } catch (Exception e) { /* Skip invalid scores */ }
      }

      // Get category (try multiple field names)
      String category = null;
      if (topic.has("category") && !topic.get("category").isNull()) {
        category = topic.get("category").asText();
      } else if (topic.has("pillar") && !topic.get("pillar").isNull()) {
        category = topic.get("pillar").asText();
      }

      double totalScore = stakeholderVal + businessVal;
      sbSum += totalScore;

      if ("E".equals(category)) {
        envScore += totalScore;
      } else if ("S".equals(category)) {
        socScore += totalScore;
      } else if ("G".equals(category)) {
        govScore += totalScore;
      }
    }

    // Set the calculated scores
    entity.setEsgSbScoresSum(BigDecimal.valueOf(sbSum));
    entity.setEsgEnvironmentalScore(BigDecimal.valueOf(envScore));
    entity.setEsgSocialScore(BigDecimal.valueOf(socScore));
    entity.setEsgGovernanceScore(BigDecimal.valueOf(govScore));
  }

  /**
   * Map annual sales data with smart parsing and type inference.
   * Handles AI responses intelligently: "N/A" → NULL, numeric values → parsed BigDecimal
   * 
   * @param json The JSON data from AI extraction
   * @param entity The entity to populate
   * @param year The year (2022, 2023, or 2024)
   */
  private void mapAnnualSalesData(JsonNode json, CompanyExtractionData entity, String year) {
    String salesValue = getTextValue(json, "annual_sales_" + year);
    String currency = normalizeCurrency(getTextValue(json, "currency_" + year));
    String companyName = entity.getCompanyName();
    
    // Check if AI provided a type (it usually doesn't)
    String providedType = getTextValue(json, "annual_sales_" + year + "_type");
    
    log.debug("Processing annual sales for {} ({}): value='{}', currency='{}', provided_type='{}'", 
              companyName, year, salesValue, currency, providedType);
    
    // Parse the sales value
    BigDecimal numericValue = SalesValueParser.parse(salesValue, companyName, year);
    
    // Determine the appropriate type and set values
    if (numericValue == null) {
      // No valid sales data
      log.debug("Setting sales data to NULL for {} ({})", companyName, year);
      setSalesDataForYear(entity, year, null, "n.a.", null);
    } else if (currency == null) {
      log.warn("Sales value found but no currency for {} ({}), saving as null", companyName, year);
      setSalesDataForYear(entity, year, null, "n.a.", null);
    } else {
      // Valid numeric data found
      // Default to "estimate" since this is AI-extracted data
      String dataType = "estimate";
      
      // If the AI somehow provided a type and it's valid, use it
      if (providedType != null && 
          (providedType.equals("actual") || providedType.equals("estimate"))) {
        dataType = providedType;
        log.debug("Using AI-provided data type '{}' for {} ({})", dataType, companyName, year);
      }
      setSalesDataForYear(entity, year, numericValue, dataType, currency);
    }
  }
  
  /**
   * Helper method to set sales data for a specific year.
   * Now uses BigDecimal fields directly.
   */
  private void setSalesDataForYear(CompanyExtractionData entity, String year, 
                                  BigDecimal value, String type, String currency) {
    switch (year) {
      case "2022":
        entity.setAnnualSales2022(value);
        entity.setAnnualSales2022Type(type);
        entity.setCurrency2022(currency);
        break;
      case "2023":
        entity.setAnnualSales2023(value);
        entity.setAnnualSales2023Type(type);
        entity.setCurrency2023(currency);
        break;
      case "2024":
        entity.setAnnualSales2024(value);
        entity.setAnnualSales2024Type(type);
        entity.setCurrency2024(currency);
        break;
      default:
        log.warn("Unknown year '{}' for sales data", year);
    }
  }

  /**
   * Map funding data with smart parsing and type inference.
   * Similar to annual sales data but for total funding amount.
   *
   * @param json The JSON data from AI extraction
   * @param entity The entity to populate
   */
  private void mapFundingData(JsonNode json, CompanyExtractionData entity) {
    String fundingValue = getTextValue(json, "total_funding_amount");
    String companyName = entity.getCompanyName();

    // Parse the funding value using the same logic as sales data
    BigDecimal numericValue = SalesValueParser.parse(fundingValue, companyName, "funding");

    // Check if AI provided a type (it usually doesn't)
    String providedType = getTextValue(json, "total_funding_amount_type");

    // Determine the appropriate type and set values
    if (numericValue == null) {
      // No valid funding data
      log.debug("Setting funding data to NULL for {}", companyName);
      entity.setTotalFundingAmount(null);
      entity.setTotalFundingAmountType("n.a.");
      entity.setFundingCurrency(null);
    } else {
      // Valid numeric data found
      // Default to "estimate" since this is AI-extracted data
      String dataType = "estimate";

      // If the AI somehow provided a type and it's valid, use it
      if (providedType != null &&
          (providedType.equals("actual") || providedType.equals("estimate"))) {
        dataType = providedType;
        log.debug("Using AI-provided data type '{}' for {} funding", dataType, companyName);
      }

      // Extract currency from the original funding value
      String currency = extractCurrencyFromValue(fundingValue);
      
      // If no currency found in the value, check if AI provided it separately
      if (currency == null) {
        String providedCurrency = getTextValue(json, "funding_currency");
        if (providedCurrency != null) {
          currency = normalizeCurrency(providedCurrency);
        }
      }
      
      // Log currency extraction result
      if (currency != null) {
        log.debug("Using currency '{}' for {} funding", currency, companyName);
      } else {
        log.debug("No valid currency found for {} funding, saving as null", companyName);
      }

      log.info("Successfully parsed funding data for {}: {} {} ({})",
               companyName, numericValue, currency, dataType);

      entity.setTotalFundingAmount(numericValue);
      entity.setTotalFundingAmountType(dataType);
      entity.setFundingCurrency(currency);
    }
  }

  /**
   * Extract currency from a funding value string.
   * Looks for currency symbols and codes in the text.
   */
  private String extractCurrencyFromValue(String value) {
    if (value == null || value.trim().isEmpty()) {
      return null;
    }

    String upperValue = value.toUpperCase();

    // Check for common currency symbols and codes
    if (upperValue.contains("$") || upperValue.contains("USD")) {
      return "USD";
    }
    if (upperValue.contains("€") || upperValue.contains("EUR")) {
      return "EUR";
    }
    if (upperValue.contains("£") || upperValue.contains("GBP")) {
      return "GBP";
    }
    if (upperValue.contains("¥") || upperValue.contains("JPY")) {
      return "JPY";
    }
    if (upperValue.contains("CHF")) {
      return "CHF";
    }
    if (upperValue.contains("CAD")) {
      return "CAD";
    }
    if (upperValue.contains("AUD")) {
      return "AUD";
    }
    if (upperValue.contains("SEK")) {
      return "SEK";
    }
    if (upperValue.contains("NOK")) {
      return "NOK";
    }
    if (upperValue.contains("DKK")) {
      return "DKK";
    }
    if (upperValue.contains("RUB") || upperValue.contains("₽")) {
      return "RUB";
    }

    return null; // No currency found
  }

  /**
   * Normalize currency values from AI extraction to standard 3-letter codes.
   * This handles cases where AI returns verbose currency descriptions like "million EUR"
   * or "United States Dollar" instead of just the currency code.
   *
   * @param currency The currency string from AI extraction
   * @return The normalized 3-letter currency code, or null if no valid currency found
   */
  private String normalizeCurrency(String currency) {
    if (currency == null || currency.trim().isEmpty()) {
      return null;
    }

    // Pattern to match currency codes that are supported in the frontend dropdown
    // Frontend supports: EUR, USD, GBP, JPY, CNY, CHF, CAD, AUD, SEK, NOK, DKK, INR, SGD, HKD, KRW, RUB
    Pattern pattern = Pattern.compile("\\b(EUR|USD|GBP|JPY|CNY|CHF|CAD|AUD|SEK|NOK|DKK|INR|SGD|HKD|KRW|RUB)\\b");
    Matcher matcher = pattern.matcher(currency.toUpperCase());
    
    if (matcher.find()) {
      String code = matcher.group(1);
      log.debug("Normalized currency '{}' to '{}'", currency, code);
      return code;
    }
    
    // If no valid currency code found, return null rather than saving garbage data
    log.warn("Could not extract valid currency from '{}', saving as null", currency);
    return null;
  }

  /**
   * Delete extraction data by ID, including all related records.
   * This deletes news events, patent events, patents, URL validation events,
   * and portfolio access records before deleting the company.
   *
   * @param id The ID of the extraction data to delete
   */
  @Transactional
  public void deleteById(Long id) {
    try {
      if (!repository.existsById(id)) {
        throw new IllegalArgumentException("Company extraction data not found with ID: " + id);
      }

      log.info("Deleting all related records for company ID: {}", id);

      // Delete related records in the correct order (respecting foreign keys)
      // 1. Delete patent events (references both company and patents)
      patentEventRepository.deleteByCompanyExtractionDataId(id);
      log.debug("Deleted patent events for company ID: {}", id);

      // 2. Delete news events
      newsEventRepository.deleteByCompanyExtractionDataId(id);
      log.debug("Deleted news events for company ID: {}", id);

      // 3. Delete URL validation events
      urlValidationEventRepository.deleteByCompanyExtractionDataId(id);
      log.debug("Deleted URL validation events for company ID: {}", id);

      // 4. Delete patents
      CompanyExtractionData company = repository.findById(id).orElse(null);
      if (company != null) {
        companyPatentRepository.deleteByCompanyExtractionData(company);
        log.debug("Deleted patents for company ID: {}", id);
      }

      // 5. Delete portfolio access records
      portfolioCompanyAccessRepository.deleteByCompanyExtractionDataId(id);
      log.debug("Deleted portfolio access records for company ID: {}", id);

      // 6. Finally delete the company itself
      repository.deleteById(id);
      log.info("Successfully deleted extraction data with ID: {}", id);
    } catch (Exception e) {
      log.error("Error deleting extraction data for ID: {}", id, e);
      throw new RuntimeException("Failed to delete extraction data: " + e.getMessage(), e);
    }
  }

  /**
   * Remove a company from a specific portfolio without deleting it from the database.
   * This only removes the portfolio access record.
   *
   * @param companyId The ID of the company
   * @param portfolioId The ID of the portfolio to remove the company from
   */
  @Transactional
  public void removeFromPortfolio(Long companyId, Long portfolioId) {
    try {
      if (!repository.existsById(companyId)) {
        throw new IllegalArgumentException("Company extraction data not found with ID: " + companyId);
      }

      portfolioCompanyAccessRepository.deleteByCompanyExtractionDataIdAndPortfolioId(
          companyId, portfolioId);
      log.info("Successfully removed company {} from portfolio {}", companyId, portfolioId);
    } catch (Exception e) {
      log.error("Error removing company {} from portfolio {}: {}", companyId, portfolioId, e.getMessage());
      throw new RuntimeException("Failed to remove company from portfolio: " + e.getMessage(), e);
    }
  }

  /**
   * Update company extraction data fields.
   *
   * @param id The ID of the extraction data to update
   * @param updates Map of field names to new values
   * @return Updated data in the format expected by frontend
   */
  @Transactional
  public Map<String, Object> updateCompanyData(Long id, Map<String, Object> updates) {
    // Validate ID and get entity
    CompanyExtractionData entity = repository.findById(id)
        .orElseThrow(() -> new IllegalArgumentException("Company extraction data not found with ID: " + id));
    
    log.debug("Updating {} fields for company ID: {}", updates.size(), id);
    
    // Fields that should not be updated
    final List<String> restrictedFields = Arrays.asList("id", "url", "domain", "company_url");
    
    // Update each field
    updates.forEach((fieldName, value) -> {
      // Skip restricted fields
      if (restrictedFields.contains(fieldName.toLowerCase())) {
        log.warn("Skipping update of restricted field: {}", fieldName);
        return;
      }
      
      try {
        updateEntityField(entity, fieldName, value);
      } catch (Exception e) {
        log.error("Error updating field '{}' for company ID {}: {}", fieldName, id, e.getMessage());
        throw new RuntimeException("Failed to update field '" + fieldName + "': " + e.getMessage());
      }
    });
    
    // Update the raw extraction data to maintain consistency
    Map<String, Object> rawData = entity.getRawExtractionData();
    if (rawData == null) {
      rawData = new HashMap<>();
    }
    
    // Create a final reference for use in lambda
    final Map<String, Object> finalRawData = rawData;
    
    // Merge updates into raw data (excluding restricted fields)
    updates.forEach((key, value) -> {
      if (!restrictedFields.contains(key.toLowerCase())) {
        finalRawData.put(key, value);
      }
    });
    
    // Ensure URL is always present in raw data
    finalRawData.put("url", entity.getCompanyUrl());
    finalRawData.put("company_url", entity.getCompanyUrl());
    
    entity.setRawExtractionData(finalRawData);
    
    // Save and return updated entity
    CompanyExtractionData savedEntity = repository.save(entity);
    log.info("Successfully saved updates for company ID: {}", id);
    
    // Convert to response format
    return convertEntityToResponseFormat(savedEntity);
  }

  /**
   * Update individual entity field based on field name.
   */
  private void updateEntityField(CompanyExtractionData entity, String fieldName, Object value) {
    // Convert value to String for text fields (handle null values)
    String stringValue = value != null ? value.toString() : null;
    
    switch (fieldName) {
      // Basic company info
      case "company_name":
        entity.setCompanyName(stringValue);
        break;
      case "company_description":
        entity.setCompanyDescription(stringValue);
        if (stringValue != null) {
          entity.setCompanyDescriptionEn(stringValue);
        }
        break;
      case "industry_sectors":
        entity.setIndustrySectors(stringValue);
        break;
      case "number_of_employees":
        entity.setNumberOfEmployees(stringValue);
        break;
      case "headquarter_address":
        // Check if address actually changed
        String oldAddress = entity.getHeadquarterAddress();
        entity.setHeadquarterAddress(stringValue);
        log.debug("Setting headquarter address to: '{}'", stringValue);
        
        // Clear coordinates if address is cleared
        if (stringValue == null || stringValue.trim().isEmpty()) {
          entity.setLatitude(null);
          entity.setLongitude(null);
          log.debug("Cleared coordinates due to empty address");
        } else if (!stringValue.equals(oldAddress) || entity.getLatitude() == null || entity.getLongitude() == null) {
          // Geocode if address changed or if we don't have coordinates
          try {
            GeocodingService.Coordinates coords = geocodingService.geocodeAddress(stringValue);
            if (coords != null) {
              entity.setLatitude(coords.latitude);
              entity.setLongitude(coords.longitude);
              log.debug("Geocoded updated address '{}' to lat: {}, lng: {}", stringValue, coords.latitude, coords.longitude);
            } else {
              log.warn("Could not geocode address: {}", stringValue);
            }
          } catch (Exception e) {
            log.warn("Error geocoding updated address '{}': {}", stringValue, e.getMessage());
          }
        }
        break;
      case "annual_sales":
      case "annual_sales_legacy":
        entity.setAnnualSalesLegacy(stringValue);
        break;
      case "annual_sales_2022":
      case "annual_sales_2023":
      case "annual_sales_2024":
        // Extract year from field name
        String year = fieldName.substring(fieldName.lastIndexOf('_') + 1);
        
        // Parse the new sales value
        BigDecimal numericValue = SalesValueParser.parse(stringValue, entity.getCompanyName(), year);
        
        // Update the value
        switch (year) {
          case "2022":
            entity.setAnnualSales2022(numericValue);
            // If clearing the value, also set type to n.a. and clear currency
            if (numericValue == null) {
              entity.setAnnualSales2022Type("n.a.");
              entity.setCurrency2022(null);
              log.info("Cleared annual sales 2022 data for {}", entity.getCompanyName());
            }
            break;
          case "2023":
            entity.setAnnualSales2023(numericValue);
            if (numericValue == null) {
              entity.setAnnualSales2023Type("n.a.");
              entity.setCurrency2023(null);
              log.info("Cleared annual sales 2023 data for {}", entity.getCompanyName());
            }
            break;
          case "2024":
            entity.setAnnualSales2024(numericValue);
            if (numericValue == null) {
              entity.setAnnualSales2024Type("n.a.");
              entity.setCurrency2024(null);
              log.info("Cleared annual sales 2024 data for {}", entity.getCompanyName());
            }
            break;
          default:
            log.warn("Unknown year for annual sales update: {}", year);
            break;
        }
        
        log.info("Updated annual sales {} for {}: '{}' -> {}", 
                 year, entity.getCompanyName(), stringValue, numericValue);
        break;
        
      case "currency_2022":
      case "currency_2023":
      case "currency_2024":
        // When updating currency, validate that we have sales data
        String currencyYear = fieldName.substring(fieldName.lastIndexOf('_') + 1);
        BigDecimal salesValue = null;
        
        // Normalize the currency value before saving
        String normalizedCurrency = normalizeCurrency(stringValue);
        
        switch (currencyYear) {
          case "2022":
            salesValue = entity.getAnnualSales2022();
            entity.setCurrency2022(normalizedCurrency);
            break;
          case "2023":
            salesValue = entity.getAnnualSales2023();
            entity.setCurrency2023(normalizedCurrency);
            break;
          case "2024":
            salesValue = entity.getAnnualSales2024();
            entity.setCurrency2024(normalizedCurrency);
            break;
          default:
            log.warn("Unknown currency year: {}", currencyYear);
            break;
        }
        
        // Warn if setting currency without sales data
        if (salesValue == null && normalizedCurrency != null) {
          log.warn("Setting currency '{}' for {} ({}) but no sales value exists", 
                   normalizedCurrency, entity.getCompanyName(), currencyYear);
        }
        break;
        
      case "annual_sales_2022_type":
      case "annual_sales_2023_type":
      case "annual_sales_2024_type":
        // When updating type, validate consistency
        String typeYear = fieldName.substring(fieldName.lastIndexOf("_type") - 4, fieldName.lastIndexOf("_type"));
        BigDecimal currentSalesValue = null;
        
        switch (typeYear) {
          case "2022":
            currentSalesValue = entity.getAnnualSales2022();
            entity.setAnnualSales2022Type(stringValue);
            break;
          case "2023":
            currentSalesValue = entity.getAnnualSales2023();
            entity.setAnnualSales2023Type(stringValue);
            break;
          case "2024":
            currentSalesValue = entity.getAnnualSales2024();
            entity.setAnnualSales2024Type(stringValue);
            break;
          default:
            log.warn("Unknown type year: {}", typeYear);
            break;
        }
        
        // Validate type consistency
        if (currentSalesValue == null) {
          if (!"n.a.".equals(stringValue)) {
            log.warn("Setting type '{}' for {} ({}) but no sales value exists - should be 'n.a.'", 
                     stringValue, entity.getCompanyName(), typeYear);
          }
        } else {
          if ("n.a.".equals(stringValue)) {
            log.warn("Setting type 'n.a.' for {} ({}) but sales value {} exists", 
                     entity.getCompanyName(), typeYear, currentSalesValue);
          }
        }
        break;
        
      // Contact info
      case "phone_number":
        entity.setPhoneNumber(stringValue);
        break;
      case "contact_email":
        entity.setContactEmail(stringValue);
        break;

      // Funding info
      case "total_funding_amount":
        // Parse the funding value similar to sales data
        BigDecimal fundingValue = SalesValueParser.parse(stringValue, entity.getCompanyName(), "funding");
        entity.setTotalFundingAmount(fundingValue);

        // Update type and currency based on the parsed value
        if (fundingValue == null) {
          entity.setTotalFundingAmountType("n.a.");
          entity.setFundingCurrency(null);
          log.info("Cleared funding data for {}", entity.getCompanyName());
        } else {
          // Set type to estimate if we have a value but no existing type
          if (entity.getTotalFundingAmountType() == null || entity.getTotalFundingAmountType().equals("n.a.")) {
            entity.setTotalFundingAmountType("estimate");
          }
          // Extract and set currency if not already set
          if (entity.getFundingCurrency() == null) {
            String currency = extractCurrencyFromValue(stringValue);
            entity.setFundingCurrency(currency); // Save null if no currency found
          }
        }

        log.info("Updated funding amount for {}: '{}' -> {}",
                 entity.getCompanyName(), stringValue, fundingValue);
        break;

      case "funding_currency":
        entity.setFundingCurrency(normalizeCurrency(stringValue));
        break;

      case "total_funding_amount_type":
        entity.setTotalFundingAmountType(stringValue);
        break;

      // Patent info
      case "patent_search_url":
        entity.setPatentSearchUrl(stringValue);
        break;
        
      // ESG/Sustainability info
      case "esg_rating":
        entity.setEsgRating(stringValue);
        break;
      case "esg_score":
        entity.setEsgScore(stringValue);
        break;
      case "sustainability_orientation":
        entity.setSustainabilityOrientation(stringValue);
        break;
      case "sustainability_impact_area":
        entity.setSustainabilityImpactArea(stringValue);
        break;
      case "sustainability_score":
        entity.setSustainabilityScore(stringValue);
        break;
        
      // Theory of change info
      case "theory_of_change":
        entity.setTheoryOfChange(stringValue);
        break;
      case "highest_abc_classification":
        entity.setHighestAbcClassification(stringValue);
        break;
      case "problem_description":
        entity.setProblemDescription(stringValue);
        break;
      case "innovation_description":
        entity.setInnovationDescription(stringValue);
        break;
      case "sdgs":
        entity.setSdgs(stringValue);
        break;
      case "target_stakeholders":
        entity.setTargetStakeholders(stringValue);
        break;
      case "geography_of_impact":
        entity.setGeographyOfImpact(stringValue);
        break;
        
      // Cluster info
      case "cluster_assignment":
      case "technology_cluster":
        entity.setClusterAssignment(stringValue);
        break;
      case "cluster_justification":
      case "cluster_reasoning":
        entity.setClusterJustification(stringValue);
        break;
        
      // Carbon emissions fields
      case "total_carbon_emissions":
        entity.setTotalCarbonEmissions(stringValue);
        break;
      case "scope1_emissions":
        entity.setScope1Emissions(stringValue);
        break;
      case "scope2_emissions":
        entity.setScope2Emissions(stringValue);
        break;
      case "scope3_emissions":
        entity.setScope3Emissions(stringValue);
        break;
        
      // Handle numeric fields that need special processing
      case "cluster_confidence_score":
        // Remove % sign if present
        if (stringValue != null) {
          stringValue = stringValue.replace("%", "").trim();
        }
        // This will be stored in raw data
        log.debug("Numeric field '{}' will be updated in raw data", fieldName);
        break;
        
      // Handle tags specially
      case "tags":
        if (value instanceof List) {
          entity.setTags((List<String>) value);
        }
        break;
      case "core_products_services":
        if (value instanceof Map) {
          entity.setCoreProductsServices((Map<String, Object>) value);
        }
        break;
      case "social_media_links":
        if (value instanceof Map) {
          @SuppressWarnings("unchecked")
          Map<String, Object> linksMap = (Map<String, Object>) value;
          Map<String, String> convertedLinks = new HashMap<>();
          linksMap.forEach((k, v) -> convertedLinks.put(k, v != null ? v.toString() : null));
          entity.setSocialMediaLinks(convertedLinks);
          log.debug("Updated social_media_links for {}: {}", entity.getCompanyName(), convertedLinks);
        }
        break;
      case "social_media_follower_counts":
        if (value instanceof Map) {
          @SuppressWarnings("unchecked")
          Map<String, Object> followersMap = (Map<String, Object>) value;
          Map<String, Long> convertedFollowers = new HashMap<>();
          followersMap.forEach((k, v) -> {
            if (v != null) {
              if (v instanceof Number) {
                convertedFollowers.put(k, ((Number) v).longValue());
              } else {
                try {
                  convertedFollowers.put(k, Long.parseLong(v.toString()));
                } catch (NumberFormatException e) {
                  log.warn("Could not parse follower count for {}: {}", k, v);
                }
              }
            }
          });
          entity.setSocialMediaFollowerCounts(convertedFollowers);
          log.debug("Updated social_media_follower_counts for {}: {}",
            entity.getCompanyName(), convertedFollowers);
        }
        break;
      case "company_logo":
        entity.setCompanyLogo(stringValue);
        break;

      // Fields that only exist in raw data
      default:
        log.debug("Field '{}' will be updated in raw data only", fieldName);
        break;
    }
  }

  /**
   * Convert entity to response format.
   * Simple approach: Return the raw extraction data plus essential fields.
   */
  public Map<String, Object> convertEntityToResponseFormat(CompanyExtractionData entity) {
    Map<String, Object> response = new HashMap<>();
    
    // Start with raw extraction data - this is the source of truth
    if (entity.getRawExtractionData() != null) {
      response.putAll(entity.getRawExtractionData());
    }
    
    // Add only the absolute essential fields that might not be in raw data
    response.put("id", entity.getId());
    response.put("url", entity.getCompanyUrl());
    response.put("domain", entity.getDomain());
    
    // Format annual sales for display (override raw data with formatted values)
    response.put("annual_sales_2022", formatSalesForDisplay(entity.getAnnualSales2022()));
    response.put("annual_sales_2023", formatSalesForDisplay(entity.getAnnualSales2023()));
    response.put("annual_sales_2024", formatSalesForDisplay(entity.getAnnualSales2024()));
    
    // Ensure type and currency fields are included
    response.put("annual_sales_2022_type", entity.getAnnualSales2022Type());
    response.put("annual_sales_2023_type", entity.getAnnualSales2023Type());
    response.put("annual_sales_2024_type", entity.getAnnualSales2024Type());
    response.put("currency_2022", entity.getCurrency2022());
    response.put("currency_2023", entity.getCurrency2023());
    response.put("currency_2024", entity.getCurrency2024());
    
    // Add coordinates if available
    if (entity.getLatitude() != null && entity.getLongitude() != null) {
      response.put("latitude", entity.getLatitude());
      response.put("longitude", entity.getLongitude());
    }
    
    // Ensure headquarter_address is in the response (frontend expects this field name)
    if (!response.containsKey("headquarter_address") && entity.getHeadquarterAddress() != null) {
      response.put("headquarter_address", entity.getHeadquarterAddress());
    }
    
    // Ensure phone and email fields are always present (even if null)
    // This fixes frontend showing N/A when fields are missing
    if (!response.containsKey("phone_number")) {
      response.put("phone_number", entity.getPhoneNumber() != null ? entity.getPhoneNumber() : "");
    }
    if (!response.containsKey("contact_email")) {
      response.put("contact_email", entity.getContactEmail() != null ? entity.getContactEmail() : "");
    }
    
    // Ensure tags are always present
    response.put("tags", entity.getTags() != null ? entity.getTags() : new ArrayList<>());
    
    // Add core products/services if available
    if (entity.getCoreProductsServices() != null) {
      response.put("core_products_services", entity.getCoreProductsServices());
    }

    // Add social media data if available
    if (entity.getSocialMediaLinks() != null) {
      response.put("social_media_links", entity.getSocialMediaLinks());
    }
    if (entity.getSocialMediaFollowerCounts() != null) {
      response.put("social_media_follower_counts", entity.getSocialMediaFollowerCounts());
    }

    // Add carbon emissions data if available
    if (entity.getTotalCarbonEmissions() != null) {
      response.put("total_carbon_emissions", entity.getTotalCarbonEmissions());
    }
    if (entity.getScope1Emissions() != null) {
      response.put("scope1_emissions", entity.getScope1Emissions());
    }
    if (entity.getScope2Emissions() != null) {
      response.put("scope2_emissions", entity.getScope2Emissions());
    }
    if (entity.getScope3Emissions() != null) {
      response.put("scope3_emissions", entity.getScope3Emissions());
    }
    
    // Ensure emissions_breakdown is included if present in raw data
    if (entity.getRawExtractionData() != null && entity.getRawExtractionData().containsKey("emissions_breakdown")) {
      response.put("emissions_breakdown", entity.getRawExtractionData().get("emissions_breakdown"));
      log.debug("Including emissions_breakdown with {} items", 
          ((List<?>) entity.getRawExtractionData().get("emissions_breakdown")).size());
    }

    response.put("impact_magnitude_5_year", entity.getImpactMagnitude5Year());
    response.put("impact_magnitude_5_year_negative", entity.getImpactMagnitude5YearNegative());
    response.put("impact_magnitude_5_year_net", entity.getImpactMagnitude5YearNet());
    response.put("impact_likelihood", entity.getImpactLikelihood());
    response.put("overall_impact_potential_score", entity.getOverallImpactPotentialScore());

    // Growth likelihood scores
    response.put("growth_media_reach_score", entity.getGrowthMediaReachScore());
    response.put("growth_sentiment_score", entity.getGrowthSentimentScore());
    response.put("growth_innovation_visibility_score", entity.getGrowthInnovationVisibilityScore());
    response.put("growth_team_strength_score", entity.getGrowthTeamStrengthScore());
    response.put("growth_funding_velocity_score", entity.getGrowthFundingVelocityScore());
    response.put("growth_company_age_score", entity.getGrowthCompanyAgeScore());
    response.put("growth_composite_score", entity.getGrowthCompositeScore());
    
    // Add ESG Risk Scores if available
    if (entity.getEsgRiskEnvironmentalInherent() != null) {
      response.put("esg_risk_environmental_inherent", entity.getEsgRiskEnvironmentalInherent());
    }
    if (entity.getEsgRiskEnvironmentalAdjusted() != null) {
      response.put("esg_risk_environmental_adjusted", entity.getEsgRiskEnvironmentalAdjusted());
    }
    if (entity.getEsgRiskSocialInherent() != null) {
      response.put("esg_risk_social_inherent", entity.getEsgRiskSocialInherent());
    }
    if (entity.getEsgRiskSocialAdjusted() != null) {
      response.put("esg_risk_social_adjusted", entity.getEsgRiskSocialAdjusted());
    }
    if (entity.getEsgRiskGovernanceInherent() != null) {
      response.put("esg_risk_governance_inherent", entity.getEsgRiskGovernanceInherent());
    }
    if (entity.getEsgRiskGovernanceAdjusted() != null) {
      response.put("esg_risk_governance_adjusted", entity.getEsgRiskGovernanceAdjusted());
    }
    if (entity.getEsgRiskTotalInherent() != null) {
      response.put("esg_risk_total_inherent", entity.getEsgRiskTotalInherent());
    }
    if (entity.getEsgRiskTotalAdjusted() != null) {
      response.put("esg_risk_total_adjusted", entity.getEsgRiskTotalAdjusted());
    }
    
    // Include explanations if present in raw data
    if (entity.getRawExtractionData() != null) {
      if (entity.getRawExtractionData().containsKey("esg_risk_environmental_explanation")) {
        response.put("esg_risk_environmental_explanation", entity.getRawExtractionData().get("esg_risk_environmental_explanation"));
      }
      if (entity.getRawExtractionData().containsKey("esg_risk_social_explanation")) {
        response.put("esg_risk_social_explanation", entity.getRawExtractionData().get("esg_risk_social_explanation"));
      }
      if (entity.getRawExtractionData().containsKey("esg_risk_governance_explanation")) {
        response.put("esg_risk_governance_explanation", entity.getRawExtractionData().get("esg_risk_governance_explanation"));
      }
    }

    PortfolioRankSnapshot snapshot =
        companyPolarChartService.getPortfolioRankingSnapshot(entity.getId());
    if (snapshot != null) {
      response.put("portfolio_rank", snapshot.getRank());
      response.put("venture_platform_score", snapshot.getAveragePercentile());
      response.put("metrics_considered", snapshot.getMetricsConsidered());
      response.put("ranked_company_count", snapshot.getRankedCompanyCount());
      response.put("portfolio_rank_v2", snapshot.getRankV2());
      response.put("venture_platform_score_v2",
          snapshot.getAveragePercentileV2());
      response.put("metrics_considered_v2",
          snapshot.getMetricsConsideredV2());
      response.put("ranked_company_count_v2",
          snapshot.getRankedCompanyCountV2());
    } else if (!response.containsKey("ranked_company_count")) {
      response.put("ranked_company_count", companyPolarChartService.getRankedCompanyCount());
      response.put("ranked_company_count_v2",
          companyPolarChartService.getRankedCompanyCountV2());
    }
    
    return response;
  }
  
  /**
   * Format sales value for display.
   * 
   * @param salesValue The sales value as BigDecimal
   * @return Formatted string for display (e.g., "1.5M") or null
   */
  private String formatSalesForDisplay(BigDecimal salesValue) {
    if (salesValue == null) {
      return null;
    }
    return SalesValueParser.formatForDisplay(salesValue);
  }
  
  /**
   * Automatically add technology cluster as a tag if it exists in the extraction data.
   * This ensures companies are automatically tagged with their cluster assignment.
   *
   * @param resultNode The JSON result from the extraction pipeline
   * @param extractionData The entity to update with cluster tag
   */
  private void addClusterAsTag(JsonNode resultNode, CompanyExtractionData extractionData) {
    try {
      // Get the technology cluster from the JSON result
      String technologyCluster = resultNode.path("technology_cluster").asText(null);

      if (technologyCluster != null && !technologyCluster.trim().isEmpty()) {
        // Get existing tags or create new list
        List<String> tags = extractionData.getTags();
        if (tags == null) {
          tags = new ArrayList<>();
        } else {
          // Create a mutable copy of the existing tags
          tags = new ArrayList<>(tags);
        }

        // Add cluster as tag if it's not already present
        if (!tags.contains(technologyCluster)) {
          tags.add(technologyCluster);
          extractionData.setTags(tags);
          log.info("Automatically added technology cluster '{}' as tag for company: {}",
                   technologyCluster, extractionData.getCompanyName());
        } else {
          log.debug("Technology cluster '{}' already exists as tag for company: {}",
                    technologyCluster, extractionData.getCompanyName());
        }
      } else {
        log.debug("No technology cluster found to add as tag for company: {}",
                  extractionData.getCompanyName());
      }
    } catch (Exception e) {
      log.error("Error adding cluster as tag for company {}: {}",
                extractionData.getCompanyName(), e.getMessage());
      // Don't fail the entire save operation if tag addition fails
    }
  }

  /**
   * Get all unique tags from the database.
   * DEPRECATED: Tags are now included in the lite endpoint response for better performance.
   * This method is kept for backward compatibility but should be avoided.
   *
   * @return List of unique tag names
   */
  @Deprecated
  public List<String> getAllUniqueTags() {
    log.warn("getAllUniqueTags() called - this is deprecated. Use tags from lite endpoint instead.");

    // More efficient query - only select tags column instead of full entities
    List<CompanyExtractionData> allCompanies = repository.findAll();
    return allCompanies.stream()
        .filter(company -> company.getTags() != null)
        .flatMap(company -> company.getTags().stream())
        .distinct()
        .sorted()
        .collect(Collectors.toList());
  }

  /**
   * Get unique tags only from companies the user has access to.
   * For superadmins, returns all tags. For regular users, only returns tags
   * from companies they can access through their portfolios.
   *
   * @param user The user requesting tags
   * @return List of unique tag names sorted alphabetically
   */
  public List<String> getUniqueTagsForUser(User user) {
    log.info("Getting unique tags for user: {}", user.getEmail());

    // Superadmins get all tags
    if (securityService.isSuperAdmin()) {
      log.info("User is superadmin, returning all tags");
      return getAllUniqueTags();
    }

    // Get all companies the user has access to through their portfolios
    List<Portfolio> userPortfolios = securityService.findMyPortfolios(user);
    if (userPortfolios.isEmpty()) {
      log.info("User has no portfolios, returning empty tag list");
      return new ArrayList<>();
    }

    // Get portfolio IDs
    List<Long> portfolioIds = userPortfolios.stream()
        .map(Portfolio::getId)
        .collect(Collectors.toList());

    // Get companies accessible through these portfolios
    List<CompanyExtractionData> accessibleCompanies =
        portfolioCompanyAccessRepository.findCompaniesByPortfolioIds(portfolioIds);

    // Extract unique tags from accessible companies
    List<String> tags = accessibleCompanies.stream()
        .filter(company -> company.getTags() != null)
        .flatMap(company -> company.getTags().stream())
        .distinct()
        .sorted()
        .collect(Collectors.toList());

    log.info("Returning {} unique tags for user {}", tags.size(), user.getEmail());
    return tags;
  }

  /**
   * Get all company locations for map display using optimized lite format.
   * Returns minimal data needed for map markers: id, name, address, coordinates, tags.
   * OPTIMIZED: Uses lite endpoint logic to avoid loading heavy JSONB data.
   *
   * @return List of company location data
   */
  public List<Map<String, Object>> getAllCompanyLocations() {
    return getAllCompanyLocations(null);
  }
  
  /**
   * Get company locations for map display with optional portfolio filtering.
   * Returns minimal data needed for map markers: id, name, address, coordinates, tags.
   * OPTIMIZED: Uses lite endpoint logic to avoid loading heavy JSONB data.
   *
   * @param portfolioId Optional portfolio ID to filter by
   * @return List of company location data
   */
  public List<Map<String, Object>> getAllCompanyLocations(Long portfolioId) {
    long methodStartTime = System.currentTimeMillis();
    log.info("[getAllCompanyLocations] ===== STARTING OPTIMIZED LOCATIONS ENDPOINT =====");

    // Use the same optimized approach as lite endpoint but return all companies
    long dbStartTime = System.currentTimeMillis();
    List<CompanyExtractionData> companies;
    
    if (portfolioId != null) {
      // Use the new junction table query for portfolio access
      companies = repository.findAllAccessibleByPortfolioId(portfolioId);
      log.info("[getAllCompanyLocations] Filtering by portfolio ID: {}", portfolioId);
    } else {
      companies = repository.findAll();
      log.info("[getAllCompanyLocations] Getting locations for all portfolios");
    }
    
    long dbTime = System.currentTimeMillis() - dbStartTime;
    log.info("[getAllCompanyLocations] *** DB FETCH COMPLETED: {} ms for {} companies ***", dbTime, companies.size());

    // Convert to location format (minimal data for map)
    long conversionStartTime = System.currentTimeMillis();
    List<Map<String, Object>> locations = companies.stream()
        .map(company -> {
          Map<String, Object> location = new HashMap<>();

          // Essential map data only (no JSONB access)
          location.put("id", company.getId());
          location.put("company_name", company.getCompanyName() != null ? company.getCompanyName() : "N/A");
          location.put("headquarter_address", company.getHeadquarterAddress() != null ? company.getHeadquarterAddress() : "N/A");
          location.put("latitude", company.getLatitude());
          location.put("longitude", company.getLongitude());
          location.put("tags", company.getTags() != null ? company.getTags() : new ArrayList<>());
          location.put("url", company.getCompanyUrl());

          // Additional fields for map info windows (from entity fields only)
          location.put("industry_sectors", company.getIndustrySectors());
          location.put("number_of_employees", company.getNumberOfEmployees());
          location.put("contact_email", company.getContactEmail());
          location.put("phone_number", company.getPhoneNumber());
          location.put("company_logo", company.getCompanyLogo());

          return location;
        })
        .collect(Collectors.toList());

    long conversionTime = System.currentTimeMillis() - conversionStartTime;
    log.info("[getAllCompanyLocations] *** CONVERSION COMPLETED: {} ms ***", conversionTime);

    long totalTime = System.currentTimeMillis() - methodStartTime;
    log.info("[getAllCompanyLocations] ===== TOTAL METHOD TIME: {} ms =====", totalTime);
    log.info("[getAllCompanyLocations] Returning {} company locations", locations.size());

    return locations;
  }

  /**
   * Calculate portfolio totals from all companies in the database.
   * Returns aggregated metrics for display in the frontend grey boxes.
   *
   * @return Map containing portfolio totals
   */
  public Map<String, Object> calculatePortfolioTotals() {
    return calculatePortfolioTotals(null);
  }
  
  /**
   * Calculate portfolio totals with optional portfolio filtering.
   * Returns aggregated metrics for display in the frontend grey boxes.
   *
   * @param portfolioId Optional portfolio ID to filter by
   * @return Map containing portfolio totals
   */
  public Map<String, Object> calculatePortfolioTotals(Long portfolioId) {
    List<CompanyExtractionData> companies;
    
    if (portfolioId != null) {
      // Use the new junction table query for portfolio access
      companies = repository.findAllAccessibleByPortfolioId(portfolioId);
      log.info("Calculating totals for portfolio {}: {} companies", portfolioId, companies.size());
    } else {
      companies = repository.findAll();
      log.info("Calculating totals for all portfolios: {} companies", companies.size());
    }

    Map<String, Object> totals = new HashMap<>();
    totals.put("totalCompanies", companies.size());
    totals.put("totalEmployees", calculateTotalEmployees(companies));
    totals.put("totalPatents", calculateTotalPatents(companies));
    totals.put("totalSocialMediaFollowers", calculateTotalSocialMediaFollowers(companies));
    totals.put("totalDailyTraffic", calculateTotalDailyTraffic(companies));
    totals.put("companiesWithReports", calculateCompaniesWithReports(companies));

    SalesTotals salesTotals = calculateTotalSales(companies);
    totals.put("totalSales", salesTotals.getDisplayValue());
    totals.put("totalSalesRaw", salesTotals.getRawValue());
    totals.put("totalSalesCurrency", salesTotals.getPrimaryCurrency());

    // Add carbon emissions totals
    Map<String, Object> carbonEmissions = calculateCarbonEmissionsTotals(companies);
    totals.putAll(carbonEmissions);

    return totals;
  }

  /**
   * Calculate total employees across all companies.
   * Handles various formats like "1,000", "1000 employees", ranges like "11-50", and plus signs like "1000+".
   */
  private long calculateTotalEmployees(List<CompanyExtractionData> companies) {
    return companies.stream()
        .filter(company -> company.getNumberOfEmployees() != null && !company.getNumberOfEmployees().equals("N/A"))
        .mapToLong(company -> parseEmployeeCount(company.getNumberOfEmployees()))
        .sum();
  }

  /**
   * Parse employee count from various string formats.
   * Handles ranges (takes middle value), plus signs, commas, and regular numbers.
   */
  private long parseEmployeeCount(String employeesStr) {
    if (employeesStr == null || employeesStr.trim().isEmpty() || "N/A".equals(employeesStr)) {
      return 0;
    }

    String cleaned = employeesStr.trim().toLowerCase();

    try {
      // Handle ranges (take the middle value for better accuracy)
      if (cleaned.contains("-")) {
        String[] parts = cleaned.split("-");
        if (parts.length >= 2) {
          String lowerBound = parts[0].replaceAll("[^0-9]", "");
          String upperBound = parts[1].replaceAll("[^0-9]", "");
          if (!lowerBound.isEmpty() && !upperBound.isEmpty()) {
            long lower = Long.parseLong(lowerBound);
            long upper = Long.parseLong(upperBound);
            long middle = (lower + upper) / 2;
            log.debug("Parsed employee range '{}' as middle value: {}", employeesStr, middle);
            return middle;
          }
        } else if (parts.length >= 1) {
          // Fallback to lower bound if upper bound is missing
          String lowerBound = parts[0].replaceAll("[^0-9]", "");
          if (!lowerBound.isEmpty()) {
            return Long.parseLong(lowerBound);
          }
        }
      }

      // Handle plus signs (remove + and take the number)
      if (cleaned.contains("+")) {
        String withoutPlus = cleaned.replace("+", "").replaceAll("[^0-9]", "");
        if (!withoutPlus.isEmpty()) {
          return Long.parseLong(withoutPlus);
        }
      }

      // Handle regular numbers (remove commas, spaces, etc.)
      String numbersOnly = cleaned.replaceAll("[^0-9]", "");
      if (!numbersOnly.isEmpty()) {
        return Long.parseLong(numbersOnly);
      }

    } catch (NumberFormatException e) {
      // Log the problematic value for debugging
      log.warn("Could not parse employee count: '{}'", employeesStr);
      return 0;
    }

    return 0;
  }

  /**
   * Parse patent count from string to integer.
   */
  private Integer parsePatentCount(String patentStr) {
    if (patentStr == null || patentStr.trim().isEmpty() || "N/A".equals(patentStr) || "Unknown".equals(patentStr)) {
      return null;
    }

    try {
      // Handle ranges like "5-10" by taking the lower number
      if (patentStr.contains("-")) {
        String[] parts = patentStr.split("-");
        if (parts.length > 0) {
          return Integer.parseInt(parts[0].trim());
        }
      }

      // Handle single numbers
      return Integer.parseInt(patentStr.trim());
    } catch (NumberFormatException e) {
      log.warn("Could not parse patent count: {}", patentStr);
      return null;
    }
  }

  /**
   * Calculate total patents across all companies.
   */
  private long calculateTotalPatents(List<CompanyExtractionData> companies) {
    return companies.stream()
        .filter(company -> company.getTotalPatents() != null)
        .mapToLong(company -> company.getTotalPatents().longValue())
        .sum();
  }

  /**
   * Calculate total social media followers across all companies and platforms.
   * Filters out obviously incorrect data that would skew totals.
   */
  private long calculateTotalSocialMediaFollowers(List<CompanyExtractionData> companies) {
    final long MAX_REASONABLE_FOLLOWERS = 50_000_000L; // 50M threshold - anything above is likely wrong

    return companies.stream()
        .filter(company -> company.getSocialMediaFollowerCounts() != null)
        .mapToLong(company -> {
          Map<String, Long> followerCounts = company.getSocialMediaFollowerCounts();
          return followerCounts.values().stream()
              .filter(count -> count != null && count > 0)
              .filter(count -> {
                if (count > MAX_REASONABLE_FOLLOWERS) {
                  log.warn("Ignoring suspicious follower count for {}: {} (likely extraction error)",
                      company.getCompanyName(), count);
                  return false; // Throw it out completely
                }
                return true;
              })
              .mapToLong(Long::longValue)
              .sum();
        })
        .sum();
  }

  /**
   * Count companies that have impact-related data.
   * Uses SBMO total score (entity field preferred, falls back to raw JSON).
   */
  private long calculateCompaniesWithImpact(List<CompanyExtractionData> companies) {
    return companies.stream()
        .filter(company -> {
          if (company.getSbmoTotalScore() != null) {
            return company.getSbmoTotalScore().doubleValue() > 0;
          }
          if (company.getRawExtractionData() != null) {
            Object score = company.getRawExtractionData().get("sbmo_total_score");
            if (score != null) {
              try {
                return Double.parseDouble(score.toString()) > 0;
              } catch (NumberFormatException e) {
                log.debug("Unable to parse sbmo_total_score for {}: {}", company.getCompanyName(), score);
                return false;
              }
            }
          }
          return false;
        })
        .count();
  }

  /**
   * Count companies that have certifications.
   * Matches frontend logic: checks if certification_name exists and isn't empty or 'N/A'
   */
  private long calculateCompaniesWithCertifications(List<CompanyExtractionData> companies) {
    return companies.stream()
        .filter(company -> {
          if (company.getRawExtractionData() != null) {
            Object certName = company.getRawExtractionData().get("certification_name");
            return certName != null && !certName.equals("") && !certName.equals("N/A");
          }
          return false;
        })
        .count();
  }

  /**
   * Calculate total daily traffic across all companies.
   * Sums up the average daily traffic based on latest month data.
   *
   * @param companies List of companies to calculate traffic for
   * @return Total daily traffic across all companies
   */
  private long calculateTotalDailyTraffic(
      final List<CompanyExtractionData> companies) {
    final int daysInMonth = 30;
    return companies.stream()
        .mapToLong(company -> {
          // Get the latest traffic month value
          Long latestTraffic = getLatestMonthlyTraffic(company);
          if (latestTraffic != null && latestTraffic > 0) {
            // Convert monthly traffic to daily average
            return latestTraffic / daysInMonth;
          }
          return 0;
        })
        .sum();
  }

  /**
   * Get the latest available monthly traffic for a company.
   * Checks traffic fields in reverse chronological order.
   *
   * @param company Company to get traffic for
   * @return Latest monthly traffic or null if none available
   */
  private Long getLatestMonthlyTraffic(
      final CompanyExtractionData company) {
    // Check 2025 months first (most recent)
    if (company.getTrafficAug2025() != null
        && company.getTrafficAug2025() > 0) {
      return company.getTrafficAug2025();
    }
    if (company.getTrafficJul2025() != null
        && company.getTrafficJul2025() > 0) {
      return company.getTrafficJul2025();
    }
    if (company.getTrafficJun2025() != null
        && company.getTrafficJun2025() > 0) {
      return company.getTrafficJun2025();
    }
    if (company.getTrafficMay2025() != null
        && company.getTrafficMay2025() > 0) {
      return company.getTrafficMay2025();
    }
    if (company.getTrafficApr2025() != null
        && company.getTrafficApr2025() > 0) {
      return company.getTrafficApr2025();
    }
    if (company.getTrafficMar2025() != null
        && company.getTrafficMar2025() > 0) {
      return company.getTrafficMar2025();
    }
    if (company.getTrafficFeb2025() != null
        && company.getTrafficFeb2025() > 0) {
      return company.getTrafficFeb2025();
    }
    if (company.getTrafficJan2025() != null
        && company.getTrafficJan2025() > 0) {
      return company.getTrafficJan2025();
    }

    // Check 2024 months
    if (company.getTrafficDec2024() != null
        && company.getTrafficDec2024() > 0) {
      return company.getTrafficDec2024();
    }
    if (company.getTrafficNov2024() != null
        && company.getTrafficNov2024() > 0) {
      return company.getTrafficNov2024();
    }
    if (company.getTrafficOct2024() != null
        && company.getTrafficOct2024() > 0) {
      return company.getTrafficOct2024();
    }
    if (company.getTrafficSep2024() != null
        && company.getTrafficSep2024() > 0) {
      return company.getTrafficSep2024();
    }
    if (company.getTrafficAug2024() != null
        && company.getTrafficAug2024() > 0) {
      return company.getTrafficAug2024();
    }
    if (company.getTrafficJul2024() != null
        && company.getTrafficJul2024() > 0) {
      return company.getTrafficJul2024();
    }
    if (company.getTrafficJun2024() != null
        && company.getTrafficJun2024() > 0) {
      return company.getTrafficJun2024();
    }
    if (company.getTrafficMay2024() != null
        && company.getTrafficMay2024() > 0) {
      return company.getTrafficMay2024();
    }
    if (company.getTrafficApr2024() != null
        && company.getTrafficApr2024() > 0) {
      return company.getTrafficApr2024();
    }
    if (company.getTrafficMar2024() != null
        && company.getTrafficMar2024() > 0) {
      return company.getTrafficMar2024();
    }
    if (company.getTrafficFeb2024() != null
        && company.getTrafficFeb2024() > 0) {
      return company.getTrafficFeb2024();
    }
    if (company.getTrafficJan2024() != null
        && company.getTrafficJan2024() > 0) {
      return company.getTrafficJan2024();
    }

    // Check 2023 months
    if (company.getTrafficDec2023() != null
        && company.getTrafficDec2023() > 0) {
      return company.getTrafficDec2023();
    }
    if (company.getTrafficNov2023() != null
        && company.getTrafficNov2023() > 0) {
      return company.getTrafficNov2023();
    }
    if (company.getTrafficOct2023() != null
        && company.getTrafficOct2023() > 0) {
      return company.getTrafficOct2023();
    }
    if (company.getTrafficSep2023() != null
        && company.getTrafficSep2023() > 0) {
      return company.getTrafficSep2023();
    }
    if (company.getTrafficAug2023() != null
        && company.getTrafficAug2023() > 0) {
      return company.getTrafficAug2023();
    }

    return null;
  }

  /**
   * Count companies that have ESG/Impact reports.
   * Checks if esgImpactReport field is true.
   *
   * @param companies List of companies to check for reports
   * @return Count of companies with ESG/Impact reports
   */
  private long calculateCompaniesWithReports(
      final List<CompanyExtractionData> companies) {
    return companies.stream()
        .filter(company -> company.getEsgImpactReport() != null
                        && company.getEsgImpactReport())
        .count();
  }

  /**
   * Calculate total sales across all companies.
   * Sums up the most recent annual sales (2024, then 2023, then 2022) for all companies.
   */
  private SalesTotals calculateTotalSales(List<CompanyExtractionData> companies) {
    double totalSales = 0.0;
    String primaryCurrency = null;
    Map<String, Double> salesByCurrency = new HashMap<>();
    
    for (CompanyExtractionData company : companies) {
      // Try to get the most recent sales data (2024 first, then 2023, then 2022)
      BigDecimal salesValue = null;
      String currency = null;
      
      if (company.getAnnualSales2024() != null) {
        salesValue = company.getAnnualSales2024();
        currency = company.getCurrency2024();
      } else if (company.getAnnualSales2023() != null) {
        salesValue = company.getAnnualSales2023();
        currency = company.getCurrency2023();
      } else if (company.getAnnualSales2022() != null) {
        salesValue = company.getAnnualSales2022();
        currency = company.getCurrency2022();
      }
      
      if (salesValue != null && salesValue.compareTo(BigDecimal.ZERO) > 0) {
        double value = salesValue.doubleValue();
        
        // Track sales by currency
        if (currency != null && !currency.isEmpty()) {
          salesByCurrency.put(currency, salesByCurrency.getOrDefault(currency, 0.0) + value);
        } else {
          // If no currency, add to a default category
          salesByCurrency.put("Unknown", salesByCurrency.getOrDefault("Unknown", 0.0) + value);
        }
        
        totalSales += value;
      }
    }
    
    // Find the most common currency
    if (!salesByCurrency.isEmpty()) {
      primaryCurrency = salesByCurrency.entrySet().stream()
          .max(Map.Entry.comparingByValue())
          .map(Map.Entry::getKey)
          .orElse("USD");
    }
    
    String displayValue;
    if (totalSales == 0) {
      displayValue = "N/A";
    } else if (totalSales >= 1_000_000_000) {
      // Format as billions
      displayValue = String.format("%.1fB %s", totalSales / 1_000_000_000,
          primaryCurrency != null ? primaryCurrency : "");
    } else if (totalSales >= 1_000_000) {
      // Format as millions
      displayValue = String.format("%.1fM %s", totalSales / 1_000_000,
          primaryCurrency != null ? primaryCurrency : "");
    } else if (totalSales >= 1_000) {
      // Format as thousands
      displayValue = String.format("%.1fK %s", totalSales / 1_000,
          primaryCurrency != null ? primaryCurrency : "");
    } else {
      // Format as is
      displayValue = String.format("%.0f %s", totalSales, primaryCurrency != null ? primaryCurrency : "");
    }

    return new SalesTotals(totalSales, displayValue, primaryCurrency);
  }

  /**
   * Calculate carbon emissions totals across all companies.
   * Returns aggregated carbon emissions data for portfolio totals.
   */
  private Map<String, Object> calculateCarbonEmissionsTotals(List<CompanyExtractionData> companies) {
    Map<String, Object> emissionsTotals = new HashMap<>();

    // Count companies with carbon emissions data
    long companiesWithEmissions = companies.stream()
        .filter(company -> company.getTotalCarbonEmissions() != null &&
                          !company.getTotalCarbonEmissions().equals("N/A") &&
                          !company.getTotalCarbonEmissions().trim().isEmpty())
        .count();

    // Calculate total emissions by scope
    double totalScope1 = companies.stream()
        .filter(company -> company.getScope1Emissions() != null && !company.getScope1Emissions().equals("N/A"))
        .mapToDouble(company -> parseEmissionValue(company.getScope1Emissions()))
        .sum();

    double totalScope2 = companies.stream()
        .filter(company -> company.getScope2Emissions() != null && !company.getScope2Emissions().equals("N/A"))
        .mapToDouble(company -> parseEmissionValue(company.getScope2Emissions()))
        .sum();

    double totalScope3 = companies.stream()
        .filter(company -> company.getScope3Emissions() != null && !company.getScope3Emissions().equals("N/A"))
        .mapToDouble(company -> parseEmissionValue(company.getScope3Emissions()))
        .sum();

    // Calculate total emissions across all scopes
    double totalEmissions = companies.stream()
        .filter(company -> company.getTotalCarbonEmissions() != null && !company.getTotalCarbonEmissions().equals("N/A"))
        .mapToDouble(company -> parseEmissionValue(company.getTotalCarbonEmissions()))
        .sum();

    // If total emissions is 0 but we have scope data, calculate from scopes
    if (totalEmissions == 0 && (totalScope1 > 0 || totalScope2 > 0 || totalScope3 > 0)) {
      totalEmissions = totalScope1 + totalScope2 + totalScope3;
    }

    emissionsTotals.put("companiesWithEmissions", companiesWithEmissions);
    emissionsTotals.put("totalCarbonEmissions", Math.round(totalEmissions * 100.0) / 100.0); // Round to 2 decimal places
    emissionsTotals.put("totalScope1Emissions", Math.round(totalScope1 * 100.0) / 100.0);
    emissionsTotals.put("totalScope2Emissions", Math.round(totalScope2 * 100.0) / 100.0);
    emissionsTotals.put("totalScope3Emissions", Math.round(totalScope3 * 100.0) / 100.0);

    return emissionsTotals;
  }

  /**
   * Parse emission value from string, handling various formats.
   * Returns 0.0 if parsing fails.
   */
  private double parseEmissionValue(String emissionStr) {
    if (emissionStr == null || emissionStr.trim().isEmpty() || emissionStr.equals("N/A")) {
      return 0.0;
    }

    try {
      // Remove common suffixes and clean the string
      String cleaned = emissionStr.trim()
          .replaceAll("(?i)\\s*tco2e?\\s*$", "") // Remove tCO2e or tCO2 suffix
          .replaceAll("(?i)\\s*tonnes?\\s*$", "") // Remove tonnes suffix
          .replaceAll("(?i)\\s*tons?\\s*$", "") // Remove tons suffix
          .replaceAll(",", "") // Remove commas
          .trim();

      return Double.parseDouble(cleaned);
    } catch (NumberFormatException e) {
      log.warn("Could not parse emission value: '{}'", emissionStr);
      return 0.0;
    }
  }

  /**
   * Get companies formatted for display in the frontend with pagination.
   *
   * @param page The page number (0-based)
   * @param size The page size
   * @return Map containing paginated companies and metadata
   */
  public Map<String, Object> getAllCompaniesForDisplay(int page, int size) {
    log.info("[getAllCompaniesForDisplay] Starting - page: {}, size: {}", page, size);

    // Create pageable with sorting by last modified date descending
    PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "lastModifiedAt"));

    // Get page of companies
    Page<CompanyExtractionData> companiesPage = repository.findAll(pageable);

    log.info("[getAllCompaniesForDisplay] Found {} companies on page {}, total elements: {}",
        companiesPage.getNumberOfElements(), page, companiesPage.getTotalElements());

    // Convert entities to response format
    List<Map<String, Object>> content = companiesPage.getContent().stream()
        .map(company -> {
          Map<String, Object> converted = convertEntityToResponseFormat(company);
          log.debug("[getAllCompaniesForDisplay] Company {} - Carbon emissions: total={}, scope1={}, scope2={}, scope3={}",
              company.getCompanyName(),
              converted.get("total_carbon_emissions"),
              converted.get("scope1_emissions"),
              converted.get("scope2_emissions"),
              converted.get("scope3_emissions"));
          return converted;
        })
        .collect(Collectors.toList());

    // Build response with pagination metadata
    Map<String, Object> response = new HashMap<>();
    response.put("content", content);
    response.put("totalElements", companiesPage.getTotalElements());
    response.put("totalPages", companiesPage.getTotalPages());
    response.put("currentPage", page);
    response.put("pageSize", size);
    response.put("isFirst", companiesPage.isFirst());
    response.put("isLast", companiesPage.isLast());

    log.info("[getAllCompaniesForDisplay] Returning response with {} companies", content.size());

    return response;
  }

  /**
   * Search companies by name with pagination.
   *
   * @param searchTerm The search term to match against company names
   * @param page The page number (0-based)
   * @param size The page size
   * @return Map containing paginated search results and metadata
   */
  public Map<String, Object> searchCompaniesByName(String searchTerm, int page, int size) {
    log.info("[searchCompaniesByName] Starting search - term: '{}', page: {}, size: {}", searchTerm, page, size);

    // Get matching companies using the existing repository method
    List<CompanyExtractionData> allMatches = repository.findByCompanyNameContainingIgnoreCase(searchTerm);

    // Sort by last modified date descending (since repository method doesn't support sorting)
    allMatches.sort((a, b) -> b.getLastModifiedAt().compareTo(a.getLastModifiedAt()));

    // Manual pagination since the repository method doesn't support Pageable
    int totalElements = allMatches.size();
    int startIndex = page * size;
    int endIndex = Math.min(startIndex + size, totalElements);

    List<CompanyExtractionData> pageContent = allMatches.subList(startIndex, endIndex);

    log.info("[searchCompaniesByName] Found {} total matches for '{}', showing {} on page {}",
        totalElements, searchTerm, pageContent.size(), page);

    // Convert entities to response format
    List<Map<String, Object>> content = pageContent.stream()
        .map(this::convertEntityToResponseFormat)
        .collect(Collectors.toList());

    // Build response with pagination metadata
    Map<String, Object> response = new HashMap<>();
    response.put("content", content);
    response.put("totalElements", totalElements);
    response.put("totalPages", (int) Math.ceil((double) totalElements / size));
    response.put("currentPage", page);
    response.put("pageSize", size);
    response.put("isFirst", page == 0);
    response.put("isLast", endIndex >= totalElements);
    response.put("searchTerm", searchTerm);

    log.info("[searchCompaniesByName] Returning search response with {} companies", content.size());

    return response;
  }

  /**
   * Get companies in lite format for improved performance.
   * Excludes heavy fields and truncates text fields to reduce payload size.
   * Sorting is handled client-side for better performance since we send all companies.
   *
   * @param page The page number (0-based)
   * @param size The page size
   * @param search Optional search term to filter company names
   * @return Map containing paginated lite company data and metadata
   */
  public Map<String, Object> getAllCompaniesLite(int page, int size, String search) {
    return getAllCompaniesLite(page, size, search, null, null);
  }

  /**
   * Get all companies data in lite format with portfolio filtering.
   *
   * @param page The page number
   * @param size The page size
   * @param search Optional search term
   * @param portfolioId Optional portfolio ID to filter by
   * @return Map containing paginated lite company data and metadata
   */
  public Map<String, Object> getAllCompaniesLite(int page, int size,
      String search, Long portfolioId) {
    return getAllCompaniesLite(page, size, search, portfolioId, null);
  }

  /**
   * Get all companies data in lite format with portfolio filtering and sparse fieldsets.
   * Sorting is handled client-side for better performance.
   *
   * @param page The page number
   * @param size The page size
   * @param search Optional search term
   * @param portfolioId Optional portfolio ID to filter by
   * @param fields Optional set of field names to include (sparse fieldsets)
   * @return Map containing paginated lite company data and metadata
   */
  public Map<String, Object> getAllCompaniesLite(int page, int size,
      String search, Long portfolioId, Set<String> fields) {
    long methodStartTime = System.currentTimeMillis();
    log.info("[getAllCompaniesLite] ===== STARTING LITE ENDPOINT (PROJECTION) =====");
    log.info("[getAllCompaniesLite] Parameters - page: {}, size: {}, search: '{}', "
        + "portfolioId: {}", page, size, search, portfolioId);

    // Create pageable with default sorting by lastModifiedAt DESC (client handles all other sorting)
    long pageableStartTime = System.currentTimeMillis();
    Sort sort = Sort.by(Sort.Direction.DESC, "lastModifiedAt");
    PageRequest pageable = PageRequest.of(page, size, sort);
    log.info("[getAllCompaniesLite] Pageable creation took: {} ms",
        System.currentTimeMillis() - pageableStartTime);

    // Get page of companies using PROJECTION (excludes large JSONB fields)
    long dbStartTime = System.currentTimeMillis();
    Page<CompanyExtractionDataLiteProjection> companiesPage;

    if (portfolioId != null) {
      log.info("[getAllCompaniesLite] Filtering by portfolio ID: {}", portfolioId);
      if (search != null && !search.trim().isEmpty()) {
        log.info("[getAllCompaniesLite] Performing SEARCH query (projection) for portfolio {}: '{}'", portfolioId, search.trim());
        // Use projection-based search for portfolio
        companiesPage = repository.searchAllAccessibleByPortfolioIdProjected(search.trim(), portfolioId, pageable);
      } else {
        log.info("[getAllCompaniesLite] Performing FINDALL query (projection) for portfolio {}", portfolioId);
        // Use projection-based query for getting all accessible companies
        companiesPage = repository.findAllAccessibleByPortfolioIdProjected(portfolioId, pageable);
      }
    } else {
      // No portfolio filter - show all companies
      if (search != null && !search.trim().isEmpty()) {
        log.info("[getAllCompaniesLite] Performing SEARCH query (projection) for ALL portfolios: '{}'", search.trim());
        // Use paginated projection search
        companiesPage = repository.findByCompanyNameContainingIgnoreCaseProjected(search.trim(), pageable);
      } else {
        log.info("[getAllCompaniesLite] Performing FINDALL query (projection) for ALL portfolios");
        companiesPage = repository.findAllProjectedBy(pageable);
      }
    }
    long dbTime = System.currentTimeMillis() - dbStartTime;
    log.info("[getAllCompaniesLite] *** DB FETCH (PROJECTION) COMPLETED: {} ms for {} companies ***",
             dbTime, companiesPage.getNumberOfElements());

    log.info("[getAllCompaniesLite] Found {} companies on page {}, total elements: {}",
        companiesPage.getNumberOfElements(), page, companiesPage.getTotalElements());

    // No server-side sorting - all sorting handled by client for better performance

    // Convert projections to lite format (with optional field selection)
    long conversionStartTime = System.currentTimeMillis();
    log.info("[getAllCompaniesLite] Starting conversion to lite format for {} companies (fields: {})",
        companiesPage.getNumberOfElements(), fields != null ? fields.size() : "all");
    final Set<String> requestedFields = fields;
    List<Map<String, Object>> content = companiesPage.getContent().stream()
        .map(projection -> convertProjectionToLiteFormat(projection, requestedFields))
        .collect(Collectors.toList());
    long conversionTime = System.currentTimeMillis() - conversionStartTime;
    log.info("[getAllCompaniesLite] *** CONVERSION COMPLETED: {} ms ({} ms per company) ***",
             conversionTime, companiesPage.getNumberOfElements() > 0 ? conversionTime / companiesPage.getNumberOfElements() : 0);

    // Attach portfolio ranking metadata from cached calculations
    List<Long> companyIds = companiesPage.getContent().stream()
        .map(CompanyExtractionDataLiteProjection::getId)
        .collect(Collectors.toList());
    Map<Long, PortfolioRankSnapshot> rankSnapshots =
        companyPolarChartService.getPortfolioRankingSnapshots(companyIds);
    int globalRankedCompanies = companyPolarChartService.getRankedCompanyCount();
    int globalRankedCompaniesV2 =
        companyPolarChartService.getRankedCompanyCountV2();

    Map<Long, Integer> portfolioRankMap = new HashMap<>();
    Map<Long, Integer> portfolioRankMapV2 = new HashMap<>();
    int portfolioRankedCount = globalRankedCompanies;
    int portfolioRankedCountV2 = globalRankedCompaniesV2;
    if (portfolioId != null) {
      List<Long> portfolioCompanyIds = repository
          .findIdsAccessibleByPortfolioId(portfolioId);
      if (!portfolioCompanyIds.isEmpty()) {
        Map<Long, PortfolioRankSnapshot> portfolioSnapshots =
            companyPolarChartService.getPortfolioRankingSnapshots(portfolioCompanyIds);
        List<PortfolioRankSnapshot> orderedSnapshots =
            portfolioSnapshots.values().stream()
                .sorted(Comparator
                    .comparing(PortfolioRankSnapshot::getAveragePercentile)
                    .reversed()
                    .thenComparing(PortfolioRankSnapshot::getCompanyId))
                .collect(Collectors.toList());
        portfolioRankedCount = orderedSnapshots.size();
        double lastScore = Double.NaN;
        int processed = 0;
        int currentRank = 0;
        for (PortfolioRankSnapshot snapshot : orderedSnapshots) {
          processed++;
          double score = snapshot.getAveragePercentile();
          if (processed == 1
              || Math.abs(score - lastScore) > PORTFOLIO_RANK_EPSILON) {
            currentRank = processed;
            lastScore = score;
          }
          portfolioRankMap.put(snapshot.getCompanyId(), currentRank);
        }

        List<PortfolioRankSnapshot> orderedSnapshotsV2 =
            portfolioSnapshots.values().stream()
                .filter(s -> s.getAveragePercentileV2() != null)
                .sorted(Comparator
                    .comparing(PortfolioRankSnapshot::getAveragePercentileV2)
                    .reversed()
                    .thenComparing(PortfolioRankSnapshot::getCompanyId))
                .collect(Collectors.toList());
        portfolioRankedCountV2 = orderedSnapshotsV2.size();
        double lastScoreV2 = Double.NaN;
        int processedV2 = 0;
        int currentRankV2 = 0;
        for (PortfolioRankSnapshot snapshot : orderedSnapshotsV2) {
          processedV2++;
          double score = snapshot.getAveragePercentileV2();
          if (processedV2 == 1
              || Math.abs(score - lastScoreV2) > PORTFOLIO_RANK_EPSILON) {
            currentRankV2 = processedV2;
            lastScoreV2 = score;
          }
          portfolioRankMapV2.put(snapshot.getCompanyId(), currentRankV2);
        }
      } else {
        portfolioRankedCount = 0;
        portfolioRankedCountV2 = 0;
      }
    }

    for (Map<String, Object> companyMap : content) {
      Object idObj = companyMap.get("id");
      Long companyId = null;
      if (idObj instanceof Number) {
        companyId = ((Number) idObj).longValue();
      }
      if (companyId == null) {
        continue;
      }
      PortfolioRankSnapshot snapshot = rankSnapshots.get(companyId);
      if (snapshot != null) {
        companyMap.put("venture_platform_score", snapshot.getAveragePercentile());
        companyMap.put("metrics_considered", snapshot.getMetricsConsidered());
        companyMap.put("venture_platform_score_v2",
            snapshot.getAveragePercentileV2());
        companyMap.put("metrics_considered_v2",
            snapshot.getMetricsConsideredV2());
      } else {
        companyMap.put("venture_platform_score", null);
        companyMap.put("metrics_considered", null);
        companyMap.put("venture_platform_score_v2", null);
        companyMap.put("metrics_considered_v2", null);
      }

      if (portfolioId != null) {
        companyMap.put("portfolio_rank", portfolioRankMap.get(companyId));
        companyMap.put("ranked_company_count", portfolioRankedCount);
        companyMap.put("portfolio_rank_v2", portfolioRankMapV2.get(companyId));
        companyMap.put("ranked_company_count_v2", portfolioRankedCountV2);
      } else if (snapshot != null) {
        companyMap.put("portfolio_rank", snapshot.getRank());
        companyMap.put("ranked_company_count", snapshot.getRankedCompanyCount());
        companyMap.put("portfolio_rank_v2", snapshot.getRankV2());
        companyMap.put("ranked_company_count_v2",
            snapshot.getRankedCompanyCountV2());
      } else {
        companyMap.put("portfolio_rank", null);
        companyMap.put("ranked_company_count", globalRankedCompanies);
        companyMap.put("portfolio_rank_v2", null);
        companyMap.put("ranked_company_count_v2",
            globalRankedCompaniesV2);
      }
    }

    // Build response with pagination metadata
    long responseStartTime = System.currentTimeMillis();
    Map<String, Object> response = new HashMap<>();
    response.put("content", content);
    response.put("totalElements", companiesPage.getTotalElements());
    response.put("totalPages", companiesPage.getTotalPages());
    response.put("currentPage", page);
    response.put("pageSize", size);
    response.put("isFirst", companiesPage.isFirst());
    response.put("isLast", companiesPage.isLast());

    // Extract all unique tags from the current result set for frontend filtering
    Set<String> uniqueTags = content.stream()
        .filter(company -> company.get("tags") != null)
        .flatMap(company -> {
          Object tagsObj = company.get("tags");
          if (tagsObj instanceof List) {
            @SuppressWarnings("unchecked")
            List<String> tags = (List<String>) tagsObj;
            return tags.stream();
          }
          return Stream.empty();
        })
        .collect(Collectors.toSet());

    List<String> sortedTags = uniqueTags.stream().sorted().collect(Collectors.toList());
    response.put("availableTags", sortedTags); // Include tags in response!

    if (search != null && !search.trim().isEmpty()) {
      response.put("searchTerm", search.trim());
    }
    log.info("[getAllCompaniesLite] Response building took: {} ms (including {} unique tags)",
             System.currentTimeMillis() - responseStartTime, sortedTags.size());

    long totalTime = System.currentTimeMillis() - methodStartTime;
    log.info("[getAllCompaniesLite] ===== TOTAL METHOD TIME: {} ms =====", totalTime);
    log.info("[getAllCompaniesLite] Returning lite response with {} companies", content.size());
    return response;
  }

  /**
   * Get complete company profile data for modal display.
   * Includes all fields needed for the profile modal, including profile-only fields.
   *
   * @param id The company ID
   * @return Map containing complete company profile data
   */
  public Map<String, Object> getCompanyProfile(Long id, Long portfolioId) {
    long methodStartTime = System.currentTimeMillis();
    log.info("[getCompanyProfile] ===== STARTING PROFILE ENDPOINT =====");
    log.info("[getCompanyProfile] Fetching profile for company ID: {}", id);

    // Fetch the company by ID
    long dbStartTime = System.currentTimeMillis();
    CompanyExtractionData company = repository.findById(id)
        .orElseThrow(() -> new IllegalArgumentException("Company not found with ID: " + id));
    long dbTime = System.currentTimeMillis() - dbStartTime;
    log.info("[getCompanyProfile] *** DB FETCH COMPLETED: {} ms ***", dbTime);

    // Convert to full profile format (includes all fields)
    long conversionStartTime = System.currentTimeMillis();
    Map<String, Object> profile = convertEntityToProfileFormat(company, portfolioId);
    long conversionTime = System.currentTimeMillis() - conversionStartTime;
    log.info("[getCompanyProfile] *** CONVERSION COMPLETED: {} ms ***", conversionTime);

    long totalTime = System.currentTimeMillis() - methodStartTime;
    log.info("[getCompanyProfile] ===== TOTAL METHOD TIME: {} ms =====", totalTime);
    log.info("[getCompanyProfile] Returning profile for company: {}", company.getCompanyName());

    return profile;
  }

  /**
   * Get public company profile data for the company overview page.
   * Returns data suitable for public display without authentication.
   * Defaults to English with public-read fallback semantics.
   *
   * @param id Company ID
   * @param portfolioId Optional portfolio ID for context
   * @return Map containing public company profile data
   */
  public Map<String, Object> getPublicCompanyProfile(
      final Long id, final Long portfolioId) {
    return getPublicCompanyProfile(id, portfolioId,
        PublicProfileLanguage.EN, false);
  }

  /**
   * Language-aware public profile read.
   *
   * <p>When {@code editorMode} is {@code false} (the default for
   * public viewers), the bilingual {@code company_description}
   * field falls back through {@code  -> _en -> legacy} so the
   * public page is never blank. When {@code editorMode} is
   * {@code true}, the editor-specific reader is used: the
   * resolved {@code company_description} is the requested
   * language column verbatim (no fallback) so the editor never
   * shows fallback text labelled as the target language. The
   * full per-language map is also returned under
   * {@code company_description_translations} so the editor can
   * render the toggle without an extra round trip.
   *
   * @param id          company id
   * @param portfolioId optional portfolio id for ranking context
   * @param language    requested language ("en" or "de")
   * @param editorMode  true when the inline editor is reading
   * @return map containing public company profile data
   */
  public Map<String, Object> getPublicCompanyProfile(
      final Long id, final Long portfolioId,
      final PublicProfileLanguage language,
      final boolean editorMode) {
    log.info(
        "[getPublicCompanyProfile] Fetching public profile"
            + " for ID: {} lang: {} editorMode: {}",
        id, language.getCode(), editorMode);

    CompanyExtractionData entity = repository.findById(id)
        .orElseThrow(() -> new IllegalArgumentException(
            "Company not found with ID: " + id));

    Map<String, Object> profile = new HashMap<>();

    profile.put("id", entity.getId());
    profile.put("company_name", entity.getCompanyName());
    profile.put("company_description",
        editorMode
            ? readDescriptionRaw(entity, language)
            : readDescriptionWithFallback(entity, language));
    Map<String, Object> translations = new HashMap<>();
    translations.put("en", entity.getCompanyDescriptionEn());
    translations.put("de", entity.getCompanyDescriptionDe());
    translations.put("en_auto_translated",
        Boolean.TRUE.equals(
            entity.getCompanyDescriptionEnAutoTranslated()));
    translations.put("de_auto_translated",
        Boolean.TRUE.equals(
            entity.getCompanyDescriptionDeAutoTranslated()));
    profile.put("company_description_translations",
        translations);
    profile.put("language", language.getCode());
    profile.put("company_logo", entity.getCompanyLogo());
    profile.put("company_url", entity.getCompanyUrl());
    profile.put("headquarter_address", entity.getHeadquarterAddress());
    profile.put("industry_sectors", entity.getIndustrySectors());
    profile.put("ceo_name", entity.getCeoName());
    profile.put("legal_form", entity.getLegalForm());
    profile.put("legal_entity_formation_date",
        entity.getLegalEntityFormationDate());
    profile.put("number_of_employees", entity.getNumberOfEmployees());
    profile.put("contact_email", entity.getContactEmail());
    profile.put("latitude", entity.getLatitude());
    profile.put("longitude", entity.getLongitude());

    profile.put("certification_name", entity.getCertificationName());
    profile.put("certification_link", entity.getCertificationLink());
    profile.put("prize_award_name_1", entity.getPrizeAwardName1());
    profile.put("prize_award_link_1", entity.getPrizeAwardLink1());
    profile.put("prize_award_name_2", entity.getPrizeAwardName2());
    profile.put("prize_award_link_2", entity.getPrizeAwardLink2());

    profile.put("esg_impact_report", entity.getEsgImpactReport());
    profile.put("esg_report_year", entity.getEsgReportYear());
    profile.put("esg_report_link", entity.getEsgReportLink());

    profile.put("hidden_profile_elements",
        entity.getHiddenProfileElements());

    Map<String, Object> rawData = entity.getRawExtractionData();
    if (rawData != null) {
      if (rawData.containsKey("core_products_services")) {
        profile.put("core_products_services",
            resolveCoreProductsForLanguage(
                rawData.get("core_products_services"),
                language, editorMode));
      }

      List<Map<String, Object>> sdgContributions =
          aggregateSdgContributions(rawData);
      if (!sdgContributions.isEmpty()) {
        profile.put("sdg_contributions", sdgContributions);
      }

      if (rawData.containsKey("social_media_links")) {
        profile.put("social_media_links", rawData.get("social_media_links"));
      }
    }

    log.info("[getPublicCompanyProfile] Returning profile for: {}",
        entity.getCompanyName());
    return profile;
  }

  /**
   * Update public profile fields on a company.
   * Only updates non-null fields from the request.
   *
   * @param id Company extraction data ID
   * @param request Fields to update
   * @return Updated public profile data
   */
  @Transactional
  public Map<String, Object> updatePublicProfile(
      final Long id,
      final io.ventureplatform.dto.request
          .UpdatePublicProfileRequest request) {
    CompanyExtractionData entity = repository.findById(id)
        .orElseThrow(() -> new IllegalArgumentException(
            "Company not found with ID: " + id));

    PublicProfileLanguage language =
        PublicProfileLanguage.parse(request.getLanguage());

    log.info("[updatePublicProfile] Updating public profile"
        + " for company: {} (ID: {}) language: {}",
        entity.getCompanyName(), id, language.getCode());

    boolean descriptionEdited =
        applyPublicProfileUpdates(entity, request, language);

    Map<String, Object> rawData =
        entity.getRawExtractionData();
    if (rawData == null) {
      rawData = new HashMap<>();
    }
    syncPublicFieldsToRawData(rawData, request, language);
    entity.setRawExtractionData(rawData);

    repository.save(entity);

    log.info("[updatePublicProfile] Successfully updated"
        + " public profile for company: {} (ID: {})",
        entity.getCompanyName(), id);

    List<PublicProfileTranslationEvent.ProductItemSnapshot>
        productSnapshots = collectProductSnapshots(
            entity, language);
    if (descriptionEdited || !productSnapshots.isEmpty()) {
      String snapshot = descriptionEdited
          ? readDescriptionRaw(entity, language) : null;
      eventPublisher.publishEvent(
          new PublicProfileTranslationEvent(
              id, language, snapshot, productSnapshots));
    }

    return getPublicCompanyProfile(id, null, language, false);
  }

  /**
   * Walk the freshly-saved core_products_services items and
   * snapshot the active-language title/description for any item
   * that has non-blank source content. The translation worker
   * will translate every snapshot in one OpenAI call. Items
   * without an {@code id} are skipped because the worker
   * matches CAS targets by id.
   */
  @SuppressWarnings("unchecked")
  private List<PublicProfileTranslationEvent.ProductItemSnapshot>
      collectProductSnapshots(
          final CompanyExtractionData entity,
          final PublicProfileLanguage language) {
    Map<String, Object> rawData = entity.getRawExtractionData();
    if (rawData == null) {
      return Collections.emptyList();
    }
    Object cps = rawData.get("core_products_services");
    if (!(cps instanceof Map)) {
      return Collections.emptyList();
    }
    Object items = ((Map<String, Object>) cps).get("items");
    if (!(items instanceof List)) {
      return Collections.emptyList();
    }
    String langSuffix = "_" + language.getCode();
    List<PublicProfileTranslationEvent.ProductItemSnapshot> out =
        new ArrayList<>();
    for (Object o : (List<Object>) items) {
      if (!(o instanceof Map)) {
        continue;
      }
      Map<String, Object> item = (Map<String, Object>) o;
      Object idObj = item.get("id");
      if (idObj == null) {
        continue;
      }
      Object titleObj = item.get("title" + langSuffix);
      Object descObj = item.get("description" + langSuffix);
      String title = titleObj instanceof String
          ? (String) titleObj : null;
      String desc = descObj instanceof String
          ? (String) descObj : null;
      boolean hasTitle = title != null && !title.isBlank();
      boolean hasDesc = desc != null && !desc.isBlank();
      if (!hasTitle && !hasDesc) {
        continue;
      }
      out.add(
          new PublicProfileTranslationEvent.ProductItemSnapshot(
              String.valueOf(idObj),
              hasTitle ? title : null,
              hasDesc ? desc : null));
    }
    return out;
  }

  /**
   * Read the language-specific description column verbatim,
   * with no fallback. Used by the inline editor so an empty
   * target language stays empty (the editor must not echo the
   * other language back as if it were a real translation).
   */
  private static String readDescriptionRaw(
      final CompanyExtractionData entity,
      final PublicProfileLanguage language) {
    return language == PublicProfileLanguage.EN
        ? entity.getCompanyDescriptionEn()
        : entity.getCompanyDescriptionDe();
  }

  /**
   * Read with public-viewer fallback chain:
   * requested -> _en -> legacy company_description. Used by
   * the public profile endpoint so the page is never blank.
   */
  private static String readDescriptionWithFallback(
      final CompanyExtractionData entity,
      final PublicProfileLanguage language) {
    String primary = readDescriptionRaw(entity, language);
    if (primary != null && !primary.isBlank()) {
      return primary;
    }
    String englishFallback = entity.getCompanyDescriptionEn();
    if (englishFallback != null && !englishFallback.isBlank()) {
      return englishFallback;
    }
    return entity.getCompanyDescription();
  }

  /**
   * Resolve {@code core_products_services} for the requested
   * language by collapsing the bilingual {@code title_en/_de} +
   * {@code description_en/_de} columns down to flat
   * {@code title}/{@code description} fields.
   *
   * <p>Editor mode returns the requested language verbatim so an
   * empty target language stays empty (no echoing the other
   * language back as if it were a real translation, same rule as
   * {@code company_description}).
   *
   * <p>Public mode applies the {@code requested -> _en -> legacy}
   * fallback chain so the public page is never blank.
   *
   * <p>The returned object preserves all original keys (including
   * the bilingual variants and per-language auto-translation
   * flags) so the editor can render the language toggle without
   * an extra round trip.
   *
   * @param raw           raw core_products_services map
   * @param language      requested language
   * @param editorMode    true when the inline editor is reading
   * @return language-resolved core_products_services map
   */
  @SuppressWarnings("unchecked")
  private static Object resolveCoreProductsForLanguage(
      final Object raw,
      final PublicProfileLanguage language,
      final boolean editorMode) {
    if (!(raw instanceof Map)) {
      return raw;
    }
    Map<String, Object> source = (Map<String, Object>) raw;
    Object items = source.get("items");
    if (!(items instanceof List)) {
      return source;
    }
    Map<String, Object> out = new LinkedHashMap<>(source);
    List<Object> resolvedItems = new ArrayList<>();
    String langSuffix = "_" + language.getCode();
    for (Object o : (List<Object>) items) {
      if (!(o instanceof Map)) {
        resolvedItems.add(o);
        continue;
      }
      Map<String, Object> item = (Map<String, Object>) o;
      Map<String, Object> resolved = new LinkedHashMap<>(item);
      resolved.put("title", resolveItemField(
          item, "title", langSuffix, editorMode));
      resolved.put("description", resolveItemField(
          item, "description", langSuffix, editorMode));
      resolvedItems.add(resolved);
    }
    out.put("items", resolvedItems);
    return out;
  }

  private static Object resolveItemField(
      final Map<String, Object> item,
      final String fieldName,
      final String langSuffix,
      final boolean editorMode) {
    Object langValue = item.get(fieldName + langSuffix);
    if (editorMode) {
      return langValue;
    }
    if (langValue instanceof String
        && !((String) langValue).isBlank()) {
      return langValue;
    }
    Object enValue = item.get(fieldName + "_en");
    if (enValue instanceof String
        && !((String) enValue).isBlank()) {
      return enValue;
    }
    return item.get(fieldName);
  }

  /**
   * Merge an incoming {@code core_products_services} payload from
   * the editor into the persisted bilingual JSON. The incoming
   * payload uses flat {@code title}/{@code description} keys (the
   * editor only renders one language at a time); we route those
   * onto the active-language column and clear the matching
   * {@code _<lang>_auto_translated} flag so user edits become
   * user-owned. The other language's columns and flags are
   * preserved so a user-owned DE description survives an EN
   * re-save (same protection rule as company_description from
   * #523, applied per-item).
   *
   * <p>Existing items are matched by stable {@code id} (the
   * frontend generates UUIDs via {@code generateProductId()}).
   * New items get their flat title/description copied into the
   * active-language column. Items removed from the request are
   * dropped entirely (the existing destructive-delete contract).
   *
   * @param existingRaw the persisted core_products_services value
   *                    (may be null or non-Map)
   * @param incoming    the new payload from the request
   * @param language    active editor language for this save
   * @return merged map ready to persist into raw_extraction_data
   */
  @SuppressWarnings("unchecked")
  private static Map<String, Object> mergeCoreProductsServices(
      final Object existingRaw,
      final Map<String, Object> incoming,
      final PublicProfileLanguage language) {
    Map<String, Object> result = new LinkedHashMap<>();
    if (incoming != null) {
      result.putAll(incoming);
    }
    Object incomingItems = result.get("items");
    if (!(incomingItems instanceof List)) {
      return result;
    }

    Map<String, Map<String, Object>> existingById =
        new LinkedHashMap<>();
    if (existingRaw instanceof Map) {
      Object existingItems =
          ((Map<String, Object>) existingRaw).get("items");
      if (existingItems instanceof List) {
        for (Object o : (List<Object>) existingItems) {
          if (!(o instanceof Map)) {
            continue;
          }
          Map<String, Object> item = (Map<String, Object>) o;
          Object id = item.get("id");
          if (id != null) {
            existingById.put(
                String.valueOf(id),
                new LinkedHashMap<>(item));
          }
        }
      }
    }

    String langCode = language.getCode();
    String otherCode = language.other().getCode();
    List<Object> mergedItems = new ArrayList<>();
    for (Object o : (List<Object>) incomingItems) {
      if (!(o instanceof Map)) {
        mergedItems.add(o);
        continue;
      }
      Map<String, Object> incomingItem = (Map<String, Object>) o;
      Object idObj = incomingItem.get("id");
      Map<String, Object> base = idObj == null
          ? new LinkedHashMap<>()
          : existingById.getOrDefault(
              String.valueOf(idObj), new LinkedHashMap<>());
      Map<String, Object> merged = new LinkedHashMap<>(base);
      merged.putAll(incomingItem);

      String activeTitle = stringOrNull(
          incomingItem.get("title"));
      String activeDesc = stringOrNull(
          incomingItem.get("description"));
      merged.put("title_" + langCode, activeTitle);
      merged.put(
          "title_" + langCode + "_auto_translated", false);
      merged.put("description_" + langCode, activeDesc);
      merged.put(
          "description_" + langCode + "_auto_translated", false);

      // Preserve the other language from the existing item if
      // the incoming payload didn't carry it (the editor only
      // sends the active tab's text). Fresh items get a default
      // null/false on the other side so they aren't ambiguously
      // user-owned.
      if (!merged.containsKey("title_" + otherCode)) {
        merged.put("title_" + otherCode, null);
      }
      if (!merged.containsKey(
          "title_" + otherCode + "_auto_translated")) {
        merged.put(
            "title_" + otherCode + "_auto_translated", false);
      }
      if (!merged.containsKey("description_" + otherCode)) {
        merged.put("description_" + otherCode, null);
      }
      if (!merged.containsKey(
          "description_" + otherCode + "_auto_translated")) {
        merged.put(
            "description_" + otherCode + "_auto_translated",
            false);
      }

      // Mirror the active-language value to the legacy flat
      // keys so any reader still on the legacy schema sees the
      // English text after an EN save. DE saves do NOT mirror
      // (same rule as company_description) — that would silently
      // flip the default for non-DE viewers.
      if (language == PublicProfileLanguage.EN) {
        merged.put("title", activeTitle);
        merged.put("description", activeDesc);
      }

      mergedItems.add(merged);
    }
    result.put("items", mergedItems);
    return result;
  }

  private static String stringOrNull(final Object value) {
    return value instanceof String ? (String) value : null;
  }

  /**
   * Apply non-null public profile fields to entity.
   *
   * @param entity   The company entity
   * @param req      The update request
   * @param language Active editor language; determines which
   *                 bilingual column receives company_description
   *                 and whose auto-translation flag is flipped.
   * @return true when company_description was set in the
   *         request (so the caller knows to fire the
   *         translation event); false otherwise.
   */
  private boolean applyPublicProfileUpdates(
      final CompanyExtractionData entity,
      final io.ventureplatform.dto.request
          .UpdatePublicProfileRequest req,
      final PublicProfileLanguage language) {
    boolean descriptionEdited = false;
    if (req.getCompanyName() != null) {
      entity.setCompanyName(req.getCompanyName());
    }
    if (req.getCompanyDescription() != null) {
      String text = req.getCompanyDescription();
      if (language == PublicProfileLanguage.EN) {
        entity.setCompanyDescriptionEn(text);
        entity.setCompanyDescriptionEnAutoTranslated(false);
        // Mirror the active language to the legacy column
        // for back-compat with any reader still on it.
        // German saves explicitly do NOT mirror to legacy
        // (#517) — that would silently flip the default
        // for non-DE viewers.
        entity.setCompanyDescription(text);
      } else {
        entity.setCompanyDescriptionDe(text);
        entity.setCompanyDescriptionDeAutoTranslated(false);
      }
      descriptionEdited = true;
    }
    if (req.getCompanyLogo() != null) {
      entity.setCompanyLogo(req.getCompanyLogo());
    }
    if (req.getCompanyUrl() != null) {
      entity.setCompanyUrl(req.getCompanyUrl());
    }
    if (req.getHeadquarterAddress() != null) {
      entity.setHeadquarterAddress(
          req.getHeadquarterAddress());
    }
    if (req.getIndustrySectors() != null) {
      entity.setIndustrySectors(req.getIndustrySectors());
    }
    if (req.getCeoName() != null) {
      entity.setCeoName(req.getCeoName());
    }
    if (req.getLegalForm() != null) {
      entity.setLegalForm(req.getLegalForm());
    }
    if (req.getLegalEntityFormationDate() != null) {
      entity.setLegalEntityFormationDate(
          req.getLegalEntityFormationDate());
    }
    if (req.getNumberOfEmployees() != null) {
      entity.setNumberOfEmployees(
          req.getNumberOfEmployees());
    }
    if (req.getContactEmail() != null) {
      entity.setContactEmail(req.getContactEmail());
    }
    if (req.getCertificationName() != null) {
      entity.setCertificationName(
          req.getCertificationName());
    }
    if (req.getCertificationLink() != null) {
      entity.setCertificationLink(
          req.getCertificationLink());
    }
    if (req.getPrizeAwardName1() != null) {
      entity.setPrizeAwardName1(req.getPrizeAwardName1());
    }
    if (req.getPrizeAwardLink1() != null) {
      entity.setPrizeAwardLink1(req.getPrizeAwardLink1());
    }
    if (req.getPrizeAwardName2() != null) {
      entity.setPrizeAwardName2(req.getPrizeAwardName2());
    }
    if (req.getPrizeAwardLink2() != null) {
      entity.setPrizeAwardLink2(req.getPrizeAwardLink2());
    }
    if (req.getEsgImpactReport() != null) {
      entity.setEsgImpactReport(req.getEsgImpactReport());
    }
    if (req.getEsgReportYear() != null) {
      entity.setEsgReportYear(req.getEsgReportYear());
    }
    if (req.getEsgReportLink() != null) {
      entity.setEsgReportLink(req.getEsgReportLink());
    }
    if (req.getHiddenProfileElements() != null) {
      entity.setHiddenProfileElements(
          normalizeHiddenProfileElements(
              req.getHiddenProfileElements()));
    }
    applyClearedFields(entity, req.getClearedFields());
    return descriptionEdited;
  }

  private static final Set<String> ALLOWED_CLEARED_FIELDS =
      Set.of("esgReport", "certPrimary",
          "certAward1", "certAward2");

  /**
   * Null out the backing columns for user-deleted items so
   * the existing "don't render empty" logic hides them
   * naturally. Unknown keys are ignored.
   *
   * @param entity the entity being mutated
   * @param keys caller-supplied list of keys to clear
   */
  private void applyClearedFields(
      final CompanyExtractionData entity,
      final List<String> keys) {
    if (keys == null || keys.isEmpty()) {
      return;
    }
    for (String key : keys) {
      if (!ALLOWED_CLEARED_FIELDS.contains(key)) {
        continue;
      }
      switch (key) {
        case "esgReport":
          entity.setEsgImpactReport(null);
          entity.setEsgReportYear(null);
          entity.setEsgReportLink(null);
          break;
        case "certPrimary":
          entity.setCertificationName(null);
          entity.setCertificationLink(null);
          break;
        case "certAward1":
          entity.setPrizeAwardName1(null);
          entity.setPrizeAwardLink1(null);
          break;
        case "certAward2":
          entity.setPrizeAwardName2(null);
          entity.setPrizeAwardLink2(null);
          break;
        default:
          break;
      }
    }
  }

  private static final Set<String> ALLOWED_HIDDEN_SECTION_KEYS =
      Set.of("overview", "metrics", "whatWeDo", "recentNews",
          "socialMedia", "reports", "sdg", "certifications",
          "contact");

  private static final Set<String> ALLOWED_HIDDEN_LIST_KEYS =
      Set.of("products", "reports", "sdg", "certifications");

  /**
   * Whitelist + shape-normalize the hide-state payload.
   * Drops unknown top-level keys, unknown section names,
   * and non-primitive list entries so the JSONB column
   * doesn't accumulate schema drift over time.
   *
   * <p>Note: there is intentionally no "deleted" concept
   * here. Destructive deletes for products are handled by
   * the existing core_products_services array write. Column-
   * backed items (ESG report, cert slots) are cleared via
   * the clearedFields list on the request, which nulls the
   * backing columns so the existing "don't render empty"
   * check naturally hides the item.
   *
   * @param raw caller-supplied payload
   * @return sanitized payload safe to persist
   */
  @SuppressWarnings("unchecked")
  private Map<String, Object> normalizeHiddenProfileElements(
      final Map<String, Object> raw) {
    Map<String, Object> out = new LinkedHashMap<>();

    Object sectionsObj = raw.get("sections");
    List<String> sections = new ArrayList<>();
    if (sectionsObj instanceof List) {
      for (Object s : (List<Object>) sectionsObj) {
        if (s instanceof String
            && ALLOWED_HIDDEN_SECTION_KEYS.contains(s)) {
          sections.add((String) s);
        }
      }
    }
    out.put("sections", sections);

    for (String listKey : ALLOWED_HIDDEN_LIST_KEYS) {
      Object listObj = raw.get(listKey);
      List<Object> items = new ArrayList<>();
      if (listObj instanceof List) {
        for (Object item : (List<Object>) listObj) {
          if (item instanceof String
              || item instanceof Number) {
            items.add(item);
          }
        }
      }
      out.put(listKey, items);
    }

    return out;
  }

  /**
   * Sync updated public profile fields into raw JSON data.
   *
   * @param rawData  The raw extraction data map
   * @param req      The update request
   * @param language Active editor language. Only EN saves
   *                 mirror {@code company_description} to the
   *                 raw JSON blob — DE saves go only to the
   *                 dedicated DE column so a German edit can't
   *                 silently appear as the default for a
   *                 non-DE viewer reading the raw blob.
   */
  @SuppressWarnings("unchecked")
  private void syncPublicFieldsToRawData(
      final Map<String, Object> rawData,
      final io.ventureplatform.dto.request
          .UpdatePublicProfileRequest req,
      final PublicProfileLanguage language) {
    if (req.getCompanyName() != null) {
      rawData.put("company_name", req.getCompanyName());
    }
    if (req.getCompanyDescription() != null
        && language == PublicProfileLanguage.EN) {
      rawData.put("company_description",
          req.getCompanyDescription());
    }
    if (req.getCompanyLogo() != null) {
      rawData.put("company_logo", req.getCompanyLogo());
    }
    if (req.getHeadquarterAddress() != null) {
      rawData.put("headquarter_address",
          req.getHeadquarterAddress());
    }
    if (req.getIndustrySectors() != null) {
      rawData.put("industry_sectors",
          req.getIndustrySectors());
    }
    if (req.getCeoName() != null) {
      rawData.put("ceo_name", req.getCeoName());
    }
    if (req.getLegalForm() != null) {
      rawData.put("legal_form", req.getLegalForm());
    }
    if (req.getLegalEntityFormationDate() != null) {
      rawData.put("legal_entity_formation_date",
          req.getLegalEntityFormationDate());
    }
    if (req.getNumberOfEmployees() != null) {
      rawData.put("number_of_employees",
          req.getNumberOfEmployees());
    }
    if (req.getContactEmail() != null) {
      rawData.put("contact_email", req.getContactEmail());
    }
    if (req.getCertificationName() != null) {
      rawData.put("certification_name",
          req.getCertificationName());
    }
    if (req.getCertificationLink() != null) {
      rawData.put("certification_link",
          req.getCertificationLink());
    }
    if (req.getPrizeAwardName1() != null) {
      rawData.put("prize_award_name_1",
          req.getPrizeAwardName1());
    }
    if (req.getPrizeAwardLink1() != null) {
      rawData.put("prize_award_link_1",
          req.getPrizeAwardLink1());
    }
    if (req.getPrizeAwardName2() != null) {
      rawData.put("prize_award_name_2",
          req.getPrizeAwardName2());
    }
    if (req.getPrizeAwardLink2() != null) {
      rawData.put("prize_award_link_2",
          req.getPrizeAwardLink2());
    }
    if (req.getEsgImpactReport() != null) {
      rawData.put("esg_impact_report",
          req.getEsgImpactReport());
    }
    if (req.getEsgReportYear() != null) {
      rawData.put("esg_report_year",
          req.getEsgReportYear());
    }
    if (req.getEsgReportLink() != null) {
      rawData.put("esg_report_link",
          req.getEsgReportLink());
    }
    if (req.getCoreProductsServices() != null) {
      Map<String, Object> mergedCps = mergeCoreProductsServices(
          rawData.get("core_products_services"),
          req.getCoreProductsServices(),
          language);
      rawData.put("core_products_services", mergedCps);
    }
    if (req.getSocialMediaLinks() != null) {
      rawData.put("social_media_links",
          req.getSocialMediaLinks());
    }
  }

  /**
   * Aggregate SDG contributions from theory_of_change data.
   * Extracts SDGs from all positive impact pathways, aggregates
   * percentages, and maps to official SDG labels and colors.
   *
   * @param rawData The raw extraction data containing theory_of_change
   * @return List of SDG contribution maps for the frontend
   */
  @SuppressWarnings("unchecked")
  private List<Map<String, Object>> aggregateSdgContributions(
      final Map<String, Object> rawData) {
    List<Map<String, Object>> result = new ArrayList<>();

    if (!rawData.containsKey("theory_of_change")) {
      return result;
    }

    Object tocObj = rawData.get("theory_of_change");
    if (!(tocObj instanceof List)) {
      return result;
    }

    List<Map<String, Object>> theoryOfChange = (List<Map<String, Object>>) tocObj;
    Map<Integer, Double> sdgTotals = new HashMap<>();
    int positivePathwayCount = 0;

    for (Map<String, Object> pathway : theoryOfChange) {
      String type = (String) pathway.get("type");
      if (type == null || !type.toLowerCase().contains("positive")) {
        continue;
      }
      positivePathwayCount++;

      Object sdgsObj = pathway.get("sdgs");
      if (!(sdgsObj instanceof List)) {
        continue;
      }

      List<Map<String, Object>> sdgs = (List<Map<String, Object>>) sdgsObj;
      for (Map<String, Object> sdg : sdgs) {
        Integer sdgNumber = null;
        Double percent = null;

        Object numObj = sdg.get("number");
        if (numObj instanceof Integer) {
          sdgNumber = (Integer) numObj;
        } else if (numObj instanceof Number) {
          sdgNumber = ((Number) numObj).intValue();
        }

        Object pctObj = sdg.get("percent");
        if (pctObj instanceof Number) {
          percent = ((Number) pctObj).doubleValue();
        }

        if (sdgNumber != null && percent != null && sdgNumber >= 1
            && sdgNumber <= 17) {
          sdgTotals.merge(sdgNumber, percent, Double::sum);
        }
      }
    }

    if (sdgTotals.isEmpty() || positivePathwayCount == 0) {
      return result;
    }

    double totalSum = sdgTotals.values().stream()
        .mapToDouble(Double::doubleValue).sum();

    List<Map.Entry<Integer, Double>> sortedSdgs = sdgTotals.entrySet().stream()
        .sorted(Map.Entry.<Integer, Double>comparingByValue().reversed())
        .limit(5)
        .collect(Collectors.toList());

    for (Map.Entry<Integer, Double> entry : sortedSdgs) {
      Integer sdgNum = entry.getKey();
      String[] sdgInfo = SDG_DATA.get(sdgNum);
      if (sdgInfo == null) {
        continue;
      }

      int normalizedPct = (int) Math.round(
          (entry.getValue() / totalSum) * 100);

      Map<String, Object> contribution = new HashMap<>();
      contribution.put("sdg", sdgNum);
      contribution.put("label", sdgInfo[0]);
      contribution.put("percentage", normalizedPct);
      contribution.put("color", sdgInfo[1]);
      result.add(contribution);
    }

    return result;
  }

  /**
   * Build compact impact summary data from raw extraction JSON.
   * Used by the lite endpoint research DB view and by backfills.
   *
   * @param rawData raw extraction data map
   * @return compact impact summary or null when no impact data exists
   */
  public Map<String, Object> buildPublicImpactSummaryFromRawData(
      final Map<String, Object> rawData) {
    if (rawData == null || rawData.isEmpty()) {
      return null;
    }
    JsonNode rawDataNode = objectMapper.valueToTree(rawData);
    return buildPublicImpactSummary(rawDataNode);
  }

  private Map<String, Object> buildPublicImpactSummary(final JsonNode json) {
    JsonNode impactArray = extractTheoryOfChangeArray(
        json.path("theory_of_change"));
    if (!impactArray.isArray() || impactArray.size() == 0) {
      return null;
    }

    int positiveCount = 0;
    int negativeCount = 0;
    for (JsonNode impactNode : impactArray) {
      if (isPositiveImpact(impactNode)) {
        positiveCount++;
      } else {
        negativeCount++;
      }
    }

    Map<Integer, JsonNode> scoringById = buildImpactScoringLookup(
        json.path("impact_scoring"));
    List<Map<String, Object>> impacts = new ArrayList<>();

    int impactId = 1;
    for (JsonNode impactNode : impactArray) {
      boolean positive = isPositiveImpact(impactNode);
      Map<String, Object> impactSummary = createPublicImpactSummaryItem(
          impactNode,
          scoringById.get(impactId),
          json,
          positive,
          positiveCount,
          negativeCount
      );
      if (impactSummary != null) {
        impacts.add(impactSummary);
      }
      impactId++;
    }

    if (impacts.isEmpty()) {
      return null;
    }

    Map<String, Object> summary = new LinkedHashMap<>();
    summary.put("impacts", impacts);
    return summary;
  }

  private JsonNode extractTheoryOfChangeArray(final JsonNode tocNode) {
    if (tocNode == null || tocNode.isNull()) {
      return objectMapper.createArrayNode();
    }
    if (tocNode.isArray()) {
      return tocNode;
    }
    if (tocNode.has("theory_of_change") && tocNode.get("theory_of_change")
        .isArray()) {
      return tocNode.get("theory_of_change");
    }
    if (tocNode.has("impacts") && tocNode.get("impacts").isArray()) {
      return tocNode.get("impacts");
    }
    return objectMapper.createArrayNode();
  }

  private boolean isPositiveImpact(final JsonNode impactNode) {
    return !impactNode.path("type").asText("")
        .toLowerCase().contains("negative");
  }

  private Map<Integer, JsonNode> buildImpactScoringLookup(
      final JsonNode scoringNode) {
    Map<Integer, JsonNode> scoringById = new HashMap<>();
    if (!scoringNode.isArray()) {
      return scoringById;
    }

    int fallbackId = 1;
    for (JsonNode scoringItem : scoringNode) {
      int impactId = scoringItem.path("id").asInt(fallbackId);
      scoringById.put(impactId, scoringItem);
      fallbackId++;
    }
    return scoringById;
  }

  private Map<String, Object> createPublicImpactSummaryItem(
      final JsonNode impactNode,
      final JsonNode scoringNode,
      final JsonNode companyData,
      final boolean positive,
      final int positiveCount,
      final int negativeCount) {
    List<Map<String, Object>> sdgs = extractPublicImpactSdgs(
        impactNode.path("sdgs"));
    List<String> geography = extractPublicImpactGeography(
        scoringNode, companyData);
    int indicatorCount = impactNode.path("indicators").isArray()
        ? impactNode.path("indicators").size() : 0;
    ImpactSummaryScores scores = calculateImpactSummaryScores(
        scoringNode,
        companyData,
        positive,
        positiveCount,
        negativeCount
    );

    if (sdgs.isEmpty() && geography.isEmpty() && indicatorCount == 0
        && scores.getScore() <= 0) {
      return null;
    }

    double score = scores.getScore();
    if (positive && score <= 0 && !sdgs.isEmpty()) {
      score = 1.0;
    }

    Map<String, Object> impactSummary = new LinkedHashMap<>();
    impactSummary.put("positive", positive);
    impactSummary.put("score", roundOneDecimal(score));
    impactSummary.put("magnitude", roundOneDecimal(scores.getMagnitude()));
    impactSummary.put("likelihood", roundOneDecimal(scores.getLikelihood()));
    impactSummary.put("indicator_count", indicatorCount);

    if (!sdgs.isEmpty()) {
      impactSummary.put("sdgs", sdgs);
    }
    if (!geography.isEmpty()) {
      impactSummary.put("geography", geography);
    }

    return impactSummary;
  }

  private ImpactSummaryScores calculateImpactSummaryScores(
      final JsonNode scoringNode,
      final JsonNode companyData,
      final boolean positive,
      final int positiveCount,
      final int negativeCount) {
    if (scoringNode != null && !scoringNode.isMissingNode()
        && !scoringNode.isNull()) {
      double magnitude = calculateImpactMagnitude(scoringNode);
      double likelihood = calculateImpactLikelihood(scoringNode, positive);
      if (magnitude > 0 && likelihood > 0) {
        return new ImpactSummaryScores(
            magnitude * likelihood / 100.0,
            magnitude,
            likelihood
        );
      }
    }

    return createFallbackImpactSummaryScores(
        companyData,
        positive,
        positiveCount,
        negativeCount
    );
  }

  private double calculateImpactMagnitude(final JsonNode scoringNode) {
    double urgency = parseScoreValue(scoringNode.path("urgency"));
    double irreversibility = parseScoreValue(
        scoringNode.path("irreversibility"));
    double fairness = parseScoreValue(scoringNode.path("fairness"));
    double interconnectedness = parseScoreValue(
        scoringNode.path("interconnectedness"));
    double stakeholderSituation = parseScoreValue(
        scoringNode.path("stakeholderSituation"));
    double degreeOfChange = parseScoreValue(
        scoringNode.path("degreeOfChange"));
    double duration = parseScoreValue(scoringNode.path("duration"));
    double scalability = parseScoreValue(scoringNode.path("scalability"));
    double contribution = parseScoreValue(scoringNode.path("contribution"));

    double problemImportance = (urgency + irreversibility + fairness
        + interconnectedness) / 4.0;

    if (problemImportance <= 0 || stakeholderSituation <= 0
        || degreeOfChange <= 0 || duration <= 0
        || scalability <= 0 || contribution <= 0) {
      return 0.0;
    }

    double importance = (problemImportance * 2.0 / 3.0
        + stakeholderSituation * 1.0 / 3.0) * 20.0;
    double howMuchSolved = ((1.0 + degreeOfChange * 9.0 / 100.0)
        * 6.0 / 7.0 + duration * 2.0 / 7.0) / 10.0;
    double contributionFactor = (1.0 + contribution * 9.0 / 100.0) / 10.0;

    return importance * howMuchSolved * (scalability / 10.0)
        * contributionFactor;
  }

  private double calculateImpactLikelihood(final JsonNode scoringNode,
                                           final boolean positive) {
    double previousEvidence = parseScoreValue(
        scoringNode.path("previousEvidence"));
    if (previousEvidence <= 0) {
      return 0.0;
    }

    if (!positive) {
      return previousEvidence * 20.0;
    }

    double proximity = parseScoreValue(scoringNode.path("proximity"));
    if (proximity <= 0) {
      return 0.0;
    }

    JsonNode indicators = scoringNode.path("indicators");
    if (indicators.isArray() && indicators.size() > 0) {
      double totalNoisiness = 0.0;
      int noisinessCount = 0;

      for (JsonNode indicator : indicators) {
        double noisiness = parseScoreValue(indicator.path("noisiness"));
        if (noisiness > 0) {
          totalNoisiness += noisiness;
          noisinessCount++;
        }
      }

      if (noisinessCount > 0) {
        double avgNoisiness = totalNoisiness / noisinessCount;
        return (previousEvidence + proximity + avgNoisiness + 3.0) * 5.0;
      }
    }

    return (previousEvidence + proximity) * 10.0;
  }

  private ImpactSummaryScores createFallbackImpactSummaryScores(
      final JsonNode companyData,
      final boolean positive,
      final int positiveCount,
      final int negativeCount) {
    double magnitudeTotal = positive
        ? parseNumericValue(companyData.path("impact_magnitude_5_year"))
        : parseNumericValue(companyData.path("impact_magnitude_5_year_negative"));
    double likelihood = parseNumericValue(companyData.path("impact_likelihood"));
    int divisor = positive ? Math.max(positiveCount, 1)
        : Math.max(negativeCount, 1);

    if (magnitudeTotal <= 0) {
      double overallScore = parseNumericValue(
          companyData.path("overall_impact_potential_score"));
      if (overallScore > 0 && positive) {
        double fallbackScore = overallScore / Math.max(positiveCount, 1);
        return new ImpactSummaryScores(fallbackScore, fallbackScore, 100.0);
      }
      return new ImpactSummaryScores(0.0, 0.0, 0.0);
    }

    double magnitude = magnitudeTotal / divisor;
    double normalizedLikelihood = likelihood > 0 ? likelihood : 100.0;
    double score = magnitude * normalizedLikelihood / 100.0;

    return new ImpactSummaryScores(score, magnitude, normalizedLikelihood);
  }

  private List<String> extractPublicImpactGeography(
      final JsonNode scoringNode,
      final JsonNode companyData) {
    List<String> geography = extractGeographyValues(
        scoringNode != null ? scoringNode.path("geography") : null);
    if (!geography.isEmpty()) {
      return geography;
    }
    return extractGeographyValues(companyData.path("geographic_scope_estimated"));
  }

  private List<String> extractGeographyValues(final JsonNode geographyNode) {
    List<String> geography = new ArrayList<>();
    if (geographyNode == null || geographyNode.isNull()
        || geographyNode.isMissingNode()) {
      return geography;
    }

    if (geographyNode.isArray()) {
      for (JsonNode geographyItem : geographyNode) {
        String value = geographyItem.asText("").trim();
        if (!value.isEmpty()) {
          geography.add(value);
        }
      }
      return geography;
    }

    if (!geographyNode.isTextual()) {
      return geography;
    }

    String rawValue = geographyNode.asText("").trim();
    if (rawValue.isEmpty()) {
      return geography;
    }

    try {
      JsonNode parsed = objectMapper.readTree(rawValue);
      if (parsed.isArray()) {
        return extractGeographyValues(parsed);
      }
    } catch (Exception e) {
      geography.add(rawValue);
    }

    return geography;
  }

  private List<Map<String, Object>> extractPublicImpactSdgs(
      final JsonNode sdgsNode) {
    List<Map<String, Object>> sdgs = new ArrayList<>();
    if (!sdgsNode.isArray()) {
      return sdgs;
    }

    for (JsonNode sdgNode : sdgsNode) {
      int sdgNumber = sdgNode.path("number").asInt(0);
      double percent = parseNumericValue(sdgNode.path("percent"));
      if (sdgNumber < 1 || sdgNumber > 17 || percent <= 0) {
        continue;
      }

      Map<String, Object> sdg = new LinkedHashMap<>();
      sdg.put("number", sdgNumber);
      sdg.put("percent", roundOneDecimal(percent));
      sdgs.add(sdg);
    }

    return sdgs;
  }

  private double parseNumericValue(final JsonNode node) {
    if (node == null || node.isNull() || node.isMissingNode()) {
      return 0.0;
    }
    if (node.isNumber()) {
      return node.asDouble();
    }
    if (node.isTextual()) {
      String text = node.asText("").trim();
      if (text.isEmpty()) {
        return 0.0;
      }
      try {
        return Double.parseDouble(text);
      } catch (NumberFormatException e) {
        return 0.0;
      }
    }
    return 0.0;
  }

  private double parseScoreValue(final JsonNode node) {
    return parseNumericValue(node);
  }

  private double roundOneDecimal(final double value) {
    return Math.round(value * 10.0) / 10.0;
  }

  /**
   * Get full text for a specific field (for smart tooltips).
   * Ultra-fast method that fetches only the requested field.
   *
   * @param id Company ID
   * @param fieldName Field name to fetch
   * @return Full text content
   */
  public String getFullTextForField(final Long id, final String fieldName) {
    long methodStartTime = System.currentTimeMillis();
    log.info("[getFullTextForField] ===== STARTING FULL-TEXT FETCH =====");
    log.info("[getFullTextForField] Company ID: {}, Field: {}", id, fieldName);

    try {
      // Fetch only the specific company
      CompanyExtractionData entity = repository.findById(id)
          .orElseThrow(() -> new IllegalArgumentException("Company not found with ID: " + id));

      String fullText = null;

      // Get full text from entity fields first (fastest)
      switch (fieldName) {
        case "company_description":
          fullText = entity.getCompanyDescription();
          break;
        case "headquarter_address":
          fullText = entity.getHeadquarterAddress();
          break;
        case "cluster_reasoning":
          // cluster_reasoning is stored in JSONB, not entity field
          Map<String, Object> rawData = entity.getRawExtractionData();
          if (rawData != null && rawData.containsKey("cluster_reasoning")) {
            Object value = rawData.get("cluster_reasoning");
            fullText = value != null ? value.toString() : null;
          }
          break;
        case "legal_form":
          fullText = entity.getLegalForm();
          break;
        case "industry_sectors":
          fullText = entity.getIndustrySectors();
          break;
        case "certification_name":
          fullText = entity.getCertificationName();
          break;
        case "prize_award_name_1":
          fullText = entity.getPrizeAwardName1();
          break;
        case "prize_award_name_2":
          fullText = entity.getPrizeAwardName2();
          break;
        default:
          // Check JSONB fields for other fields (justifications, explanations, etc.)
          Map<String, Object> rawDataDefault = entity.getRawExtractionData();
          if (rawDataDefault != null && rawDataDefault.containsKey(fieldName)) {
            Object value = rawDataDefault.get(fieldName);
            fullText = value != null ? value.toString() : null;
          }
          break;
      }

      long totalTime = System.currentTimeMillis() - methodStartTime;
      log.info("[getFullTextForField] *** TOTAL TIME: {} ms ***", totalTime);
      log.info("[getFullTextForField] Field '{}' length: {} chars", fieldName,
          fullText != null ? fullText.length() : 0);

      return fullText;

    } catch (Exception e) {
      log.error("[getFullTextForField] Error fetching field '{}' for company {}: {}",
          fieldName, id, e.getMessage());
      throw e;
    }
  }

  /**
   * Convert entity to complete profile format including all profile-only fields.
   * Unlike lite format, this does NOT truncate text fields for full profile display.
   */
  private Map<String, Object> convertEntityToProfileFormat(
      CompanyExtractionData entity,
      Long portfolioId) {
    Map<String, Object> profile = new HashMap<>();

    // Start with all lite fields but override truncated fields with full text
    Map<String, Object> liteData = convertEntityToLiteFormat(entity, null);
    profile.putAll(liteData);

    // Override truncated fields with full text for profile display
    profile.put("company_description", entity.getCompanyDescription()); // Full text, not truncated
    profile.put("cluster_reasoning", entity.getClusterJustification()); // Full text, not truncated
    profile.put("headquarter_address", entity.getHeadquarterAddress()); // Full text, not truncated

    // Override SBMO explanations with full text
    profile.put("sbmo_criteria_a_explanation", entity.getSbmoCriteriaAExplanation());
    profile.put("sbmo_criteria_b_explanation", entity.getSbmoCriteriaBExplanation());
    profile.put("sbmo_criteria_c_explanation", entity.getSbmoCriteriaCExplanation());
    profile.put("sbmo_criteria_d_explanation", entity.getSbmoCriteriaDExplanation());

    // Add ESG Foresight detailed data from raw_extraction_data
    if (entity.getRawExtractionData() != null) {
      Map<String, Object> rawData = entity.getRawExtractionData();
      // Add foresight explanation data fields
      profile.put("esg_risk_environmental_foresight_data", rawData.get("esg_risk_environmental_foresight_data"));
      profile.put("esg_risk_social_foresight_data", rawData.get("esg_risk_social_foresight_data"));
      profile.put("esg_risk_governance_foresight_data", rawData.get("esg_risk_governance_foresight_data"));
      profile.put("esg_risk_foresight_mitigation_recommendations", rawData.get("esg_risk_foresight_mitigation_recommendations"));
      profile.put("esg_risk_foresight_risk_outlook", rawData.get("esg_risk_foresight_risk_outlook"));
      profile.put("esg_risk_foresight_rising_risk_explanation", rawData.get("esg_risk_foresight_rising_risk_explanation"));

      // Growth likelihood reasons and summary (profile-only fields)
      addProfileOnlyField(profile, rawData, "growth_media_reach_reason");
      addProfileOnlyField(profile, rawData, "growth_sentiment_reason");
      addProfileOnlyField(profile, rawData, "growth_innovation_visibility_reason");
      addProfileOnlyField(profile, rawData, "growth_team_strength_reason");
      addProfileOnlyField(profile, rawData, "growth_funding_velocity_reason");
      addProfileOnlyField(profile, rawData, "growth_company_age_reason");
      addProfileOnlyField(profile, rawData, "growth_summary");
      addProfileOnlyField(profile, rawData, "growth_likelihood_details");
    }
    // Add profile-only fields that are excluded from lite endpoint
    Map<String, Object> rawData = entity.getRawExtractionData();
    if (rawData != null) {
      // Profile-only fields from JSONB
      addProfileOnlyField(profile, rawData, "impact_scoring");
      addProfileOnlyField(profile, rawData, "theory_of_change");
      addProfileOnlyField(profile, rawData, "core_products_services");
      addProfileOnlyField(profile, rawData, "emissions_breakdown");
      addProfileOnlyField(profile, rawData, "esg_materiality_analysis");

      // ESG Risk Score explanations (profile-only, not in lite endpoint)
      addProfileOnlyField(profile, rawData, "esg_risk_environmental_explanation");
      addProfileOnlyField(profile, rawData, "esg_risk_social_explanation");
      addProfileOnlyField(profile, rawData, "esg_risk_governance_explanation");
    }

    // Add entity-specific profile fields
    profile.put("id", entity.getId());
    profile.put("created_at", entity.getCreatedAt());
    profile.put("last_modified_at", entity.getLastModifiedAt());
    profile.put("track_news", entity.getTrackNews());

    PortfolioRankDetails rankDetails =
        getPortfolioRankDetails(entity.getId(), portfolioId);
    profile.put("venture_platform_score", rankDetails.getVenturePlatformScore());
    profile.put("metrics_considered", rankDetails.getMetricsConsidered());
    profile.put("portfolio_rank", rankDetails.getPortfolioRank());
    profile.put("ranked_company_count", rankDetails.getRankedCompanyCount());
    profile.put("venture_platform_score_v2",
        rankDetails.getVenturePlatformScoreV2());
    profile.put("metrics_considered_v2",
        rankDetails.getMetricsConsideredV2());
    profile.put("portfolio_rank_v2", rankDetails.getPortfolioRankV2());
    profile.put("ranked_company_count_v2",
        rankDetails.getRankedCompanyCountV2());

    return profile;
  }

  /**
   * Helper method to safely add profile-only fields from raw data.
   */
  private void addProfileOnlyField(Map<String, Object> profile, Map<String, Object> rawData, String fieldName) {
    Object value = rawData.get(fieldName);
    if (value != null) {
      profile.put(fieldName, value);
    }
  }

  /**
   * Compute venture platform score and rank details.
   *
   * @param companyId company identifier
   * @param portfolioId optional portfolio identifier
   * @return portfolio rank details with global fallback
   */
  public PortfolioRankDetails getPortfolioRankDetails(
      final Long companyId,
      final Long portfolioId) {
    PortfolioRankSnapshot globalSnapshot =
        companyPolarChartService.getPortfolioRankingSnapshot(companyId);

    Double venturePlatformScore =
        globalSnapshot != null ? globalSnapshot.getAveragePercentile() : null;
    Integer metricsConsidered =
        globalSnapshot != null ? globalSnapshot.getMetricsConsidered() : null;
    Double venturePlatformScoreV2 =
        globalSnapshot != null ? globalSnapshot.getAveragePercentileV2() : null;
    Integer metricsConsideredV2 =
        globalSnapshot != null ? globalSnapshot.getMetricsConsideredV2() : null;
    Integer portfolioRank = null;
    Integer rankedCompanyCount = null;
    Integer portfolioRankV2 = null;
    Integer rankedCompanyCountV2 = null;

    if (portfolioId != null) {
      List<Long> portfolioCompanyIds =
          repository.findIdsAccessibleByPortfolioId(portfolioId);
      if (!portfolioCompanyIds.isEmpty()) {
        Map<Long, PortfolioRankSnapshot> portfolioSnapshots =
            companyPolarChartService.getPortfolioRankingSnapshots(
                portfolioCompanyIds);
        rankedCompanyCount = portfolioSnapshots.size();
        PortfolioRankSnapshot targetSnapshot =
            portfolioSnapshots.get(companyId);
        if (targetSnapshot != null) {
          List<PortfolioRankSnapshot> orderedSnapshots =
              portfolioSnapshots.values()
                  .stream()
                  .sorted(Comparator
                      .comparing(PortfolioRankSnapshot::getAveragePercentile)
                      .reversed()
                      .thenComparing(PortfolioRankSnapshot::getCompanyId))
                  .collect(Collectors.toList());
          int processed = 0;
          int currentRank = 0;
          double lastScore = Double.NaN;
          for (PortfolioRankSnapshot snapshot : orderedSnapshots) {
            processed++;
            double score = snapshot.getAveragePercentile();
            if (processed == 1
                || Math.abs(score - lastScore) > PORTFOLIO_RANK_EPSILON) {
              currentRank = processed;
              lastScore = score;
            }
            if (snapshot.getCompanyId().equals(companyId)) {
              portfolioRank = currentRank;
              break;
            }
          }
        }

        List<PortfolioRankSnapshot> orderedSnapshotsV2 =
            portfolioSnapshots.values()
                .stream()
                .filter(snapshot ->
                    snapshot.getAveragePercentileV2() != null)
                .sorted(Comparator
                    .comparing(PortfolioRankSnapshot::getAveragePercentileV2)
                    .reversed()
                    .thenComparing(PortfolioRankSnapshot::getCompanyId))
                .collect(Collectors.toList());
        rankedCompanyCountV2 = orderedSnapshotsV2.size();
        int processedV2 = 0;
        int currentRankV2 = 0;
        double lastScoreV2 = Double.NaN;
        for (PortfolioRankSnapshot snapshot : orderedSnapshotsV2) {
          processedV2++;
          double score = snapshot.getAveragePercentileV2();
          if (processedV2 == 1
              || Math.abs(score - lastScoreV2) > PORTFOLIO_RANK_EPSILON) {
            currentRankV2 = processedV2;
            lastScoreV2 = score;
          }
          if (snapshot.getCompanyId().equals(companyId)) {
            portfolioRankV2 = currentRankV2;
            break;
          }
        }
      } else {
        rankedCompanyCount = 0;
        rankedCompanyCountV2 = 0;
      }
      return new PortfolioRankDetails(
          venturePlatformScore,
          metricsConsidered,
          portfolioRank,
          rankedCompanyCount,
          venturePlatformScoreV2,
          metricsConsideredV2,
          portfolioRankV2,
          rankedCompanyCountV2);
    }

    if (globalSnapshot != null) {
      portfolioRank = globalSnapshot.getRank();
      rankedCompanyCount = globalSnapshot.getRankedCompanyCount();
      portfolioRankV2 = globalSnapshot.getRankV2();
      rankedCompanyCountV2 = globalSnapshot.getRankedCompanyCountV2();
    } else {
      rankedCompanyCount = companyPolarChartService.getRankedCompanyCount();
      rankedCompanyCountV2 =
          companyPolarChartService.getRankedCompanyCountV2();
    }

    return new PortfolioRankDetails(
        venturePlatformScore,
        metricsConsidered,
        portfolioRank,
        rankedCompanyCount,
        venturePlatformScoreV2,
        metricsConsideredV2,
        portfolioRankV2,
        rankedCompanyCountV2);
  }

  @Getter
  @AllArgsConstructor
  public static class PortfolioRankDetails {
    private final Double venturePlatformScore;
    private final Integer metricsConsidered;
    private final Integer portfolioRank;
    private final Integer rankedCompanyCount;
    private final Double venturePlatformScoreV2;
    private final Integer metricsConsideredV2;
    private final Integer portfolioRankV2;
    private final Integer rankedCompanyCountV2;
  }

  /**
   * Convert entity to lite format with optional field selection for sparse fieldsets.
   * When requestedFields is null or empty, includes all fields.
   * When requestedFields is specified, only includes those fields plus required fields.
   * Required fields always included: id, url, company_name, created_at.
   */
  private Map<String, Object> convertEntityToLiteFormat(
      CompanyExtractionData entity, Set<String> requestedFields) {
    boolean includeAll = (requestedFields == null || requestedFields.isEmpty());

    Map<String, Object> lite = new HashMap<>();

    // Always include required fields
    lite.put("id", entity.getId());
    lite.put("url", entity.getCompanyUrl());
    lite.put("company_name", entity.getCompanyName());
    lite.put("created_at", entity.getCreatedAt());

    // Basic company info
    if (includeAll || requestedFields.contains("track_news")) {
      lite.put("track_news", entity.getTrackNews());
    }
    if (includeAll || requestedFields.contains("company_description")) {
      lite.put("company_description", truncateText(entity.getCompanyDescription(), 180));
    }
    if (includeAll || requestedFields.contains("legal_form")) {
      lite.put("legal_form", entity.getLegalForm());
    }
    if (includeAll || requestedFields.contains("legal_entity_formation_date")) {
      lite.put("legal_entity_formation_date", entity.getLegalEntityFormationDate());
    }
    if (includeAll || requestedFields.contains("headquarter_address")) {
      lite.put("headquarter_address", truncateText(entity.getHeadquarterAddress(), 180));
    }
    if (includeAll || requestedFields.contains("phone_number")) {
      lite.put("phone_number", entity.getPhoneNumber());
    }
    if (includeAll || requestedFields.contains("contact_email")) {
      lite.put("contact_email", entity.getContactEmail());
    }
    if (includeAll || requestedFields.contains("ceo_name")) {
      lite.put("ceo_name", entity.getCeoName());
    }
    if (includeAll || requestedFields.contains("number_of_employees")) {
      lite.put("number_of_employees", entity.getNumberOfEmployees());
    }
    if (includeAll || requestedFields.contains("company_logo")) {
      lite.put("company_logo", entity.getCompanyLogo());
    }

    // Financial data
    if (includeAll || requestedFields.contains("total_funding_amount")) {
      lite.put("total_funding_amount", entity.getTotalFundingAmount());
    }
    if (includeAll || requestedFields.contains("funding_currency")) {
      lite.put("funding_currency", entity.getFundingCurrency());
    }
    if (includeAll || requestedFields.contains("total_funding_amount_type")) {
      lite.put("total_funding_amount_type", entity.getTotalFundingAmountType());
    }
    if (includeAll || requestedFields.contains("annual_sales_2022")) {
      lite.put("annual_sales_2022", formatSalesForDisplay(entity.getAnnualSales2022()));
    }
    if (includeAll || requestedFields.contains("annual_sales_2023")) {
      lite.put("annual_sales_2023", formatSalesForDisplay(entity.getAnnualSales2023()));
    }
    if (includeAll || requestedFields.contains("annual_sales_2024")) {
      lite.put("annual_sales_2024", formatSalesForDisplay(entity.getAnnualSales2024()));
    }
    if (includeAll || requestedFields.contains("currency_2022")) {
      lite.put("currency_2022", entity.getCurrency2022());
    }
    if (includeAll || requestedFields.contains("currency_2023")) {
      lite.put("currency_2023", entity.getCurrency2023());
    }
    if (includeAll || requestedFields.contains("currency_2024")) {
      lite.put("currency_2024", entity.getCurrency2024());
    }
    if (includeAll || requestedFields.contains("annual_sales_2022_type")) {
      lite.put("annual_sales_2022_type", entity.getAnnualSales2022Type());
    }
    if (includeAll || requestedFields.contains("annual_sales_2023_type")) {
      lite.put("annual_sales_2023_type", entity.getAnnualSales2023Type());
    }
    if (includeAll || requestedFields.contains("annual_sales_2024_type")) {
      lite.put("annual_sales_2024_type", entity.getAnnualSales2024Type());
    }

    // Patent count fields
    if (includeAll || requestedFields.contains("total_patents")) {
      lite.put("total_patents", entity.getTotalPatents());
    }
    if (includeAll || requestedFields.contains("granted_patents")) {
      lite.put("granted_patents", entity.getGrantedPatents());
    }
    if (includeAll || requestedFields.contains("patent_applications")) {
      lite.put("patent_applications", entity.getPatentApplications());
    }
    if (includeAll || requestedFields.contains("last_patent_check_at")) {
      lite.put("last_patent_check_at", entity.getLastPatentCheckAt());
    }

    // Industry/Clustering
    if (includeAll || requestedFields.contains("industry_sectors")) {
      lite.put("industry_sectors", entity.getIndustrySectors());
    }
    if (includeAll || requestedFields.contains("technology_cluster")) {
      lite.put("technology_cluster", entity.getClusterAssignment() != null
          ? entity.getClusterAssignment() : "General – Non-Cluster");
    }
    if (includeAll || requestedFields.contains("cluster_confidence_score")) {
      lite.put("cluster_confidence_score", entity.getClusterConfidenceScore());
    }
    if (includeAll || requestedFields.contains("cluster_reasoning")) {
      lite.put("cluster_reasoning", truncateText(entity.getClusterJustification(), 180));
    }

    // All numeric scores
    if (includeAll || requestedFields.contains("overall_impact_potential_score")) {
      lite.put("overall_impact_potential_score", entity.getOverallImpactPotentialScore());
    }
    if (includeAll || requestedFields.contains("impact_magnitude_5_year")) {
      lite.put("impact_magnitude_5_year", entity.getImpactMagnitude5Year());
    }
    if (includeAll || requestedFields.contains("impact_magnitude_5_year_negative")) {
      lite.put("impact_magnitude_5_year_negative", entity.getImpactMagnitude5YearNegative());
    }
    if (includeAll || requestedFields.contains("impact_magnitude_5_year_net")) {
      lite.put("impact_magnitude_5_year_net", entity.getImpactMagnitude5YearNet());
    }
    if (includeAll || requestedFields.contains("impact_likelihood")) {
      lite.put("impact_likelihood", entity.getImpactLikelihood());
    }
    if (includeAll || requestedFields.contains("growth_media_reach_score")) {
      lite.put("growth_media_reach_score", entity.getGrowthMediaReachScore());
    }
    if (includeAll || requestedFields.contains("growth_sentiment_score")) {
      lite.put("growth_sentiment_score", entity.getGrowthSentimentScore());
    }
    if (includeAll || requestedFields.contains("growth_innovation_visibility_score")) {
      lite.put("growth_innovation_visibility_score", entity.getGrowthInnovationVisibilityScore());
    }
    if (includeAll || requestedFields.contains("growth_team_strength_score")) {
      lite.put("growth_team_strength_score", entity.getGrowthTeamStrengthScore());
    }
    if (includeAll || requestedFields.contains("growth_funding_velocity_score")) {
      lite.put("growth_funding_velocity_score", entity.getGrowthFundingVelocityScore());
    }
    if (includeAll || requestedFields.contains("growth_company_age_score")) {
      lite.put("growth_company_age_score", entity.getGrowthCompanyAgeScore());
    }
    if (includeAll || requestedFields.contains("growth_composite_score")) {
      lite.put("growth_composite_score", entity.getGrowthCompositeScore());
    }

    // ESG Risk Scores
    if (includeAll || requestedFields.contains("esg_risk_environmental_inherent")) {
      lite.put("esg_risk_environmental_inherent", entity.getEsgRiskEnvironmentalInherent());
    }
    if (includeAll || requestedFields.contains("esg_risk_environmental_adjusted")) {
      lite.put("esg_risk_environmental_adjusted", entity.getEsgRiskEnvironmentalAdjusted());
    }
    if (includeAll || requestedFields.contains("esg_risk_social_inherent")) {
      lite.put("esg_risk_social_inherent", entity.getEsgRiskSocialInherent());
    }
    if (includeAll || requestedFields.contains("esg_risk_social_adjusted")) {
      lite.put("esg_risk_social_adjusted", entity.getEsgRiskSocialAdjusted());
    }
    if (includeAll || requestedFields.contains("esg_risk_governance_inherent")) {
      lite.put("esg_risk_governance_inherent", entity.getEsgRiskGovernanceInherent());
    }
    if (includeAll || requestedFields.contains("esg_risk_governance_adjusted")) {
      lite.put("esg_risk_governance_adjusted", entity.getEsgRiskGovernanceAdjusted());
    }
    if (includeAll || requestedFields.contains("esg_risk_total_inherent")) {
      lite.put("esg_risk_total_inherent", entity.getEsgRiskTotalInherent());
    }
    if (includeAll || requestedFields.contains("esg_risk_total_adjusted")) {
      lite.put("esg_risk_total_adjusted", entity.getEsgRiskTotalAdjusted());
    }

    // ESG Foresight Scores
    if (includeAll || requestedFields.contains("esg_risk_environmental_foresight")) {
      lite.put("esg_risk_environmental_foresight", entity.getEsgRiskEnvironmentalForesight());
    }
    if (includeAll || requestedFields.contains("esg_risk_social_foresight")) {
      lite.put("esg_risk_social_foresight", entity.getEsgRiskSocialForesight());
    }
    if (includeAll || requestedFields.contains("esg_risk_governance_foresight")) {
      lite.put("esg_risk_governance_foresight", entity.getEsgRiskGovernanceForesight());
    }
    if (includeAll || requestedFields.contains("esg_risk_total_foresight")) {
      lite.put("esg_risk_total_foresight", entity.getEsgRiskTotalForesight());
    }
    if (includeAll || requestedFields.contains("esg_foresight_qualified")) {
      lite.put("esg_foresight_qualified", entity.getEsgForesightQualified());
    }
    if (includeAll || requestedFields.contains("is_large_cap_mode")) {
      lite.put("is_large_cap_mode", entity.getIsLargeCapMode());
    }
    if (includeAll || requestedFields.contains("large_cap_threshold_reason")) {
      lite.put("large_cap_threshold_reason", entity.getLargeCapThresholdReason());
    }

    // SBMO Scores
    if (includeAll || requestedFields.contains("sbmo_criteria_a_score")) {
      lite.put("sbmo_criteria_a_score", entity.getSbmoCriteriaAScore());
    }
    if (includeAll || requestedFields.contains("sbmo_criteria_b_score")) {
      lite.put("sbmo_criteria_b_score", entity.getSbmoCriteriaBScore());
    }
    if (includeAll || requestedFields.contains("sbmo_criteria_c_score")) {
      lite.put("sbmo_criteria_c_score", entity.getSbmoCriteriaCScore());
    }
    if (includeAll || requestedFields.contains("sbmo_criteria_d_score")) {
      lite.put("sbmo_criteria_d_score", entity.getSbmoCriteriaDScore());
    }
    if (includeAll || requestedFields.contains("sbmo_total_score")) {
      lite.put("sbmo_total_score", entity.getSbmoTotalScore());
    }
    if (includeAll || requestedFields.contains("sbmo_criteria_a_explanation")) {
      lite.put("sbmo_criteria_a_explanation", truncateText(entity.getSbmoCriteriaAExplanation(), 180));
    }
    if (includeAll || requestedFields.contains("sbmo_criteria_b_explanation")) {
      lite.put("sbmo_criteria_b_explanation", truncateText(entity.getSbmoCriteriaBExplanation(), 180));
    }
    if (includeAll || requestedFields.contains("sbmo_criteria_c_explanation")) {
      lite.put("sbmo_criteria_c_explanation", truncateText(entity.getSbmoCriteriaCExplanation(), 180));
    }
    if (includeAll || requestedFields.contains("sbmo_criteria_d_explanation")) {
      lite.put("sbmo_criteria_d_explanation", truncateText(entity.getSbmoCriteriaDExplanation(), 180));
    }

    // Carbon Emissions
    if (includeAll || requestedFields.contains("total_carbon_emissions")) {
      lite.put("total_carbon_emissions", entity.getTotalCarbonEmissions());
    }
    if (includeAll || requestedFields.contains("scope1_emissions")) {
      lite.put("scope1_emissions", entity.getScope1Emissions());
    }
    if (includeAll || requestedFields.contains("scope2_emissions")) {
      lite.put("scope2_emissions", entity.getScope2Emissions());
    }
    if (includeAll || requestedFields.contains("scope3_emissions")) {
      lite.put("scope3_emissions", entity.getScope3Emissions());
    }

    // Social Media Links
    if (includeAll || requestedFields.contains("social_media_links")) {
      lite.put("social_media_links", entity.getSocialMediaLinks());
    }

    // Social Media Follower Counts
    if (includeAll || requestedFields.contains("social_media_follower_counts")) {
      lite.put("social_media_follower_counts", entity.getSocialMediaFollowerCounts());
    }

    // Evidence fields
    if (includeAll || requestedFields.contains("certification_name")) {
      lite.put("certification_name", entity.getCertificationName());
    }
    if (includeAll || requestedFields.contains("certification_link")) {
      lite.put("certification_link", entity.getCertificationLink());
    }
    if (includeAll || requestedFields.contains("esg_impact_report")) {
      lite.put("esg_impact_report", entity.getEsgImpactReport());
    }
    if (includeAll || requestedFields.contains("esg_report_year")) {
      lite.put("esg_report_year", entity.getEsgReportYear());
    }
    if (includeAll || requestedFields.contains("esg_report_link")) {
      lite.put("esg_report_link", entity.getEsgReportLink());
    }
    if (includeAll || requestedFields.contains("prize_award_name_1")) {
      lite.put("prize_award_name_1", entity.getPrizeAwardName1());
    }
    if (includeAll || requestedFields.contains("prize_award_link_1")) {
      lite.put("prize_award_link_1", entity.getPrizeAwardLink1());
    }
    if (includeAll || requestedFields.contains("prize_award_name_2")) {
      lite.put("prize_award_name_2", entity.getPrizeAwardName2());
    }
    if (includeAll || requestedFields.contains("prize_award_link_2")) {
      lite.put("prize_award_link_2", entity.getPrizeAwardLink2());
    }
    if (includeAll || requestedFields.contains("primary_industry_standard")) {
      lite.put("primary_industry_standard", entity.getPrimaryIndustryStandard());
    }
    if (includeAll || requestedFields.contains("secondary_industry_standard")) {
      lite.put("secondary_industry_standard", entity.getSecondaryIndustryStandard());
    }
    if (includeAll || requestedFields.contains("geographic_scope_estimated")) {
      lite.put("geographic_scope_estimated", entity.getGeographicScopeEstimated());
    }
    if (includeAll || requestedFields.contains("stakeholder_geography_summary")) {
      lite.put("stakeholder_geography_summary", entity.getStakeholderGeographySummary());
    }
    if (includeAll || requestedFields.contains("public_impact_summary")) {
      lite.put("public_impact_summary", entity.getPublicImpactSummary());
    }

    // ESG Materiality Scores
    if (includeAll || requestedFields.contains("esg_sb_scores_sum")) {
      lite.put("esg_sb_scores_sum", entity.getEsgSbScoresSum() != null
          ? entity.getEsgSbScoresSum() : BigDecimal.ZERO);
    }
    if (includeAll || requestedFields.contains("esg_environmental_score")) {
      lite.put("esg_environmental_score", entity.getEsgEnvironmentalScore() != null
          ? entity.getEsgEnvironmentalScore() : BigDecimal.ZERO);
    }
    if (includeAll || requestedFields.contains("esg_social_score")) {
      lite.put("esg_social_score", entity.getEsgSocialScore() != null
          ? entity.getEsgSocialScore() : BigDecimal.ZERO);
    }
    if (includeAll || requestedFields.contains("esg_governance_score")) {
      lite.put("esg_governance_score", entity.getEsgGovernanceScore() != null
          ? entity.getEsgGovernanceScore() : BigDecimal.ZERO);
    }

    // Website Traffic Data
    if (includeAll || requestedFields.contains("traffic_aug_2023")) {
      lite.put("traffic_aug_2023", entity.getTrafficAug2023());
    }
    if (includeAll || requestedFields.contains("traffic_sep_2023")) {
      lite.put("traffic_sep_2023", entity.getTrafficSep2023());
    }
    if (includeAll || requestedFields.contains("traffic_oct_2023")) {
      lite.put("traffic_oct_2023", entity.getTrafficOct2023());
    }
    if (includeAll || requestedFields.contains("traffic_nov_2023")) {
      lite.put("traffic_nov_2023", entity.getTrafficNov2023());
    }
    if (includeAll || requestedFields.contains("traffic_dec_2023")) {
      lite.put("traffic_dec_2023", entity.getTrafficDec2023());
    }
    if (includeAll || requestedFields.contains("traffic_jan_2024")) {
      lite.put("traffic_jan_2024", entity.getTrafficJan2024());
    }
    if (includeAll || requestedFields.contains("traffic_feb_2024")) {
      lite.put("traffic_feb_2024", entity.getTrafficFeb2024());
    }
    if (includeAll || requestedFields.contains("traffic_mar_2024")) {
      lite.put("traffic_mar_2024", entity.getTrafficMar2024());
    }
    if (includeAll || requestedFields.contains("traffic_apr_2024")) {
      lite.put("traffic_apr_2024", entity.getTrafficApr2024());
    }
    if (includeAll || requestedFields.contains("traffic_may_2024")) {
      lite.put("traffic_may_2024", entity.getTrafficMay2024());
    }
    if (includeAll || requestedFields.contains("traffic_jun_2024")) {
      lite.put("traffic_jun_2024", entity.getTrafficJun2024());
    }
    if (includeAll || requestedFields.contains("traffic_jul_2024")) {
      lite.put("traffic_jul_2024", entity.getTrafficJul2024());
    }
    if (includeAll || requestedFields.contains("traffic_aug_2024")) {
      lite.put("traffic_aug_2024", entity.getTrafficAug2024());
    }
    if (includeAll || requestedFields.contains("traffic_sep_2024")) {
      lite.put("traffic_sep_2024", entity.getTrafficSep2024());
    }
    if (includeAll || requestedFields.contains("traffic_oct_2024")) {
      lite.put("traffic_oct_2024", entity.getTrafficOct2024());
    }
    if (includeAll || requestedFields.contains("traffic_nov_2024")) {
      lite.put("traffic_nov_2024", entity.getTrafficNov2024());
    }
    if (includeAll || requestedFields.contains("traffic_dec_2024")) {
      lite.put("traffic_dec_2024", entity.getTrafficDec2024());
    }
    if (includeAll || requestedFields.contains("traffic_jan_2025")) {
      lite.put("traffic_jan_2025", entity.getTrafficJan2025());
    }
    if (includeAll || requestedFields.contains("traffic_feb_2025")) {
      lite.put("traffic_feb_2025", entity.getTrafficFeb2025());
    }
    if (includeAll || requestedFields.contains("traffic_mar_2025")) {
      lite.put("traffic_mar_2025", entity.getTrafficMar2025());
    }
    if (includeAll || requestedFields.contains("traffic_apr_2025")) {
      lite.put("traffic_apr_2025", entity.getTrafficApr2025());
    }
    if (includeAll || requestedFields.contains("traffic_may_2025")) {
      lite.put("traffic_may_2025", entity.getTrafficMay2025());
    }
    if (includeAll || requestedFields.contains("traffic_jun_2025")) {
      lite.put("traffic_jun_2025", entity.getTrafficJun2025());
    }
    if (includeAll || requestedFields.contains("traffic_jul_2025")) {
      lite.put("traffic_jul_2025", entity.getTrafficJul2025());
    }
    if (includeAll || requestedFields.contains("traffic_aug_2025")) {
      lite.put("traffic_aug_2025", entity.getTrafficAug2025());
    }
    if (includeAll || requestedFields.contains("traffic_sep_2025")) {
      lite.put("traffic_sep_2025", entity.getTrafficSep2025());
    }
    if (includeAll || requestedFields.contains("traffic_oct_2025")) {
      lite.put("traffic_oct_2025", entity.getTrafficOct2025());
    }
    if (includeAll || requestedFields.contains("traffic_nov_2025")) {
      lite.put("traffic_nov_2025", entity.getTrafficNov2025());
    }
    if (includeAll || requestedFields.contains("traffic_dec_2025")) {
      lite.put("traffic_dec_2025", entity.getTrafficDec2025());
    }

    // Traffic growth metrics
    if (includeAll || requestedFields.contains("one_month_growth")) {
      lite.put("one_month_growth", entity.getOneMonthGrowth());
    }
    if (includeAll || requestedFields.contains("three_month_growth_trend")) {
      lite.put("three_month_growth_trend", entity.getThreeMonthGrowthTrend());
    }
    if (includeAll || requestedFields.contains("six_month_growth_trend")) {
      lite.put("six_month_growth_trend", entity.getSixMonthGrowthTrend());
    }
    if (includeAll || requestedFields.contains("one_year_growth")) {
      lite.put("one_year_growth", entity.getOneYearGrowth());
    }
    if (includeAll || requestedFields.contains("two_year_growth")) {
      lite.put("two_year_growth", entity.getTwoYearGrowth());
    }

    // Other important fields
    if (includeAll || requestedFields.contains("latitude")) {
      lite.put("latitude", entity.getLatitude());
    }
    if (includeAll || requestedFields.contains("longitude")) {
      lite.put("longitude", entity.getLongitude());
    }
    if (includeAll || requestedFields.contains("tags")) {
      lite.put("tags", entity.getTags() != null ? entity.getTags() : new ArrayList<>());
    }

    return lite;
  }

  /**
   * Convert a lite projection to the API response format.
   * Uses reflection-based ProjectionMapper for automatic field mapping,
   * then applies special transformations for specific fields.
   *
   * <p>New fields added to CompanyExtractionDataLiteProjection are automatically
   * included without any code changes needed here.
   *
   * @param projection The lite projection (excludes rawExtractionData)
   * @param requestedFields Optional set of field names to include
   * @return Map representation for API response
   */
  private Map<String, Object> convertProjectionToLiteFormat(
      CompanyExtractionDataLiteProjection projection, Set<String> requestedFields) {

    // Auto-map all projection fields using reflection
    Map<String, Object> lite = ProjectionMapper.toMap(projection, requestedFields);

    // Add field aliases (frontend expects different names)
    lite.put("url", projection.getCompanyUrl());

    // Always include id - essential for company identification and profile links
    // This must be present even when sparse fieldsets are used
    lite.put("id", projection.getId());

    // Apply special transformations for fields that need them
    applyProjectionTransformations(lite, projection, requestedFields);

    return lite;
  }

  /**
   * Apply special transformations to projection fields.
   * This includes truncation, formatting, default values, and field aliases.
   */
  private void applyProjectionTransformations(
      Map<String, Object> lite,
      CompanyExtractionDataLiteProjection projection,
      Set<String> requestedFields) {

    boolean includeAll = (requestedFields == null || requestedFields.isEmpty());

    // Truncated text fields
    if (includeAll || requestedFields.contains("company_description")) {
      lite.put("company_description",
          truncateText(projection.getCompanyDescription(), 180));
    }
    if (includeAll || requestedFields.contains("headquarter_address")) {
      lite.put("headquarter_address",
          truncateText(projection.getHeadquarterAddress(), 180));
    }
    if (includeAll || requestedFields.contains("cluster_reasoning")) {
      lite.put("cluster_reasoning",
          truncateText(projection.getClusterJustification(), 180));
    }
    if (includeAll || requestedFields.contains("sbmo_criteria_a_explanation")) {
      lite.put("sbmo_criteria_a_explanation",
          truncateText(projection.getSbmoCriteriaAExplanation(), 180));
    }
    if (includeAll || requestedFields.contains("sbmo_criteria_b_explanation")) {
      lite.put("sbmo_criteria_b_explanation",
          truncateText(projection.getSbmoCriteriaBExplanation(), 180));
    }
    if (includeAll || requestedFields.contains("sbmo_criteria_c_explanation")) {
      lite.put("sbmo_criteria_c_explanation",
          truncateText(projection.getSbmoCriteriaCExplanation(), 180));
    }
    if (includeAll || requestedFields.contains("sbmo_criteria_d_explanation")) {
      lite.put("sbmo_criteria_d_explanation",
          truncateText(projection.getSbmoCriteriaDExplanation(), 180));
    }

    // Formatted sales fields
    if (includeAll || requestedFields.contains("annual_sales_2022")) {
      lite.put("annual_sales_2022",
          formatSalesForDisplay(projection.getAnnualSales2022()));
    }
    if (includeAll || requestedFields.contains("annual_sales_2023")) {
      lite.put("annual_sales_2023",
          formatSalesForDisplay(projection.getAnnualSales2023()));
    }
    if (includeAll || requestedFields.contains("annual_sales_2024")) {
      lite.put("annual_sales_2024",
          formatSalesForDisplay(projection.getAnnualSales2024()));
    }

    // Fields with default values
    if (includeAll || requestedFields.contains("technology_cluster")) {
      lite.put("technology_cluster", projection.getClusterAssignment() != null
          ? projection.getClusterAssignment() : "General – Non-Cluster");
    }
    if (includeAll || requestedFields.contains("esg_sb_scores_sum")) {
      lite.put("esg_sb_scores_sum", projection.getEsgSbScoresSum() != null
          ? projection.getEsgSbScoresSum() : BigDecimal.ZERO);
    }
    if (includeAll || requestedFields.contains("esg_environmental_score")) {
      lite.put("esg_environmental_score", projection.getEsgEnvironmentalScore() != null
          ? projection.getEsgEnvironmentalScore() : BigDecimal.ZERO);
    }
    if (includeAll || requestedFields.contains("esg_social_score")) {
      lite.put("esg_social_score", projection.getEsgSocialScore() != null
          ? projection.getEsgSocialScore() : BigDecimal.ZERO);
    }
    if (includeAll || requestedFields.contains("esg_governance_score")) {
      lite.put("esg_governance_score", projection.getEsgGovernanceScore() != null
          ? projection.getEsgGovernanceScore() : BigDecimal.ZERO);
    }
    if (includeAll || requestedFields.contains("tags")) {
      lite.put("tags", projection.getTags() != null
          ? projection.getTags() : new ArrayList<>());
    }
  }

  /**
   * Truncate text to specified length, trying to break at word boundaries.
   */
  private String truncateText(String text, int maxLength) {
    if (text == null || text.length() <= maxLength) {
      return text;
    }
    // Try to break at word boundary
    int endIndex = text.lastIndexOf(' ', maxLength);
    if (endIndex == -1 || endIndex < maxLength - 20) {
      endIndex = maxLength;
    }
    return text.substring(0, endIndex).trim() + "...";
  }
  
  /**
   * Copy field from source to destination if it exists.
   */
  private void copyFieldIfExists(Map<String, Object> source, Map<String, Object> dest, String field) {
    if (source != null && source.containsKey(field)) {
      dest.put(field, source.get(field));
    }
  }
  
  /**
   * Get field value from raw extraction data.
   */
  private Object getFromRawData(CompanyExtractionData entity, String fieldName) {
    if (entity.getRawExtractionData() != null) {
      return entity.getRawExtractionData().get(fieldName);
    }
    return null;
  }
  
  /**
   * Get string value from raw data map.
   */
  private String getStringFromRawData(Map<String, Object> rawData, String fieldName) {
    Object value = rawData.get(fieldName);
    return value != null ? value.toString() : null;
  }
  
  /**
   * Apply in-memory sorting for fields that only exist in raw data.
   */
  private Page<CompanyExtractionData> sortByRawDataField(Page<CompanyExtractionData> page, 
                                                         String sortBy, 
                                                         String sortDirection,
                                                         PageRequest pageable) {
    // Check if we need in-memory sorting
    List<String> rawDataOnlyFields = Arrays.asList(
      "overall_impact_potential_score",
      "impact_magnitude_5_year", "impact_likelihood",
      "cluster_confidence_score",
      "esg_sb_scores_sum", "esg_environmental_score", 
      "esg_social_score", "esg_governance_score",
      "social_media_twitter_followers", "social_media_facebook_followers",
      "social_media_linkedin_followers", "social_media_instagram_followers",
      "social_media_youtube_followers", "social_media_tiktok_followers",
      "social_media_bluesky_followers"
    );
    
    if (!rawDataOnlyFields.contains(sortBy)) {
      return page; // No in-memory sorting needed
    }
    
    // Get all content and sort in memory
    List<CompanyExtractionData> allContent = page.getContent();
    boolean ascending = "ASC".equalsIgnoreCase(sortDirection);
    
    allContent.sort((a, b) -> {
      Object aValue = null;
      Object bValue = null;
      
      // Handle social media followers specially
      if (sortBy.contains("_followers")) {
        String platform = sortBy.replace("social_media_", "").replace("_followers", "");
        if (a.getSocialMediaFollowerCounts() != null) {
          aValue = a.getSocialMediaFollowerCounts().get(platform);
        }
        if (b.getSocialMediaFollowerCounts() != null) {
          bValue = b.getSocialMediaFollowerCounts().get(platform);
        }
      } else {
        // Handle raw data fields
        if (a.getRawExtractionData() != null) {
          aValue = a.getRawExtractionData().get(sortBy);
        }
        if (b.getRawExtractionData() != null) {
          bValue = b.getRawExtractionData().get(sortBy);
        }
      }
      
      // Handle nulls
      if (aValue == null && bValue == null) {
        return 0;
      }
      if (aValue == null) {
        return ascending ? -1 : 1;
      }
      if (bValue == null) {
        return ascending ? 1 : -1;
      }
      
      // Compare as numbers
      try {
        double aNum = Double.parseDouble(aValue.toString());
        double bNum = Double.parseDouble(bValue.toString());
        int result = Double.compare(aNum, bNum);
        return ascending ? result : -result;
      } catch (NumberFormatException e) {
        // Fall back to string comparison
        int result = aValue.toString().compareTo(bValue.toString());
        return ascending ? result : -result;
      }
    });
    
    // Return new page with sorted content
    return new PageImpl<>(allContent, pageable, page.getTotalElements());
  }

  /**
   * Get companies within geographic bounds.
   * Returns basic company information for map markers.
   *
   * @param minLat Minimum latitude
   * @param maxLat Maximum latitude
   * @param minLng Minimum longitude
   * @param maxLng Maximum longitude
   * @param portfolioId Optional portfolio filter
   * @param tags Optional tag filters
   * @param user User for access control
   * @return List of companies with basic info
   */
  public List<Map<String, Object>> getCompaniesInBounds(
      final Double minLat, final Double maxLat,
      final Double minLng, final Double maxLng,
      final Long portfolioId, final List<String> tags, final User user) {

    log.info("[GEOLOCATION-SERVICE] Getting companies in bounds - minLat: {}, maxLat: {}, " +
        "minLng: {}, maxLng: {}, portfolioId: {}, tags: {}",
        minLat, maxLat, minLng, maxLng, portfolioId, tags);

    // Query companies based on portfolio and geographic bounds
    List<CompanyExtractionData> companies;

    if (portfolioId != null) {
      // Use portfolio-specific query with geographic filtering
      companies = repository.findAllAccessibleByPortfolioIdAndBounds(
          portfolioId, minLat, maxLat, minLng, maxLng);
      log.info("[GEOLOCATION-SERVICE] Found {} companies in bounds for portfolio {}",
          companies.size(), portfolioId);
    } else if (securityService.isSuperAdmin()) {
      // SuperAdmin gets all companies in bounds
      companies = repository.findAllInBounds(minLat, maxLat, minLng, maxLng);
      log.info("[GEOLOCATION-SERVICE] SuperAdmin: Found {} companies in bounds",
          companies.size());
    } else {
      // For regular users, return empty list - they must specify a portfolioId
      log.info("[GEOLOCATION-SERVICE] Non-admin user without portfolio ID, returning empty list");
      return new ArrayList<>();
    }

    // Apply tag filtering if specified
    if (tags != null && !tags.isEmpty()) {
      companies = companies.stream()
          .filter(company -> {
            List<String> companyTags = company.getTags();
            if (companyTags == null || companyTags.isEmpty()) {
              return false;
            }
            return tags.stream().anyMatch(companyTags::contains);
          })
          .collect(Collectors.toList());
      log.info("[GEOLOCATION-SERVICE] After tag filtering: {} companies", companies.size());
    }

    // Convert to simple map format for frontend
    List<Map<String, Object>> result = companies.stream()
        .map(company -> {
          Map<String, Object> map = new HashMap<>();
          map.put("id", company.getId());
          map.put("company_name", company.getCompanyName());
          map.put("latitude", company.getLatitude());
          map.put("longitude", company.getLongitude());
          map.put("industry_sectors", company.getIndustrySectors());
          map.put("number_of_employees", company.getNumberOfEmployees());
          map.put("tags", company.getTags());
          return map;
        })
        .collect(Collectors.toList());

    log.info("[GEOLOCATION-SERVICE] Returning {} companies in bounds", result.size());
    return result;
  }

  /**
   * Calculate metrics for companies within geographic bounds.
   * Returns aggregated metrics similar to portfolio totals but filtered by location.
   *
   * @param minLat Minimum latitude
   * @param maxLat Maximum latitude
   * @param minLng Minimum longitude
   * @param maxLng Maximum longitude
   * @param portfolioId Optional portfolio filter
   * @param tags Optional tag filters
   * @param user User for access control
   * @return Map containing calculated metrics
   */
  public Map<String, Object> calculateMetricsForBounds(
      final Double minLat, final Double maxLat,
      final Double minLng, final Double maxLng,
      final Long portfolioId, final List<String> tags, final User user) {

    log.info("[GEOLOCATION-SERVICE] Calculating metrics for bounds - minLat: {}, maxLat: {}, " +
        "minLng: {}, maxLng: {}, portfolioId: {}, tags: {}",
        minLat, maxLat, minLng, maxLng, portfolioId, tags);

    // Query companies based on portfolio and geographic bounds
    List<CompanyExtractionData> companies;

    if (portfolioId != null) {
      // Use portfolio-specific query with geographic filtering
      companies = repository.findAllAccessibleByPortfolioIdAndBounds(
          portfolioId, minLat, maxLat, minLng, maxLng);
      log.info("[GEOLOCATION-SERVICE] Calculating metrics for {} companies in bounds for portfolio {}",
          companies.size(), portfolioId);
    } else if (securityService.isSuperAdmin()) {
      // SuperAdmin gets all companies in bounds
      companies = repository.findAllInBounds(minLat, maxLat, minLng, maxLng);
      log.info("[GEOLOCATION-SERVICE] SuperAdmin: Calculating metrics for {} companies in bounds",
          companies.size());
    } else {
      // For regular users, return empty metrics - they must specify a portfolioId
      log.info("[GEOLOCATION-SERVICE] Non-admin user without portfolio ID, returning empty metrics");
      return createEmptyMetrics();
    }

    // Apply tag filtering if specified
    if (tags != null && !tags.isEmpty()) {
      companies = companies.stream()
          .filter(company -> {
            List<String> companyTags = company.getTags();
            if (companyTags == null || companyTags.isEmpty()) {
              return false;
            }
            return tags.stream().anyMatch(companyTags::contains);
          })
          .collect(Collectors.toList());
      log.info("[GEOLOCATION-SERVICE] After tag filtering: {} companies for metrics", companies.size());
    }

    // Calculate metrics using existing helper methods
    Map<String, Object> metrics = new HashMap<>();
    metrics.put("totalCompanies", companies.size());
    metrics.put("totalEmployees", calculateTotalEmployees(companies));
    metrics.put("totalPatents", calculateTotalPatents(companies));
    metrics.put("totalSocialMediaFollowers", calculateTotalSocialMediaFollowers(companies));
    metrics.put("totalDailyTraffic", calculateTotalDailyTraffic(companies));
    metrics.put("companiesWithReports", calculateCompaniesWithReports(companies));

    SalesTotals salesTotals = calculateTotalSales(companies);
    metrics.put("totalSales", salesTotals.getDisplayValue());
    metrics.put("totalSalesRaw", salesTotals.getRawValue());
    metrics.put("totalSalesCurrency", salesTotals.getPrimaryCurrency());

    metrics.put("totalCarbonEmissions", calculateTotalCarbonEmissions(companies));
    metrics.put("companiesWithImpact", calculateCompaniesWithImpact(companies));
    metrics.put("companiesWithCertifications", calculateCompaniesWithCertifications(companies));

    addContinuousCounterMetadata(metrics);

    log.info("[GEOLOCATION-SERVICE] Calculated metrics for {} companies in bounds",
        metrics.get("totalCompanies"));
    return metrics;
  }

  /**
   * Create empty metrics map for when no companies are found.
   * @return Map with all metrics set to zero or N/A
   */
  private Map<String, Object> createEmptyMetrics() {
    Map<String, Object> metrics = new HashMap<>();
    metrics.put("totalCompanies", 0);
    metrics.put("totalEmployees", 0);
    metrics.put("totalPatents", 0);
    metrics.put("totalSocialMediaFollowers", 0);
    metrics.put("totalDailyTraffic", 0);
    metrics.put("companiesWithReports", 0);
    metrics.put("totalSales", "N/A");
    metrics.put("totalSalesRaw", 0D);
    metrics.put("totalSalesCurrency", null);
    metrics.put("totalCarbonEmissions", 0);
    metrics.put("companiesWithImpact", 0);
    metrics.put("companiesWithCertifications", 0);
    addContinuousCounterMetadata(metrics);
    return metrics;
  }

  /**
   * Calculate totals with tag filtering.
   * Used when tags are specified - can't use cached values for dynamic tag filtering.
   *
   * @param portfolioId optional portfolio filter
   * @param tags list of tags to filter companies
   * @return Map containing calculated totals
   */
  public Map<String, Object> calculateTotalsWithTags(final Long portfolioId, final List<String> tags) {
    log.info("Calculating totals with tag filtering - portfolioId: {}, tags: {}", portfolioId, tags);

    // Get all companies (filtered by portfolio if specified)
    List<CompanyExtractionData> companies;
    if (portfolioId != null) {
      companies = repository.findAllAccessibleByPortfolioId(portfolioId);
    } else {
      companies = repository.findAll();
    }

    // Apply tag filtering
    if (tags != null && !tags.isEmpty()) {
      companies = companies.stream()
          .filter(company -> {
            List<String> companyTags = company.getTags();
            if (companyTags == null || companyTags.isEmpty()) {
              return false;
            }
            return tags.stream().anyMatch(companyTags::contains);
          })
          .collect(Collectors.toList());
      log.info("After tag filtering: {} companies for totals", companies.size());
    }

    // Calculate totals using existing helper methods
    Map<String, Object> totals = new HashMap<>();
    totals.put("totalCompanies", companies.size());
    totals.put("totalEmployees", calculateTotalEmployees(companies));
    totals.put("totalPatents", calculateTotalPatents(companies));
    totals.put("totalSocialMediaFollowers", calculateTotalSocialMediaFollowers(companies));
    totals.put("totalDailyTraffic", calculateTotalDailyTraffic(companies));
    totals.put("companiesWithReports", calculateCompaniesWithReports(companies));

    SalesTotals salesTotals = calculateTotalSales(companies);
    totals.put("totalSales", salesTotals.getDisplayValue());
    totals.put("totalSalesRaw", salesTotals.getRawValue());
    totals.put("totalSalesCurrency", salesTotals.getPrimaryCurrency());

    totals.put("totalCarbonEmissions", calculateTotalCarbonEmissions(companies));
    totals.put("companiesWithImpact", calculateCompaniesWithImpact(companies));
    totals.put("companiesWithCertifications", calculateCompaniesWithCertifications(companies));

    log.info("Calculated totals for {} tag-filtered companies", companies.size());
    return totals;
  }

  /**
   * Calculate SBMO level distribution for a portfolio.
   * Groups companies into 4 levels based on weighted score:
   * Level 0 (None): 0-24, Level 1 (Peripheral): 25-49,
   * Level 2 (Embedded): 50-69, Level 3 (North Star): 70-100.
   *
   * @param portfolioId optional portfolio filter
   * @param tags optional tag filter
   * @return distribution map with counts and percentages
   */
  @SuppressWarnings("unchecked")
  public Map<String, Object> calculateSbmoDistribution(
      final Long portfolioId, final List<String> tags) {

    List<Object[]> rows = querySbmoAggregates(
        portfolioId, tags);

    int[] levelCounts = new int[4];
    Map<String, int[]> clusterCounts =
        new LinkedHashMap<>();
    Map<String, Integer> clusterTotals =
        new LinkedHashMap<>();

    for (Object[] row : rows) {
      int level = ((Number) row[0]).intValue();
      String cluster = (String) row[1];
      long cnt = ((Number) row[2]).longValue();

      levelCounts[level] += (int) cnt;

      if (cluster != null && !cluster.isEmpty()) {
        clusterCounts
            .computeIfAbsent(cluster, k -> new int[4]);
        clusterCounts.get(cluster)[level] += (int) cnt;
        clusterTotals.merge(
            cluster, (int) cnt, Integer::sum);
      }
    }

    int scored = 0;
    for (int c : levelCounts) {
      scored += c;
    }

    Long noScoreCount = countWithoutScore(
        portfolioId, tags);
    int noScore = noScoreCount.intValue();
    int total = scored + noScore;

    Map<String, Object> result = new LinkedHashMap<>();
    result.put("totalCompanies", total);
    result.put("companiesWithScore", scored);
    result.put("companiesWithoutScore", noScore);

    List<Map<String, Object>> levels = new ArrayList<>();
    levels.add(buildLevelEntry(
        0, "None", levelCounts[0], scored));
    levels.add(buildLevelEntry(
        1, "Peripheral", levelCounts[1], scored));
    levels.add(buildLevelEntry(
        2, "Embedded", levelCounts[2], scored));
    levels.add(buildLevelEntry(
        3, "North Star", levelCounts[3], scored));
    result.put("levels", levels);

    String[] levelLabels = {
      "None", "Peripheral", "Embedded", "North Star"
    };
    Map<String, Object> clusterBreakdown =
        new LinkedHashMap<>();
    for (Map.Entry<String, int[]> entry
        : clusterCounts.entrySet()) {
      int[] cc = entry.getValue();
      int cScored = 0;
      for (int v : cc) {
        cScored += v;
      }
      List<Map<String, Object>> cl = new ArrayList<>();
      for (int i = 0; i < 4; i++) {
        cl.add(buildLevelEntry(
            i, levelLabels[i], cc[i], cScored));
      }
      Map<String, Object> cd = new LinkedHashMap<>();
      cd.put("total",
          clusterTotals.getOrDefault(
              entry.getKey(), cScored));
      cd.put("scored", cScored);
      cd.put("levels", cl);
      clusterBreakdown.put(entry.getKey(), cd);
    }
    result.put("byCluster", clusterBreakdown);

    return result;
  }

  @SuppressWarnings("unchecked")
  private List<Object[]> querySbmoAggregates(
      final Long portfolioId,
      final List<String> tags) {
    boolean hasTags = tags != null && !tags.isEmpty();
    StringBuilder sql = new StringBuilder();
    sql.append("SELECT CASE")
        .append(" WHEN c.sbmo_total_score >= 70 THEN 3")
        .append(" WHEN c.sbmo_total_score >= 50 THEN 2")
        .append(" WHEN c.sbmo_total_score >= 25 THEN 1")
        .append(" ELSE 0 END AS sbmo_level,")
        .append(" COALESCE(c.cluster_assignment, '')")
        .append(" AS cluster,")
        .append(" COUNT(*) AS cnt")
        .append(" FROM company_extraction_data c");
    if (portfolioId != null) {
      sql.append(" JOIN")
          .append(" portfolio_company_extraction_access")
          .append(" a ON c.id")
          .append(" = a.company_extraction_data_id");
    }
    sql.append(" WHERE c.sbmo_total_score IS NOT NULL");
    if (portfolioId != null) {
      sql.append(" AND a.portfolio_id = :pid");
    }
    if (hasTags) {
      appendTagFilter(sql, tags);
    }
    sql.append(" GROUP BY sbmo_level, cluster");
    sql.append(" ORDER BY sbmo_level, cluster");

    javax.persistence.Query q =
        entityManager.createNativeQuery(sql.toString());
    if (portfolioId != null) {
      q.setParameter("pid", portfolioId);
    }
    if (hasTags) {
      bindTagParams(q, tags);
    }
    return q.getResultList();
  }

  private Long countWithoutScore(
      final Long portfolioId,
      final List<String> tags) {
    boolean hasTags = tags != null && !tags.isEmpty();
    StringBuilder sql = new StringBuilder();
    sql.append("SELECT COUNT(*)")
        .append(" FROM company_extraction_data c");
    if (portfolioId != null) {
      sql.append(" JOIN")
          .append(" portfolio_company_extraction_access")
          .append(" a ON c.id")
          .append(" = a.company_extraction_data_id");
    }
    sql.append(" WHERE c.sbmo_total_score IS NULL");
    if (portfolioId != null) {
      sql.append(" AND a.portfolio_id = :pid");
    }
    if (hasTags) {
      appendTagFilter(sql, tags);
    }

    javax.persistence.Query q =
        entityManager.createNativeQuery(sql.toString());
    if (portfolioId != null) {
      q.setParameter("pid", portfolioId);
    }
    if (hasTags) {
      bindTagParams(q, tags);
    }
    return ((Number) q.getSingleResult()).longValue();
  }

  private void appendTagFilter(
      final StringBuilder sql,
      final List<String> tags) {
    sql.append(" AND EXISTS (SELECT 1")
        .append(" FROM jsonb_array_elements_text(")
        .append("c.tags) t WHERE t IN (");
    for (int i = 0; i < tags.size(); i++) {
      if (i > 0) {
        sql.append(", ");
      }
      sql.append(":tag").append(i);
    }
    sql.append("))");
  }

  private void bindTagParams(
      final javax.persistence.Query q,
      final List<String> tags) {
    for (int i = 0; i < tags.size(); i++) {
      q.setParameter("tag" + i, tags.get(i));
    }
  }

  private Map<String, Object> buildLevelEntry(
      final int level,
      final String label,
      final int count,
      final int total) {
    Map<String, Object> entry = new LinkedHashMap<>();
    entry.put("level", level);
    entry.put("label", label);
    entry.put("count", count);
    entry.put("percentage", total > 0
        ? Math.round(
            (double) count / total * 1000.0) / 10.0
        : 0.0);
    return entry;
  }

  /**
   * Calculate total carbon emissions for a list of companies.
   * Reuses parseEmissionValue for consistent parsing logic.
   * @param companies List of companies to calculate for
   * @return Total carbon emissions
   */
  private long calculateTotalCarbonEmissions(
      final List<CompanyExtractionData> companies) {
    double total = companies.stream()
        .filter(c -> c.getTotalCarbonEmissions() != null && !c.getTotalCarbonEmissions().isEmpty())
        .mapToDouble(c -> parseEmissionValue(c.getTotalCarbonEmissions()))
        .sum();
    return Math.round(total);
  }

  /**
   * Attach continuous counter metadata to a metrics map.
   * Metadata describes how each metric should animate on the frontend.
   *
   * @param metrics base metrics map
   * @return enriched metrics map
   */
  public Map<String, Object> addContinuousCounterMetadata(Map<String, Object> metrics) {
    Map<String, Object> workingMetrics = metrics != null ? metrics : new HashMap<>();
    workingMetrics.put("continuousCounters", buildContinuousCounterMetadata(workingMetrics));
    return workingMetrics;
  }

  private Map<String, Object> buildContinuousCounterMetadata(Map<String, Object> metrics) {
    Map<String, Object> metadata = new HashMap<>();
    TimeWindow yearWindow = getCurrentYearWindow();
    TimeWindow dayWindow = getCurrentDayWindow();

    addFlowMetric(metadata, "totalSales", metrics.get("totalSalesRaw"),
        yearWindow.getStart(), yearWindow.getEnd(), false);
    addFlowMetric(metadata, "totalCarbonEmissions", metrics.get("totalCarbonEmissions"),
        yearWindow.getStart(), yearWindow.getEnd(), false);
    addFlowMetric(metadata, "totalDailyTraffic", metrics.get("totalDailyTraffic"),
        dayWindow.getStart(), dayWindow.getEnd(), true);
    return metadata;
  }

  private void addFlowMetric(Map<String, Object> metadata, String key, Object value,
      Instant periodStart, Instant periodEnd, boolean loop) {
    Double numericValue = extractDouble(value);
    if (numericValue == null || numericValue <= 0 || periodStart == null || periodEnd == null) {
      return;
    }

    long durationSeconds = Duration.between(periodStart, periodEnd).getSeconds();
    if (durationSeconds <= 0) {
      return;
    }

    Map<String, Object> config = new HashMap<>();
    config.put("mode", loop ? "loop" : "flow");
    config.put("targetValue", numericValue);
    config.put("periodStart", periodStart.toString());
    config.put("periodEnd", periodEnd.toString());
    config.put("loop", loop);
    config.put("ratePerSecond", numericValue / durationSeconds);
    metadata.put(key, config);
  }

  private Double extractDouble(Object value) {
    if (value == null) {
      return null;
    }
    if (value instanceof Number) {
      return ((Number) value).doubleValue();
    }
    if (value instanceof String) {
      String cleaned = ((String) value).replaceAll(",", "").trim();
      if (cleaned.isEmpty()) {
        return null;
      }
      try {
        return Double.parseDouble(cleaned);
      } catch (NumberFormatException e) {
        return null;
      }
    }
    return null;
  }

  private TimeWindow getCurrentYearWindow() {
    LocalDate today = LocalDate.now(ZoneOffset.UTC);
    LocalDate firstDay = today.withDayOfYear(1);
    Instant start = firstDay.atStartOfDay(ZoneOffset.UTC).toInstant();
    Instant end = firstDay.plusYears(1).atStartOfDay(ZoneOffset.UTC).toInstant();
    return new TimeWindow(start, end);
  }

  private TimeWindow getCurrentDayWindow() {
    LocalDate today = LocalDate.now(ZoneOffset.UTC);
    Instant start = today.atStartOfDay(ZoneOffset.UTC).toInstant();
    Instant end = today.plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant();
    return new TimeWindow(start, end);
  }

  @Getter
  @AllArgsConstructor
  private static class SalesTotals {
    private final double rawValue;
    private final String displayValue;
    private final String primaryCurrency;
  }

  @Getter
  @AllArgsConstructor
  private static class ImpactSummaryScores {
    private final double score;
    private final double magnitude;
    private final double likelihood;
  }

  @Getter
  @AllArgsConstructor
  private static class TimeWindow {
    private final Instant start;
    private final Instant end;
  }

  /**
   * Get companies grouped by technology cluster and ranked by specified criterion.
   * Returns top N companies per cluster sorted by the ranking metric.
   * Clusters are dynamically determined from the data in the database.
   *
   * @param portfolioId optional portfolio filter
   * @param rankBy ranking criterion: portfolio_rank, business_model, growth_likelihood, traffic
   * @param limit number of companies per cluster
   * @return Map containing clusters with ranked companies
   */
  public Map<String, Object> getClusterRankings(Long portfolioId, String rankBy, int limit) {
    return getClusterRankings(portfolioId, rankBy, limit, null);
  }

  /**
   * Get cluster rankings with optional custom metrics support.
   *
   * @param portfolioId optional portfolio filter
   * @param rankBy ranking criterion (or "custom" for custom metrics)
   * @param limit companies per cluster
   * @param customMetrics list of metric IDs when rankBy is "custom"
   * @return cluster rankings data
   */
  public Map<String, Object> getClusterRankings(Long portfolioId, String rankBy, int limit,
      List<String> customMetrics) {
    return getClusterRankings(portfolioId, rankBy, limit, customMetrics, null);
  }

  /**
   * Get cluster rankings with optional custom metrics and tag filtering support.
   *
   * @param portfolioId optional portfolio filter
   * @param rankBy ranking criterion (or "custom" for custom metrics)
   * @param limit companies per cluster
   * @param customMetrics list of metric IDs when rankBy is "custom"
   * @param tags optional list of tags to filter companies
   * @return cluster rankings data
   */
  public Map<String, Object> getClusterRankings(Long portfolioId, String rankBy, int limit,
      List<String> customMetrics, List<String> tags) {
    log.info("Getting cluster rankings - portfolioId: {}, rankBy: {}, limit: {}, customMetrics: {}, tags: {}",
        portfolioId, rankBy, limit, customMetrics, tags);

    // Get all companies (filtered by portfolio if specified)
    List<CompanyExtractionData> allCompanies;
    if (portfolioId != null) {
      allCompanies = repository.findAllAccessibleByPortfolioId(portfolioId);
    } else {
      allCompanies = repository.findAll();
    }

    // Apply tag filtering if specified
    if (tags != null && !tags.isEmpty()) {
      allCompanies = allCompanies.stream()
          .filter(company -> {
            List<String> companyTags = company.getTags();
            if (companyTags == null || companyTags.isEmpty()) {
              return false;
            }
            return tags.stream().anyMatch(companyTags::contains);
          })
          .collect(Collectors.toList());
      log.info("After tag filtering: {} companies for cluster rankings", allCompanies.size());
    }

    // Get portfolio ranking snapshots for all companies
    List<Long> companyIds = allCompanies.stream()
        .map(CompanyExtractionData::getId)
        .collect(Collectors.toList());
    Map<Long, PortfolioRankSnapshot> rankSnapshots =
        companyPolarChartService.getPortfolioRankingSnapshots(companyIds);

    // For custom rankings, pre-calculate scores for all companies
    Map<Long, Double> customScores = new HashMap<>();
    if ("custom".equals(rankBy) && customMetrics != null && !customMetrics.isEmpty()) {
      for (CompanyExtractionData company : allCompanies) {
        Double score = companyPolarChartService.calculateCustomRankingScore(
            company.getId(), customMetrics);
        if (score != null) {
          customScores.put(company.getId(), score);
        }
      }
    }

    // Group companies by cluster (dynamically from data)
    Map<String, List<CompanyExtractionData>> companiesByCluster = allCompanies.stream()
        .filter(c -> c.getClusterAssignment() != null && !c.getClusterAssignment().isEmpty())
        .collect(Collectors.groupingBy(CompanyExtractionData::getClusterAssignment));

    // Build result with rankings per cluster
    Map<String, Object> result = new HashMap<>();
    Map<String, Object> clusters = new HashMap<>();

    // Iterate over actual clusters found in the data (sorted alphabetically)
    List<String> sortedClusterNames = companiesByCluster.keySet().stream()
        .sorted()
        .collect(Collectors.toList());

    for (String cluster : sortedClusterNames) {
      List<CompanyExtractionData> clusterCompanies = companiesByCluster.get(cluster);

      // Sort companies by the specified ranking criterion
      List<CompanyExtractionData> sortedCompanies = sortCompaniesByRankCriterion(
          clusterCompanies, rankBy, rankSnapshots, customScores);

      // Take top N and convert to response format
      List<Map<String, Object>> rankedCompanies = sortedCompanies.stream()
          .limit(limit)
          .map(company -> buildClusterRankingEntry(company, rankBy, rankSnapshots, customScores))
          .collect(Collectors.toList());

      Map<String, Object> clusterData = new HashMap<>();
      clusterData.put("name", cluster);
      clusterData.put("companies", rankedCompanies);
      clusterData.put("totalCompanies", clusterCompanies.size());

      clusters.put(cluster, clusterData);
    }

    result.put("clusters", clusters);
    result.put("rankBy", rankBy);
    result.put("limit", limit);
    result.put("totalCompanies", allCompanies.size());
    if (customMetrics != null && !customMetrics.isEmpty()) {
      result.put("customMetrics", customMetrics);
    }

    return result;
  }

  /**
   * Sort companies by the specified ranking criterion.
   */
  private List<CompanyExtractionData> sortCompaniesByRankCriterion(
      List<CompanyExtractionData> companies,
      String rankBy,
      Map<Long, PortfolioRankSnapshot> rankSnapshots,
      Map<Long, Double> customScores) {

    Comparator<CompanyExtractionData> comparator;

    switch (rankBy) {
      case "custom":
        // Sort by custom composite score (higher percentile is better)
        comparator = Comparator.comparing(
            (CompanyExtractionData c) -> customScores.getOrDefault(c.getId(), 0.0),
            Comparator.reverseOrder());
        break;

      case "business_model":
        // Sort by SBMO total score (higher is better)
        comparator = Comparator.comparing(
            (CompanyExtractionData c) -> c.getSbmoTotalScore() != null
                ? c.getSbmoTotalScore().doubleValue() : 0.0,
            Comparator.reverseOrder());
        break;

      case "growth_likelihood":
        // Sort by growth composite score (higher is better)
        comparator = Comparator.comparing(
            (CompanyExtractionData c) -> c.getGrowthCompositeScore() != null
                ? c.getGrowthCompositeScore().doubleValue() : 0.0,
            Comparator.reverseOrder());
        break;

      case "traffic":
        // Sort by latest monthly traffic (higher is better)
        comparator = Comparator.comparing(
            this::getLatestTraffic,
            Comparator.reverseOrder());
        break;

      case "portfolio_rank_v2":
        // Sort by portfolio rank V2 score (higher percentile is better)
        comparator = Comparator.comparing(
            (CompanyExtractionData c) -> {
              PortfolioRankSnapshot snapshot = rankSnapshots.get(c.getId());
              if (snapshot != null && snapshot.getAveragePercentileV2() != null) {
                return snapshot.getAveragePercentileV2();
              }
              return 0.0;
            },
            Comparator.reverseOrder());
        break;

      case "portfolio_rank":
      default:
        // Sort by portfolio rank V1 score (higher percentile is better)
        comparator = Comparator.comparing(
            (CompanyExtractionData c) -> {
              PortfolioRankSnapshot snapshot = rankSnapshots.get(c.getId());
              return snapshot != null ? snapshot.getAveragePercentile() : 0.0;
            },
            Comparator.reverseOrder());
        break;
    }

    // Add secondary sort by company name for stability
    comparator = comparator.thenComparing(
        c -> c.getCompanyName() != null ? c.getCompanyName() : "",
        String.CASE_INSENSITIVE_ORDER);

    return companies.stream()
        .sorted(comparator)
        .collect(Collectors.toList());
  }

  /**
   * Get latest traffic value for a company.
   */
  private Long getLatestTraffic(CompanyExtractionData company) {
    // Check traffic values from newest to oldest
    if (company.getTrafficAug2025() != null && company.getTrafficAug2025() > 0) {
      return company.getTrafficAug2025();
    }
    if (company.getTrafficJul2025() != null && company.getTrafficJul2025() > 0) {
      return company.getTrafficJul2025();
    }
    if (company.getTrafficJun2025() != null && company.getTrafficJun2025() > 0) {
      return company.getTrafficJun2025();
    }
    if (company.getTrafficMay2025() != null && company.getTrafficMay2025() > 0) {
      return company.getTrafficMay2025();
    }
    if (company.getTrafficApr2025() != null && company.getTrafficApr2025() > 0) {
      return company.getTrafficApr2025();
    }
    if (company.getTrafficMar2025() != null && company.getTrafficMar2025() > 0) {
      return company.getTrafficMar2025();
    }
    return 0L;
  }

  /**
   * Build a cluster ranking entry for a company.
   */
  private Map<String, Object> buildClusterRankingEntry(
      CompanyExtractionData company,
      String rankBy,
      Map<Long, PortfolioRankSnapshot> rankSnapshots,
      Map<Long, Double> customScores) {

    Map<String, Object> entry = new HashMap<>();
    entry.put("id", company.getId());
    entry.put("companyName", company.getCompanyName());
    entry.put("companyLogo", company.getCompanyLogo());
    entry.put("domain", company.getDomain());

    // Add the score based on rank criterion
    double score = 0.0;
    switch (rankBy) {
      case "custom":
        // Convert percentile to 0-100 score
        score = customScores.getOrDefault(company.getId(), 0.0) * 100;
        entry.put("score", Math.round(score));
        entry.put("scoreLabel", "Custom Score");
        break;

      case "business_model":
        if (company.getSbmoTotalScore() != null) {
          score = company.getSbmoTotalScore().doubleValue();
        }
        entry.put("score", Math.round(score));
        entry.put("scoreLabel", "SBMO Score");
        break;

      case "growth_likelihood":
        if (company.getGrowthCompositeScore() != null) {
          score = company.getGrowthCompositeScore().doubleValue();
        }
        entry.put("score", Math.round(score));
        entry.put("scoreLabel", "Growth Score");
        break;

      case "traffic":
        Long traffic = getLatestTraffic(company);
        entry.put("score", traffic);
        entry.put("scoreLabel", "Monthly Traffic");
        break;

      case "portfolio_rank_v2":
        PortfolioRankSnapshot snapshotV2 = rankSnapshots.get(company.getId());
        if (snapshotV2 != null && snapshotV2.getAveragePercentileV2() != null) {
          // Convert percentile to 0-100 score
          score = snapshotV2.getAveragePercentileV2() * 100;
        }
        entry.put("score", Math.round(score));
        entry.put("scoreLabel", "Portfolio Score v2");
        break;

      case "portfolio_rank":
      default:
        PortfolioRankSnapshot snapshot = rankSnapshots.get(company.getId());
        // Convert percentile to 0-100 score
        score = snapshot != null ? snapshot.getAveragePercentile() * 100 : 0.0;
        entry.put("score", Math.round(score));
        entry.put("scoreLabel", "Portfolio Score");
        break;
    }

    return entry;
  }
}
