package io.ventureplatform.service.extraction.phases;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import io.ventureplatform.service.extraction.pipeline.BaseExtractionPhase;
import io.ventureplatform.service.external.OpenAiClient;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Phase 10: Calculate ESG Risk Scores (Inherent and Adjusted).
 * Assesses a company's exposure to Environmental, Social, and Governance (ESG) risk in two phases:
 * - Phase 1: Calculate the inherent ESG risk using weighted structural criteria
 * - Phase 2: Reduce each score only if clear, verifiable ESG performance is documented
 */
@Service
@Slf4j
public class EsgRiskScoreService extends BaseExtractionPhase {

  public EsgRiskScoreService(ObjectMapper objectMapper, OpenAiClient openAiClient) {
    super(objectMapper, openAiClient);
  }

  @Override
  public String getPhaseName() {
    return "Phase 10: ESG Risk Score Calculation";
  }

  @Override
  public int getPhaseNumber() {
    return 10;
  }

  @Override
  protected JsonNode executePhase(JsonNode companyData, String companyUrl) {
    try {
      log.info("Starting ESG Risk Score calculation for company: {}", companyUrl);
      
      // Build the prompt with all required variables
      String prompt = buildEsgRiskScorePrompt(companyData);
      
      // Make the OpenAI call
      String response = makeOpenAiCallWithO3WebSearch(prompt);
      
      // Parse the response and extract scores
      JsonNode esgRiskScores = parseEsgRiskScoreResponse(response);
      
      // Merge the ESG risk scores into the company data
      ObjectNode result = (ObjectNode) companyData;
      
      // Add individual scores
      double envInherent = 0.0;
      double envAdjusted = 0.0;
      double socialInherent = 0.0;
      double socialAdjusted = 0.0;
      double govInherent = 0.0;
      double govAdjusted = 0.0;
      
      if (esgRiskScores.has("environmental")) {
        JsonNode envData = esgRiskScores.get("environmental");
        envInherent = envData.path("inherent").asDouble();
        envAdjusted = envData.path("adjusted").asDouble();
        result.put("esg_risk_environmental_inherent", envInherent);
        result.put("esg_risk_environmental_adjusted", envAdjusted);
        result.put("esg_risk_environmental_explanation", envData.path("explanation").asText());
      }
      
      if (esgRiskScores.has("social")) {
        JsonNode socialData = esgRiskScores.get("social");
        socialInherent = socialData.path("inherent").asDouble();
        socialAdjusted = socialData.path("adjusted").asDouble();
        result.put("esg_risk_social_inherent", socialInherent);
        result.put("esg_risk_social_adjusted", socialAdjusted);
        result.put("esg_risk_social_explanation", socialData.path("explanation").asText());
      }
      
      if (esgRiskScores.has("governance")) {
        JsonNode govData = esgRiskScores.get("governance");
        govInherent = govData.path("inherent").asDouble();
        govAdjusted = govData.path("adjusted").asDouble();
        result.put("esg_risk_governance_inherent", govInherent);
        result.put("esg_risk_governance_adjusted", govAdjusted);
        result.put("esg_risk_governance_explanation", govData.path("explanation").asText());
      }
      
      // Calculate total scores as sum (not average) - will be on 0-30 scale
      double totalInherent = envInherent + socialInherent + govInherent;
      double totalAdjusted = envAdjusted + socialAdjusted + govAdjusted;
      result.put("esg_risk_total_inherent", totalInherent);
      result.put("esg_risk_total_adjusted", totalAdjusted);
      
      log.info("Successfully calculated ESG risk scores for company: {}", companyUrl);
      return result;
      
    } catch (Exception e) {
      log.error("Failed to calculate ESG risk scores: {}", e.getMessage());
      // Return original data with empty ESG risk scores
      ObjectNode result = (ObjectNode) companyData;
      result.put("esg_risk_environmental_inherent", (BigDecimal) null);
      result.put("esg_risk_environmental_adjusted", (BigDecimal) null);
      result.put("esg_risk_social_inherent", (BigDecimal) null);
      result.put("esg_risk_social_adjusted", (BigDecimal) null);
      result.put("esg_risk_governance_inherent", (BigDecimal) null);
      result.put("esg_risk_governance_adjusted", (BigDecimal) null);
      result.put("esg_risk_total_inherent", (BigDecimal) null);
      result.put("esg_risk_total_adjusted", (BigDecimal) null);
      return result;
    }
  }

