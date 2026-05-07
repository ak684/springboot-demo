package io.ventureplatform.service.extraction.phases;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import io.ventureplatform.service.extraction.pipeline.BaseExtractionPhase;
import io.ventureplatform.service.external.OpenAiClient;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

/**
 * Phase 7: Calculate Sustainability Business Model Orientation (SBMO) Scores.
 * Evaluates a company's sustainability efforts based on how effectively its business model
 * is oriented toward solving significant sustainability problems.
 */
@Service
@Slf4j
public class SustainabilityBusinessModelOrientationService extends BaseExtractionPhase {

  public SustainabilityBusinessModelOrientationService(ObjectMapper objectMapper, OpenAiClient openAiClient) {
    super(objectMapper, openAiClient);
  }

  @Override
  public String getPhaseName() {
    return "Phase 7: Sustainability Business Model Orientation Score Calculation";
  }

  @Override
  public int getPhaseNumber() {
    return 7;
  }

  @Override
  protected JsonNode executePhase(JsonNode companyData, String companyUrl) {
    try {
      log.info("Starting Sustainability Business Model Orientation score calculation for company: {}", companyUrl);
      
      // Build the prompt with all required variables
      String prompt = buildSBMOPrompt(companyData);
      log.info("SBMO Prompt being sent to AI (first 500 chars): {}", 
               prompt.length() > 500 ? prompt.substring(0, 500) + "..." : prompt);
      log.info("Full SBMO prompt length: {} characters", prompt.length());
      
      // Make the OpenAI call
      log.info("Making OpenAI call for SBMO scoring...");
      long startTime = System.currentTimeMillis();
      String response = makeOpenAiCallWithO3WebSearch(prompt);
      long duration = System.currentTimeMillis() - startTime;
      log.info("OpenAI call completed in {} ms", duration);
      log.info("Raw AI response for SBMO (first 500 chars): {}", 
               response != null && response.length() > 500 ? response.substring(0, 500) + "..." : response);
      JsonNode sbmoScores = parseSBMOResponse(response);
      
      // Merge the SBMO scores into the company data
      ObjectNode result = (ObjectNode) companyData;
      
      // Add individual scores (stored as 0-5 in database)
      double criteriaA = 0.0;
      double criteriaB = 0.0;
      double criteriaC = 0.0;
      double criteriaD = 0.0;
      
      if (sbmoScores.has("criteriaA")) {
        criteriaA = sbmoScores.path("criteriaA").path("score").asDouble();
        result.put("sbmo_criteria_a_score", criteriaA);
        result.put("sbmo_criteria_a_explanation", sbmoScores.path("criteriaA").path("explanation").asText());
      }
      
      if (sbmoScores.has("criteriaB")) {
        criteriaB = sbmoScores.path("criteriaB").path("score").asDouble();
        result.put("sbmo_criteria_b_score", criteriaB);
        result.put("sbmo_criteria_b_explanation", sbmoScores.path("criteriaB").path("explanation").asText());
      }
      
      if (sbmoScores.has("criteriaC")) {
        criteriaC = sbmoScores.path("criteriaC").path("score").asDouble();
        result.put("sbmo_criteria_c_score", criteriaC);
        result.put("sbmo_criteria_c_explanation", sbmoScores.path("criteriaC").path("explanation").asText());
      }
      
      if (sbmoScores.has("criteriaD")) {
        criteriaD = sbmoScores.path("criteriaD").path("score").asDouble();
        result.put("sbmo_criteria_d_score", criteriaD);
        result.put("sbmo_criteria_d_explanation", sbmoScores.path("criteriaD").path("explanation").asText());
      }
      
      // Calculate total score using weighted average and convert to 0-100 scale
      double totalScore = ((criteriaA * 0.3) + (criteriaB * 0.3) + (criteriaC * 0.2) + (criteriaD * 0.2)) * 20;
      result.put("sbmo_total_score", totalScore);
      
      log.info("Successfully calculated SBMO scores for company: {} - A:{}, B:{}, C:{}, D:{}, Total:{}", 
               companyUrl, criteriaA, criteriaB, criteriaC, criteriaD, totalScore);
      return result;
      
    } catch (Exception e) {
      log.error("Failed to calculate SBMO scores for company {}: {}", companyUrl, e.getMessage(), e);
      // Return original data with empty SBMO scores
      ObjectNode result = (ObjectNode) companyData;
      result.put("sbmo_criteria_a_score", (BigDecimal) null);
      result.put("sbmo_criteria_b_score", (BigDecimal) null);
      result.put("sbmo_criteria_c_score", (BigDecimal) null);
      result.put("sbmo_criteria_d_score", (BigDecimal) null);
      result.put("sbmo_total_score", (BigDecimal) null);
      return result;
    }
  }

