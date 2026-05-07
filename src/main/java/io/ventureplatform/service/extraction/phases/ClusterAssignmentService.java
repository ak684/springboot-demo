package io.ventureplatform.service.extraction.phases;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import io.ventureplatform.service.extraction.pipeline.BaseExtractionPhase;
import io.ventureplatform.service.external.OpenAiClient;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Phase 5: Extract Technology Cluster Assignment.
 */
@Service
@Slf4j
public class ClusterAssignmentService extends BaseExtractionPhase {

  public ClusterAssignmentService(ObjectMapper objectMapper, OpenAiClient openAiClient) {
    super(objectMapper, openAiClient);
  }

  @Override
  public String getPhaseName() {
    return "Phase 5: Cluster Assignment";
  }

  @Override
  public int getPhaseNumber() {
    return 5;
  }

  @Override
  protected JsonNode executePhase(JsonNode companyData, String companyUrl) {
    String clusterData = extractClusterAssignment(companyData);
    return mergeClusterData(companyData, clusterData);
  }

  /**
   * Extract Technology Cluster Assignment.
   */
  private String extractClusterAssignment(JsonNode companyData) {
    try {
      String companyDescription = companyData.path("company_description").asText("");

      if (companyDescription.isEmpty()) {
        log.warn("No company description available for cluster assignment");
        return "{\"assigned_category\": \"General – Non-Cluster\", \"confidence_score\": 0, "
            + "\"reasoning\": \"No company description available\"}";
      }

      // Build context from available company data including Phase 1 results
      StringBuilder contextBuilder = new StringBuilder();
      contextBuilder.append("Company Information:\n");
      contextBuilder.append("- Name: ").append(companyData.path("company_name").asText("")).append("\n");
      contextBuilder.append("- Description: ").append(companyDescription).append("\n");
      if (!companyData.path("industry_sectors").isMissingNode()) {
        contextBuilder.append("- Industry Sectors: ")
            .append(companyData.path("industry_sectors").toString()).append("\n");
      }
      if (!companyData.path("number_of_employees").asText("").isEmpty()) {
        contextBuilder.append("- Number of Employees: ")
            .append(companyData.path("number_of_employees").asText("")).append("\n");
      }

      // Add core products/services from Phase 2
      if (companyData.has("core_products_services")) {
        JsonNode coreProducts = companyData.get("core_products_services");
        if (coreProducts.has("items") && coreProducts.get("items").isArray()) {
          contextBuilder.append("Core Products/Services:\n");
          for (JsonNode item : coreProducts.get("items")) {
            contextBuilder.append("  - ").append(item.path("title").asText(""))
                          .append(": ").append(item.path("description").asText("")).append("\n");
          }
        }
      }
      
      if (companyData.has("technology_cluster")) {
        contextBuilder.append("- Previous Cluster Assignment: ")
            .append(companyData.path("technology_cluster").asText("")).append("\n");
      }
      contextBuilder.append("\n");

      String prompt = contextBuilder.toString()
          + "You are an AI assistant tasked with categorizing ventures into one of six categories "
          + "based on it's current or potential technological innovation domain. Each venture should be assigned "
          + "to the most relevant technological category if it has technological innovation or innovation potential"
          + "that fits cleanly within the technological category. If it does not, it should be assigned to the "
          + "\"General – Non-Cluster\" category. Your assignment choice should be based on all the data you have"
          + "and have researched about the venture, including its industry, focus, and technological domain. "
          + "Additionally, provide a confidence score (0-100%) indicating how well the venture fits "
          + "within the assigned category.\n\n"
          + "Categories:\n"
          + "1. Photonics/Optics\n"
          + "2. Microsystems/Materials\n"
          + "3. IT/Media\n"
          + "4. Biotechnology/Environment\n"
          + "5. Renewable Energy/Photovoltaics\n"
          + "6. General – Non-Cluster (For ventures that do not fit any of the above clusters)\n\n"
          + "Instructions:\n"
          + "- Analyze the venture's industry, products, and research focus.\n"
          + "- Assign the venture to the most appropriate category.\n"
          + "- If the venture does not clearly fit a cluster, place it in \"General – Non-Cluster.\"\n"
          + "- Provide a confidence score based on how well the venture aligns with the assigned "
          + "category.\n\n"
          + "Return JSON format: {\"assigned_category\": \"CATEGORY_NAME\", \"confidence_score\": "
          + "INTEGER, \"reasoning\": \"TEXT\"}\n\n"
          + "IMPORTANT: RETURN ONLY THE JSON OBJECT WITHOUT ANY MARKDOWN FORMATTING, "
          + "CODE BLOCKS, OR ADDITIONAL TEXT.";

      return makeOpenAiCallWithO3WebSearch(prompt);
    } catch (Exception e) {
      log.error("Error extracting cluster assignment", e);
      return "{\"assigned_category\": \"General – Non-Cluster\", \"confidence_score\": 0, "
          + "\"reasoning\": \"Error during analysis\"}";
    }
  }

  /**
   * Merge Cluster Assignment data into the main JSON response.
   */
  private JsonNode mergeClusterData(JsonNode mainData, String clusterJsonString) {
    try {
      JsonNode clusterData = objectMapper.readTree(clusterJsonString);
      ObjectNode mainNode = (ObjectNode) mainData;

      // Map fields from OpenAI response to target field names
      if (clusterData.has("assigned_category")) {
        mainNode.put("technology_cluster",
            clusterData.get("assigned_category").asText("General – Non-Cluster"));
      }
      if (clusterData.has("confidence_score")) {
        mainNode.put("cluster_confidence_score", clusterData.get("confidence_score").asInt(0));
      }
      if (clusterData.has("reasoning")) {
        mainNode.put("cluster_reasoning", clusterData.get("reasoning").asText(""));
      }

      return mainNode;
    } catch (Exception e) {
      log.error("Error merging cluster data: {}", e.getMessage());
      // Set default values on error
      ObjectNode mainNode = (ObjectNode) mainData;
      mainNode.put("technology_cluster", "General – Non-Cluster");
      mainNode.put("cluster_confidence_score", 0);
      mainNode.put("cluster_reasoning", "");
      return mainNode;
    }
  }
}
