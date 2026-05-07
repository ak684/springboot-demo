package io.ventureplatform.service.extraction.phases;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import io.ventureplatform.service.external.ImpactAiService;
import io.ventureplatform.service.external.OpenAiClient;
import io.ventureplatform.service.extraction.pipeline.BaseExtractionPhase;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Phase 9: Theory of Change integration using existing ToC system.
 */
@Service
@Slf4j
public class TheoryOfChangeService extends BaseExtractionPhase {

  private final ImpactAiService impactAiService;

  public TheoryOfChangeService(ObjectMapper objectMapper, OpenAiClient openAiClient, ImpactAiService impactAiService) {
    super(objectMapper, openAiClient);
    this.impactAiService = impactAiService;
  }

  @Override
  public String getPhaseName() {
    return "Phase 9: Theory of Change";
  }

  @Override
  public int getPhaseNumber() {
    return 9;
  }

  @Override
  protected JsonNode executePhase(JsonNode companyData, String companyUrl) {
    return integrateTheoryOfChange(companyData, companyUrl);
  }

  /**
   * Re-run only the ABC classification for existing Theory of Change data.
   */
  public JsonNode addAbcClassificationOnly(JsonNode existingData, String companyUrl) {
    try {
      JsonNode parsed = objectMapper.readTree(objectMapper.writeValueAsString(existingData));
      if (!(parsed instanceof ObjectNode)) {
        return existingData;
      }
      ObjectNode result = (ObjectNode) parsed;
      addAbcClassification(result, result, companyUrl);
      return result;
    } catch (Exception e) {
      log.error("Error running ABC-only classification for {}: {}", companyUrl, e.getMessage());
      return existingData;
    }
  }

  /**
   * Recalculate impact scoring aggregates for existing extraction data.
   * This uses the corrected dashboard formula without re-running AI generation.
   *
   * @param existingData The existing extraction data with theory_of_change and impact_scoring
   * @param companyUrl The company URL (for logging)
   * @return Updated extraction data with recalculated aggregate metrics
   */
  public JsonNode recalculateImpactScoring(JsonNode existingData, String companyUrl) {
    try {
      JsonNode parsed = objectMapper.readTree(objectMapper.writeValueAsString(existingData));
      if (!(parsed instanceof ObjectNode)) {
        log.warn("Invalid data format for impact scoring recalculation: {}", companyUrl);
        return existingData;
      }
      ObjectNode result = (ObjectNode) parsed;

      JsonNode tocData = result.path("theory_of_change");
      JsonNode scoringData = result.path("impact_scoring");

      if (!scoringData.isArray() || scoringData.size() == 0) {
        log.warn("No impact_scoring data found for recalculation: {}", companyUrl);
        return existingData;
      }

      // Recalculate aggregated metrics using the corrected dashboard formula
      addAggregatedImpactMetrics(result, tocData, scoringData);

      log.info("Successfully recalculated impact scoring for {}", companyUrl);
      return result;
    } catch (Exception e) {
      log.error("Error recalculating impact scoring for {}: {}", companyUrl, e.getMessage());
      return existingData;
    }
  }

  /**
   * Integrate Theory of Change generation using existing ToC system.
   */
  private JsonNode integrateTheoryOfChange(JsonNode companyData, String companyUrl) {
    try {
      log.info("Starting Phase 9: Theory of Change integration for {}", companyUrl);

      // Phase 9A: Geographic Scope Estimation
      String geographicScope = estimateGeographicScope(companyData, companyUrl);
      log.info("Estimated geographic scope: {}", geographicScope);

      // Phase 9B: Generate ToC using adapted existing method with retry handling
      String richContext = buildRichContextForToC(companyData, companyUrl);
      log.info("Phase 9B: Generating ToC with rich context");
      
      JsonNode tocData;
      try {
        String tocResponse = impactAiService.generateAiTocFromContext(richContext);
        String cleanedTocResponse = cleanJsonResponse(tocResponse);
        log.info("Phase 9B: ToC response cleaned, length: {}", cleanedTocResponse.length());
        tocData = objectMapper.readTree(cleanedTocResponse);
      } catch (Exception e) {
        log.error("Phase 9B: ToC generation failed after retries: {}", e.getMessage());
        tocData = objectMapper.createArrayNode(); // Empty array fallback
      }

      // Phase 9C: Generate scoring with geographic context with retry handling
      JsonNode scoringData;
      try {
        String scoringInput = formatForExistingScoring(companyData, tocData, geographicScope);
        log.info("Phase 9C: Generating scoring with {} impact areas",
                 tocData.isArray() ? tocData.size() : "unknown");
        String scoringResponse = impactAiService.generateAiScoringFromJson(scoringInput);
        String cleanedScoringResponse = cleanJsonResponse(scoringResponse);
        log.info("Phase 9C: Scoring response cleaned, length: {}", cleanedScoringResponse.length());
        scoringData = objectMapper.readTree(cleanedScoringResponse);
      } catch (Exception e) {
        log.error("Phase 9C: Scoring generation failed after retries: {}", e.getMessage());
        scoringData = objectMapper.createArrayNode(); // Empty array fallback
      }

      // Combine results
      ObjectNode finalResult = (ObjectNode) companyData;

      // Add geographic estimation
      finalResult.put("geographic_scope_estimated", geographicScope);

      // Add ToC data
      if (tocData.isArray()) {
        finalResult.set("theory_of_change", tocData);
      } else if (tocData.has("impacts") || tocData.has("theory_of_change")) {
        JsonNode impactArray = tocData.has("theory_of_change")
            ? tocData.get("theory_of_change") : tocData.get("impacts");
        finalResult.set("theory_of_change", impactArray);
      } else {
        finalResult.set("theory_of_change", objectMapper.createArrayNode());
      }

      // Add scoring data
      finalResult.set("impact_scoring", scoringData.isArray() ? scoringData : objectMapper.createArrayNode());

      // Calculate aggregated metrics using existing logic
      addAggregatedImpactMetrics(finalResult, tocData, scoringData);

      // Add ABC classification per impact chain
      addAbcClassification(finalResult, companyData, companyUrl);

      // Generate stakeholder geography summary
      addStakeholderGeographySummary(finalResult, companyData, companyUrl);

      log.info("Phase 9 completed successfully for {}", companyUrl);
      return finalResult;

    } catch (Exception e) {
      log.error("Error in ToC integration for {}: {}", companyUrl, e.getMessage());
      return createFallbackWithEmptyToC(companyData);
    }
  }

