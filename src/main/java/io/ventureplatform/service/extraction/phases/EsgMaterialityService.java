package io.ventureplatform.service.extraction.phases;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import io.ventureplatform.constant.EsgStandardizedTopics;
import io.ventureplatform.service.extraction.pipeline.BaseExtractionPhase;
import io.ventureplatform.service.external.OpenAiClient;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

/**
 * Phase 6: Extract ESG Materiality Analysis with SASB industry mapping and 4 OpenAI calls (1 sequential + 3 parallel).
 * Enhanced with SASB (Sustainability Accounting Standards Board) industry classification for better materiality assessment.
 */
@Service
@Slf4j
public class EsgMaterialityService extends BaseExtractionPhase {

  public EsgMaterialityService(ObjectMapper objectMapper, OpenAiClient openAiClient) {
    super(objectMapper, openAiClient);
  }

  @Override
  public String getPhaseName() {
    return "Phase 6: ESG Materiality Analysis with SASB Enhancement";
  }

  @Override
  public int getPhaseNumber() {
    return 6;
  }

  @Override
  protected JsonNode executePhase(JsonNode companyData, String companyUrl) {
    try {
      log.info("Starting ESG Materiality Phase with SASB enhancement");
      
      // STEP 1: SASB Classification and Topic Generation (FIXED: Generate 10 unique topics upfront)
      log.info("Step 1: Performing SASB industry classification and generating 10 unique topics");
      JsonNode sasbClassificationAndTopics = performSasbClassificationAndTopicGeneration(companyData, companyUrl);
      
      String primaryIndustry = sasbClassificationAndTopics.get("primaryIndustry").asText("General");
      String secondaryIndustry = sasbClassificationAndTopics.get("secondaryIndustry").asText("");
      JsonNode prioritizedTopics = sasbClassificationAndTopics.get("prioritizedTopics");
      JsonNode tenUniqueTopics = sasbClassificationAndTopics.get("tenUniqueTopics");
      
      log.info("SASB Classification - Primary: {}, Secondary: {}", primaryIndustry, secondaryIndustry);
      log.info("Generated {} unique ESG topics", tenUniqueTopics.size());
      
      // STEP 2: Enhanced ESG Analysis (FIXED: Use shared topic list to prevent duplicates)
      log.info("Step 2: Performing detailed ESG analysis with SASB context using generated topics");
      
      // Call 1: Topics 1-3
      CompletableFuture<JsonNode> esgResults1Future = CompletableFuture.supplyAsync(() -> 
          performEnhancedEsgAnalysisWithTopics(companyData, sasbClassificationAndTopics, tenUniqueTopics, 1, 3));
      
      // Call 2: Topics 4-6  
      CompletableFuture<JsonNode> esgResults2Future = CompletableFuture.supplyAsync(() -> 
          performEnhancedEsgAnalysisWithTopics(companyData, sasbClassificationAndTopics, tenUniqueTopics, 4, 6));
      
      // Call 3: Topics 7-8
      CompletableFuture<JsonNode> esgResults3Future = CompletableFuture.supplyAsync(() -> 
          performEnhancedEsgAnalysisWithTopics(companyData, sasbClassificationAndTopics, tenUniqueTopics, 7, 8));
      
      // Call 4: Topics 9-10
      CompletableFuture<JsonNode> esgResults4Future = CompletableFuture.supplyAsync(() -> 
          performEnhancedEsgAnalysisWithTopics(companyData, sasbClassificationAndTopics, tenUniqueTopics, 9, 10));
      
      // Wait for all parallel calls to complete
      JsonNode esgResults1 = esgResults1Future.join();
      JsonNode esgResults2 = esgResults2Future.join();
      JsonNode esgResults3 = esgResults3Future.join();
      JsonNode esgResults4 = esgResults4Future.join();
      
      log.info("All parallel ESG topic analyses completed");
      
      // STEP 3: Combine all results
      ObjectNode finalResult = (ObjectNode) companyData;
      finalResult.put("sasbPrimaryIndustry", primaryIndustry);
      finalResult.put("sasbSecondaryIndustry", secondaryIndustry);
      finalResult.set("sasbPrioritizedTopics", prioritizedTopics);
      
      // Merge ESG results into the standard format
      String combinedEsgData = combineEnhancedEsgAnalyses(sasbClassificationAndTopics, esgResults1, esgResults2, esgResults3, esgResults4, companyData);
      return mergeEsgData(finalResult, combinedEsgData);
      
    } catch (Exception e) {
      log.error("ESG Materiality Phase failed: {}", e.getMessage());
      // Return original data with empty ESG results
      ObjectNode result = (ObjectNode) companyData;
      result.set("esg_materiality_analysis", createEmptyEsgAnalysisNode());
      return result;
    }
  }

