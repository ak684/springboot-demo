package io.ventureplatform.service.extraction.phases;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.fasterxml.jackson.databind.node.ArrayNode;
import io.ventureplatform.service.extraction.pipeline.BaseExtractionPhase;
import io.ventureplatform.service.external.OpenAiClient;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * Phase 11: ESG Foresight Score Calculation.
 * Projects future structural ESG risk assuming company scales to
 * 1000+ employees or €100M+ revenue within 8 years.
 * Structural assessment without Phase 2 mitigation factors.
 */
@Service
@Slf4j
public class EsgForesightScoreService extends BaseExtractionPhase {

  private static final int EMPLOYEE_THRESHOLD = 1000;
  private static final int REVENUE_THRESHOLD_MILLIONS = 100;
  private static final double CAGR_LOWER = 0.12;
  private static final double CAGR_UPPER = 0.15;
  private static final int PROJECTION_YEARS = 8;
  private static final int LARGE_CAP_EMPLOYEES = 5000;
  private static final int LARGE_CAP_REVENUE = 500;

  /**
   * Constructor.
   *
   * @param objectMapper JSON object mapper
   * @param openAiClient OpenAI client for API calls
   */
  public EsgForesightScoreService(final ObjectMapper objectMapper,
                                  final OpenAiClient openAiClient) {
    super(objectMapper, openAiClient);
  }

  @Override
  public String getPhaseName() {
    return "Phase 11: ESG Foresight Score Calculation";
  }

  @Override
  public int getPhaseNumber() {
    return 11;
  }

  @Override
  protected JsonNode executePhase(final JsonNode companyData,
                                  final String companyUrl) {
    try {
      log.info("Starting ESG Foresight Score for: {}", companyUrl);

      // Check qualification for foresight scoring
      boolean qualifies = checkForesightQualification(companyData);

      if (!qualifies) {
        log.info("Company doesn't qualify for foresight scoring");
        return addEmptyForesightScores(companyData,
            "Company unlikely to reach scale thresholds", false);
      }

      // Build and execute AI prompt
      String prompt = buildForesightScorePrompt(companyData);
      String response = makeOpenAiCallWithO3WebSearch(prompt);

      // Parse AI response
      log.info("AI Response for foresight: {}", response);
      JsonNode foresightData = parseForesightResponse(response);
      log.info("Parsed foresight data: {}", foresightData);

      // Store results in company data
      return storeForesightResults(companyData, foresightData, true);

    } catch (Exception e) {
      log.error("Failed to calculate foresight scores: {}",
                e.getMessage());
      return addEmptyForesightScores(companyData,
          "Error calculating foresight scores", true);
    }
  }

  /**
   * Check if company qualifies for foresight scoring.
   *
   * @param companyData Company data
   * @return true if qualifies
   */
  private boolean checkForesightQualification(
      final JsonNode companyData) {
    // Check current size
    String employeeStr = companyData
        .path("number_of_employees").asText("");
    int currentEmployees = parseEmployeeCount(employeeStr);

    if (currentEmployees >= EMPLOYEE_THRESHOLD) {
      return true;
    }

    // Check current revenue
    BigDecimal currentRevenue = getCurrentRevenue(companyData);
    if (currentRevenue != null
        && currentRevenue.intValue() >= REVENUE_THRESHOLD_MILLIONS) {
      return true;
    }

    // Project future growth
    double avgCagr = (CAGR_LOWER + CAGR_UPPER) / 2;

    if (currentEmployees > 0) {
      int projectedEmployees = (int) (currentEmployees
          * Math.pow(1 + avgCagr, PROJECTION_YEARS));
      if (projectedEmployees >= EMPLOYEE_THRESHOLD) {
        return true;
      }
    }

    if (currentRevenue != null && currentRevenue.doubleValue() > 0) {
      double projectedRevenue = currentRevenue.doubleValue()
          * Math.pow(1 + avgCagr, PROJECTION_YEARS);
      if (projectedRevenue >= REVENUE_THRESHOLD_MILLIONS) {
        return true;
      }
    }

    return false;
  }