  /**
   * Build the ESG Risk Score prompt with all required variables mapped from company data.
   * This uses the EXACT prompt from the ESG Risk Score v2 document.
   */
  private String buildEsgRiskScorePrompt(JsonNode companyData) {
    // Extract all required variables from company data
    String companyName = companyData.path("company_name").asText("Unknown Company");
    String industrySectors = companyData.path("industry_sectors").asText("N/A");
    String headquarterAddress = companyData.path("headquarter_address").asText("N/A");
    String numberOfEmployees = companyData.path("number_of_employees").asText("N/A");
    
    // Get annual sales - try 2023 first, then 2024, then 2022
    String annualSales2023 = "N/A";
    if (!companyData.path("annual_sales_2023").isNull() && !companyData.path("annual_sales_2023").asText("").isEmpty()) {
      annualSales2023 = companyData.path("annual_sales_2023").asText() + " " + companyData.path("currency_2023").asText("");
    } else if (!companyData.path("annual_sales_2024").isNull() && !companyData.path("annual_sales_2024").asText("").isEmpty()) {
      annualSales2023 = companyData.path("annual_sales_2024").asText() + " " + companyData.path("currency_2024").asText("");
    } else if (!companyData.path("annual_sales_2022").isNull() && !companyData.path("annual_sales_2022").asText("").isEmpty()) {
      annualSales2023 = companyData.path("annual_sales_2022").asText() + " " + companyData.path("currency_2022").asText("");
    }
    
    // Extract carbon emissions data - only Scope 1 and 2
    String scope1Emissions = companyData.path("scope_1_emissions").asText("N/A");
    String scope2Emissions = companyData.path("scope_2_emissions").asText("N/A");
    
    // Try to infer legal form from company name or description
    String legalForm = inferLegalForm(companyData);
    
    // Extract ESG report info from evidence collection phase
    String esgReportYear = "N/A";
    String esgReportLink = "N/A";
    if (companyData.has("esg_report_year") && !companyData.get("esg_report_year").isNull()) {
      esgReportYear = companyData.path("esg_report_year").asText();
      esgReportLink = companyData.path("esg_report_link").asText("N/A");
    }
    
    // Extract certifications and awards
    String certificationName = companyData.path("certification_name").asText("N/A");
    String prizeAward1 = companyData.path("prize_award_name_1").asText("N/A");
    String prizeAward2 = companyData.path("prize_award_name_2").asText("N/A");
    
    StringBuilder prompt = new StringBuilder();
    
    prompt.append("**AI Inherent and Adjust ESG Risk Scores**\n\n");
    
    prompt.append("Overview:\n");
    prompt.append("You are an opinionated expert at evaluating company ESG risk and assessing ");
    prompt.append("a company's exposure to Environmental, Social, and Governance (ESG) risk in two phases:\n\n");
    prompt.append("In addition to using the provided information, feel free to use web search freely if ever needed");
    prompt.append("in order to provide your very best evaluation.\n\n");

    
    prompt.append("Phase 1: Calculate the inherent ESG risk using weighted structural ");
    prompt.append("criteria such as industry, geography, emissions, company size, and legal ");
    prompt.append("form. After calculating the inherent score for each dimension (E, S, G), ");
    prompt.append("add +0.5 per High-Severity Risk Indicator (HSRI), max +1.5 per dimension, ");
    prompt.append("then cap at 10.\n\n");

    prompt.append("Phase 2: Reduce each score only if clear, verifiable ESG performance is ");
    prompt.append("documented --- specifically, ESG reports, recognized certifications, or ");
    prompt.append("well-defined awards.\n\n");
    
    prompt.append("Your output entails:\n\n");
    prompt.append("Inherent and adjusted scores (0--10) for each ESG dimension\n\n");
    prompt.append("A clearly written explanation (3 to 4 full sentences) for each score\n\n");
    
    prompt.append("Use the following company data (plus any data you researched on the web):\n\n");
    
    // Always include company name as it's essential
    prompt.append("- company_name: ").append(companyName).append("\n");
    
    // Only include other fields if they have meaningful values
    if (shouldIncludeValue(industrySectors)) {
      prompt.append("- industry_sectors: ").append(industrySectors).append("\n");
    }
    if (shouldIncludeValue(headquarterAddress)) {
      prompt.append("- headquarter_address: ").append(headquarterAddress).append("\n");
    }
    if (shouldIncludeValue(numberOfEmployees)) {
      prompt.append("- number_of_employees: ").append(numberOfEmployees).append("\n");
    }
    if (shouldIncludeValue(annualSales2023)) {
      prompt.append("- annual_sales_2023: ").append(annualSales2023).append("\n");
    }
    if (shouldIncludeValue(scope1Emissions)) {
      prompt.append("- scope_1_emissions (Direct Carbon Emissions): ").append(scope1Emissions).append("\n");
    }
    if (shouldIncludeValue(scope2Emissions)) {
      prompt.append("- scope_2_emissions (Indirect Direct Carbon Emissions): ").append(scope2Emissions).append("\n");
    }
    if (shouldIncludeValue(legalForm) && !"Private Company".equals(legalForm)) {
      // Only include legal form if it's not the default "Private Company"
      prompt.append("- legal_form: ").append(legalForm).append("\n");
    }
    if (shouldIncludeValue(esgReportYear)) {
      prompt.append("- esg_report_year: ").append(esgReportYear).append("\n");
    }
    if (shouldIncludeValue(esgReportLink)) {
      prompt.append("- esg_report_link: ").append(esgReportLink).append("\n");
    }
    if (shouldIncludeValue(certificationName)) {
      prompt.append("- certification_name: ").append(certificationName).append("\n");
    }
    if (shouldIncludeValue(prizeAward1)) {
      prompt.append("- prize_award_name_1: ").append(prizeAward1).append("\n");
    }
    if (shouldIncludeValue(prizeAward2)) {
      prompt.append("- prize_award_name_2: ").append(prizeAward2).append("\n");
    }
    
    prompt.append("\n");

    prompt.append("Data Quality & Plausibility Rules (Apply Globally)\r\n" + //
            "MOST IMPORTANT, NO MATTER WHAT YOU MUST FOLLOW THESE INSTRUCTIONS -" + //
            "Use the full 0–10 scale in Phase 1, for all 3 dimensions, according to the below:\r\n" + //
            "•\t10 if there are 3 or more High-Severity Risk Indicators (HSRIs) or clear red flags in that dimension.\r\n" + //
            "•\t9-10 (depending on severity) if there are 2 High-Severity Risk Indicators (HSRIs) or clear red flags in that " + //
            "dimension or other clear red flags.\r\n" + //
            "•\t7–8 if there is 1 High-Severity Risk Indicators (HSRIs) or other clear red flag in that dimension or other clear red flags.\r\n" + //
            "•\t0–2 if there are no HSRIs, no red flags, the inherent exposure is low and/or there is limited inherent risk based on structural " + //
            "context only (ie. low number of employees, low inherent industry risk exposure, product polarity, regulation strength, intensity " + //
            "per revenue/output, etc.). \r\n" +
            "Do not credit company programs/policies/certifications in Phase 1; " +
            "those are handled in Phase 2 via verifiable evidence. " + //
            "Clear red flags for social include, for example, lack of supplier social audits in high-risk sourcing, large, distributed workforce " + //
            "(either via employees and/or contractors). These are just examples though, feel free to come up with others that are reasonable" + //
            "Clear red flags for government include, for example, opaque or non-obvious legal form + no disclosure in a weak-enforcement country " + //
            "(again, these are just examples.). \r\n" + //
            "•\tOtherwise, if there are no HSRIs but also the inherent exposure is not limited based on structural context" + //
            " assign 3–6 proportional to materiality and count of structural issues.\r\n" + //
            "\r\n" + //
            "Carbon/Energy Intensity metric order (use first available):\r\n" + //
            "•\tEmissions per revenue (preferred)\r\n" + //
            "•\tEnergy intensity per unit of output/operations (or closest proxy)\r\n" + //
            "•\tSector-average benchmark comparison\r\n" + //
            "•\tPer-employee (use only if headcount is reliable)\r\n" + //
            "If a required value is missing or unreliable, use sector averages and score conservatively. Do not infer data or ask for more input.\r\n");
    
    prompt.append("Phase 1: Inherent ESG Risk Scoring\n\n");
    prompt.append("**CRITICAL SCORING RULE**: ALL scores MUST be in increments of 0.5 only. ");
    prompt.append("Valid scores are: 0.0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, ");
    prompt.append("5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0, 9.5, 10.0. ");
    prompt.append("DO NOT use any other values like 4.3, 6.7, 8.2, etc. ONLY use 0.5 increments.\n\n");
    prompt.append("Each ESG dimension is scored by combining the weighted inputs below:\n\n");

    prompt.append("Environmental Risk (0-10). Please Apply full-scale scoring as mentioned above. ");
    
    prompt.append("Weight each factor as follows:\n" +
        "•\tIndustry environmental exposure (45%)\n" +
        "•\tProduct environmental polarity (30%) (e.g., hazardous inputs, end-of-life waste, recyclability)\n" +
        "•\tCarbon/energy intensity per revenue or per unit of output (15%). " +
        "Please use per-employee only if headcount is given or independently verified. " +
        "If neither revenue nor output data is available, compare to sector averages and score conservatively.\n" +
        "•\tCountry-level environmental regulatory strength (10%)");
    
    prompt.append("Social Risk (0–10). Please Apply full-scale scoring as mentioned above. " +
        "Weight each factor as follows:\n" +
        "•\tIndustry labor/social exposure (45%)\n" +
        "•\tCompany size (employee count) (35%)\n" +
        "•\tCountry labor rights and protections (10%)\n" +
        "•\tProduct's social benefit or harm (10%)");
    
    prompt.append("Governance Risk (0–10). Please Apply full-scale scoring as "
        + "mentioned above. Transparent public reporting with strong oversight "
        + "can be 0–2.\n"
        + "Adjustments for small firms and non-sensitive sectors:\n"
        + "• If the company has fewer than 10 employees and operates in a "
        + "non-sensitive service sector (e.g., culinary services, event planning), "
        + "governance inherent risk should be scored in the 0.5–3.0 range unless "
        + "red flags apply.\n"
        + "• If the company is private, has fewer than 100 employees, and shows "
        + "no governance red flags, governance scores must be capped at 6.0.\n"
        + "• Absence of ESG reporting is not a governance red flag in inherently "
        + "non-sensitive sectors.");
    
    prompt.append("HSRI library (determine only from the provided inputs and extracted company/sector context):\n" +
        "Environmental\n" +
        "•\tHazardous product profile without controls: High product polarity (≥7/10) and " +
        "no environmental management certification (e.g., ISO 14001) and weak/medium regulation.\n" +
        "•\tExtreme intensity vs sector: Carbon/energy intensity (per revenue/output; per-employee only if verified) in the top decile of its sector.\n" +
        "•\tNo end-of-life/circularity plan where high waste is implied (polarity ≥7) and no evidence of recyclability/circularity.\n" +
        "•\tCarbon-intensive sector classification: If the company operates in a carbon-intensive sector, " +
        "count one HSRI. Carbon-intensive sectors include (non-exhaustive): Oil & Gas (E&P, Midstream, " +
        "Refining/Marketing), Coal, Metals & Mining (incl. rare earths), Iron & Steel, Aluminum, " +
        "and fossil-fuel power generation.\n" +
        "Social\n" +
        "•\tHigh labor exposure + weak oversight: High industry labor risk and workforce ≥500 and no supplier social standard/certification (e.g., SA8000).\n" +
        "•\tSensitive customer/data risk without safeguards (digital/IT/media): " +
        "Handles sensitive user data or safety-critical use with no privacy/safety controls indicated.\n" +
        "•\tNamed controversy/incident in the description with no corrective program.\n" +
        "Governance\n"
        + "•\tNo public ESG disclosure: esg_report_year missing or < 2022 "
        + "(only treated as HSRI if sector is sensitive).\n"
        + "•\tOpaque ownership in weak-enforcement country: Private/opaque "
        + "legal form and HQ in a low governance-quality jurisdiction.\n"
        + "•\tNamed fines/regulatory actions with no corrective action.\n" +
        "Note: HSRIs are inherent-risk amplifiers and are separate from Phase-2 reductions.\n");

    prompt.append("Phase 2: Adjusted ESG Risk Scoring\n\n");
    prompt.append("Reduce the inherent score only if verifiable ESG performance is evident. ");
    prompt.append("Do not apply speculative or narrative adjustments. Use the following ");
    prompt.append("criteria:\n\n");
    
    prompt.append("You may apply a reduction to the ESG inherent risk scores only when the ");
    prompt.append("following verifiable inputs are provided. The type of input determines ");
    prompt.append("which ESG dimension it affects and the maximum score reduction allowed:\n\n");
    
    prompt.append("1. If the company has an ESG report published in 2022 or later, reduce ");
    prompt.append("the Governance score by up to 1.0 point.\n\n");
    
    prompt.append("2. If the company holds a governance-related certification, such as ISO ");
    prompt.append("9001, reduce the Governance score by up to 0.5 points.\n\n");
    
    prompt.append("3. If the company holds an environmental management certification, such ");
    prompt.append("as ISO 14001, reduce the Environmental score by up to 0.5 points.\n\n");
    
    prompt.append("4. If the company holds a recognized social responsibility ");
    prompt.append("certification, such as SA8000, reduce the Social score by up to 0.5 ");
    prompt.append("points.\n\n");
    
    prompt.append("5. If the company has received an award specifically related to ");
    prompt.append("governance (e.g., \"Best Board Practice\"), reduce the Governance ");
    prompt.append("score by up to 0.5 points.\n\n");
    
    prompt.append("6. If the company has received an award related to social performance ");
    prompt.append("(e.g., \"Best Employer\"), reduce the Social score by up to 0.5 ");
    prompt.append("points.\n\n");
    
    prompt.append("7. If the company has received an award related to environmental ");
    prompt.append("leadership or innovation, reduce the Environmental score by up to ");
    prompt.append("0.5 points.\n\n");
    
    prompt.append("Each dimension's total reduction is capped at 2.0 points.\n");
    prompt.append("Do not apply reductions for generic, outdated, or unverifiable inputs.Do ");
    prompt.append("not interpret awards or certifications unless their relevance is ");
    prompt.append("explicitly clear from their name.\n\n");
    
    prompt.append("Output Format: 3-Row Table with Descriptions\n\n");
    prompt.append("Produce a 3-row table with the following columns:\n\n");
    prompt.append("| Dimension | Inherent Score | Adjusted Score | Explanation |\n\n");
    
    prompt.append("Column Descriptions:\n\n");
    prompt.append("- Dimension: \"Environmental\", \"Social\", or \"Governance\"\n\n");
    
    prompt.append("- Inherent Score: A number from 0 to 10 based on Phase 1 weighted ");
    prompt.append("criteria. MUST be in 0.5 increments (e.g., 3.0, 3.5, 4.0, NOT 3.3).\n\n");
    
    prompt.append("- Adjusted Score: Equal to inherent score unless reduced using ");
    prompt.append("evidence from Phase 2. MUST also be in 0.5 increments.\n\n");
    
    prompt.append("- Explanation: Exactly 2--3 full sentences. Each explanation must:\n\n");
    prompt.append("  - Be grounded in the input data only\n\n");
    prompt.append("  - Reference only the actual award, certification, or ESG report ");
    prompt.append("provided\n\n");
    prompt.append("  - State specifically how each input affects the score (calculation ");
    prompt.append("weight or actual high value)\n\n");
    prompt.append("  - Avoid all speculative language (e.g., \"likely,\" \"appears to,\" ");
    prompt.append("\"may,\" \"suggests,\" or \"such as\")\n\n");
    prompt.append("  - Match the correct ESG dimension (e.g., ISO 9001 adjusts ");
    prompt.append("Governance only)");
    prompt.append("  - When HSRIs apply, append “HSRIs: …” listing them.\n\n");

    prompt.append("Row Descriptions:\n\n");
    prompt.append("- Row 1: Environmental --- apply rules strictly to environmental ");
    prompt.append("inputs\n\n");
    prompt.append("- Row 2: Social --- apply rules strictly to social inputs\n\n");
    prompt.append("- Row 3: Governance --- apply rules strictly to governance inputs\n\n");
    
    prompt.append("Guardrails for Explanation Language: Do not write phrases like \"likely,\" ");
    prompt.append("\"such as,\" \"assumed to be,\" \"suggests,\" or \"appears\" Do not assign ");
    prompt.append("impact from certifications or awards unless they are explicitly ");
    prompt.append("dimension-relevant. Do not infer connections between unrelated inputs. ");
    prompt.append("Every adjustment must be justified by a directly matching data field\n\n");
    
    prompt.append("FINAL CRITICAL INSTRUCTIONS:\n");
    prompt.append("1. ALL scores MUST be in 0.5 increments (0.0, 0.5, 1.0, 1.5, etc.)\n");
    prompt.append("2. NEVER use scores like 4.3, 6.7, 8.2 - round to nearest 0.5\n");
    prompt.append("3. Return ONLY a valid JSON object with the scores and explanations\n");
    prompt.append("4. Do not include the table format, markdown, or any additional text\n\n");
    prompt.append("Use this exact JSON structure:\n\n");
    
    prompt.append("{\n");
    prompt.append("  \"environmental\": {\n");
    prompt.append("    \"inherent\": 7.0,\n");
    prompt.append("    \"adjusted\": 6.5,\n");
    prompt.append("    \"explanation\": \"Explanation text here\"\n");
    prompt.append("  },\n");
    prompt.append("  \"social\": {\n");
    prompt.append("    \"inherent\": 5.0,\n");
    prompt.append("    \"adjusted\": 4.5,\n");
    prompt.append("    \"explanation\": \"Explanation text here\"\n");
    prompt.append("  },\n");
    prompt.append("  \"governance\": {\n");
    prompt.append("    \"inherent\": 8.0,\n");
    prompt.append("    \"adjusted\": 7.0,\n");
    prompt.append("    \"explanation\": \"Explanation text here\"\n");
    prompt.append("  }\n");
    prompt.append("}\n");
    
    return prompt.toString();
  }