  /**
   * Phase 9A: AI-based geographic scope estimation.
   */
  private String estimateGeographicScope(JsonNode companyData, String companyUrl) {
    try {
      StringBuilder context = new StringBuilder();
      context.append("Company Analysis for Geographic Scope Estimation:\n\n");
      context.append("Company: ").append(companyData.path("company_name").asText("")).append("\n");
      context.append("Description: ").append(companyData.path("company_description").asText("")).append("\n");
      context.append("Industry: ").append(companyData.path("industry_sectors").toString()).append("\n");
      context.append("Employees: ").append(companyData.path("number_of_employees").asText("")).append("\n");
      context.append("Headquarters: ").append(companyData.path("headquarter_address").asText("")).append("\n");

      if (companyData.has("technology_cluster")) {
        context.append("Technology Cluster: ").append(companyData.path("technology_cluster").asText("")).append("\n");
      }

      String prompt = context.toString()
          + "\n\nBased on the company size, industry type, technology focus, and current development stage, "
          + "conservatively estimate the geographic areas this venture will likely be active in over the next 5 years.\n\n"
          + "Consider:\n"
          + "- Company maturity and size\n"
          + "- Type of business (local services vs. scalable tech)\n"
          + "- Industry characteristics\n"
          + "- Typical expansion patterns for similar companies\n\n"
          + "Provide a conservative estimate using country codes or continent names.\n"
          + "Use ISO-2 country codes (e.g., DE, FR, US) and continent names (EUROPE, NORTH_AMERICA, ASIA).\n\n"
          + "Return ONLY a JSON array like: [\"DE\"] or [\"EUROPE\"] or [\"DE\", \"AT\", \"CH\"]\n"
          + "WITHOUT any markdown formatting or additional text.";

      String response = makeOpenAiCallWithO3WebSearch(prompt);
      String cleanResponse = cleanJsonResponse(response);

      // Validate it's a JSON array
      JsonNode geoArray = objectMapper.readTree(cleanResponse);
      if (geoArray.isArray() && geoArray.size() > 0) {
        return cleanResponse;
      } else {
        return getDefaultGeographicScope(companyData);
      }

    } catch (Exception e) {
      log.error("Error estimating geographic scope", e);
      return getDefaultGeographicScope(companyData);
    }
  }

  /**
   * Fallback geographic scoping based on company location.
   */
  private String getDefaultGeographicScope(JsonNode companyData) {
    String headquarters = companyData.path("headquarter_address").asText("").toLowerCase();
    String employees = companyData.path("number_of_employees").asText("");

    // For VISTA portfolio, most companies are German, so default to DE
    if (headquarters.contains("germany") || headquarters.contains("deutschland") || headquarters.isEmpty()) {
      // If larger company, might expand regionally
      if (employees.contains("50") || employees.contains("100")
          || employees.contains("200") || employees.contains("500")) {
        return "[\"EUROPE\"]";
      }
      return "[\"DE\"]";
    } else if (headquarters.contains("europe")) {
      return "[\"EUROPE\"]";
    } else {
      return "[\"DE\"]"; // Conservative default for VISTA portfolio
    }
  }