  /**
   * Build the SBMO prompt with all required variables mapped from company data.
   */
  private String buildSBMOPrompt(JsonNode companyData) {
    // Extract required variables from company data
    String companyName = companyData.path("company_name").asText("Unknown Company");
    String companyDescription = companyData.path("company_description").asText("N/A");
    String industrySectors = companyData.path("industry_sectors").asText("N/A");
    String sustainabilityOrientation = companyData.path("sustainability_orientation").asText("N/A");
    String sustainabilityImpactArea = companyData.path("sustainability_impact_area").asText("N/A");
    String theoryOfChange = companyData.path("theory_of_change").asText("N/A");
    String problemDescription = companyData.path("problem_description").asText("N/A");
    String innovationDescription = companyData.path("innovation_description").asText("N/A");
    String sdgs = companyData.path("sdgs").asText("N/A");
    
    // Extract core products/services if available
    String coreProductsServices = "N/A";
    if (companyData.has("core_products_services") && !companyData.get("core_products_services").isNull()) {
      coreProductsServices = companyData.path("core_products_services").toString();
    }
    
    // Extract impact scoring justifications if available
    String impactScoringInfo = extractImpactScoringInfo(companyData);
    
    // Build the prompt EXACTLY as specified by the boss
    StringBuilder prompt = new StringBuilder();
    
    prompt.append("Sustainability Business Model Orientation:\n");
    prompt.append("The sustainability business model orientation framework evaluates a company's ");
    prompt.append("sustainability efforts based on how effectively its business model is oriented ");
    prompt.append("toward solving significant sustainability problems. The score is calculated ");
    prompt.append("based on four key criteria:\n\n");
    
    prompt.append("A. Distinctive Sustainability Problem Addressed (Score 0-5): Does the company's ");
    prompt.append("core business intentionally and directly address a significant, systemic ");
    prompt.append("sustainability problem, defined as a state where an outcome is below an ");
    prompt.append("acceptable societal or ecological threshold? The problem must not be one that ");
    prompt.append("the company itself is causing or mitigating. For each problem addressed, ");
    prompt.append("relevant SDGs and targets must be identified.\n\n");
    
    prompt.append("B. Depth of Impact (Score 0-5): How deep and intentional is the company's ");
    prompt.append("impact? Does it have full control over the sustainability outcomes of its work? ");
    prompt.append("Is the positive impact measurable and scalable?\n\n");
    
    prompt.append("C. Business Model Leverage (Score 0-5): How integrated is the sustainability ");
    prompt.append("contribution into the business model? Does the company's revenue and ");
    prompt.append("profitability increase directly with its positive sustainability impact, ");
    prompt.append("creating a powerful positive feedback loop?\n\n");
    
    prompt.append("D. Multi-Problem Solutions (Score 0-5): Does the company's solution solve more ");
    prompt.append("than one distinct sustainability problem, each of which is defined as an outcome ");
    prompt.append("below an acceptable societal or ecological threshold? A higher score indicates ");
    prompt.append("a more holistic solution. This evaluation must also include the identification ");
    prompt.append("and direct mapping of relevant SDGs and targets for each problem.\n\n");
    
    prompt.append("Scoring:\n");
    prompt.append("The total SPOS score is a weighted average of these four criteria:\n");
    prompt.append("A: 30%\n");
    prompt.append("B: 30%\n");
    prompt.append("C: 20%\n");
    prompt.append("D: 20%\n");
    prompt.append("SPOSScore=(A×0.3)+(B×0.3)+(C×0.2)+(D×0.2)\n");
    prompt.append("The final score will be presented on a scale of 0-100.\n\n");
    
    // Add company data
    prompt.append("Use the following company data:\n\n");
    prompt.append("- Company Name: ").append(companyName).append("\n");
    prompt.append("- Company Description: ").append(companyDescription).append("\n");
    prompt.append("- Industry Sectors: ").append(industrySectors).append("\n");
    prompt.append("- Sustainability Orientation: ").append(sustainabilityOrientation).append("\n");
    prompt.append("- Sustainability Impact Area: ").append(sustainabilityImpactArea).append("\n");
    prompt.append("- Theory of Change: ").append(theoryOfChange).append("\n");
    prompt.append("- Problem Description: ").append(problemDescription).append("\n");
    prompt.append("- Innovation Description: ").append(innovationDescription).append("\n");
    prompt.append("- SDGs: ").append(sdgs).append("\n");
    prompt.append("- Core Products/Services: ").append(coreProductsServices).append("\n");
    if (!impactScoringInfo.equals("N/A")) {
      prompt.append("- Impact Scoring Information: ").append(impactScoringInfo).append("\n");
    }
    
    // Log the extracted company data for debugging
    log.debug("SBMO Company Data - Name: {}, Description: {}, Industry: {}", 
             companyName, 
             companyDescription.length() > 100 ? companyDescription.substring(0, 100) + "..." : companyDescription,
             industrySectors);
    
    prompt.append("\nIMPORTANT INSTRUCTIONS:\n");
    prompt.append("1. Evaluate each criterion (A, B, C, D) on a scale of 0-5\n");
    prompt.append("2. Provide a clear explanation for each score (2-3 sentences)\n");
    prompt.append("3. For criterion A and D, explicitly identify relevant SDGs and targets\n");
    prompt.append("4. Return ONLY a valid JSON object with the scores and explanations\n");
    prompt.append("5. Do not include any additional text, markdown, or formatting\n\n");
    
    prompt.append("Use this exact JSON structure:\n");
    prompt.append("{\n");
    prompt.append("  \"criteriaA\": {\n");
    prompt.append("    \"score\": 4.0,\n");
    prompt.append("    \"explanation\": \"Explanation here including relevant SDGs and targets\"\n");
    prompt.append("  },\n");
    prompt.append("  \"criteriaB\": {\n");
    prompt.append("    \"score\": 3.5,\n");
    prompt.append("    \"explanation\": \"Explanation here\"\n");
    prompt.append("  },\n");
    prompt.append("  \"criteriaC\": {\n");
    prompt.append("    \"score\": 4.5,\n");
    prompt.append("    \"explanation\": \"Explanation here\"\n");
    prompt.append("  },\n");
    prompt.append("  \"criteriaD\": {\n");
    prompt.append("    \"score\": 3.0,\n");
    prompt.append("    \"explanation\": \"Explanation here including relevant SDGs and targets\"\n");
    prompt.append("  }\n");
    prompt.append("}\n");
    
    return prompt.toString();
  }