  /**
   * Step 1: Classify company using SASB framework and generate 10 unique ESG topics
   * FIXED: This replaces the old performSasbClassification to also generate topics upfront
   */
  private JsonNode performSasbClassificationAndTopicGeneration(JsonNode companyData, String companyUrl) {
    String sasbAndTopicsPrompt = buildSasbClassificationAndTopicsPrompt(companyData);
    
    try {
      String sasbResponse = makeOpenAiCallWithO3WebSearch(sasbAndTopicsPrompt);
      String cleanedSasbResponse = cleanJsonResponse(sasbResponse);
      return objectMapper.readTree(cleanedSasbResponse);
    } catch (Exception e) {
      log.error("SASB classification and topic generation failed: {}", e.getMessage());
      // Return fallback with generic classification
      ObjectNode fallback = objectMapper.createObjectNode();
      fallback.put("primaryIndustry", "General Business");
      fallback.put("secondaryIndustry", "");
      fallback.put("primaryIndustryCode", "");
      fallback.put("secondaryIndustryCode", "");
      fallback.put("reasoning", "Could not classify industry - using general framework");
      fallback.set("prioritizedTopics", objectMapper.createArrayNode());
      
      // Create default 10 topics for fallback
      ArrayNode defaultTopics = objectMapper.createArrayNode();
      String[] defaultTopicNames = {
        "Environmental Impact Management", "Employee Health and Safety", "Corporate Governance",
        "Supply Chain Sustainability", "Data Privacy and Security", "Product Quality and Safety",
        "Energy Efficiency", "Waste Management", "Community Relations", "Ethical Business Practices"
      };
      String[] defaultCategories = {"E", "S", "G", "E", "G", "S", "E", "E", "S", "G"};
      
      for (int i = 0; i < defaultTopicNames.length; i++) {
        ObjectNode topic = objectMapper.createObjectNode();
        topic.put("name", defaultTopicNames[i]);
        topic.put("category", defaultCategories[i]);
        defaultTopics.add(topic);
      }
      fallback.set("tenUniqueTopics", defaultTopics);
      return fallback;
    }
  }

  /**
   * Build prompt for SASB industry classification and 10 unique topic generation
   * FIXED: This replaces the old buildSasbClassificationPrompt to also generate topics
   */
  private String buildSasbClassificationAndTopicsPrompt(JsonNode companyData) {
    StringBuilder prompt = new StringBuilder();
    
    prompt.append("TASK: Classify this company using SASB industry framework and generate 10 unique ESG topics.\n\n");
    
    // Add company context
    prompt.append("COMPANY INFORMATION:\n");
    prompt.append("Name: ").append(companyData.path("company_name").asText("")).append("\n");
    prompt.append("Description: ").append(companyData.path("company_description").asText("")).append("\n");
    prompt.append("Industry Sectors: ").append(companyData.path("industry_sectors").asText("")).append("\n");
    if (!companyData.path("number_of_employees").asText("").isEmpty()) {
      prompt.append("Number of Employees: ").append(companyData.path("number_of_employees").asText("")).append("\n");
    }
    if (!companyData.path("headquarter_address").asText("").isEmpty()) {
      prompt.append("Headquarters: ").append(companyData.path("headquarter_address").asText("")).append("\n");
    }
    // Include annual sales data - check year-specific fields first, then legacy field
    boolean addedSalesData = false;
    if (!companyData.path("annual_sales_2024").asText("").isEmpty()) {
      prompt.append("2024 Annual Sales: ").append(companyData.path("annual_sales_2024").asText(""))
            .append(" ").append(companyData.path("currency_2024").asText("")).append("\n");
      addedSalesData = true;
    }
    if (!companyData.path("annual_sales_2023").asText("").isEmpty()) {
      prompt.append("2023 Annual Sales: ").append(companyData.path("annual_sales_2023").asText(""))
            .append(" ").append(companyData.path("currency_2023").asText("")).append("\n");
      addedSalesData = true;
    }
    if (!companyData.path("annual_sales_2022").asText("").isEmpty()) {
      prompt.append("2022 Annual Sales: ").append(companyData.path("annual_sales_2022").asText(""))
            .append(" ").append(companyData.path("currency_2022").asText("")).append("\n");
      addedSalesData = true;
    }
    // Fallback to legacy field if no year-specific data
    if (!addedSalesData && !companyData.path("annual_sales").asText("").isEmpty()) {
      prompt.append("Annual Sales: ").append(companyData.path("annual_sales").asText("")).append("\n");
    }
    prompt.append("\n");
    
    // Add SASB industry options
    prompt.append("SASB INDUSTRY CLASSIFICATION OPTIONS:\n");
    prompt.append(getSasbIndustryList());
    prompt.append("\n");
    
    prompt.append("INSTRUCTIONS:\n");
    prompt.append("1. Analyze the company information\n");
    prompt.append("2. Select the PRIMARY SASB industry that best fits (most relevant)\n");
    prompt.append("3. Select a SECONDARY SASB industry if applicable (second most relevant)\n");
    prompt.append("4. Based on SASB materiality maps, generate exactly 10 unique ESG material topics that are most important for this specific company\n");
    prompt.append("5. Ensure each of the 10 topics is unique and is material for this company's industry and business model\n");
    prompt.append("6. Return ONLY valid JSON in this exact format:\n\n");
    
    prompt.append("{\n");
    prompt.append("  \"primaryIndustry\": \"[SASB Industry Name]\",\n");
    prompt.append("  \"secondaryIndustry\": \"[SASB Industry Name or null]\",\n");
    prompt.append("  \"primaryIndustryCode\": \"[SASB Code like TC-SI]\",\n");
    prompt.append("  \"secondaryIndustryCode\": \"[SASB Code or null]\",\n");
    prompt.append("  \"reasoning\": \"[2-3 sentences explaining the classification]\",\n");
    prompt.append("  \"prioritizedTopics\": [\n");
    prompt.append("    \"Topic Name 1\",\n");
    prompt.append("    \"Topic Name 2\",\n");
    prompt.append("    \"...(up to 15 topics)\"\n");
    prompt.append("  ],\n");
    prompt.append("  \"tenUniqueTopics\": [\n");
    prompt.append("    {\n");
    prompt.append("      \"name\": \"Unique Topic Name 1\",\n");
    prompt.append("      \"category\": \"E|S|G\"\n");
    prompt.append("    },\n");
    prompt.append("    {\n");
    prompt.append("      \"name\": \"Unique Topic Name 2\",\n");
    prompt.append("      \"category\": \"E|S|G\"\n");
    prompt.append("    }\n");
    prompt.append("    // ... exactly 10 unique topics total\n");
    prompt.append("  ]\n");
    prompt.append("}\n");
    
    return prompt.toString();
  }