  /**
   * Build rich context from Phases 1-4 to replace Q&A flow.
   * Format matches existing AI_TOC_SYSTEM input expectations.
   */
  private String buildRichContextForToC(JsonNode companyData, String companyUrl) {
    try {
      // First, format as the basic JSON structure that AI_TOC_SYSTEM expects
      Map<String, String> basicStructure = new HashMap<>();
      basicStructure.put("name", companyData.path("company_name").asText(""));
      basicStructure.put("website", companyUrl);
      basicStructure.put("activities", companyData.path("company_description").asText(""));

      String basicJson = objectMapper.writeValueAsString(basicStructure);

      // Then add rich context that replaces the Q&A answers
      StringBuilder context = new StringBuilder();
      context.append(basicJson).append("\n\n");
      context.append("Additional Company Context (replaces Q&A session):\n");
      context.append("Industry Sectors: ").append(companyData.path("industry_sectors").toString()).append("\n");
      context.append("Number of Employees: ").append(companyData.path("number_of_employees").asText("")).append("\n");

      // Add core products/services (Phase 2 data)
      if (companyData.has("core_products_services")) {
        JsonNode coreProducts = companyData.get("core_products_services");
        if (coreProducts.has("items") && coreProducts.get("items").isArray()) {
          context.append("\nCore Products/Services/Activities:\n");
          for (JsonNode item : coreProducts.get("items")) {
            context.append("- ").append(item.path("title").asText(""))
                   .append(": ").append(item.path("description").asText("")).append("\n");
          }
        }
      }

      if (companyData.has("technology_cluster")) {
        context.append("Technology Cluster: ").append(companyData.path("technology_cluster").asText("")).append("\n");
      }

      // Add ESG materiality context if available
      if (companyData.has("esg_materiality_analysis")) {
        JsonNode esgData = companyData.get("esg_materiality_analysis");
        if (esgData.has("topics") && esgData.get("topics").isArray()) {
          context.append("\nKey ESG Material Topics:\n");
          int count = 0;
          for (JsonNode topic : esgData.get("topics")) {
            if (count >= 3) {
              break; // Only show top 3 to keep context manageable
            }
            context.append("- ").append(topic.path("name").asText(""))
                      .append(" (").append(topic.path("category").asText("")).append(")")
                      .append(" - Stakeholder: ").append(topic.path("stakeholder_importance").asInt())
                      .append(", Business: ").append(topic.path("business_importance").asInt()).append("\n");
            count++;
          }
        }
      }

      // Add evidence context if available (Phase 4 data)
      if (companyData.has("certification_name") && !companyData.path("certification_name").asText("").isEmpty()) {
        context.append("\nCertifications: ").append(companyData.path("certification_name").asText("")).append("\n");
      }

      // Add SBMO scores (Phase 7 data)
      if (companyData.has("sbmo_total_score")) {
        context.append("\nSustainability Business Model Orientation:\n");
        context.append("- Total SBMO Score: ")
               .append(companyData.path("sbmo_total_score").asDouble()).append("/100\n");
        if (companyData.has("sbmo_criteria_a_score")) {
          context.append("- Criterion A (Distinctive Sustainability Problem Addressed): ")
                 .append(companyData.path("sbmo_criteria_a_score").asDouble()).append("/5\n");
          if (companyData.has("sbmo_criteria_a_explanation")) {
            context.append("  Explanation: ")
                   .append(companyData.path("sbmo_criteria_a_explanation").asText("")).append("\n");
          }
        }
        if (companyData.has("sbmo_criteria_b_score")) {
          context.append("- Criterion B (Depth of Impact): ")
                 .append(companyData.path("sbmo_criteria_b_score").asDouble()).append("/5\n");
          if (companyData.has("sbmo_criteria_b_explanation")) {
            context.append("  Explanation: ")
                   .append(companyData.path("sbmo_criteria_b_explanation").asText("")).append("\n");
          }
        }
        if (companyData.has("sbmo_criteria_c_score")) {
          context.append("- Criterion C (Business Model Leverage): ")
                 .append(companyData.path("sbmo_criteria_c_score").asDouble()).append("/5\n");
          if (companyData.has("sbmo_criteria_c_explanation")) {
            context.append("  Explanation: ")
                   .append(companyData.path("sbmo_criteria_c_explanation").asText("")).append("\n");
          }
        }
        if (companyData.has("sbmo_criteria_d_score")) {
          context.append("- Criterion D (Multi-Problem Solutions): ")
                 .append(companyData.path("sbmo_criteria_d_score").asDouble()).append("/5\n");
          if (companyData.has("sbmo_criteria_d_explanation")) {
            context.append("  Explanation: ")
                   .append(companyData.path("sbmo_criteria_d_explanation").asText("")).append("\n");
          }
        }
      }

      // Add company scale data for context (helps calibrate impact assessments)
      addCompanyScaleContext(context, companyData);

      // Add carbon emissions data (Phase 8 data) - CRITICAL for impact assessment
      addCarbonEmissionsContext(context, companyData);

      context.append("\nBased on this comprehensive company profile with detailed products/services, sustainability scores, and emissions data, "
                     + "generate a Theory of Change with 5 positive and 2 negative impact areas. "
                     + "Pay special attention to the Core Products/Services when defining the 'activities' and 'outputUnits' fields.");

      return context.toString();
    } catch (Exception e) {
      log.error("Error building ToC context", e);
      // Fallback to basic structure
      return String.format("{\"name\": \"%s\", \"website\": \"%s\", \"activities\": \"%s\"}",
                           companyData.path("company_name").asText(""),
                           companyUrl,
                           companyData.path("company_description").asText(""));
    }
  }

  /**
   * Add company scale context (annual sales, funding, employees) to help
   * calibrate impact assessments. Only includes data when actually available.
   */
  private void addCompanyScaleContext(StringBuilder context, JsonNode companyData) {
    StringBuilder scaleSection = new StringBuilder("\nCompany Scale Context:\n");

    // Add annual sales - include both 2024 and 2023 if available
    String sales2024 = companyData.path("annual_sales_2024").asText("");
    if (isValidValue(sales2024)) {
      scaleSection.append("- Annual Revenue (2024): ").append(sales2024);
      String currency2024 = companyData.path("currency_2024").asText("");
      if (!currency2024.isEmpty()) {
        scaleSection.append(" ").append(currency2024);
      }
      scaleSection.append("\n");
    }

    String sales2023 = companyData.path("annual_sales_2023").asText("");
    if (isValidValue(sales2023)) {
      scaleSection.append("- Annual Revenue (2023): ").append(sales2023);
      String currency2023 = companyData.path("currency_2023").asText("");
      if (!currency2023.isEmpty()) {
        scaleSection.append(" ").append(currency2023);
      }
      scaleSection.append("\n");
    }

    // Add total funding if available
    String funding = companyData.path("total_funding_amount").asText("");
    if (isValidValue(funding)) {
      scaleSection.append("- Total Funding: ").append(formatCurrency(funding));
      String fundingCurrency = companyData.path("funding_currency").asText("");
      if (!fundingCurrency.isEmpty()) {
        scaleSection.append(" ").append(fundingCurrency);
      }
      scaleSection.append("\n");
    }

    // Always include cluster reasoning for industry context
    String clusterReasoning = companyData.path("cluster_reasoning").asText("");
    scaleSection.append("- Industry Classification Reasoning: ")
                .append(clusterReasoning).append("\n");

    context.append(scaleSection);
  }

