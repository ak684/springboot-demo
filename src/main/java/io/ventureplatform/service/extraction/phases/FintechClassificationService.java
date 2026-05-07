package io.ventureplatform.service.extraction.phases;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import io.ventureplatform.service.extraction.pipeline.BaseExtractionPhase;
import io.ventureplatform.service.external.OpenAiClient;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Phase 13: FinTech Classification.
 * Analyzes whether a company could be classified as a FinTech company.
 * This is separate from the main technology cluster assignment.
 */
@Service
@Slf4j
public class FintechClassificationService extends BaseExtractionPhase {

  public FintechClassificationService(ObjectMapper objectMapper,
                                      OpenAiClient openAiClient) {
    super(objectMapper, openAiClient);
  }

  @Override
  public String getPhaseName() {
    return "Phase 13: FinTech Classification";
  }

  @Override
  public int getPhaseNumber() {
    return 13;
  }

  @Override
  protected JsonNode executePhase(JsonNode companyData, String companyUrl) {
    String fintechData = classifyFintech(companyData);
    return mergeFintechData(companyData, fintechData);
  }

  /**
   * Classify whether the company is a FinTech company.
   */
  private String classifyFintech(JsonNode companyData) {
    try {
      String companyDescription = companyData
          .path("company_description").asText("");

      if (companyDescription.isEmpty()) {
        log.warn("No company description available for FinTech classification");
        return "{\"is_fintech\": false, \"fintech_confidence_score\": 0, "
            + "\"fintech_explanation\": \"No company description available\"}";
      }

      StringBuilder contextBuilder = new StringBuilder();
      contextBuilder.append("Company Information:\n");
      contextBuilder.append("- Name: ").append(
          companyData.path("company_name").asText("")).append("\n");
      contextBuilder.append("- Description: ").append(
          companyDescription).append("\n");
      if (!companyData.path("industry_sectors").isMissingNode()) {
        contextBuilder.append("- Industry Sectors: ")
            .append(companyData.path("industry_sectors").toString())
            .append("\n");
      }
      if (!companyData.path("number_of_employees").asText("").isEmpty()) {
        contextBuilder.append("- Number of Employees: ")
            .append(companyData.path("number_of_employees").asText(""))
            .append("\n");
      }

      if (companyData.has("core_products_services")) {
        JsonNode coreProducts = companyData.get("core_products_services");
        if (coreProducts.has("items") && coreProducts.get("items").isArray()) {
          contextBuilder.append("Core Products/Services:\n");
          for (JsonNode item : coreProducts.get("items")) {
            contextBuilder.append("  - ")
                .append(item.path("title").asText(""))
                .append(": ")
                .append(item.path("description").asText(""))
                .append("\n");
          }
        }
      }

      if (companyData.has("technology_cluster")) {
        contextBuilder.append("- Current Technology Cluster: ")
            .append(companyData.path("technology_cluster").asText(""))
            .append("\n");
      }
      contextBuilder.append("\n");

      String prompt = contextBuilder.toString()
          + "You are an AI assistant tasked with determining whether a company "
          + "could be classified as a FinTech (Financial Technology) company.\n\n"
          + "FinTech Definition:\n"
          + "FinTech companies use technology to improve, automate, or disrupt "
          + "traditional financial services. This includes but is not limited to:\n"
          + "- Digital payments and money transfers\n"
          + "- Online banking and neobanks\n"
          + "- Cryptocurrency and blockchain for financial applications\n"
          + "- InsurTech (technology for insurance)\n"
          + "- RegTech (regulatory technology)\n"
          + "- WealthTech (investment and wealth management technology)\n"
          + "- Lending platforms and credit services\n"
          + "- Personal finance and budgeting apps\n"
          + "- B2B financial software and infrastructure\n"
          + "- Financial data analytics and AI for finance\n"
          + "- Trading platforms and robo-advisors\n\n"
          + "Instructions:\n"
          + "1. Analyze the company's products, services, and business focus\n"
          + "2. Determine if the company primarily operates in or significantly "
          + "serves the financial services sector with technology\n"
          + "3. Provide a confidence score (0-100) indicating how strongly the "
          + "company fits the FinTech classification\n"
          + "4. Provide a brief explanation (1-2 sentences) for your decision\n\n"
          + "A company should be classified as FinTech if:\n"
          + "- Its PRIMARY business involves financial technology services, OR\n"
          + "- A SIGNIFICANT portion of its technology products serve the "
          + "financial services industry\n\n"
          + "A company should NOT be classified as FinTech if:\n"
          + "- It merely uses financial software internally\n"
          + "- It has minor financial features but is primarily in another sector\n"
          + "- It provides general IT services that happen to have some "
          + "financial clients\n\n"
          + "Return JSON format: {\"is_fintech\": BOOLEAN, "
          + "\"fintech_confidence_score\": INTEGER, \"fintech_explanation\": \"TEXT\"}\n\n"
          + "IMPORTANT: RETURN ONLY THE JSON OBJECT WITHOUT ANY MARKDOWN "
          + "FORMATTING, CODE BLOCKS, OR ADDITIONAL TEXT.";

      return makeOpenAiCallWithO3WebSearch(prompt);
    } catch (Exception e) {
      log.error("Error classifying FinTech", e);
      return "{\"is_fintech\": false, \"fintech_confidence_score\": 0, "
          + "\"fintech_explanation\": \"Error during analysis\"}";
    }
  }

  /**
   * Merge FinTech classification data into the main JSON response.
   */
  private JsonNode mergeFintechData(JsonNode mainData, String fintechJsonString) {
    try {
      JsonNode fintechData = objectMapper.readTree(fintechJsonString);
      ObjectNode mainNode = (ObjectNode) mainData;

      if (fintechData.has("is_fintech")) {
        mainNode.put("is_fintech",
            fintechData.get("is_fintech").asBoolean(false));
      }
      if (fintechData.has("fintech_confidence_score")) {
        mainNode.put("fintech_confidence_score",
            fintechData.get("fintech_confidence_score").asInt(0));
      }
      if (fintechData.has("fintech_explanation")) {
        mainNode.put("fintech_explanation",
            fintechData.get("fintech_explanation").asText(""));
      }

      return mainNode;
    } catch (Exception e) {
      log.error("Error merging FinTech data: {}", e.getMessage());
      ObjectNode mainNode = (ObjectNode) mainData;
      mainNode.put("is_fintech", false);
      mainNode.put("fintech_confidence_score", 0);
      mainNode.put("fintech_explanation", "");
      return mainNode;
    }
  }
}
