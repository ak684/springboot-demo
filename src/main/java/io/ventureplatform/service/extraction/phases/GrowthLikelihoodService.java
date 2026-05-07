package io.ventureplatform.service.extraction.phases;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import io.ventureplatform.service.extraction.pipeline.BaseExtractionPhase;
import io.ventureplatform.service.extraction.prompt.PromptLoader;
import io.ventureplatform.service.external.OpenAiClient;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Phase 12: Calculate 5-year growth likelihood scores using AI.
 */
@Service
@Slf4j
public class GrowthLikelihoodService extends BaseExtractionPhase {

  private static final String GROWTH_PROMPT_PATH = "prompts/growth_likelihood.md";

  private final PromptLoader promptLoader;

  public GrowthLikelihoodService(final ObjectMapper objectMapper,
                                 final OpenAiClient openAiClient,
                                 final PromptLoader promptLoader) {
    super(objectMapper, openAiClient);
    this.promptLoader = promptLoader;
  }

  @Override
  public String getPhaseName() {
    return "Phase 12: Growth Likelihood";
  }

  @Override
  public int getPhaseNumber() {
    return 12;
  }

  @Override
  protected JsonNode executePhase(JsonNode companyData, String companyUrl) {
    String prompt = buildPrompt(companyData, companyUrl);
    String response = makeOpenAiCallWithO3WebSearch(prompt);
    String cleanedResponse = cleanJsonResponse(response);
    return mergeGrowthData(companyData, cleanedResponse);
  }

  private String buildPrompt(JsonNode companyData, String companyUrl) {
    String companyContext = buildCompanyContext(companyData, companyUrl);
    String template = promptLoader.loadPrompt(GROWTH_PROMPT_PATH);
    return template.replace("{COMPANY_CONTEXT}", companyContext);
  }

  private String buildCompanyContext(JsonNode companyData, String companyUrl) {
    StringBuilder contextBuilder = new StringBuilder();
    contextBuilder.append("Company context for growth likelihood scoring:\n");
    contextBuilder.append("- Organization Name: ")
        .append(companyData.path("company_name").asText("")).append("\n");
    contextBuilder.append("- URL: ").append(companyUrl).append("\n");
    contextBuilder.append("- Description: ")
        .append(companyData.path("company_description").asText("N/A")).append("\n");
    if (!companyData.path("industry_sectors").isMissingNode()) {
      contextBuilder.append("- Industry Sectors: ")
          .append(companyData.path("industry_sectors").asText("")).append("\n");
    }
    if (!companyData.path("number_of_employees").asText("").isEmpty()) {
      contextBuilder.append("- Number of Employees: ")
          .append(companyData.path("number_of_employees").asText("")).append("\n");
    }
    if (!companyData.path("headquarter_address").asText("").isEmpty()) {
      contextBuilder.append("- Headquarters: ")
          .append(companyData.path("headquarter_address").asText("")).append("\n");
    }
    if (!isMissingOrZero(companyData, "geography")) {
      contextBuilder.append("- Geography of impact: ")
          .append(companyData.path("geography").asText("")).append("\n");
    }
    if (!companyData.path("legal_entity_formation_date").asText("").isEmpty()) {
      contextBuilder.append("- Legal entity formation date: ")
          .append(companyData.path("legal_entity_formation_date").asText("")).append("\n");
    }
    if (!companyData.path("technology_cluster").asText("").isEmpty()) {
      contextBuilder.append("- Technology cluster: ")
          .append(companyData.path("technology_cluster").asText("")).append("\n");
    }
    String coreProductsSummary = summarizeCoreProducts(companyData);
    if (!coreProductsSummary.isEmpty()) {
      contextBuilder.append("- Core products/services: ")
          .append(coreProductsSummary).append("\n");
    }
    String fundingAmount = companyData.path("total_funding_amount").asText("");
    String fundingCurrency = companyData.path("funding_currency").asText("");
    if (!isZeroText(fundingAmount) || !fundingCurrency.isEmpty()) {
      contextBuilder.append("- Total funding: ")
          .append(fundingAmount)
          .append(" ")
          .append(fundingCurrency)
          .append("\n");
    }
    String latestTraffic = getLatestTraffic(companyData);
    if (!latestTraffic.isEmpty()) {
      contextBuilder.append("- Latest monthly web traffic: ")
          .append(latestTraffic).append("\n");
    }
    if (hasFollowers(companyData)) {
      contextBuilder.append("- Social followers: ")
          .append(companyData.get("social_media_follower_counts").toString())
          .append("\n");
    }
    if (!companyData.path("monthly_growth_trend").asText("").isEmpty()) {
      contextBuilder.append("- Monthly web traffic growth: ")
          .append(companyData.path("monthly_growth_trend").asText("")).append("\n");
    }
    if (!companyData.path("three_month_growth_trend").asText("").isEmpty()) {
      contextBuilder.append("- 3-month web traffic growth: ")
          .append(companyData.path("three_month_growth_trend").asText("")).append("\n");
    }
    if (!companyData.path("six_month_growth_trend").asText("").isEmpty()) {
      contextBuilder.append("- 6-month web traffic growth: ")
          .append(companyData.path("six_month_growth_trend").asText("")).append("\n");
    }
    if (!companyData.path("one_year_growth").asText("").isEmpty()) {
      contextBuilder.append("- 1-year web traffic growth: ")
          .append(companyData.path("one_year_growth").asText("")).append("\n");
    }
    if (!companyData.path("two_year_growth").asText("").isEmpty()) {
      contextBuilder.append("- 2-year web traffic growth: ")
          .append(companyData.path("two_year_growth").asText("")).append("\n");
    }
    if (!isZeroText(companyData.path("sbmo_total_score").asText(""))) {
      contextBuilder.append("- Sustainability business model orientation score: ")
          .append(companyData.path("sbmo_total_score").asText("")).append("\n");
    }
    contextBuilder.append("\n");
    return contextBuilder.toString();
  }