  /**
   * Enhanced ESG analysis with SASB context for specific topics from the pre-generated list
   * FIXED: This replaces performEnhancedEsgAnalysis to use shared topic list
   */
  private JsonNode performEnhancedEsgAnalysisWithTopics(JsonNode companyData, JsonNode sasbClassification, 
                                                       JsonNode tenUniqueTopics, int topicStart, int topicEnd) {
    String enhancedPrompt = buildEnhancedEsgPromptWithTopics(companyData, sasbClassification, tenUniqueTopics, topicStart, topicEnd);
    
    try {
      String esgResponse = makeOpenAiCallWithO3WebSearch(enhancedPrompt);
      String cleanedResponse = cleanJsonResponse(esgResponse);
      return objectMapper.readTree(cleanedResponse);
    } catch (Exception e) {
      log.error("Enhanced ESG analysis failed for topics {}-{}: {}", topicStart, topicEnd, e.getMessage());
      ObjectNode fallback = objectMapper.createObjectNode();
      fallback.set("esgTopics", objectMapper.createArrayNode());
      return fallback;
    }
  }

  /**
   * Build enhanced ESG prompt with SASB context for specific topics from the pre-generated list
   * FIXED: This replaces buildEnhancedEsgPrompt to use shared topics and request business descriptions
   */
  private String buildEnhancedEsgPromptWithTopics(JsonNode companyData, JsonNode sasbClassification, 
                                                 JsonNode tenUniqueTopics, int topicStart, int topicEnd) {
    StringBuilder prompt = new StringBuilder();
    
    prompt.append("ENHANCED ESG MATERIALITY ANALYSIS WITH SASB FRAMEWORK\n\n");
    
    // Add SASB context
    prompt.append("SASB INDUSTRY CONTEXT:\n");
    prompt.append("Primary Industry: ").append(sasbClassification.get("primaryIndustry").asText()).append("\n");
    if (!sasbClassification.get("secondaryIndustry").asText().isEmpty()) {
      prompt.append("Secondary Industry: ").append(sasbClassification.get("secondaryIndustry").asText()).append("\n");
    }
    prompt.append("SASB-Prioritized Topics: ");
    JsonNode prioritizedTopics = sasbClassification.get("prioritizedTopics");
    if (prioritizedTopics.isArray()) {
      List<String> topics = new ArrayList<>();
      prioritizedTopics.forEach(topic -> topics.add(topic.asText()));
      prompt.append(String.join(", ", topics));
    }
    prompt.append("\n\n");
    
    // Add company context
    prompt.append("VENTURE DETAILS:\n");
    
    // Add core products/services from Phase 2 if available
    if (companyData.has("core_products_services")) {
      JsonNode coreProducts = companyData.get("core_products_services");
      if (coreProducts.has("items") && coreProducts.get("items").isArray()) {
        prompt.append("Core Products/Services:\n");
        for (JsonNode item : coreProducts.get("items")) {
          prompt.append("- ").append(item.path("title").asText(""))
                .append(": ").append(item.path("description").asText("")).append("\n");
        }
      }
    } else {
      prompt.append("Venture products/services/activities: ").append(companyData.path("company_description").asText("")).append("\n");
    }
    prompt.append("Primary Industry: ").append(sasbClassification.get("primaryIndustry").asText()).append("\n");
    prompt.append("Secondary Industry: ").append(sasbClassification.get("secondaryIndustry").asText("N/A")).append("\n\n");
    
    // Add the specific topics to analyze
    prompt.append("SPECIFIC TOPICS TO ANALYZE (numbers ").append(topicStart).append("-").append(topicEnd).append("):\n");
    if (tenUniqueTopics.isArray()) {
      for (int i = topicStart - 1; i < Math.min(topicEnd, tenUniqueTopics.size()); i++) {
        JsonNode topic = tenUniqueTopics.get(i);
        prompt.append((i + 1)).append(". ")
            .append(topic.path("name").asText(""))
            .append(" (").append(topic.path("category").asText("")).append(")\n");
      }
    }
    prompt.append("\n");

    // Add standardized topics list using constants
    prompt.append(EsgStandardizedTopics.getFormattedTopicsForPrompt());

    // Task instructions
    prompt.append("TASK: Provide detailed materiality analysis for the specific topics listed above ONLY.\n\n");

    prompt.append("INSTRUCTIONS:\n");
    prompt.append("1. Consider the SASB industry classification and prioritized topics above\n");
    prompt.append("2. Focus on topics that are material for the identified SASB industry\n");
    prompt.append("3. Analyze ONLY the topics numbered ").append(topicStart).append("-").append(topicEnd).append(" from the list above\n");
    prompt.append("4. Consider venture size and stage (governance may be less critical for early-stage)\n");
    prompt.append("5. Draw upon SASB materiality frameworks and other established sustainability standards\n");
    prompt.append("6. For each topic, map it to the SINGLE most relevant standardized topic from the lists above\n\n");
    
    prompt.append("For EACH of the topics ").append(topicStart).append("-").append(topicEnd).append(" listed above, provide:\n");
    prompt.append("- Material Topic Name (use exact name from list above)\n");
    prompt.append("- Category (E, S, or G)\n");
    prompt.append("- Standardized Topic (select ONE from the standardized topics list that best matches this topic)\n");
    prompt.append("- Importance to Stakeholder Score (1-10)\n");
    prompt.append("- Write a 4-5 sentence explanation of why this ESG topic matters to the company's stakeholders. ")
        .append("Reference specific stakeholder groups such as customers, investors, regulators, or employees, ")
        .append("and describe how the company's actual activities or sector context make this topic important to them. ")
        .append("Include concrete reasons (e.g., reputational concerns, compliance pressure, investor expectations, ")
        .append("or community impact) grounded in what the company does.\n");
    prompt.append("- Scientific Evidence 1 with Link\n");
    prompt.append("- Scientific Evidence 2 with Link\n");
    prompt.append("- Importance to Business Score (1-10)\n");
    prompt.append("- Write a 4-5 sentence explanation of how this ESG topic directly affects the company, ")
        .append("based on its business model, size, sector, and operations. Reference specific company activities ")
        .append("(e.g., 'because your company does X, Y, Z') or typical practices in its industry. ")
        .append("Explain how the issue may impact revenue, cost, regulatory exposure, or reputation. ")
        .append("End by asking whether the company has considered addressing or reducing this risk proactively.\n");
    prompt.append("- Scientific Evidence 3 (Business) with Link\n");
    prompt.append("- Scientific Evidence 4 (Business) with Link\n\n");
    
    prompt.append("Return ONLY valid JSON in this format:\n");
    prompt.append("{\n");
    prompt.append("  \"esgTopics\": [\n");
    prompt.append("    {\n");
    prompt.append("      \"topicNumber\": ").append(topicStart).append(",\n");
    prompt.append("      \"materialTopicName\": \"[Exact Topic Name from list]\",\n");
    prompt.append("      \"category\": \"[E/S/G]\",\n");
    prompt.append("      \"standardizedTopic\": \"[One standardized topic from the list]\",\n");
    prompt.append("      \"importanceToStakeholderScore\": [1-10],\n");
    prompt.append("      \"stakeholderImportanceDescription\": \"[4-5 sentences]\",\n");
    prompt.append("      \"scientificEvidence1\": \"[Evidence description]\",\n");
    prompt.append("      \"scientificEvidence1Link\": \"[URL or 'Not available']\",\n");
    prompt.append("      \"scientificEvidence2\": \"[Evidence description]\",\n");
    prompt.append("      \"scientificEvidence2Link\": \"[URL or 'Not available']\",\n");
    prompt.append("      \"importanceToBusinessScore\": [1-10],\n");
    prompt.append("      \"businessImpactDescription\": \"[4-5 sentences about business impact]\",\n");
    prompt.append("      \"scientificEvidence3\": \"[Business evidence description]\",\n");
    prompt.append("      \"scientificEvidence3Link\": \"[URL or 'Not available']\",\n");
    prompt.append("      \"scientificEvidence4\": \"[Business evidence description]\",\n");
    prompt.append("      \"scientificEvidence4Link\": \"[URL or 'Not available']\"\n");
    prompt.append("    }\n");
    prompt.append("    // ... repeat for each topic in range\n");
    prompt.append("  ]\n");
    prompt.append("}\n");
    
    return prompt.toString();
  }