  /**
   * Add carbon emissions context. Uses correct field names (scope1_emissions
   * not scope_1_emissions) and includes total emissions for impact calibration.
   */
  private void addCarbonEmissionsContext(StringBuilder context, JsonNode companyData) {
    boolean hasEmissionsData = false;
    StringBuilder emissionsSection = new StringBuilder("\nCarbon Emissions Data:\n");
    emissionsSection.append("(Scale: Major >1M, Significant >100K, ")
                    .append("Moderate 1K-100K, Small <1K tons CO2e/year)\n");

    // Total carbon emissions - CRITICAL for understanding environmental impact
    String totalEmissions = companyData.path("total_carbon_emissions").asText("");
    if (isValidValue(totalEmissions)) {
      emissionsSection.append("- TOTAL Carbon Emissions: ")
                      .append(totalEmissions).append(" tons CO2e/year");
      hasEmissionsData = true;

      // Classify based on our scale
      try {
        double emissions = Double.parseDouble(totalEmissions.replace(",", ""));
        if (emissions > 1000000) {
          emissionsSection.append(" [MAJOR emitter]");
        } else if (emissions > 100000) {
          emissionsSection.append(" [Significant emitter]");
        } else if (emissions >= 1000) {
          emissionsSection.append(" [Moderate emitter]");
        } else {
          emissionsSection.append(" [Small emitter]");
        }
      } catch (NumberFormatException e) {
        // Ignore parsing errors
      }
      emissionsSection.append("\n");
    }

    // Scope 1 - Direct emissions (NOTE: field is scope1_emissions not scope_1)
    String scope1 = companyData.path("scope1_emissions").asText("");
    if (isValidValue(scope1)) {
      emissionsSection.append("- Scope 1 (Direct): ").append(scope1).append(" tons CO2e\n");
      hasEmissionsData = true;
    }

    // Scope 2 - Indirect from purchased energy
    String scope2 = companyData.path("scope2_emissions").asText("");
    if (isValidValue(scope2)) {
      emissionsSection.append("- Scope 2 (Purchased Energy): ")
                      .append(scope2).append(" tons CO2e\n");
      hasEmissionsData = true;
    }

    // Scope 3 - Value chain emissions
    String scope3 = companyData.path("scope3_emissions").asText("");
    if (isValidValue(scope3)) {
      emissionsSection.append("- Scope 3 (Value Chain): ").append(scope3).append(" tons CO2e\n");
      hasEmissionsData = true;
    }

    if (hasEmissionsData) {
      context.append(emissionsSection);
    }
  }

  /**
   * Check if a value is valid (not null, not empty, not "0", not "null").
   */
  private boolean isValidValue(String value) {
    if (value == null || value.isEmpty()) {
      return false;
    }
    String trimmed = value.trim().toLowerCase();
    return !trimmed.equals("0") && !trimmed.equals("0.0") && !trimmed.equals("0.00")
           && !trimmed.equals("null") && !trimmed.equals("n/a") && !trimmed.equals("n.a.");
  }

  /**
   * Format large numbers as currency strings (e.g., 150000000 -> "150M").
   */
  private String formatCurrency(String value) {
    try {
      double amount = Double.parseDouble(value.replace(",", ""));
      if (amount >= 1_000_000_000) {
        return String.format("%.1fB", amount / 1_000_000_000);
      } else if (amount >= 1_000_000) {
        return String.format("%.1fM", amount / 1_000_000);
      } else if (amount >= 1_000) {
        return String.format("%.0fK", amount / 1_000);
      }
      return value;
    } catch (NumberFormatException e) {
      return value; // Return as-is if not a number
    }
  }

