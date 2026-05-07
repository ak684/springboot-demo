package io.ventureplatform.service.extraction.phases;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import io.ventureplatform.service.extraction.pipeline.BaseExtractionPhase;
import io.ventureplatform.service.external.OpenAiClient;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Phase 3: Extract Sustainability Evidence Collection.
 */
@Service
@Slf4j
public class EvidenceCollectionService extends BaseExtractionPhase {

  public EvidenceCollectionService(ObjectMapper objectMapper, OpenAiClient openAiClient) {
    super(objectMapper, openAiClient);
  }

  @Override
  public String getPhaseName() {
    return "Phase 4: Evidence Collection";
  }

  @Override
  public int getPhaseNumber() {
    return 4;
  }

  @Override
  protected JsonNode executePhase(JsonNode companyData, String companyUrl) {
    String evidenceData = extractSustainabilityEvidence(companyUrl, companyData);
    return mergeEvidenceData(companyData, evidenceData);
  }

  /**
   * Extract Sustainability Evidence Collection.
   */
  private String extractSustainabilityEvidence(String companyUrl, JsonNode companyData) {
    try {
      // Build context from available company data including Phase 1 and 2 results
      StringBuilder contextBuilder = new StringBuilder();
      contextBuilder.append("Company Information:\n");
      contextBuilder.append("- Name: ").append(companyData.path("company_name").asText("")).append("\n");
      contextBuilder.append("- URL: ").append(companyUrl).append("\n");
      contextBuilder.append("- Description: ").append(companyData.path("company_description").asText("")).append("\n");
      if (!companyData.path("industry_sectors").isMissingNode()) {
        contextBuilder.append("- Industry Sectors: ").append(companyData.path("industry_sectors").toString()).append("\n");
      }

      // Include Phase 2 cluster results if available
      if (companyData.has("technology_cluster")) {
        contextBuilder.append("- Technology Cluster: ")
            .append(companyData.path("technology_cluster").asText("")).append("\n");
      }
      contextBuilder.append("\n");

      String prompt = contextBuilder.toString()
          + "You are to act as an AI assistant helping to identify sustainability-related information "
          + "for companies. For this company, please scan their online presence (website, press "
          + "releases, social media, etc.) for evidence of the following:\n\n"
          + "Certifications: Look for mentions or logos of sustainability certifications. If found, "
          + "provide the 'Certification Name' and the 'Certification Link' (if available). "
          + "Specifically look for: B Corp, EU Ecolabel, EMAS. Note any other sustainability-related "
          + "certifications found.\n\n"
          + "ESG/Impact Reports: Search for documents or website sections that appear to be "
          + "sustainability, ESG, or impact reports (e.g., titled \"Sustainability Report,\" "
          + "\"ESG Report,\" \"Impact Report,\" \"CSR Report\"). If found, indicate 'Yes' for "
          + "'ESG/Impact Report', try to identify the 'Report Year', and provide the 'Report Link'. "
          + "Use web search with queries like '[company name] ESG report PDF', '[company name] "
          + "sustainability report [year]', or '[company name] impact report'. Ideally, you find a direct "
          + "link to the actual report document (PDF or web version). If you cannot find a direct link to "
          + "the actual report document (PDF or web version), at least return a webpage mentioning it.\n\n"
          + "Prices/Awards: Identify any mentions of the company winning or being recognized with "
          + "prizes or awards, particularly those related to sustainability, social impact, innovation, "
          + "or industry recognition. For each 'Prize/Award' found, provide the 'Prize/Award Name' and "
          + "search for the specific 'Prize/Award Link' - this should be the actual URL of the award "
          + "announcement, press release, or official award page. Use web search to find the source "
          + "links for each award mentioned. Aim to capture at least two distinct prizes/awards "
          + "if found. Look for awards like: Innovation prizes, Industry recognition, Technology awards, "
          + "Sustainability awards, Excellence awards, and any other significant recognitions.\n\n"
          + "Return JSON format: {\"certification_name\": \"\", \"certification_link\": \"\", "
          + "\"esg_impact_report\": false, \"esg_report_year\": \"\", \"esg_report_link\": \"\", "
          + "\"prize_award_name_1\": \"\", \"prize_award_link_1\": \"\", \"prize_award_name_2\": \"\", "
          + "\"prize_award_link_2\": \"\"}\n\n"
          + "IMPORTANT: For each award/prize found, use web search to locate the specific source URL "
          + "where the award was announced or documented. The links should be actual web addresses, "
          + "not just the company website. RETURN ONLY THE JSON OBJECT WITHOUT ANY MARKDOWN FORMATTING, "
          + "CODE BLOCKS, OR ADDITIONAL TEXT.";

      return makeOpenAiCallWithO3WebSearch(prompt);
    } catch (Exception e) {
      log.error("Error extracting sustainability evidence", e);
      return "{\"certification_name\": \"\", \"certification_link\": \"\", \"esg_impact_report\": "
          + "false, \"esg_report_year\": \"\", \"esg_report_link\": \"\", \"prize_award_name_1\": \"\", "
          + "\"prize_award_link_1\": \"\", \"prize_award_name_2\": \"\", \"prize_award_link_2\": \"\"}";
    }
  }

  /**
   * Merge Evidence Collection data into the main JSON response.
   */
  private JsonNode mergeEvidenceData(JsonNode mainData, String evidenceJsonString) {
    try {
      JsonNode evidenceData = objectMapper.readTree(evidenceJsonString);
      ObjectNode mainNode = (ObjectNode) mainData;

      // Direct field mapping since field names match exactly
      if (evidenceData.has("certification_name")) {
        mainNode.put("certification_name", evidenceData.get("certification_name").asText(""));
      }
      if (evidenceData.has("certification_link")) {
        mainNode.put("certification_link", evidenceData.get("certification_link").asText(""));
      }
      if (evidenceData.has("esg_impact_report")) {
        mainNode.put("esg_impact_report", evidenceData.get("esg_impact_report").asBoolean(false));
      }
      if (evidenceData.has("esg_report_year")) {
        mainNode.put("esg_report_year", evidenceData.get("esg_report_year").asText(""));
      }
      if (evidenceData.has("esg_report_link")) {
        mainNode.put("esg_report_link", evidenceData.get("esg_report_link").asText(""));
      }
      if (evidenceData.has("prize_award_name_1")) {
        mainNode.put("prize_award_name_1", evidenceData.get("prize_award_name_1").asText(""));
      }
      if (evidenceData.has("prize_award_link_1")) {
        mainNode.put("prize_award_link_1", evidenceData.get("prize_award_link_1").asText(""));
      }
      if (evidenceData.has("prize_award_name_2")) {
        mainNode.put("prize_award_name_2", evidenceData.get("prize_award_name_2").asText(""));
      }
      if (evidenceData.has("prize_award_link_2")) {
        mainNode.put("prize_award_link_2", evidenceData.get("prize_award_link_2").asText(""));
      }

      return mainNode;
    } catch (Exception e) {
      log.error("Error merging evidence data: {}", e.getMessage());
      // Set default values on error
      ObjectNode mainNode = (ObjectNode) mainData;
      mainNode.put("certification_name", "");
      mainNode.put("certification_link", "");
      mainNode.put("esg_impact_report", false);
      mainNode.put("esg_report_year", "");
      mainNode.put("esg_report_link", "");
      mainNode.put("prize_award_name_1", "");
      mainNode.put("prize_award_link_1", "");
      mainNode.put("prize_award_name_2", "");
      mainNode.put("prize_award_link_2", "");
      return mainNode;
    }
  }
}