  /**
   * Combine the enhanced ESG analysis responses into final format compatible with existing system
   */
  private String combineEnhancedEsgAnalyses(JsonNode sasbClassification, JsonNode esgResults1, 
                                           JsonNode esgResults2, JsonNode esgResults3, JsonNode esgResults4, JsonNode companyData) {
    try {
      // Create the final response structure in the existing format
      ObjectNode finalResponse = objectMapper.createObjectNode();

      // Set industry standards (maintain compatibility)
      String primaryIndustry = sasbClassification.get("primaryIndustry").asText("");
      String secondaryIndustry = sasbClassification.get("secondaryIndustry").asText("");
      
      finalResponse.put("primary_industry_standard", primaryIndustry);
      finalResponse.put("secondary_industry_standard", secondaryIndustry);

      // Create the esg_materiality_analysis object
      ObjectNode esgAnalysis = objectMapper.createObjectNode();
      ArrayNode finalTopics = objectMapper.createArrayNode();

      // Combine all topics from the 4 calls
      addTopicsFromResponse(esgResults1, finalTopics);
      addTopicsFromResponse(esgResults2, finalTopics);
      addTopicsFromResponse(esgResults3, finalTopics);
      addTopicsFromResponse(esgResults4, finalTopics);

      esgAnalysis.set("topics", finalTopics);
      finalResponse.set("esg_materiality_analysis", esgAnalysis);

      return objectMapper.writeValueAsString(finalResponse);

    } catch (Exception e) {
      log.error("Error combining enhanced ESG analyses", e);
      return createEmptyEsgResponse();
    }
  }