  /**
   * Parse employee count from string.
   *
   * @param employeeStr Employee string
   * @return Employee count
   */
  private int parseEmployeeCount(final String employeeStr) {
    if (employeeStr == null || employeeStr.isEmpty()) {
      return 0;
    }

    // Handle ranges like "100-200"
    if (employeeStr.contains("-")) {
      String[] parts = employeeStr.split("-");
      try {
        int lower = Integer.parseInt(
            parts[0].trim().replaceAll("[^0-9]", ""));
        int upper = Integer.parseInt(
            parts[1].trim().replaceAll("[^0-9]", ""));
        return (lower + upper) / 2;
      } catch (Exception e) {
        log.debug("Could not parse employee range: {}", employeeStr);
      }
    }

    // Extract number
    try {
      return Integer.parseInt(employeeStr.replaceAll("[^0-9]", ""));
    } catch (Exception e) {
      log.debug("Could not parse employee count: {}", employeeStr);
      return 0;
    }
  }

  /**
   * Get current revenue from most recent year.
   *
   * @param companyData Company data
   * @return Current revenue or null
   */
  private BigDecimal getCurrentRevenue(final JsonNode companyData) {
    String[] years = {"2024", "2023", "2022"};
    for (String year : years) {
      JsonNode revenueNode = companyData
          .get("annual_sales_" + year);
      if (revenueNode != null && !revenueNode.isNull()) {
        try {
          return new BigDecimal(revenueNode.asText());
        } catch (Exception e) {
          // Continue to next year
        }
      }
    }
    return null;
  }