  private JsonNode mergeGrowthData(JsonNode companyData, String growthJsonString) {
    try {
      JsonNode growthData = objectMapper.readTree(growthJsonString);
      ObjectNode result = (ObjectNode) companyData;

      setDecimalField(result, growthData, "growth_media_reach_score");
      setDecimalField(result, growthData, "growth_sentiment_score");
      setDecimalField(result, growthData, "growth_innovation_visibility_score");
      setDecimalField(result, growthData, "growth_team_strength_score");
      setDecimalField(result, growthData, "growth_funding_velocity_score");
      setDecimalField(result, growthData, "growth_company_age_score");
      setDecimalField(result, growthData, "growth_composite_score");

      copyTextField(result, growthData, "growth_media_reach_reason");
      copyTextField(result, growthData, "growth_sentiment_reason");
      copyTextField(result, growthData, "growth_innovation_visibility_reason");
      copyTextField(result, growthData, "growth_team_strength_reason");
      copyTextField(result, growthData, "growth_funding_velocity_reason");
      copyTextField(result, growthData, "growth_company_age_reason");
      copyTextField(result, growthData, "growth_summary");

      if (growthData.has("growth_likelihood_details") && growthData.get("growth_likelihood_details").isObject()) {
        result.set("growth_likelihood_details", growthData.get("growth_likelihood_details"));
      }

      return result;
    } catch (Exception e) {
      log.warn("Could not merge growth likelihood data: {}", e.getMessage());
      return companyData;
    }
  }

  private void setDecimalField(ObjectNode target, JsonNode source, String fieldName) {
    if (source.has(fieldName) && !source.get(fieldName).isNull()) {
      try {
        target.put(fieldName, source.get(fieldName).asDouble());
      } catch (Exception e) {
        log.debug("Failed to parse numeric field {}: {}", fieldName, e.getMessage());
      }
    }
  }

  private void copyTextField(ObjectNode target, JsonNode source, String fieldName) {
    if (source.has(fieldName) && !source.get(fieldName).isNull()) {
      target.put(fieldName, source.get(fieldName).asText());
    }
  }

  private String summarizeCoreProducts(JsonNode companyData) {
    if (!companyData.has("core_products_services")
        || companyData.get("core_products_services").isNull()) {
      return "";
    }
    try {
      JsonNode cps = companyData.get("core_products_services");
      if (cps.isArray()) {
        StringBuilder sb = new StringBuilder();
        int count = 0;
        for (JsonNode item : cps) {
          if (item.isTextual()) {
            if (count > 0) {
              sb.append("; ");
            }
            sb.append(item.asText());
            count++;
            if (count >= 3) {
              break;
            }
          }
        }
        return sb.toString();
      }
      if (cps.isObject()) {
        // Convert keys or values to a short string
        StringBuilder sb = new StringBuilder();
        cps.fields().forEachRemaining(entry -> {
          if (sb.length() > 0) {
            sb.append("; ");
          }
          sb.append(entry.getKey());
        });
        return sb.toString();
      }
    } catch (Exception e) {
      log.debug("Could not summarize core products/services: {}", e.getMessage());
    }
    return "";
  }

  private String getLatestTraffic(JsonNode companyData) {
    String[] trafficFields = new String[] {
      "traffic_dec_2025", "traffic_nov_2025", "traffic_oct_2025", "traffic_sep_2025",
      "traffic_aug_2025", "traffic_jul_2025", "traffic_jun_2025", "traffic_may_2025",
      "traffic_apr_2025", "traffic_mar_2025", "traffic_feb_2025", "traffic_jan_2025",
      "traffic_dec_2024", "traffic_nov_2024", "traffic_oct_2024", "traffic_sep_2024",
      "traffic_aug_2024", "traffic_jul_2024", "traffic_jun_2024", "traffic_may_2024",
      "traffic_apr_2024", "traffic_mar_2024", "traffic_feb_2024", "traffic_jan_2024"
    };
    for (String field : trafficFields) {
      if (companyData.has(field)
          && !companyData.get(field).isNull()
          && !isZeroText(companyData.get(field).asText())) {
        return field + "=" + companyData.get(field).asText();
      }
    }
    return "";
  }

  private boolean isMissingOrZero(JsonNode node, String fieldName) {
    if (!node.has(fieldName) || node.get(fieldName).isNull()) {
      return true;
    }
    return isZeroText(node.get(fieldName).asText());
  }

  private boolean isZeroText(String text) {
    if (text == null) {
      return true;
    }
    String trimmed = text.trim();
    return trimmed.isEmpty() || "0".equals(trimmed) || "0.0".equals(trimmed) || "0.00".equals(trimmed);
  }

  private boolean hasFollowers(JsonNode companyData) {
    if (!companyData.has("social_media_follower_counts")
        || companyData.get("social_media_follower_counts").isNull()
        || !companyData.get("social_media_follower_counts").isObject()) {
      return false;
    }
    for (JsonNode value : companyData.get("social_media_follower_counts")) {
      if (!isZeroText(value.asText())) {
        return true;
      }
    }
    return false;
  }
}