  /**
   * Add topics from an ESG response to the final topics array
   * FIXED: Now uses businessImpactDescription instead of hardcoded text
   */
  private void addTopicsFromResponse(JsonNode esgResponse, ArrayNode finalTopics) {
    if (esgResponse.has("esgTopics") && esgResponse.get("esgTopics").isArray()) {
      JsonNode topics = esgResponse.get("esgTopics");
      for (JsonNode topic : topics) {
        ObjectNode topicNode = objectMapper.createObjectNode();

        // Map from new format to existing format
        topicNode.put("name", topic.path("materialTopicName").asText(""));
        topicNode.put("category", topic.path("category").asText(""));
        topicNode.put("standardized_topic", topic.path("standardizedTopic").asText(""));  // NEW FIELD
        topicNode.put("stakeholder_importance", topic.path("importanceToStakeholderScore").asInt(5));
        topicNode.put("stakeholder_description", topic.path("stakeholderImportanceDescription").asText(""));
        
        // Create research objects
        ObjectNode research1 = objectMapper.createObjectNode();
        research1.put("title", topic.path("scientificEvidence1").asText(""));
        research1.put("link", topic.path("scientificEvidence1Link").asText(""));
        topicNode.set("stakeholder_research_1", research1);
        
        ObjectNode research2 = objectMapper.createObjectNode();
        research2.put("title", topic.path("scientificEvidence2").asText(""));
        research2.put("link", topic.path("scientificEvidence2Link").asText(""));
        topicNode.set("stakeholder_research_2", research2);
        
        topicNode.put("business_importance", topic.path("importanceToBusinessScore").asInt(5));
        // FIXED: Use the actual business description from AI response instead of hardcoded text
        topicNode.put("business_description", topic.path("businessImpactDescription").asText("Business impact analysis based on SASB industry context."));
        
        ObjectNode businessResearch1 = objectMapper.createObjectNode();
        businessResearch1.put("title", topic.path("scientificEvidence3").asText(""));
        businessResearch1.put("link", topic.path("scientificEvidence3Link").asText(""));
        topicNode.set("business_research_1", businessResearch1);
        
        ObjectNode businessResearch2 = objectMapper.createObjectNode();
        businessResearch2.put("title", topic.path("scientificEvidence4").asText(""));
        businessResearch2.put("link", topic.path("scientificEvidence4Link").asText(""));
        topicNode.set("business_research_2", businessResearch2);
        
        finalTopics.add(topicNode);
      }
    }
  }