  /**
   * Build the foresight score prompt.
   *
   * @param companyData Company data
   * @return Prompt string
   */
  private String buildForesightScorePrompt(
      final JsonNode companyData) {
    StringBuilder prompt = new StringBuilder();

    // Objective section
    prompt.append("Objective:\n");
    prompt.append("You are an ESG foresight analyst. ");
    prompt.append("Your task is to project the future ");
    prompt.append("structural ESG risk of a company, ");
    prompt.append("assuming it scales to over 1,000 employees ");
    prompt.append("and more than €100 million in annual revenue ");
    prompt.append("within the next 8 years. ");
    prompt.append("Assume a reasonable compound annual growth rate (CAGR) ");
    prompt.append("of 12-15% per year, based on the company and industry, ");
    prompt.append("unless strong contradictory data is available. ");
    prompt.append("All foresight risk scores should reflect the ");
    prompt.append("structural risk exposure that arises from ");
    prompt.append("scaling to this size.\n");
    prompt.append("You must also consider the company's current ");
    prompt.append("ESG inherent and adjusted risk scores to ensure ");
    prompt.append("consistency in forward-looking risk logic.\n");
    prompt.append("The foresight score reflects the structural ");
    prompt.append("risk the company will pose if it becomes a ");
    prompt.append("global player, regardless of intentions, ");
    prompt.append("mission statements, or ESG marketing. ");
    prompt.append("Do not factor in Phase 2 mitigation like ");
    prompt.append("certifications or ESG reports. ");
    prompt.append("This is a structural forward-looking ");
    prompt.append("assessment only.\n\n");

    // Scope and Approach
    prompt.append("Scope and Approach\n");
    prompt.append("• Do not apply Phase 2 adjustments ");
    prompt.append("or credit ESG performance.\n");
    prompt.append("• Assume the company will operate at ");
    prompt.append("global scale with complex operations.\n");
    prompt.append("• Risk is structural, based on what the ");
    prompt.append("company does, sells, and will structurally ");
    prompt.append("expose if scaled.\n\n");

    // Scoring Breakdown
    prompt.append("Scoring Breakdown\n");
    prompt.append("You must assign a numeric score between ");
    prompt.append("0.0 and 10.0, in 0.5-point intervals, ");
    prompt.append("for each ESG dimension:\n");
    prompt.append("• Environmental\n");
    prompt.append("• Social\n");
    prompt.append("• Governance\n");
    prompt.append("Each dimension is scored structurally using ");
    prompt.append("weighted criteria. The total score is the ");
    prompt.append("sum of the three (max = 30).\n");
    prompt.append("Tag the result as a \"High Risk Outcome\" ");
    prompt.append("if the total score > 20.\n\n");

    // Scoring Weights
    prompt.append("Scoring Weights\n");
    prompt.append("Environmental (0–10):\n");
    prompt.append("• Sector environmental exposure: 45%\n");
    prompt.append("• Product polarity ");
    prompt.append("(toxicity, recyclability, waste): 30%\n");
    prompt.append("• Carbon/energy intensity ");
    prompt.append("(per revenue/output): 15%\n");
    prompt.append("• Country-level regulatory strength: 10%\n\n");

    prompt.append("Social (0–10):\n");
    prompt.append("• Industry labor exposure: 45%\n");
    prompt.append("• Company size (employee count): 35%\n");
    prompt.append("• Product social benefit/harm: 10%\n");
    prompt.append("• Country-level labor protections: 10%\n\n");

    prompt.append("Governance (0–10):\n");
    prompt.append("• Legal form and ownership transparency: 50%\n");
    prompt.append("• ESG disclosure and public accountability: 25%\n");
    prompt.append("• Country-level governance and ");
    prompt.append("enforcement quality: 25%\n\n");

    // HSRIs
    prompt.append("High-Severity Risk Indicators (HSRIs)\n");
    prompt.append("Add +0.5 per HSRI, up to +1.5 max per dimension.\n");
    prompt.append("Examples of HSRIs:\n");
    prompt.append("Environmental:\n");
    prompt.append("• Operates in carbon-intensive sector\n");
    prompt.append("• High emissions per revenue vs. sector norms\n");
    prompt.append("• Hazardous product profile with no ");
    prompt.append("circularity plan\n");
    prompt.append("• High end-of-life waste with no recyclability\n");
    prompt.append("Social:\n");
    prompt.append("• 1,000+ workers + no labor audits\n");
    prompt.append("• Handles sensitive user data with ");
    prompt.append("no privacy protocols\n");
    prompt.append("• Past labor/safety controversies with ");
    prompt.append("no corrective steps\n");
    prompt.append("Governance:\n");
    prompt.append("• Opaque ownership in weak-enforcement ");
    prompt.append("jurisdiction\n");
    prompt.append("• No ESG reporting since 2022 or at all\n");
    prompt.append("• Named regulatory fines with no remedy\n\n");

    // Scoring Guardrails
    prompt.append("Scoring Guardrails\n");
    prompt.append("• Use 0.5-point intervals only ");
    prompt.append("(e.g., 2.0, 4.5, 9.0)\n");
    prompt.append("• Do not default to 4–6 range unless ");
    prompt.append("structurally justified\n");
    prompt.append("• Do not hedge language ");
    prompt.append("(no \"may,\" \"might,\" \"could\")\n");
    prompt.append("• Avoid vague qualifiers ");
    prompt.append("(no \"somewhat,\" \"arguably,\" etc.)\n");
    prompt.append("• Assign firm scores — be decisive\n");
    prompt.append("• Use firm and confident tone\n");
    prompt.append("• Tag as \"High Risk Outcome\" ");
    prompt.append("if total score > 20.\n");
    prompt.append("Add a 2–3 sentence paragraph clearly ");
    prompt.append("explaining what risks are likely to ");
    prompt.append("intensify at global scale. Focus on ");
    prompt.append("structural bottlenecks or risk amplifiers.\n\n");

    // Company Data
    prompt.append("Company Data:\n");
    prompt.append("- company_name: ");
    prompt.append(companyData.path("company_name")
        .asText("Unknown")).append("\n");
    prompt.append("- industry_sectors: ");
    prompt.append(companyData.path("industry_sectors")
        .asText("N/A")).append("\n");
    prompt.append("- number_of_employees: ");
    prompt.append(companyData.path("number_of_employees")
        .asText("N/A")).append("\n");
    prompt.append("- headquarter_address: ");
    prompt.append(companyData.path("headquarter_address")
        .asText("N/A")).append("\n");

    // Add current ESG scores if available
    if (companyData.has("esg_risk_environmental_inherent")) {
      prompt.append("- current_esg_environmental_inherent: ");
      prompt.append(companyData.get("esg_risk_environmental_inherent")
          .asText()).append("\n");
    }
    if (companyData.has("esg_risk_social_inherent")) {
      prompt.append("- current_esg_social_inherent: ");
      prompt.append(companyData.get("esg_risk_social_inherent")
          .asText()).append("\n");
    }
    if (companyData.has("esg_risk_governance_inherent")) {
      prompt.append("- current_esg_governance_inherent: ");
      prompt.append(companyData.get("esg_risk_governance_inherent")
          .asText()).append("\n");
    }

    // JSON Format - Simplified flat structure
    prompt.append("\nJSON Format\n");
    prompt.append("Return ONLY a valid JSON object ");
    prompt.append("with this EXACT flat structure ");
    prompt.append("(all fields at root level, no nesting):\n");
    prompt.append("{\n");
    prompt.append("  \"environmental_score\": 5.5,\n");
    prompt.append("  \"environmental_explanation\": \"2-3 sentence explanation\",\n");
    prompt.append("  \"environmental_drivers\": \"Driver 1 (45%); Driver 2 (30%); Driver 3 (15%); Driver 4 (10%)\",\n");
    prompt.append("  \"environmental_hsri\": \"HSRI 1; HSRI 2\" or \"None\",\n");
    prompt.append("\n");
    prompt.append("  \"social_score\": 6.0,\n");
    prompt.append("  \"social_explanation\": \"2-3 sentence explanation\",\n");
    prompt.append("  \"social_drivers\": \"Driver 1 (45%); Driver 2 (35%); Driver 3 (10%); Driver 4 (10%)\",\n");
    prompt.append("  \"social_hsri\": \"HSRI 1; HSRI 2\" or \"None\",\n");
    prompt.append("\n");
    prompt.append("  \"governance_score\": 4.5,\n");
    prompt.append("  \"governance_explanation\": \"2-3 sentence explanation\",\n");
    prompt.append("  \"governance_drivers\": \"Driver 1 (50%); Driver 2 (25%); Driver 3 (25%)\",\n");
    prompt.append("  \"governance_hsri\": \"HSRI 1; HSRI 2\" or \"None\",\n");
    prompt.append("\n");
    prompt.append("  \"total_score\": 16.0,\n");
    prompt.append("  \"risk_outlook\": \"High Risk Outcome\" or ");
    prompt.append("\"Moderate Risk\" or \"Low Risk\",\n");
    prompt.append("  \"rising_risk_explanation\": \"Brief paragraph\",\n");
    prompt.append("\n");
    prompt.append("  \"environmental_mitigation\": \"Specific environmental mitigation actions separated by semicolons\",\n");
    prompt.append("  \"social_mitigation\": \"Specific social mitigation actions separated by semicolons\",\n");
    prompt.append("  \"governance_mitigation\": \"Specific governance mitigation actions separated by semicolons\"\n");
    prompt.append("}\n");
    prompt.append("\nIMPORTANT:\n");
    prompt.append("- Use semicolons to separate multiple items\n");
    prompt.append("- Include percentage weights in drivers where applicable\n");
    prompt.append("- Use \"None\" if no HSRIs apply\n");
    prompt.append("- Provide 1-3 specific, actionable mitigation actions ");
    prompt.append("for EACH dimension (environmental, social, governance)\n");
    prompt.append("- Mitigation actions should directly address ");
    prompt.append("the key risks identified for that dimension\n");

    return prompt.toString();
  }