  /**
   * Check if a value should be included in the prompt.
   * Returns true if the value is not null, not empty, and not "N/A".
   */
  private boolean shouldIncludeValue(String value) {
    return value != null && !value.trim().isEmpty() && !"N/A".equals(value);
  }

  /**
   * Infer legal form from company data.
   * This is a best-effort attempt based on company name patterns and country.
   */
  private String inferLegalForm(JsonNode companyData) {
    String companyName = companyData.path("company_name").asText("").toLowerCase();
    String headquarterAddress = companyData.path("headquarter_address").asText("").toLowerCase();
    
    // German legal forms
    if (headquarterAddress.contains("germany") || headquarterAddress.contains("deutschland")) {
      if (companyName.contains("gmbh")) {
        return "GmbH";
      }
      if (companyName.contains("ag")) {
        return "AG";
      }
      if (companyName.contains("kg")) {
        return "KG";
      }
      if (companyName.contains("ohg")) {
        return "OHG";
      }
      if (companyName.contains("e.v.")) {
        return "e.V.";
      }
      if (companyName.contains("ev")) {
        return "e.V.";
      }
    }
    
    // US legal forms
    if (headquarterAddress.contains("usa") || headquarterAddress.contains("united states")) {
      if (companyName.contains("inc.") || companyName.contains("incorporated")) {
        return "Inc.";
      }
      if (companyName.contains("corp") || companyName.contains("corporation")) {
        return "Corporation";
      }
      if (companyName.contains("llc")) {
        return "LLC";
      }
      if (companyName.contains("lp")) {
        return "LP";
      }
    }
    
    // UK legal forms
    if (headquarterAddress.contains("uk") || headquarterAddress.contains("united kingdom")) {
      if (companyName.contains("ltd") || companyName.contains("limited")) {
        return "Ltd";
      }
      if (companyName.contains("plc")) {
        return "PLC";
      }
      if (companyName.contains("llp")) {
        return "LLP";
      }
    }
    
    // French legal forms
    if (headquarterAddress.contains("france")) {
      if (companyName.contains("sarl")) {
        return "SARL";
      }
      if (companyName.contains("sas")) {
        return "SAS";
      }
      if (companyName.contains("sa")) {
        return "SA";
      }
    }
    
    // Check if it's a public institution
    if (companyName.contains("university") || companyName.contains("institute") || 
        companyName.contains("foundation") || companyName.contains("association")) {
      return "Non-profit/Institution";
    }
    
    // Default
    return "Private Company";
  }

