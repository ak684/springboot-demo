package io.ventureplatform.service.extraction.phases;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import io.ventureplatform.service.extraction.pipeline.BaseExtractionPhase;
import io.ventureplatform.service.external.OpenAiClient;
import java.util.List;
import java.util.Map;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Phase 2: Core Products/Services Extraction.
 * Extracts and structures 2-5 core products, services, or activities with marketing-quality descriptions.
 * Uses strict character limits and first-person perspective.
 */
@Service
@Slf4j
public class CoreProductsServicesExtractionService extends BaseExtractionPhase {

  private static final String SYSTEM_PROMPT = 
      "You are an expert at analyzing company information and creating concise, marketing-quality descriptions of their core offerings.\n\n"
      + "You will receive comprehensive company data from previous extraction phases. Your task is to identify and summarize "
      + "the organization's products/services in a structured format.\n\n"
      + "REQUIREMENTS:\n"
      + "1. Identify between 2-5 core products, services, or activities\n"
      + "2. Each item MUST have:\n"
      + "   - Title: Maximum 30 characters (STRICT LIMIT)\n"
      + "   - Description: Maximum 150 characters (STRICT LIMIT)\n"
      + "3. Use FIRST PERSON perspective (e.g., \"Our AI platform\" NOT \"Their AI platform\")\n"
      + "4. Choose an appropriate category title based on the company type:\n"
      + "   - \"Our Core Products\" (for product companies)\n"
      + "   - \"Our Core Services\" (for service companies)\n"
      + "   - \"Our Core Activities\" (for non-profits/NGOs)\n"
      + "   - \"Our Core Solutions\" (for mixed offerings)\n"
      + "   - Or a combination like \"Our Core Products & Services\"\n\n"
      + "QUALITY GUIDELINES:\n"
      + "- Write in professional, marketing-quality language\n"
      + "- Focus on VALUE provided to customers/users\n"
      + "- Be specific but concise\n"
      + "- Avoid generic descriptions\n"
      + "- Highlight what makes each offering unique\n"
      + "- Ensure descriptions could appear on a company website\n\n"
      + "CHARACTER COUNT ENFORCEMENT:\n"
      + "- Count every character including spaces and punctuation\n"
      + "- Titles must be ≤30 characters\n"
      + "- Descriptions must be ≤150 characters\n"
      + "- If you exceed limits, rewrite to be more concise\n\n"
      + "IMPORTANT: Return ONLY a JSON object in this EXACT format:\n"
      + "{\n"
      + "  \"category_title\": \"Our Core [Products/Services/Solutions]\",\n"
      + "  \"items\": [\n"
      + "    {\n"
      + "      \"title\": \"Title here (≤30 chars)\",\n"
      + "      \"description\": \"Description here (≤150 chars)\"\n"
      + "    },\n"
      + "    {\n"
      + "      \"title\": \"Second item title\",\n"
      + "      \"description\": \"Second item description\"\n"
      + "    }\n"
      + "  ]\n"
      + "}\n\n"
      + "Return 2-5 items. No markdown, no explanation, just the JSON object.";

  public CoreProductsServicesExtractionService(final ObjectMapper objectMapper,
                                               final OpenAiClient openAiClient) {
    super(objectMapper, openAiClient);
  }

  @Override
  public String getPhaseName() {
    return "Phase 2: Core Products/Services Extraction";
  }

  @Override
  public int getPhaseNumber() {
    return 2;
  }

  @Override
  protected JsonNode executePhase(JsonNode companyData, String companyUrl) {
    try {
      log.info("=== PHASE 2: CORE PRODUCTS/SERVICES EXTRACTION ===");
      log.info("Extracting core products/services for: {}", companyUrl);

      // Build user prompt with context from previous phases
      String userPrompt = buildUserPrompt(companyData);
      
      // Make AI call
      String aiResponse = makeOpenAiCall(userPrompt);
      
      // Parse and validate the response
      JsonNode coreProductsServices = parseAndValidateResponse(aiResponse);
      
      // Create result with the extracted data
      ObjectNode result = companyData.deepCopy();
      result.set("core_products_services", coreProductsServices);
      
      log.info("Successfully extracted {} core products/services", 
               coreProductsServices.get("items").size());
      
      return result;

    } catch (Exception e) {
      log.error("Error in Phase 2 extraction for {}: {}", companyUrl, e.getMessage(), e);
      
      // Return original data with empty core products/services on failure
      ObjectNode result = companyData.deepCopy();
      ObjectNode emptyResult = objectMapper.createObjectNode();
      emptyResult.put("category_title", "Our Core Solutions");
      emptyResult.putArray("items");
      result.set("core_products_services", emptyResult);
      
      return result;
    }
  }