  /**
   * Parse the foresight score response from AI.
   *
   * @param response AI response
   * @return Parsed JSON node
   */
  private JsonNode parseForesightResponse(final String response) {
    try {
      JsonNode parsed = objectMapper.readTree(response);

      // Validate required fields (simplified flat structure)
      if (parsed.has("environmental_score")
          && parsed.has("social_score")
          && parsed.has("governance_score")
          && parsed.has("total_score")) {
        // Convert flat structure to nested for consistency
        return convertFlatToNested(parsed);
      }

      log.error("Incomplete foresight response structure");
      return createEmptyForesightData();

    } catch (Exception e) {
      log.error("Error parsing foresight response: {}",
                e.getMessage());
      return createEmptyForesightData();
    }
  }

  /**
   * Convert flat AI response to nested structure.
   *
   * @param flat Flat response from AI
   * @return Nested structure for storage
   */
  private JsonNode convertFlatToNested(final JsonNode flat) {
    ObjectNode result = objectMapper.createObjectNode();

    // Convert environmental
    ObjectNode environmental = objectMapper.createObjectNode();
    environmental.put("score",
        flat.path("environmental_score").asDouble());
    environmental.put("explanation",
        flat.path("environmental_explanation").asText());
    environmental.put("drivers",
        flat.path("environmental_drivers").asText());
    environmental.put("hsri",
        flat.path("environmental_hsri").asText());
    result.set("environmental", environmental);

    // Convert social
    ObjectNode social = objectMapper.createObjectNode();
    social.put("score",
        flat.path("social_score").asDouble());
    social.put("explanation",
        flat.path("social_explanation").asText());
    social.put("drivers",
        flat.path("social_drivers").asText());
    social.put("hsri",
        flat.path("social_hsri").asText());
    result.set("social", social);

    // Convert governance
    ObjectNode governance = objectMapper.createObjectNode();
    governance.put("score",
        flat.path("governance_score").asDouble());
    governance.put("explanation",
        flat.path("governance_explanation").asText());
    governance.put("drivers",
        flat.path("governance_drivers").asText());
    governance.put("hsri",
        flat.path("governance_hsri").asText());
    result.set("governance", governance);

    // Add top-level fields
    result.put("total_score", flat.path("total_score").asDouble());
    result.put("risk_outlook", flat.path("risk_outlook").asText());
    result.put("rising_risk_explanation",
        flat.path("rising_risk_explanation").asText());

    // Convert mitigation recommendations - categorized by dimension
    ObjectNode mitigations = objectMapper.createObjectNode();
    
    log.info("Converting mitigation recommendations from flat structure");
    log.info("Flat has environmental_mitigation: {}", flat.has("environmental_mitigation"));
    log.info("Flat has social_mitigation: {}", flat.has("social_mitigation"));
    log.info("Flat has governance_mitigation: {}", flat.has("governance_mitigation"));
    
    // Environmental mitigations
    if (flat.has("environmental_mitigation") 
        && !flat.get("environmental_mitigation").asText().isEmpty()) {
      ArrayNode envMitigations = objectMapper.createArrayNode();
      String[] envItems = flat.get("environmental_mitigation")
          .asText().split(";");
      for (String item : envItems) {
        if (!item.trim().isEmpty()) {
          envMitigations.add(item.trim());
        }
      }
      mitigations.set("environmental", envMitigations);
    }
    
    // Social mitigations
    if (flat.has("social_mitigation") 
        && !flat.get("social_mitigation").asText().isEmpty()) {
      ArrayNode socialMitigations = objectMapper.createArrayNode();
      String[] socialItems = flat.get("social_mitigation")
          .asText().split(";");
      for (String item : socialItems) {
        if (!item.trim().isEmpty()) {
          socialMitigations.add(item.trim());
        }
      }
      mitigations.set("social", socialMitigations);
    }
    
    // Governance mitigations
    if (flat.has("governance_mitigation") 
        && !flat.get("governance_mitigation").asText().isEmpty()) {
      ArrayNode govMitigations = objectMapper.createArrayNode();
      String[] govItems = flat.get("governance_mitigation")
          .asText().split(";");
      for (String item : govItems) {
        if (!item.trim().isEmpty()) {
          govMitigations.add(item.trim());
        }
      }
      mitigations.set("governance", govMitigations);
    }
    
    result.set("mitigation_recommendations", mitigations);

    return result;
  }