  /**
   * Parse the ESG risk score response from the AI.
   * Expects a JSON response with environmental, social, governance, and total scores.
   */
  private JsonNode parseEsgRiskScoreResponse(String response) {
    try {
      // First try to parse as-is
      JsonNode parsed = objectMapper.readTree(response);
      
      // Validate the structure - we only need the 3 dimensions now
      if (parsed.has("environmental") && parsed.has("social") && 
          parsed.has("governance")) {
        return parsed;
      }
      
      // If not in expected format, try to extract from table format
      // This is a fallback in case the AI returns a table despite instructions
      ObjectNode result = objectMapper.createObjectNode();
      
      // Pattern to extract scores from table rows
      Pattern rowPattern = Pattern.compile(
        "(Environmental|Social|Governance|Total Score)\\s*\\|\\s*(\\d+\\.?\\d*)\\s*\\|\\s*(\\d+\\.?\\d*)\\s*\\|\\s*(.*)");
      
      String[] lines = response.split("\n");
      for (String line : lines) {
        Matcher matcher = rowPattern.matcher(line);
        if (matcher.find()) {
          String dimension = matcher.group(1).toLowerCase().replace(" score", "");
          double inherent = Double.parseDouble(matcher.group(2));
          double adjusted = Double.parseDouble(matcher.group(3));
          String explanation = matcher.group(4).trim();
          
          ObjectNode dimNode = objectMapper.createObjectNode();
          dimNode.put("inherent", inherent);
          dimNode.put("adjusted", adjusted);
          if (!dimension.equals("total")) {
            dimNode.put("explanation", explanation);
          }
          
          result.set(dimension, dimNode);
        }
      }
      
      // If we found all dimensions, return the result - no need for total
      if (result.has("environmental") && result.has("social") && 
          result.has("governance")) {
        return result;
      }
      
      // If all else fails, return empty scores
      log.error("Could not parse ESG risk scores from response: {}", response);
      return createEmptyScores();
      
    } catch (Exception e) {
      log.error("Error parsing ESG risk score response: {}", e.getMessage());
      return createEmptyScores();
    }
  }