  /**
   * Format our data for existing AI scoring system.
   */
  private String formatForExistingScoring(JsonNode companyData, JsonNode tocData, String geographicScope)
      throws JsonProcessingException {
    Map<String, Object> scoringInput = new HashMap<>();

    // Basic company info in existing format
    scoringInput.put("name", companyData.path("company_name").asText(""));
    scoringInput.put("website", companyData.path("url").asText(""));
    scoringInput.put("description", companyData.path("company_description").asText(""));

    // CRITICAL: Add geographic scope for proper AI scoring
    scoringInput.put("geography", geographicScope);

    // Add company context for scoring calibration (emissions, scale, industry)
    String totalEmissions = companyData.path("total_carbon_emissions").asText("");
    if (!totalEmissions.isEmpty() && !totalEmissions.equals("0")) {
      scoringInput.put("totalCarbonEmissions", totalEmissions);
      // Classify emitter size for scoring context
      try {
        double emissions = Double.parseDouble(totalEmissions.replace(",", ""));
        if (emissions > 1000000) {
          scoringInput.put("emitterCategory", "MAJOR (>1M tons CO2e/year)");
        } else if (emissions > 100000) {
          scoringInput.put("emitterCategory", "SIGNIFICANT (>100K tons CO2e/year)");
        } else if (emissions >= 1000) {
          scoringInput.put("emitterCategory", "MODERATE (1K-100K tons CO2e/year)");
        } else {
          scoringInput.put("emitterCategory", "SMALL (<1K tons CO2e/year)");
        }
      } catch (NumberFormatException e) {
        // Keep raw value without category
      }
    }
    String revenue = companyData.path("annual_sales_2024").asText("");
    if (!revenue.isEmpty()) {
      scoringInput.put("annualRevenue", revenue);
    }
    String employees = companyData.path("number_of_employees").asText("");
    if (!employees.isEmpty()) {
      scoringInput.put("employees", employees);
    }
    String industry = companyData.path("industry_sectors").toString();
    if (!industry.isEmpty() && !industry.equals("null")) {
      scoringInput.put("industry", industry);
    }

    // Add certifications and awards for evidence scoring
    String certification = companyData.path("certification_name").asText("");
    if (!certification.isEmpty()) {
      scoringInput.put("certifications", certification);
    }
    String award1 = companyData.path("prize_award_name_1").asText("");
    String award2 = companyData.path("prize_award_name_2").asText("");
    if (!award1.isEmpty() || !award2.isEmpty()) {
      String awards = (award1 + (award2.isEmpty() ? "" : "; " + award2)).trim();
      scoringInput.put("awards", awards);
    }

    // Add ESG environmental score if available
    String esgEnv = companyData.path("esg_environmental_score").asText("");
    if (!esgEnv.isEmpty() && !esgEnv.equals("0")) {
      scoringInput.put("esgEnvironmentalScore", esgEnv);
    }

    // Convert ToC data to impacts format expected by existing scoring
    List<Map<String, Object>> impacts = new ArrayList<>();
    JsonNode impactArray = tocData.isArray() ? tocData :
        (tocData.has("theory_of_change") ? tocData.get("theory_of_change") :
         (tocData.has("impacts") ? tocData.get("impacts") : null));

    if (impactArray != null && impactArray.isArray()) {
      int id = 1;
      for (JsonNode impact : impactArray) {
        Map<String, Object> impactMap = new HashMap<>();
        impactMap.put("id", id++);
        impactMap.put("name", impact.path("title").asText(""));
        impactMap.put("positive", !impact.path("type").asText("").toLowerCase().contains("negative"));
        impactMap.put("statusQuo", impact.path("statusQuo").asText(""));
        impactMap.put("innovation", impact.path("innovation").asText(""));
        impactMap.put("stakeholders", impact.path("stakeholders").asText(""));
        impactMap.put("change", impact.path("change").asText(""));
        impactMap.put("outputUnits", impact.path("outputUnits").asText(""));

        // Add ABC classification if available (A=avoid harm, B=benefit, C=contribute)
        if (impact.has("abc_classification")) {
          JsonNode abc = impact.get("abc_classification");
          impactMap.put("abcClassification", abc.path("classification").asText(""));
          impactMap.put("abcReason", abc.path("reason").asText(""));
        }

        // Convert indicators to expected format
        List<Map<String, Object>> indicators = new ArrayList<>();
        if (impact.has("indicators") && impact.get("indicators").isArray()) {
          int indicatorId = 1;
          for (JsonNode indicator : impact.get("indicators")) {
            Map<String, Object> indMap = new HashMap<>();
            indMap.put("id", indicatorId++);
            indMap.put("name", indicator.path("name").asText(""));
            indMap.put("year", indicator.path("year").asInt());
            indicators.add(indMap);
          }
        }
        impactMap.put("indicators", indicators);

        impacts.add(impactMap);
      }
    }

    scoringInput.put("impacts", impacts);

    return objectMapper.writeValueAsString(scoringInput);
  }

  /**
   * Calculate aggregated impact metrics using the SAME formula as CalculationService.
   *
   * Dashboard formula (from CalculationService.java):
   *
   * MAGNITUDE (positive) = importance * howMuchSolved * (sizeOfStakeholders / 10) * contribution
   *   where:
   *     importance = (problemImportance * 2/3 + stakeholderSituation * 1/3) * 20
   *     howMuchSolved = ((1 + degreeOfChange * 9.0 / 100) * 6/7 + duration * 2/7) / 10
   *     contribution = (1 + contribution * 9.0 / 100) / 10
   *
   * LIKELIHOOD (positive with indicators) = (previousEvidence + proximity + avgNoisiness + avgValidation) * 5
   * LIKELIHOOD (positive without indicators) = (previousEvidence + proximity) * 10
   * LIKELIHOOD (negative) = previousEvidence * 20
   *
   * SCORE = magnitude * likelihood / 100
   *
   * TOTAL = sum(top 5 positive scores) - sum(top 2 negative scores), capped 0-500
   */
  private void addAggregatedImpactMetrics(ObjectNode result, JsonNode tocData, JsonNode scoringData) {
    try {
      if (!scoringData.isArray() || scoringData.size() == 0) {
        setDefaultMetrics(result);
        return;
      }

      // Create lookup map: ID -> isPositive from ToC data
      Map<Integer, Boolean> impactTypeMap = new HashMap<>();
      int totalImpactAreas = 0;
      int positiveCount = 0;
      int negativeCount = 0;

      if (tocData.isArray()) {
        totalImpactAreas = tocData.size();
        int id = 1;
        for (JsonNode impact : tocData) {
          boolean isPositive = !impact.path("type").asText("").toLowerCase().contains("negative");
          impactTypeMap.put(id, isPositive);
          if (isPositive) {
            positiveCount++;
          } else {
            negativeCount++;
          }
          id++;
        }
      }

      // Store calculated scores for each impact chain
      List<Double> positiveScores = new ArrayList<>();
      List<Double> negativeScores = new ArrayList<>();
      List<Double> positiveMagnitudes = new ArrayList<>();
      List<Double> negativeMagnitudes = new ArrayList<>();

      // Calculate metrics for each impact chain using dashboard formula
      for (JsonNode scoringItem : scoringData) {
        int impactId = scoringItem.path("id").asInt(0);
        Boolean isPositive = impactTypeMap.get(impactId);

        if (isPositive == null) {
          continue; // Skip if we can't determine positive/negative
        }

        // Calculate magnitude using exact dashboard formula
        Double magnitude = calculateMagnitude(scoringItem, isPositive);
        if (magnitude == null) {
          continue; // Skip if magnitude couldn't be calculated
        }

        // Calculate likelihood using exact dashboard formula
        Double likelihood = calculateLikelihood(scoringItem, isPositive);
        if (likelihood == null) {
          continue; // Skip if likelihood couldn't be calculated
        }

        // Calculate score: magnitude * likelihood / 100
        double score = magnitude * likelihood / 100.0;

        if (isPositive) {
          positiveScores.add(score);
          positiveMagnitudes.add(magnitude);
        } else {
          negativeScores.add(score);
          negativeMagnitudes.add(magnitude);
        }
      }

      // Sort scores descending to get top performers
      positiveScores.sort((a, b) -> Double.compare(b, a));
      negativeScores.sort((a, b) -> Double.compare(b, a));
      positiveMagnitudes.sort((a, b) -> Double.compare(b, a));
      negativeMagnitudes.sort((a, b) -> Double.compare(b, a));

      // Take top 5 positive and top 2 negative (matching dashboard logic)
      double sumTop5PositiveScores = positiveScores.stream().limit(5).mapToDouble(Double::doubleValue).sum();
      double sumTop2NegativeScores = negativeScores.stream().limit(2).mapToDouble(Double::doubleValue).sum();
      double sumTop5PositiveMagnitudes = positiveMagnitudes.stream().limit(5).mapToDouble(Double::doubleValue).sum();
      double sumTop2NegativeMagnitudes = negativeMagnitudes.stream().limit(2).mapToDouble(Double::doubleValue).sum();

      // Calculate total score: positive - negative, capped at -500 to 500
      double totalScore = Math.max(-500.0, Math.min(500.0, sumTop5PositiveScores - sumTop2NegativeScores));
      double totalMagnitude = Math.max(-500.0, Math.min(500.0, sumTop5PositiveMagnitudes - sumTop2NegativeMagnitudes));

      // Calculate total likelihood as score/magnitude * 100 (matching dashboard)
      // Clamp to 0-100 to handle edge cases where magnitudes nearly cancel out
      double totalLikelihood = 0.0;
      if (totalMagnitude != 0) {
        totalLikelihood = Math.min(100.0, Math.abs((totalScore / totalMagnitude) * 100.0));
      }

      // Set result metrics
      result.put("impact_magnitude_5_year", Math.round(sumTop5PositiveMagnitudes));
      result.put("impact_magnitude_5_year_negative", Math.round(sumTop2NegativeMagnitudes));
      result.put("impact_magnitude_5_year_net", Math.round(totalMagnitude));
      result.put("impact_likelihood", Math.round(totalLikelihood));
      result.put("overall_impact_potential_score", Math.round(totalScore * 10.0) / 10.0);

      // Add counts for frontend display
      result.put("positive_impact_areas_count", positiveCount);
      result.put("negative_impact_areas_count", negativeCount);
      result.put("total_impact_areas_count", totalImpactAreas);

    } catch (Exception e) {
      log.error("Error calculating impact metrics", e);
      setDefaultMetrics(result);
    }
  }

