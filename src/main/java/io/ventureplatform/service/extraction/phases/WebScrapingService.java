package io.ventureplatform.service.extraction.phases;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import io.ventureplatform.service.CompanyExtractorScrapeService;
import io.ventureplatform.service.extraction.pipeline.BaseExtractionPhase;
import io.ventureplatform.service.external.OpenAiClient;
import io.ventureplatform.util.CompanyExtractorUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Map;

/**
 * Phase 0: Raw Data Extraction - Extract structured data from website.
 * This phase performs web scraping to gather raw structured data only.
 * No AI processing - just reliable DOM-based extraction for Phase 1 to analyze.
 */
@Service
@Slf4j
public class WebScrapingService extends BaseExtractionPhase {

  private final CompanyExtractorScrapeService companyExtractorScrapeService;

  public WebScrapingService(ObjectMapper objectMapper, OpenAiClient openAiClient,
                                  CompanyExtractorScrapeService companyExtractorScrapeService) {
    super(objectMapper, openAiClient);
    this.companyExtractorScrapeService = companyExtractorScrapeService;
  }

  @Override
  public String getPhaseName() {
    return "Phase 0: Raw Data Extraction";
  }

  @Override
  public int getPhaseNumber() {
    return 0;
  }

  @Override
  protected JsonNode executePhase(JsonNode companyData, String companyUrl) {
    try {
      log.debug("Web scraping started for: {}", companyUrl);

      // Format the URL properly for scraping
      String formattedUrl = CompanyExtractorUtils.formatUrl(companyUrl);
      log.debug("Processing formatted URL: {}", formattedUrl);

      // Get raw structured data only - no AI processing
      Map<String, Object> scrapedData = companyExtractorScrapeService.getComprehensiveCompanyData(formattedUrl);

      log.debug("Raw data extraction completed with {} data fields", scrapedData.size());

      // Convert Map<String, Object> to JsonNode and merge with existing data
      JsonNode scrapedDataNode = objectMapper.valueToTree(scrapedData);

      // If companyData is empty (first phase), return scraped data
      if (companyData == null || companyData.isEmpty()) {
        return scrapedDataNode;
      }

      // Otherwise, merge scraped data with existing data
      return mergeScrapedData(companyData, scrapedDataNode);

    } catch (Exception e) {
      log.error("Error during web scraping for {}: {}", companyUrl, e.getMessage());

      // Return original data on error, or empty object if no original data
      if (companyData != null && !companyData.isEmpty()) {
        return companyData;
      } else {
        return objectMapper.createObjectNode();
      }
    }
  }

  /**
   * Merge scraped data with existing company data.
   * Scraped data takes precedence for most fields.
   */
  private JsonNode mergeScrapedData(JsonNode existingData, JsonNode scrapedData) {
    try {
      ObjectNode result = (ObjectNode) existingData.deepCopy();

      // Merge all scraped data fields
      scrapedData.fields().forEachRemaining(entry -> {
        String key = entry.getKey();
        JsonNode value = entry.getValue();

        // Add scraped data to result
        result.set(key, value);
      });

      return result;

    } catch (Exception e) {
      log.error("Error merging scraped data: {}", e.getMessage());
      return existingData;
    }
  }
}