  /**
   * Create empty ESG analysis node for fallback cases
   */
  private ObjectNode createEmptyEsgAnalysisNode() {
    ObjectNode esgAnalysis = objectMapper.createObjectNode();
    ArrayNode emptyTopics = objectMapper.createArrayNode();
    esgAnalysis.set("topics", emptyTopics);
    return esgAnalysis;
  }

  /**
   * Create empty ESG response for error cases.
   */
  private String createEmptyEsgResponse() {
    try {
      ObjectNode emptyResponse = objectMapper.createObjectNode();
      emptyResponse.put("primary_industry_standard", "");
      emptyResponse.put("secondary_industry_standard", "");

      ObjectNode esgAnalysis = objectMapper.createObjectNode();
      ArrayNode emptyTopics = objectMapper.createArrayNode();
      esgAnalysis.set("topics", emptyTopics);
      emptyResponse.set("esg_materiality_analysis", esgAnalysis);

      return objectMapper.writeValueAsString(emptyResponse);
    } catch (Exception e) {
      return "{\"primary_industry_standard\": \"\", \"secondary_industry_standard\": \"\", "
          + "\"esg_materiality_analysis\": {\"topics\": []}}";
    }
  }

  /**
   * Merge ESG Materiality data into the main JSON response.
   */
  private JsonNode mergeEsgData(JsonNode mainData, String esgJsonString) {
    try {
      JsonNode esgData = objectMapper.readTree(esgJsonString);
      ObjectNode mainNode = (ObjectNode) mainData;

      // Extract and set industry standards
      if (esgData.has("primary_industry_standard")) {
        mainNode.put("primary_industry_standard", esgData.get("primary_industry_standard").asText(""));
      }
      if (esgData.has("secondary_industry_standard")) {
        mainNode.put("secondary_industry_standard", esgData.get("secondary_industry_standard").asText(""));
      }

      // Extract and set the ESG materiality analysis
      if (esgData.has("esg_materiality_analysis")) {
        mainNode.set("esg_materiality_analysis", esgData.get("esg_materiality_analysis"));
      } else {
        // Create empty ESG analysis structure
        mainNode.set("esg_materiality_analysis", createEmptyEsgAnalysisNode());
      }

      return mainNode;
    } catch (Exception e) {
      log.error("Error merging ESG data: {}", e.getMessage());
      // Set default values on error
      ObjectNode mainNode = (ObjectNode) mainData;
      mainNode.put("primary_industry_standard", "");
      mainNode.put("secondary_industry_standard", "");
      mainNode.set("esg_materiality_analysis", createEmptyEsgAnalysisNode());
      return mainNode;
    }
  }