  /**
   * Calculate magnitude for a single impact chain using exact dashboard formula.
   *
   * Formula: importance * howMuchSolved * (sizeOfStakeholders / 10) * contribution
   *
   * AI field mapping:
   * - problemImportance = avg(urgency, irreversibility, fairness, interconnectedness) [1-5]
   * - stakeholderSituation = stakeholderSituation [1-5]
   * - degreeOfChange = degreeOfChange [1-100]
   * - duration = duration [1-5]
   * - sizeOfStakeholders = scalability [1-10]
   * - contribution = contribution [1-100]
   */
  private Double calculateMagnitude(JsonNode scoringItem, boolean isPositive) {
    // Get raw values from AI scoring
    double urgency = parseScoreValue(scoringItem.path("urgency"));
    double irreversibility = parseScoreValue(scoringItem.path("irreversibility"));
    double fairness = parseScoreValue(scoringItem.path("fairness"));
    double interconnectedness = parseScoreValue(scoringItem.path("interconnectedness"));
    double stakeholderSituation = parseScoreValue(scoringItem.path("stakeholderSituation"));
    double degreeOfChange = parseScoreValue(scoringItem.path("degreeOfChange"));
    double duration = parseScoreValue(scoringItem.path("duration"));
    double scalability = parseScoreValue(scoringItem.path("scalability")); // maps to sizeOfStakeholders
    double contribution = parseScoreValue(scoringItem.path("contribution"));

    // Calculate problemImportance as average of the 4 sub-scores (scale 1-5)
    double problemImportance = (urgency + irreversibility + fairness + interconnectedness) / 4.0;

    // Validate we have all required fields (must be > 0)
    if (problemImportance <= 0 || stakeholderSituation <= 0 || degreeOfChange <= 0 ||
        duration <= 0 || scalability <= 0 || contribution <= 0) {
      log.warn("Missing required fields for magnitude calculation");
      return null;
    }

    // Apply exact dashboard formula from CalculationService.getMagnitude()
    // importance = (problemImportance * 2/3 + stakeholderSituation * 1/3) * 20
    double importance = (problemImportance * 2.0 / 3.0 + stakeholderSituation * 1.0 / 3.0) * 20.0;

    // howMuchSolved = ((1 + degreeOfChange * 9.0 / 100) * 6/7 + duration * 2/7) / 10
    double howMuchSolved = ((1.0 + degreeOfChange * 9.0 / 100.0) * 6.0 / 7.0 + duration * 2.0 / 7.0) / 10.0;

    // contribution factor = (1 + contribution * 9.0 / 100) / 10
    double contributionFactor = (1.0 + contribution * 9.0 / 100.0) / 10.0;

    // magnitude = importance * howMuchSolved * (sizeOfStakeholders / 10) * contribution
    double magnitude = importance * howMuchSolved * (scalability / 10.0) * contributionFactor;

    return magnitude;
  }

