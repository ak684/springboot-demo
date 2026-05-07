package io.ventureplatform.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import io.ventureplatform.dto.response.PatentCountModel;
import io.ventureplatform.entity.CompanyExtractionData;
import io.ventureplatform.entity.Portfolio;
import io.ventureplatform.entity.PortfolioCompanyExtractionAccess;
import io.ventureplatform.repository.PortfolioCompanyExtractionAccessRepository;
import io.ventureplatform.repository.PortfolioRepository;
import io.ventureplatform.service.external.ImpactAiService;
import io.ventureplatform.service.extraction.pipeline.CompanyExtractionPipeline;
import io.ventureplatform.util.DomainExtractionUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class CompanyDataExtractionService {
  @Value("${openai.key}")
  private String apiKey;

  private final ObjectMapper objectMapper;
  private final RestTemplate restTemplate;
  private final ScrapeService scrapeService;
  private final PatentCounterService patentCounterService;
  private final ImpactAiService impactAiService;
  private final CompanyExtractorScrapeService companyExtractorScrapeService;
  private final SocialMediaExtractionService socialMediaExtractionService;
  private final CompanyExtractionPipeline extractionPipeline;
  private final CompanyExtractionDataService companyExtractionDataService;
  private final PortfolioCompanyExtractionAccessRepository portfolioAccessRepository;
  private final PortfolioRepository portfolioRepository;
  private final CompanyPolarChartService companyPolarChartService;

  private static final String SYSTEM_PROMPT = "You are a helpful assistant that extracts company information from URLs. "
    + "You will be given a company URL, and your task is to extract as much information as possible about the company. "
    + "Use web search to find additional information. Research thoroughly and provide the most accurate"
    + " information possible. Make sure your company description is comprehensive. Make sure number of employees is either"
    + "IMPORTANT: Always respond in English, regardless of the language of the source website or content. "
    + " a number or a number range (ie. 1-20, 20-50, 100-200, etc.). Return the information in this exact JSON format:\n\n"
    + "{\n"
    + "  \"company_name\": \"\",\n"
    + "  \"company_description\": \"\",\n"
    + "  \"industry_sectors\": \"\",\n"
    + "  \"number_of_employees\": \"\",\n"
    + "  \"headquarters_location\": \"\",\n"
    + "  \"website\": \"\",\n"
    + "  \"social_media_links\": {\n"
    + "    \"twitter\": \"\",\n"
    + "    \"linkedin\": \"\",\n"
    + "    \"facebook\": \"\",\n"
    + "    \"instagram\": \"\",\n"
    + "    \"youtube\": \"\"\n"
    + "  },\n"
    + "  \"confidence_scores\": {\n"
    + "    \"company_name\": 0,\n"
    + "    \"company_description\": 0,\n"
    + "    \"industry_sectors\": 0,\n"
    + "    \"number_of_employees\": 0,\n"
    + "    \"headquarters_location\": 0,\n"
    + "    \"website\": 0,\n"
    + "    \"social_media_links\": 0\n"
    + "  }\n"
    + "}\n\n"
    + "IMPORTANT: RETURN ONLY THE JSON OBJECT WITHOUT ANY MARKDOWN FORMATTING, "
    + "CODE BLOCKS, OR ADDITIONAL TEXT.";

  /**
   * Main entry point for company data extraction.
   * Orchestrates the complete extraction pipeline including web scraping, AI analysis, and parallel processing.
   * Implements domain-based caching to avoid re-extracting data for the same company.
   */
  public String extractCompanyData(String companyUrl) {
    return extractCompanyData(companyUrl, null);
  }
  
  /**
   * Main entry point for company data extraction with portfolio assignment.
   * Orchestrates the complete extraction pipeline including web scraping, AI analysis, and parallel processing.
   * Implements domain-based caching to avoid re-extracting data for the same company.
   *
   * @param companyUrl The URL of the company to extract data from
   * @param portfolioId The portfolio ID to assign the company to (optional)
   * @return JSON string containing the extraction results
   */
  public String extractCompanyData(String companyUrl, Long portfolioId) {
    try {
      log.info("Starting company data extraction for: {}", companyUrl);

      // Extract domain for caching check
      String domain = DomainExtractionUtil.extractRootDomain(companyUrl);
      if (domain != null) {
        log.debug("Extracted domain '{}' from URL '{}'", domain, companyUrl);

        // Check if we already have data for this domain
        CompanyExtractionData existingData = companyExtractionDataService.findByDomain(domain);
        if (existingData != null) {
          log.info("Found existing extraction data for domain '{}', checking portfolio access", domain);

          // Create portfolio access record if needed
          if (portfolioId != null) {
            boolean hasAccess = portfolioAccessRepository
                .existsByCompanyExtractionDataIdAndPortfolioId(existingData.getId(), portfolioId);

            if (!hasAccess) {
              log.info("Creating portfolio access for cached company '{}' (ID: {}) for portfolio {}",
                       domain, existingData.getId(), portfolioId);

              Portfolio portfolio = portfolioRepository.findById(portfolioId).orElse(null);
              if (portfolio != null) {
                PortfolioCompanyExtractionAccess access = new PortfolioCompanyExtractionAccess();
                access.setCompanyExtractionData(existingData);
                access.setPortfolio(portfolio);
                portfolioAccessRepository.save(access);

                log.info("✅ VALIDATION: Portfolio {} now has access to company {} (domain: {})",
                         portfolioId, existingData.getId(), domain);
              } else {
                log.warn("Portfolio with ID {} not found, cannot create access record", portfolioId);
              }
            } else {
              log.info("Portfolio {} already has access to company ID: {}", portfolioId, existingData.getId());
            }

          }

          // Convert existing data to JSON format and add from_cache flag
          String cachedResult = convertExistingDataToJson(existingData, true);
          log.info("Returning cached extraction data for domain '{}'. Result size: {} characters",
                   domain, cachedResult.length());
          return cachedResult;
        } else {
          log.debug("No existing data found for domain '{}', proceeding with fresh extraction", domain);
        }
      } else {
        log.warn("Could not extract domain from URL '{}', proceeding with fresh extraction", companyUrl);
      }

      // Execute the complete pipeline with optimized parallel processing
      JsonNode result = executeCompleteExtractionPipeline(companyUrl);

      String jsonResult = objectMapper.writeValueAsString(result);
      log.info("Company data extraction completed successfully. Result size: {} characters", jsonResult.length());

      // Add from_cache flag to indicate this is fresh data
      try {
        ObjectNode resultWithFlag = (ObjectNode) objectMapper.readTree(jsonResult);
        resultWithFlag.put("from_cache", false);
        jsonResult = objectMapper.writeValueAsString(resultWithFlag);
      } catch (Exception flagError) {
        log.warn("Could not add from_cache flag to result", flagError);
      }

      // Save extraction data to database and add the database ID to the result
      try {
        CompanyExtractionData savedData = companyExtractionDataService.saveExtractionData(companyUrl, jsonResult, portfolioId);
        log.info("Extraction data saved to database with ID: {} for URL: {}, portfolio: {}",
                 savedData.getId(), companyUrl, portfolioId);

        // Create portfolio access record for new company
        if (portfolioId != null) {
          Portfolio portfolio = portfolioRepository.findById(portfolioId).orElse(null);
          if (portfolio != null) {
            PortfolioCompanyExtractionAccess access = new PortfolioCompanyExtractionAccess();
            access.setCompanyExtractionData(savedData);
            access.setPortfolio(portfolio);
            portfolioAccessRepository.save(access);

            log.info("✅ VALIDATION: Portfolio {} now has access to new company {} (domain: {})",
                     portfolioId, savedData.getId(), savedData.getDomain());
          } else {
            log.warn("Portfolio with ID {} not found, cannot create access record", portfolioId);
          }
        }

        // Now save the patents if we have them (company exists now!)
        try {
          JsonNode patentDataNode = result.get("_patentDataForSaving");
          if (patentDataNode != null) {
            PatentCountModel patentData = objectMapper.treeToValue(patentDataNode, PatentCountModel.class);
            if (patentData != null && patentData.getPatentDetails() != null && !patentData.getPatentDetails().isEmpty()) {
              log.info("Saving {} patents for company ID: {}", patentData.getPatentDetails().size(), savedData.getId());
              patentCounterService.savePatentsToDatabase(savedData.getCompanyName(), patentData);
              log.info("Successfully saved patents for company: {}", savedData.getCompanyName());
            }
          }
        } catch (Exception patentSaveError) {
          log.error("Failed to save patents after company creation, but continuing", patentSaveError);
          // Don't fail the whole extraction if patent saving fails
        }

        // Refresh the portfolio ranking cache to include the newly extracted company
        try {
          log.info("Refreshing portfolio ranking cache after new company extraction for ID: {}", savedData.getId());
          companyPolarChartService.refreshCache();
          log.info("Successfully refreshed portfolio ranking cache");
        } catch (Exception cacheRefreshError) {
          log.error("Failed to refresh portfolio ranking cache after company extraction, but continuing", cacheRefreshError);
          // Don't fail the extraction if cache refresh fails - it will refresh eventually via scheduled job
        }

        // Add the database ID and coordinates to the JSON result
        try {
          ObjectNode resultWithId = (ObjectNode) objectMapper.readTree(jsonResult);
          resultWithId.put("id", savedData.getId());
          
          // Remove the temporary patent data field from the result
          resultWithId.remove("_patentDataForSaving");
          
          // Add coordinates if they were successfully geocoded
          if (savedData.getLatitude() != null) {
            resultWithId.put("latitude", savedData.getLatitude());
          }
          if (savedData.getLongitude() != null) {
            resultWithId.put("longitude", savedData.getLongitude());
          }
          
          jsonResult = objectMapper.writeValueAsString(resultWithId);
          log.debug("Added database ID {} to extraction result", savedData.getId());
        } catch (Exception idError) {
          log.warn("Could not add database ID to result", idError);
        }
      } catch (Exception saveError) {
        log.error("Failed to save extraction data to database, but returning result anyway", saveError);
        // Don't fail the extraction if saving to DB fails - still return the result
      }

      return jsonResult;

    } catch (Exception e) {
      log.error("Error in company data extraction for {}: {}", companyUrl, e.getMessage(), e);

      // Return a basic error response structure
      try {
        ObjectNode errorResponse = objectMapper.createObjectNode();
        errorResponse.put("error", "Extraction failed: " + e.getMessage());
        errorResponse.put("company_url", companyUrl);
        errorResponse.put("timestamp", System.currentTimeMillis());
        errorResponse.put("from_cache", false);
        return objectMapper.writeValueAsString(errorResponse);
      } catch (JsonProcessingException jsonError) {
        return "{\"error\":\"Complete extraction failure\",\"company_url\":\"" + companyUrl + "\",\"from_cache\":false}";
      }
    }
  }

  /**
   * Convert existing CompanyExtractionData entity to JSON format for API response.
   * Uses the original raw extraction data to ensure all fields are preserved.
   *
   * @param existingData The existing extraction data
   * @param fromCache Whether this data is from cache
   * @return JSON string representation of the data
   */
  private String convertExistingDataToJson(CompanyExtractionData existingData, boolean fromCache) {
    try {
      ObjectNode result;

      // Use the original raw extraction data if available
      if (existingData.getRawExtractionData() != null) {
        // Convert the stored raw data back to ObjectNode
        result = (ObjectNode) objectMapper.valueToTree(existingData.getRawExtractionData());
        log.debug("Using raw extraction data for cached response");
      } else {
        // Fallback: manually construct from entity fields (for older data without raw storage)
        log.warn("No raw extraction data found for ID {}, falling back to entity field mapping", existingData.getId());
        result = objectMapper.createObjectNode();

        // Add basic company info
        result.put("company_name", existingData.getCompanyName());
        result.put("company_description", existingData.getCompanyDescription());
        result.put("industry_sectors", existingData.getIndustrySectors());
        result.put("number_of_employees", existingData.getNumberOfEmployees());
        result.put("headquarter_address", existingData.getHeadquarterAddress());

        // Add coordinates if available
        if (existingData.getLatitude() != null) {
          result.put("latitude", existingData.getLatitude());
        }
        if (existingData.getLongitude() != null) {
          result.put("longitude", existingData.getLongitude());
        }
        
        result.put("annual_sales_legacy", existingData.getAnnualSalesLegacy());
        result.put("annual_sales_2022", existingData.getAnnualSales2022());
        result.put("annual_sales_2023", existingData.getAnnualSales2023());
        result.put("annual_sales_2024", existingData.getAnnualSales2024());
        result.put("currency_2022", existingData.getCurrency2022());
        result.put("currency_2023", existingData.getCurrency2023());
        result.put("currency_2024", existingData.getCurrency2024());

        // Add patent info
        result.put("total_patents", existingData.getTotalPatents());
        result.put("granted_patents", existingData.getGrantedPatents());
        result.put("patent_applications", existingData.getPatentApplications());
        result.put("patent_search_url", existingData.getPatentSearchUrl());

        // Add ESG/Sustainability info
        result.put("esg_rating", existingData.getEsgRating());
        result.put("esg_score", existingData.getEsgScore());
        result.put("sustainability_orientation", existingData.getSustainabilityOrientation());
        result.put("sustainability_impact_area", existingData.getSustainabilityImpactArea());
        result.put("sustainability_score", existingData.getSustainabilityScore());

        // Add theory of change info
        result.put("theory_of_change", existingData.getTheoryOfChange());
        result.put("problem", existingData.getProblemDescription());
        result.put("innovation", existingData.getInnovationDescription());
        result.put("sdgs", existingData.getSdgs());
        result.put("target_stakeholders", existingData.getTargetStakeholders());
        result.put("geography", existingData.getGeographyOfImpact());

        // Add cluster info
        result.put("cluster", existingData.getClusterAssignment());
        result.put("cluster_justification", existingData.getClusterJustification());

        // Add social media data
        if (existingData.getSocialMediaLinks() != null) {
          result.set("social_media_links", objectMapper.valueToTree(existingData.getSocialMediaLinks()));
        }
        if (existingData.getSocialMediaFollowerCounts() != null) {
          result.set("social_media_follower_counts", objectMapper.valueToTree(existingData.getSocialMediaFollowerCounts()));
        }

        // Add confidence scores
        if (existingData.getConfidenceScores() != null) {
          result.set("confidence_scores", objectMapper.valueToTree(existingData.getConfidenceScores()));
        }
        
        // Add core products/services
        if (existingData.getCoreProductsServices() != null) {
          result.set("core_products_services", objectMapper.valueToTree(existingData.getCoreProductsServices()));
        }
      }

      // Add cache metadata (always add these regardless of source)
      result.put("from_cache", fromCache);
      result.put("cached_at", existingData.getLastModifiedAt() != null ?
                 existingData.getLastModifiedAt().getTime() :
                 existingData.getCreatedAt().getTime());
      
      // IMPORTANT: Add the database ID so frontend can use it for updates/deletes
      result.put("id", existingData.getId());

      return objectMapper.writeValueAsString(result);

    } catch (Exception e) {
      log.error("Error converting existing data to JSON", e);
      throw new RuntimeException("Failed to convert cached data to JSON: " + e.getMessage(), e);
    }
  }

  /**
   * Executes the complete extraction pipeline including Phase 0 (web scraping) through Phase 6.
   * Also handles patent extraction and social media follower extraction sequentially to avoid Chrome conflicts.
   */
  private JsonNode executeCompleteExtractionPipeline(String companyUrl) {
    try {
      // Holder for social media follower future (will be initialized after Phase 1)
      @SuppressWarnings("unchecked")
      final CompletableFuture<Map<String, Long>>[] socialMediaFuture = new CompletableFuture[1];
      
      // Holder for company name from Phase 1 (needed for patent extraction)
      final String[] companyNameHolder = new String[1];
      
      // Holder for patent data (to save after company is created)
      final PatentCountModel[] patentDataHolder = new PatentCountModel[1];

      // Execute the complete pipeline with social media extraction starting after Phase 1
      log.debug("Starting complete pipeline (phases 0-6) with parallel processing");

      JsonNode pipelineResult = extractionPipeline.executePipelineWithCallback(null, companyUrl, phase1Result -> {
        // This callback executes after Phase 1 completes, when we have social media links
        return CompletableFuture.runAsync(() -> {
          try {
            log.debug("Starting parallel social media extraction after Phase 1");
            
            // Store company name for later patent extraction
            JsonNode companyNameNode = phase1Result.get("company_name");
            if (companyNameNode != null && !companyNameNode.isNull()) {
              companyNameHolder[0] = companyNameNode.asText();
              log.debug("Extracted company name from Phase 1: {}", companyNameHolder[0]);
            }

            // Extract social media links from Phase 1 result
            JsonNode socialMediaLinksNode = phase1Result.get("social_media_links");

            if (socialMediaLinksNode != null && !socialMediaLinksNode.isEmpty()) {
              // Convert JsonNode to Map<String, String>
              Map<String, String> socialMediaLinks = new HashMap<>();
              socialMediaLinksNode.fields().forEachRemaining(entry -> {
                socialMediaLinks.put(entry.getKey(), entry.getValue().asText());
              });

              log.debug("Extracting social media follower counts for {} platforms", socialMediaLinks.size());

              // Start social media extraction
              Map<String, Long> followerCounts = socialMediaExtractionService
                  .extractSocialMediaFollowerCounts(socialMediaLinks);

              // Store the result in a way we can access it later
              socialMediaFuture[0] = CompletableFuture.completedFuture(followerCounts);

              log.debug("Parallel social media extraction completed with {} platforms", followerCounts.size());

            } else {
              log.debug("No social media links found in Phase 1 result, skipping follower extraction");
              socialMediaFuture[0] = CompletableFuture.completedFuture(new HashMap<>());
            }

          } catch (Exception e) {
            log.error("Error in parallel social media extraction: {}", e.getMessage());
            socialMediaFuture[0] = CompletableFuture.completedFuture(new HashMap<>());
          }
        });
      });

      // Create the final result from pipeline
      ObjectNode finalResult = (ObjectNode) pipelineResult.deepCopy();

      // Wait for social media data and add it to the result
      Map<String, Long> followerCounts = new HashMap<>();
      if (socialMediaFuture[0] != null) {
        try {
          followerCounts = socialMediaFuture[0].join();
          log.debug("Social media follower extraction completed for {} platforms", followerCounts.size());
        } catch (Exception e) {
          log.error("Error getting social media data: {}", e.getMessage());
        }
      }

      // Add social media follower counts to the result
      if (!followerCounts.isEmpty()) {
        ObjectNode followerCountsNode = objectMapper.createObjectNode();
        for (Map.Entry<String, Long> entry : followerCounts.entrySet()) {
          followerCountsNode.put(entry.getKey(), entry.getValue());
        }
        finalResult.set("social_media_follower_counts", followerCountsNode);
        log.debug("Added social media follower counts for {} platforms to final result", followerCounts.size());
      } else {
        finalResult.set("social_media_follower_counts", objectMapper.createObjectNode());
        log.debug("No social media follower counts to add to final result");
      }
      
      // Now do FULL patent extraction (after social media is done to avoid Chrome conflicts)
      PatentCountModel patentData = null;
      if (companyNameHolder[0] != null && !companyNameHolder[0].isEmpty()) {
        log.info("Starting FULL patent extraction for company: {}", companyNameHolder[0]);
        long patentStartTime = System.currentTimeMillis();
        
        try {
          // Use countPatents directly with company name to avoid re-extraction
          // IMPORTANT: Don't save to database yet - company doesn't exist until after we save CompanyExtractionData
          patentData = patentCounterService.countPatents(
              companyNameHolder[0],
              companyUrl,
              false,  // euOnly = false
              false,  // grantsOnly = false
              false,  // countOnly = false (get full details)
              false   // saveToDatabase = false (we'll save after company is created)
          );
          
          long patentDuration = System.currentTimeMillis() - patentStartTime;
          log.info("Full patent extraction completed in {}ms. Found {} total patents ({} granted, {} applications)",
              patentDuration, patentData.getPatentCount(), 
              patentData.getGrantedPatentCount(), patentData.getApplicationCount());
              
        } catch (Exception e) {
          log.error("Full patent extraction failed: {}", e.getMessage(), e);
          // Create empty patent data as fallback
          patentData = PatentCountModel.builder()
              .companyName(companyNameHolder[0])
              .patentCount(0)
              .grantedPatentCount(0)
              .applicationCount(0)
              .searchUrl("")
              .error("Patent extraction failed: " + e.getMessage())
              .build();
        }
      } else {
        log.warn("No company name available, skipping patent extraction");
        patentData = PatentCountModel.builder()
            .patentCount(0)
            .grantedPatentCount(0)
            .applicationCount(0)
            .searchUrl("")
            .build();
      }
      
      // Store patent data for saving after company is created
      patentDataHolder[0] = patentData;
      
      // Add patent data to result
      if (patentData != null) {
        finalResult.put("total_patents", patentData.getPatentCount() != null ? patentData.getPatentCount() : 0);
        finalResult.put("granted_patents", patentData.getGrantedPatentCount() != null ? patentData.getGrantedPatentCount() : 0);
        finalResult.put("patent_applications", patentData.getApplicationCount() != null ? patentData.getApplicationCount() : 0);
        finalResult.put("patent_search_url", patentData.getSearchUrl() != null ? patentData.getSearchUrl() : "");
        
        // Update confidence scores if they exist
        if (finalResult.has("confidence_scores")) {
          ObjectNode confidenceScores = (ObjectNode) finalResult.get("confidence_scores");
          confidenceScores.put("total_patents",
              patentData.getPatentCount() != null && patentData.getPatentCount() > 0 ? 95 : 0);
          confidenceScores.put("granted_patents",
              patentData.getGrantedPatentCount() != null && patentData.getGrantedPatentCount() > 0 ? 95 : 0);
          confidenceScores.put("patent_applications",
              patentData.getApplicationCount() != null && patentData.getApplicationCount() > 0 ? 95 : 0);
          confidenceScores.put("patent_search_url",
              patentData.getSearchUrl() != null && !patentData.getSearchUrl().isEmpty() ? 100 : 0);
        }
        
        // Log if there was an error
        if (patentData.getError() != null) {
          log.warn("Patent extraction had errors: {}", patentData.getError());
        }
      }

      log.debug("Complete pipeline finished with sequential patent extraction");
      
      // Add patent data to the result so we can access it after saving the company
      if (patentDataHolder[0] != null) {
        ObjectNode resultWithPatentData = (ObjectNode) finalResult;
        resultWithPatentData.set("_patentDataForSaving", objectMapper.valueToTree(patentDataHolder[0]));
      }
      
      return finalResult;

    } catch (Exception e) {
      log.error("Error in complete pipeline execution", e);
      throw new RuntimeException("Complete pipeline failed: " + e.getMessage(), e);
    }
  }

  /**
   * Legacy method - adds social media follower counts to the pipeline result.
   * This method is now used as a fallback when the optimized parallel approach fails.
   *
   * @deprecated Use the optimized parallel approach in executeCompleteExtractionPipeline instead
   */
  @Deprecated
  private JsonNode addSocialMediaFollowersFromPipelineResult(ObjectNode pipelineResult) {
    try {
      // Extract social media links from pipeline result
      JsonNode socialMediaLinksNode = pipelineResult.get("social_media_links");

      if (socialMediaLinksNode != null && !socialMediaLinksNode.isEmpty()) {
        log.debug("Fallback: social media follower extraction");

        // Convert JsonNode to Map<String, String>
        Map<String, String> socialMediaLinks = new HashMap<>();
        socialMediaLinksNode.fields().forEachRemaining(entry -> {
          socialMediaLinks.put(entry.getKey(), entry.getValue().asText());
        });

        log.debug("Extracting social media follower counts for {} platforms", socialMediaLinks.size());

        // Extract follower counts
        Map<String, Long> followerCounts = socialMediaExtractionService
            .extractSocialMediaFollowerCounts(socialMediaLinks);

        log.info("=== FALLBACK FOLLOWER EXTRACTION RESULTS ===");
        log.info("Follower counts: {}", followerCounts);

        if (!followerCounts.isEmpty()) {
          ObjectNode followerCountsNode = objectMapper.createObjectNode();
          for (Map.Entry<String, Long> entry : followerCounts.entrySet()) {
            followerCountsNode.put(entry.getKey(), entry.getValue());
          }
          pipelineResult.set("social_media_follower_counts", followerCountsNode);
          log.info("Social media follower extraction completed for {} platforms", followerCounts.size());
        } else {
          pipelineResult.set("social_media_follower_counts", objectMapper.createObjectNode());
        }
      } else {
        log.info("No social media links found in pipeline result, skipping follower extraction");
        pipelineResult.set("social_media_follower_counts", objectMapper.createObjectNode());
      }

      return pipelineResult;
    } catch (Exception e) {
      log.error("Error adding social media followers from pipeline result: {}", e.getMessage());
      pipelineResult.set("social_media_follower_counts", objectMapper.createObjectNode());
      return pipelineResult; // Return original result if follower extraction fails
    }
  }
}