  /**
   * Get the SASB industry list with 77 industries across 11 sectors
   */
  private String getSasbIndustryList() {
    return """
        EXTRACTIVES & MINERALS PROCESSING:
        - Oil & Gas - Exploration & Production (EM-EP)
        - Oil & Gas - Midstream (EM-MD)
        - Oil & Gas - Refining & Marketing (EM-RM)
        - Oil & Gas - Services (EM-SV)
        - Coal Operations (EM-CO)
        - Iron & Steel Producers (EM-IS)
        - Metals & Mining (EM-MM)
        - Construction Materials (EM-CM)
        - Chemicals (EM-CH)

        FOOD & BEVERAGE:
        - Alcoholic Beverages (FB-AB)
        - Non-Alcoholic Beverages (FB-NB)
        - Restaurants (FB-RN)
        - Food Retailers & Distributors (FB-FR)
        - Processed Foods (FB-PF)
        - Agricultural Products (FB-AG)
        - Meat, Poultry & Dairy (FB-MP)

        FINANCIALS:
        - Commercial Banks (FN-CB)
        - Investment Banking & Brokerage (FN-IB)
        - Asset Management & Custody Activities (FN-AC)
        - Security & Commodity Exchanges (FN-EX)
        - Insurance (FN-IN)
        - Mortgage Finance (FN-MF)
        - Consumer Finance (FN-CF)

        HEALTHCARE:
        - Biotechnology & Pharmaceuticals (HC-BP)
        - Medical Equipment & Supplies (HC-MS)
        - Health Care Delivery (HC-DY)
        - Managed Care (HC-MC)
        - Health Care Distributors (HC-DI)

        INFRASTRUCTURE:
        - Electric Utilities & Power Generators (IF-EU)
        - Gas Utilities & Distributors (IF-GU)
        - Water Utilities & Services (IF-WU)
        - Waste Management (IF-WM)
        - Engineering & Construction Services (IF-EN)
        - Real Estate (IF-RE)
        - Home Builders (IF-HB)
        - Real Estate Services (IF-RS)

        RENEWABLE RESOURCES & ALTERNATIVE ENERGY:
        - Biofuels (RR-BI)
        - Forestry Management (RR-FM)
        - Pulp & Paper Products (RR-PP)
        - Solar Technology & Project Developers (RR-ST)
        - Wind Technology & Project Developers (RR-WT)
        - Fuel Cells & Industrial Batteries (RR-FC)

        RESOURCE TRANSFORMATION:
        - Aerospace & Defense (RT-AE)
        - Airlines (RT-AL)
        - Auto Parts (RT-AP)
        - Automobiles (RT-AU)
        - Building Products & Furnishings (RT-BF)
        - Containers & Packaging (RT-CP)
        - Electrical & Electronic Equipment (RT-EE)
        - Industrial Machinery & Goods (RT-IG)
        - Marine Transportation (RT-MT)
        - Rail Transportation (RT-RT)
        - Road Transportation (RT-RO)

        SERVICES:
        - Advertising & Marketing (SV-AD)
        - Casinos & Gaming (SV-CA)
        - Education (SV-ED)
        - Employment Services (SV-EM)
        - Hotels & Lodging (SV-HL)
        - Leisure Facilities (SV-LF)
        - Media & Entertainment (SV-ME)
        - Professional Services (SV-PS)

        TECHNOLOGY & COMMUNICATIONS:
        - Hardware (TC-HW)
        - Internet Media & Services (TC-IM)
        - Semiconductors (TC-SC)
        - Software & IT Services (TC-SI)
        - Telecommunications Services (TC-TL)
        - Electronic Manufacturing Services & Original Design Manufacturing (TC-ES)

        TRANSPORTATION:
        - Airlines (TR-AL)
        - Auto Parts (TR-AP)
        - Automobiles (TR-AU)
        - Car Rental & Leasing (TR-CR)
        - Cruise Lines (TR-CL)
        - Marine Transportation (TR-MT)
        - Rail Transportation (TR-RA)
        - Road Transportation (TR-RO)

        CONSUMER GOODS:
        - Apparel, Accessories & Footwear (CG-AA)
        - Appliance Manufacturing (CG-AM)
        - Building Products & Furnishings (CG-BF)
        - E-Commerce (CG-EC)
        - Household & Personal Products (CG-HP)
        - Multiline and Specialty Retailers & Distributors (CG-MR)
        - Toys & Sporting Goods (CG-TS)
        - Tobacco (CG-TO)
        """;
  }

  /**
   * Public method to run the full phase (for rerun endpoint)
   */
  public JsonNode processPhase(JsonNode companyData, String companyUrl) {
    return executePhase(companyData, companyUrl);
  }