  /**
   * Calculate likelihood for a single impact chain using exact dashboard formula.
   *
   * For positive impacts with indicators:
   *   likelihood = (previousEvidence + proximity + avgNoisiness + avgValidation) * 5
   *
   * For positive impacts without indicators:
   *   likelihood = (previousEvidence + proximity) * 10
   *
   * For negative impacts:
   *   likelihood = previousEvidence * 20
   *
   * AI field mapping:
   * - previousEvidence = previousEvidence [1-5]
   * - proximity = proximity [1-5] (null for negative)
   * - noisiness = avg(indicators.noisiness) [1-5] (null for negative)
   * - validation = DEFAULT 3 (not generated by AI, using neutral default)
   */
  private Double calculateLikelihood(JsonNode scoringItem, boolean isPositive) {
    double previousEvidence = parseScoreValue(scoringItem.path("previousEvidence"));

    if (previousEvidence <= 0) {
      log.warn("Missing previousEvidence for likelihood calculation");
      return null;
    }

    if (!isPositive) {
      // Negative impact: likelihood = previousEvidence * 20
      return previousEvidence * 20.0;
    }

    // Positive impact
    double proximity = parseScoreValue(scoringItem.path("proximity"));
    if (proximity <= 0) {
      log.warn("Missing proximity for positive impact likelihood calculation");
      return null;
    }

    // Check if we have indicator noisiness scores
    JsonNode indicators = scoringItem.path("indicators");
    if (indicators.isArray() && indicators.size() > 0) {
      // Calculate average noisiness from indicators
      double totalNoisiness = 0;
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
        double avgValidation = 3.0; // Default validation score (not generated by AI)

        // With indicators: (previousEvidence + proximity + avgNoisiness + avgValidation) * 5
        return (previousEvidence + proximity + avgNoisiness + avgValidation) * 5.0;
      }
    }