  /**
   * Store foresight results in company data.
   *
   * @param companyData Original company data
   * @param foresightData Foresight calculation results
   * @return Updated company data
   */
  private JsonNode storeForesightResults(final JsonNode companyData,
                                         final JsonNode foresightData,
                                         final boolean qualified) {
    ObjectNode result = (ObjectNode) companyData;

    // Store individual scores for querying/sorting
    if (foresightData.has("environmental")) {
      JsonNode envData = foresightData.get("environmental");
      result.put("esg_risk_environmental_foresight",
          envData.path("score").asDouble());
      // Store full environmental data following existing pattern
      result.set("esg_risk_environmental_foresight_data", envData);
    }

    if (foresightData.has("social")) {
      JsonNode socialData = foresightData.get("social");
      result.put("esg_risk_social_foresight",
          socialData.path("score").asDouble());
      // Store full social data following existing pattern
      result.set("esg_risk_social_foresight_data", socialData);
    }

    if (foresightData.has("governance")) {
      JsonNode govData = foresightData.get("governance");
      result.put("esg_risk_governance_foresight",
          govData.path("score").asDouble());
      // Store full governance data following existing pattern
      result.set("esg_risk_governance_foresight_data", govData);
    }

    if (foresightData.has("total_score")) {
      result.put("esg_risk_total_foresight",
          foresightData.get("total_score").asDouble());
    }

    // Store other fields following existing pattern
    // These will automatically flow into raw_extraction_data
    if (foresightData.has("risk_outlook")) {
      result.put("esg_risk_foresight_risk_outlook",
          foresightData.get("risk_outlook").asText());
    }

    if (foresightData.has("rising_risk_explanation")) {
      result.put("esg_risk_foresight_rising_risk_explanation",
          foresightData.get("rising_risk_explanation").asText());
    }

    // Store mitigation recommendations - categorized by ESG dimension
    if (foresightData.has("mitigation_recommendations")) {
      result.set("esg_risk_foresight_mitigation_recommendations",
          foresightData.get("mitigation_recommendations"));
    }

    // Check and mark large-cap mode
    boolean isLargeCap = checkLargeCapMode(companyData);
    result.put("is_large_cap_mode", isLargeCap);
    if (isLargeCap) {
      result.put("large_cap_threshold_reason",
          determineLargeCapReason(companyData));
    }

    // Store qualification status
    result.put("esg_foresight_qualified", qualified);

    log.info("Successfully stored foresight scores");
    return result;
  }