  /**
   * Add standardized topic mappings to existing ESG topics (for lightweight rerun mode).
   * This method ONLY adds the standardized_topic field without regenerating the topics.
   */
  public JsonNode addStandardizedTopicMappings(JsonNode companyData, String companyUrl) {
    try {
      log.info("Adding standardized topic mappings for company: {}", companyUrl);

      // Check if company has ESG materiality topics
      if (!companyData.has("esg_materiality_analysis")) {
        log.info("No ESG materiality analysis found, skipping standardization");
        return null;
      }

      JsonNode esgAnalysis = companyData.get("esg_materiality_analysis");
      if (!esgAnalysis.has("topics") || !esgAnalysis.get("topics").isArray()) {
        log.info("No ESG topics found, skipping standardization");
        return null;
      }

      ArrayNode topics = (ArrayNode) esgAnalysis.get("topics");
      if (topics.size() == 0) {
        log.info("No topics to standardize");
        return null;
      }

      // Check if already standardized
      JsonNode firstTopic = topics.get(0);
      if (firstTopic.has("standardized_topic") && !firstTopic.get("standardized_topic").asText("").isEmpty()) {
        log.info("Topics already have standardized mappings, skipping");
        return null;
      }

      // Create a deep copy to avoid modifying the original
      JsonNode companyDataCopy = objectMapper.readTree(companyData.toString());
      ArrayNode topicsCopy = (ArrayNode) companyDataCopy.get("esg_materiality_analysis").get("topics");

      // Build list of topic names for AI to map
      List<String> topicNames = new ArrayList<>();
      for (JsonNode topic : topicsCopy) {
        topicNames.add(topic.get("name").asText(""));
      }

      // Call AI to get standardized mappings
      Map<String, String> standardizedMappings = getStandardizedMappings(topicNames, companyData);

      // Add standardized_topic field to each topic in the copy
      for (JsonNode topicNode : topicsCopy) {
        ObjectNode topic = (ObjectNode) topicNode;
        String topicName = topic.get("name").asText("");
        String standardizedTopic = standardizedMappings.getOrDefault(topicName, "");
        topic.put("standardized_topic", standardizedTopic);
        log.debug("Mapped '{}' to '{}'", topicName, standardizedTopic);
      }

      log.info("Successfully added standardized mappings to {} topics", topicsCopy.size());
      return companyDataCopy;

    } catch (Exception e) {
      log.error("Error adding standardized topic mappings: {}", e.getMessage());
      return null;  // Return null to indicate no change
    }
  }

  /**
   * Get standardized topic mappings for a list of personalized topics
   */
  private Map<String, String> getStandardizedMappings(List<String> topicNames, JsonNode companyData) {
    Map<String, String> mappings = new HashMap<>();

    try {
      String prompt = buildStandardizationPrompt(topicNames, companyData);
      String response = makeOpenAiCallWithO3WebSearch(prompt);
      String cleanedResponse = cleanJsonResponse(response);
      JsonNode mappingsNode = objectMapper.readTree(cleanedResponse);

      if (mappingsNode.has("mappings") && mappingsNode.get("mappings").isArray()) {
        for (JsonNode mapping : mappingsNode.get("mappings")) {
          String personalizedTopic = mapping.get("personalized_topic").asText("");
          String standardizedTopic = mapping.get("standardized_topic").asText("");
          if (!personalizedTopic.isEmpty() && !standardizedTopic.isEmpty()) {
            mappings.put(personalizedTopic, standardizedTopic);
          }
        }
      }
    } catch (Exception e) {
      log.error("Error getting standardized mappings from AI: {}", e.getMessage());
      // Return empty mappings on error
    }

    return mappings;
  }

  /**
   * Build prompt for standardizing existing topics
   */
  private String buildStandardizationPrompt(List<String> topicNames, JsonNode companyData) {
    StringBuilder prompt = new StringBuilder();

    prompt.append("TASK: Map personalized ESG topics to standardized topics\n\n");

    // Add company context
    prompt.append("COMPANY INFORMATION:\n");
    prompt.append("Name: ").append(companyData.path("company_name").asText("")).append("\n");
    prompt.append("Industry: ").append(companyData.path("industry_sectors").asText("")).append("\n");
    prompt.append("Primary SASB Industry: ").append(companyData.path("sasbPrimaryIndustry").asText("")).append("\n\n");

    // Add the personalized topics
    prompt.append("PERSONALIZED ESG TOPICS TO MAP:\n");
    for (int i = 0; i < topicNames.size(); i++) {
      prompt.append(i + 1).append(". ").append(topicNames.get(i)).append("\n");
    }
    prompt.append("\n");

    // Add standardized topics using constants
    prompt.append(EsgStandardizedTopics.getFormattedTopicsForPrompt());

    prompt.append("INSTRUCTIONS:\n");
    prompt.append("For each personalized topic, select the SINGLE most relevant standardized topic.\n");
    prompt.append("Consider the meaning and intent of the personalized topic when mapping.\n");
    prompt.append("Return ONLY valid JSON in this format:\n\n");

    prompt.append("{\n");
    prompt.append("  \"mappings\": [\n");
    prompt.append("    {\n");
    prompt.append("      \"personalized_topic\": \"[Exact topic name from list]\",\n");
    prompt.append("      \"standardized_topic\": \"[One standardized topic from the list above]\"\n");
    prompt.append("    }\n");
    prompt.append("    // ... for all topics\n");
    prompt.append("  ]\n");
    prompt.append("}\n");

    return prompt.toString();
  }
}