    // Without indicators: (previousEvidence + proximity) * 10
    return (previousEvidence + proximity) * 10.0;
  }

  /**
   * Helper method to parse score values that might be strings or numbers.
   */
  private double parseScoreValue(JsonNode scoreNode) {
    if (scoreNode.isNumber()) {
      return scoreNode.asDouble();
    } else if (scoreNode.isTextual()) {
      try {
        return Double.parseDouble(scoreNode.asText());
      } catch (NumberFormatException e) {
        log.warn("Could not parse score value: {}", scoreNode.asText());
        return 0.0;
      }
    }
    return 0.0;
  }

  /**
   * Set default metrics for error cases.
   */
  private void setDefaultMetrics(ObjectNode result) {
    result.put("impact_magnitude_5_year", 0);
    result.put("impact_magnitude_5_year_negative", 0);
    result.put("impact_magnitude_5_year_net", 0);
    result.put("impact_likelihood", 0);
    result.put("overall_impact_potential_score", 0.0);
    result.put("positive_impact_areas_count", 0);
    result.put("negative_impact_areas_count", 0);
    result.put("total_impact_areas_count", 0);
  }

  /**
   * Create fallback result with empty ToC fields.
   */
  private JsonNode createFallbackWithEmptyToC(JsonNode baseExtractionResult) {
    try {
      ObjectNode fallbackResult = (ObjectNode) baseExtractionResult;
      fallbackResult.put("geographic_scope_estimated", "[\"DE\"]");
      fallbackResult.set("theory_of_change", objectMapper.createArrayNode());
      fallbackResult.set("impact_scoring", objectMapper.createArrayNode());
      setDefaultMetrics(fallbackResult);

      return fallbackResult;
    } catch (Exception fallbackException) {
      log.error("Error creating fallback result: {}", fallbackException.getMessage());
      return baseExtractionResult; // Last resort
    }
  }

  private void addAbcClassification(ObjectNode result, JsonNode companyData, String companyUrl) {
    if (result == null || !result.has("theory_of_change") || !result.get("theory_of_change").isArray()) {
      return;
    }

    ArrayNode tocArray = (ArrayNode) result.get("theory_of_change");
    for (int i = 0; i < tocArray.size(); i++) {
      JsonNode impactNode = tocArray.get(i);
      if (!(impactNode instanceof ObjectNode)) {
        continue;
      }

      ObjectNode impact = (ObjectNode) impactNode;
      try {
        String abcInput = buildAbcInput(companyData, impact, i + 1, companyUrl);
        String abcResponse = impactAiService.generateAbcClassification(abcInput);
        String cleaned = cleanJsonResponse(abcResponse);
        JsonNode parsed = objectMapper.readTree(cleaned);
        impact.set("abc_classification", parsed);
      } catch (Exception e) {
        log.error("ABC classification failed for {} impact chain {}: {}", companyUrl, i + 1, e.getMessage());
        ObjectNode fallback = objectMapper.createObjectNode();
        fallback.put("classification", "unknown");
        fallback.put("reason", "Classification unavailable");
        impact.set("abc_classification", fallback);
      }
    }
  }

  private String buildAbcInput(JsonNode companyData, ObjectNode impact, int index, String companyUrl)
      throws JsonProcessingException {
    ObjectNode payload = objectMapper.createObjectNode();

    // Basic company info
    payload.put("company_name", companyData.path("company_name").asText(""));
    payload.put("company_url", companyUrl);
    payload.put("company_description", companyData.path("company_description").asText(""));

    // Additional company context for better ABC classification
    if (companyData.has("industry_sectors")) {
      payload.set("industry_sectors", companyData.get("industry_sectors"));
    }
    if (companyData.has("number_of_employees")) {
      payload.put("number_of_employees", companyData.path("number_of_employees").asText(""));
    }
    if (companyData.has("technology_cluster")) {
      payload.put("technology_cluster", companyData.path("technology_cluster").asText(""));
    }

    // Core products/services - important for understanding business model
    if (companyData.has("core_products_services")) {
      payload.set("core_products_services", companyData.get("core_products_services"));
    }

    // ESG materiality - shows what sustainability topics are material
    if (companyData.has("esg_materiality_analysis")) {
      payload.set("esg_materiality_analysis", companyData.get("esg_materiality_analysis"));
    }

    // Certifications - evidence of sustainability focus
    if (companyData.has("certification_name") && !companyData.path("certification_name").asText("").isEmpty()) {
      payload.put("certification_name", companyData.path("certification_name").asText(""));
    }

    // SBMO scores - particularly Criterion A (distinctive sustainability problem)
    if (companyData.has("sbmo_total_score")) {
      ObjectNode sbmoData = payload.putObject("sbmo_scores");
      sbmoData.put("total_score", companyData.path("sbmo_total_score").asDouble());

      if (companyData.has("sbmo_criteria_a_score")) {
        ObjectNode criteriaA = sbmoData.putObject("criteria_a");
        criteriaA.put("score", companyData.path("sbmo_criteria_a_score").asDouble());
        if (companyData.has("sbmo_criteria_a_explanation")) {
          criteriaA.put("explanation", companyData.path("sbmo_criteria_a_explanation").asText(""));
        }
      }

      if (companyData.has("sbmo_criteria_b_score")) {
        ObjectNode criteriaB = sbmoData.putObject("criteria_b");
        criteriaB.put("score", companyData.path("sbmo_criteria_b_score").asDouble());
        if (companyData.has("sbmo_criteria_b_explanation")) {
          criteriaB.put("explanation", companyData.path("sbmo_criteria_b_explanation").asText(""));
        }
      }
    }

    // Impact chain being classified
    payload.put("impact_chain_index", index);
    payload.set("impact_chain", impact);

    return objectMapper.writeValueAsString(payload);
  }

  /**
   * Generate AI-powered stakeholder geography summary with 3 claims.
   */
  private void addStakeholderGeographySummary(
      final ObjectNode result,
      final JsonNode companyData,
      final String companyUrl) {
    try {
      JsonNode tocData = result.path("theory_of_change");
      JsonNode scoringData = result.path("impact_scoring");

      if (!tocData.isArray() || !scoringData.isArray()
          || tocData.size() == 0 || scoringData.size() == 0) {
        log.debug("No ToC/scoring data for geography summary: {}", companyUrl);
        return;
      }

      String contextJson = buildGeographySummaryContext(companyData, tocData, scoringData);
      String response = impactAiService.generateStakeholderGeographySummary(contextJson);
      String cleaned = cleanJsonResponse(response);
      JsonNode parsed = objectMapper.readTree(cleaned);

      if (parsed.has("claims") && parsed.get("claims").isArray()) {
        ArrayNode claims = (ArrayNode) parsed.get("claims");
        StringBuilder summary = new StringBuilder();
        for (int i = 0; i < claims.size() && i < 3; i++) {
          if (i > 0) {
            summary.append(" ");
          }
          summary.append(claims.get(i).asText());
        }
        result.put("stakeholder_geography_summary", summary.toString());
        log.info("Generated geography summary for {}", companyUrl);
      }
    } catch (Exception e) {
      log.error("Geography summary generation failed for {}: {}",
          companyUrl, e.getMessage());
    }
  }

  /**
   * Build context JSON for stakeholder geography summary generation.
   */
  private String buildGeographySummaryContext(
      final JsonNode companyData,
      final JsonNode tocData,
      final JsonNode scoringData) throws JsonProcessingException {
    ObjectNode context = objectMapper.createObjectNode();

    context.put("company_name", companyData.path("company_name").asText(""));
    context.set("theory_of_change", tocData);
    context.set("impact_scoring", scoringData);

    // Aggregate geography data by region
    Map<String, Double> positiveByRegion = new HashMap<>();
    Map<String, Double> negativeByRegion = new HashMap<>();
    List<String> globalCommunityImpacts = new ArrayList<>();

    int tocIndex = 0;
    for (JsonNode toc : tocData) {
      boolean isPositive = !toc.path("type").asText("").toLowerCase().contains("negative");
      String stakeholders = toc.path("stakeholders").asText("");
      String change = toc.path("change").asText("");

      // Find matching scoring data
      JsonNode scoring = null;
      for (JsonNode s : scoringData) {
        if (s.path("id").asInt() == tocIndex + 1) {
          scoring = s;
          break;
        }
      }

      if (scoring != null) {
        JsonNode geoNode = scoring.path("geography");
        double magnitude = scoring.path("degreeOfChange").asDouble(50)
            * scoring.path("scalability").asDouble(5) / 50.0;

        if (geoNode.isArray() && geoNode.size() > 0) {
          for (JsonNode geo : geoNode) {
            String region = geo.asText("");
            if (region.equalsIgnoreCase("GLOBAL_COMMUNITY")
                || region.equalsIgnoreCase("GLOBAL")) {
              globalCommunityImpacts.add(stakeholders + ": " + change);
            } else if (!region.isEmpty()) {
              Map<String, Double> target = isPositive ? positiveByRegion : negativeByRegion;
              target.merge(region, magnitude, Double::sum);
            }
          }
        }
      }
      tocIndex++;
    }

    // Convert to sorted lists (top regions first)
    ArrayNode positiveRegions = objectMapper.createArrayNode();
    positiveByRegion.entrySet().stream()
        .sorted((a, b) -> Double.compare(b.getValue(), a.getValue()))
        .limit(5)
        .forEach(e -> positiveRegions.add(e.getKey()));

    ArrayNode negativeRegions = objectMapper.createArrayNode();
    negativeByRegion.entrySet().stream()
        .sorted((a, b) -> Double.compare(b.getValue(), a.getValue()))
        .limit(3)
        .forEach(e -> negativeRegions.add(e.getKey()));

    ArrayNode globalImpacts = objectMapper.createArrayNode();
    globalCommunityImpacts.forEach(globalImpacts::add);

    context.set("positive_regions", positiveRegions);
    context.set("negative_regions", negativeRegions);
    context.set("global_community_impacts", globalImpacts);

    return objectMapper.writeValueAsString(context);
  }
}