  /**
   * Build user prompt with relevant context from previous phases.
   */
  private String buildUserPrompt(JsonNode companyData) {
    StringBuilder prompt = new StringBuilder();
    prompt.append("Based on the company data provided, extract their core products/services:\n\n");
    
    // Add company name
    if (companyData.has("company_name") && !companyData.get("company_name").isNull()) {
      prompt.append("Company: ").append(companyData.get("company_name").asText()).append("\n");
    }
    
    // Add industry
    if (companyData.has("industry_sectors") && !companyData.get("industry_sectors").isNull()) {
      prompt.append("Industry: ").append(companyData.get("industry_sectors").asText()).append("\n");
    }
    
    // Add description
    if (companyData.has("company_description") && !companyData.get("company_description").isNull()) {
      prompt.append("Description: ").append(companyData.get("company_description").asText()).append("\n");
    }
    
    // Add business model
    if (companyData.has("business_model") && !companyData.get("business_model").isNull()) {
      prompt.append("Business Model: ").append(companyData.get("business_model").asText()).append("\n");
    }
    
    // Add target market
    if (companyData.has("target_market") && !companyData.get("target_market").isNull()) {
      prompt.append("Target Market: ").append(companyData.get("target_market").asText()).append("\n");
    }
    
    // Add mission
    if (companyData.has("mission") && !companyData.get("mission").isNull()) {
      prompt.append("Mission: ").append(companyData.get("mission").asText()).append("\n");
    }
    
    // Add revenue model
    if (companyData.has("revenue_model") && !companyData.get("revenue_model").isNull()) {
      prompt.append("Revenue Model: ").append(companyData.get("revenue_model").asText()).append("\n");
    }
    
    // Add theory of change summary if available
    if (companyData.has("theory_of_change") && !companyData.get("theory_of_change").isNull()) {
      JsonNode toc = companyData.get("theory_of_change");
      if (toc.isArray() && toc.size() > 0) {
        prompt.append("Impact Focus: ");
        for (int i = 0; i < Math.min(3, toc.size()); i++) {
          if (i > 0) {
            prompt.append(", ");
          }
          prompt.append(toc.get(i).asText());
        }
        prompt.append("\n");
      }
    }
    
    prompt.append("\nCreate 2-5 core products/services with professional descriptions that highlight their value proposition.");
    
    return prompt.toString();
  }

  /**
   * Make OpenAI API call using OpenAiClient for consistent retry logic.
   */
  private String makeOpenAiCall(final String userPrompt) {
    try {
      List<Map<String, String>> messages = List.of(
        Map.of("role", "system", "content", SYSTEM_PROMPT),
        Map.of("role", "user", "content", userPrompt)
      );

      log.debug("Making OpenAI API call for core products/services extraction");

      String content = openAiClient.makeChatCompletion(messages);

      log.debug("Received AI response");

      return content;

    } catch (Exception e) {
      log.error("Error making OpenAI API call: {}", e.getMessage(), e);
      throw new RuntimeException("Failed to get AI response", e);
    }
  }

  /**
   * Parse and validate the AI response.
   */
  private JsonNode parseAndValidateResponse(String aiResponse) {
    try {
      // Clean the response (remove any markdown or extra text)
      String cleanedResponse = aiResponse.trim();
      if (cleanedResponse.startsWith("```json")) {
        cleanedResponse = cleanedResponse.substring(7);
      }
      if (cleanedResponse.startsWith("```")) {
        cleanedResponse = cleanedResponse.substring(3);
      }
      if (cleanedResponse.endsWith("```")) {
        cleanedResponse = cleanedResponse.substring(0, cleanedResponse.length() - 3);
      }
      cleanedResponse = cleanedResponse.trim();

      // Parse JSON
      JsonNode result = objectMapper.readTree(cleanedResponse);
      
      // Validate structure
      if (!result.has("category_title") || !result.has("items")) {
        throw new IllegalArgumentException("Response missing required fields");
      }
      
      JsonNode items = result.get("items");
      if (!items.isArray() || items.size() < 2 || items.size() > 5) {
        throw new IllegalArgumentException("Items must be an array with 2-5 elements");
      }
      
      // Validate each item and enforce character limits
      ObjectNode validatedResult = objectMapper.createObjectNode();
      validatedResult.put("category_title", result.get("category_title").asText());
      
      ArrayNode validatedItems = validatedResult.putArray("items");
      
      for (JsonNode item : items) {
        if (!item.has("title") || !item.has("description")) {
          log.warn("Item missing title or description, skipping");
          continue;
        }
        
        String title = item.get("title").asText();
        String description = item.get("description").asText();
        
        // Enforce character limits
        if (title.length() > 30) {
          log.warn("Title exceeds 30 characters, truncating: {}", title);
          title = title.substring(0, 27) + "...";
        }
        
        if (description.length() > 150) {
          log.warn("Description exceeds 150 characters, truncating: {}", description);
          description = description.substring(0, 147) + "...";
        }
        
        ObjectNode validatedItem = objectMapper.createObjectNode();
        validatedItem.put("title", title);
        validatedItem.put("description", description);
        validatedItems.add(validatedItem);
      }
      
      // Ensure we still have 2-5 items after validation
      if (validatedItems.size() < 2) {
        throw new IllegalArgumentException("Not enough valid items after validation");
      }
      
      return validatedResult;
      
    } catch (Exception e) {
      log.error("Error parsing/validating AI response: {}", e.getMessage());
      throw new RuntimeException("Failed to parse AI response", e);
    }
  }
}