  /**
   * Create empty ESG risk scores structure for error cases.
   */
  private JsonNode createEmptyScores() {
    ObjectNode result = objectMapper.createObjectNode();
    
    ObjectNode environmental = objectMapper.createObjectNode();
    environmental.put("inherent", 0.0);
    environmental.put("adjusted", 0.0);
    environmental.put("explanation", "Unable to calculate ESG risk scores");
    result.set("environmental", environmental);
    
    ObjectNode social = objectMapper.createObjectNode();
    social.put("inherent", 0.0);
    social.put("adjusted", 0.0);
    social.put("explanation", "Unable to calculate ESG risk scores");
    result.set("social", social);
    
    ObjectNode governance = objectMapper.createObjectNode();
    governance.put("inherent", 0.0);
    governance.put("adjusted", 0.0);
    governance.put("explanation", "Unable to calculate ESG risk scores");
    result.set("governance", governance);
    
    return result;
  }

  /**
   * Filter company data to exclude existing ESG scores that could bias recalculation.
   * Uses exclusion approach to be robust against future schema changes.
   */
  public JsonNode filterDataForEsgCalculation(JsonNode rawData) {
    // Create a copy of the original data
    ObjectNode filteredData = rawData.deepCopy();
    
    // Remove existing ESG risk scores to prevent bias
    filteredData.remove("esg_risk_environmental_inherent");
    filteredData.remove("esg_risk_environmental_adjusted");
    filteredData.remove("esg_risk_environmental_explanation");
    filteredData.remove("esg_risk_social_inherent");
    filteredData.remove("esg_risk_social_adjusted");
    filteredData.remove("esg_risk_social_explanation");
    filteredData.remove("esg_risk_governance_inherent");
    filteredData.remove("esg_risk_governance_adjusted");
    filteredData.remove("esg_risk_governance_explanation");
    filteredData.remove("esg_risk_total_inherent");
    filteredData.remove("esg_risk_total_adjusted");
    
    int originalSize = rawData.size();
    int filteredSize = filteredData.size();
    int removedFields = originalSize - filteredSize;
    
    log.debug("Filtered ESG data - kept {} fields, removed {} ESG score fields", filteredSize, removedFields);
    
    return filteredData;
  }
}