  /**
   * Check if company qualifies for large-cap mode.
   *
   * @param companyData Company data
   * @return true if large-cap
   */
  private boolean checkLargeCapMode(final JsonNode companyData) {
    String employeeStr = companyData
        .path("number_of_employees").asText("");
    int employees = parseEmployeeCount(employeeStr);

    BigDecimal revenue = getCurrentRevenue(companyData);

    return employees >= LARGE_CAP_EMPLOYEES
        || (revenue != null
            && revenue.intValue() >= LARGE_CAP_REVENUE);
  }

  /**
   * Determine reason for large-cap classification.
   *
   * @param companyData Company data
   * @return Reason string
   */
  private String determineLargeCapReason(final JsonNode companyData) {
    String employeeStr = companyData
        .path("number_of_employees").asText("");
    int employees = parseEmployeeCount(employeeStr);
    BigDecimal revenue = getCurrentRevenue(companyData);

    List<String> reasons = new ArrayList<>();
    if (employees >= LARGE_CAP_EMPLOYEES) {
      reasons.add("employees >= 5000");
    }
    if (revenue != null && revenue.intValue() >= LARGE_CAP_REVENUE) {
      reasons.add("revenue >= €500M");
    }

    return String.join(", ", reasons);
  }

  /**
   * Add empty foresight scores when not applicable.
   *
   * @param companyData Company data
   * @param reason Reason for empty scores
   * @return Updated company data
   */
  private JsonNode addEmptyForesightScores(final JsonNode companyData,
                                           final String reason,
                                           final boolean qualified) {
    ObjectNode result = (ObjectNode) companyData;
    result.put("esg_risk_environmental_foresight", (BigDecimal) null);
    result.put("esg_risk_social_foresight", (BigDecimal) null);
    result.put("esg_risk_governance_foresight", (BigDecimal) null);
    result.put("esg_risk_total_foresight", (BigDecimal) null);
    result.put("esg_foresight_qualified", qualified);


    return result;
  }

  /**
   * Create empty foresight data structure.
   *
   * @return Empty foresight data
   */
  private JsonNode createEmptyForesightData() {
    ObjectNode result = objectMapper.createObjectNode();

    ObjectNode environmental = objectMapper.createObjectNode();
    environmental.put("score", 0.0);
    environmental.set("drivers", objectMapper.createArrayNode());
    environmental.put("explanation", "Unable to calculate");
    environmental.set("hsri", objectMapper.createArrayNode());
    result.set("environmental", environmental);

    ObjectNode social = objectMapper.createObjectNode();
    social.put("score", 0.0);
    social.set("drivers", objectMapper.createArrayNode());
    social.put("explanation", "Unable to calculate");
    social.set("hsri", objectMapper.createArrayNode());
    result.set("social", social);

    ObjectNode governance = objectMapper.createObjectNode();
    governance.put("score", 0.0);
    governance.set("drivers", objectMapper.createArrayNode());
    governance.put("explanation", "Unable to calculate");
    governance.set("hsri", objectMapper.createArrayNode());
    result.set("governance", governance);

    result.put("total_score", 0.0);
    result.put("risk_outlook", "Unknown");
    result.put("rising_risk_explanation", "Unable to project");
    result.set("mitigation_recommendations",
        objectMapper.createArrayNode());

    return result;
  }
}