  /**
   * Extract impact scoring information from company data if available.
   */
  private String extractImpactScoringInfo(JsonNode companyData) {
    StringBuilder info = new StringBuilder();
    
    if (companyData.has("impact_scoring") && companyData.get("impact_scoring").isArray()) {
      for (JsonNode score : companyData.get("impact_scoring")) {
        String criterion = score.path("criterion").asText();
        String justification = score.path("justification").asText();
        if (!criterion.isEmpty() && !justification.isEmpty()) {
          if (info.length() > 0) {
            info.append("; ");
          }
          info.append(criterion).append(": ").append(justification);
        }
      }
    }
    
    return info.length() > 0 ? info.toString() : "N/A";
  }

  /**
   * Parse the SBMO response from the AI.
   * Expects a JSON response with criteriaA, criteriaB, criteriaC, criteriaD scores and explanations.
   */
  private JsonNode parseSBMOResponse(String response) {
    try {
      // First try to parse as-is
      JsonNode parsed = objectMapper.readTree(response);
      
      // Validate the structure
      if (parsed.has("criteriaA") && parsed.has("criteriaB") && 
          parsed.has("criteriaC") && parsed.has("criteriaD")) {
        return parsed;
      }
      
      // Check if the response contains an error from the API parsing
      if (parsed.has("error") && parsed.has("raw_response")) {
        // The response was not valid JSON, let's try to extract from raw_response
        String rawResponse = parsed.get("raw_response").asText();
        log.warn("API returned non-JSON response, attempting to parse raw response: {}", rawResponse);
        
        // Try parsing the raw response
        return objectMapper.readTree(rawResponse);
      }
      
      // If not in expected format, return empty scores
      log.error("Response does not contain expected SBMO criteria structure. Response: {}", response);
      return createEmptyScores();
      
    } catch (Exception e) {
      log.error("Error parsing SBMO response: {}. Original response: {}", e.getMessage(), response);
      return createEmptyScores();
    }
  }

  /**
   * Create empty SBMO scores structure for error cases.
   */
  private JsonNode createEmptyScores() {
    ObjectNode result = objectMapper.createObjectNode();
    
    String[] criteria = {"criteriaA", "criteriaB", "criteriaC", "criteriaD"};
    for (String criterion : criteria) {
      ObjectNode criterionNode = objectMapper.createObjectNode();
      criterionNode.put("score", 0.0);
      criterionNode.put("explanation", "Unable to calculate SBMO scores");
      result.set(criterion, criterionNode);
    }
    
    return result;
  }
}
