package io.ventureplatform.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.ventureplatform.entity.CompanyExtractionData;
import io.ventureplatform.repository.CompanyExtractionDataRepository;
import io.ventureplatform.service.external.OpenAiClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Service for backfilling missing contact data (phone and email) for companies.
 * Uses O3 model with web search to find contact information.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ContactDataBackfillService {

  private final CompanyExtractionDataRepository companyRepository;
  private final ObjectMapper objectMapper;
  private final OpenAiClient openAiClient;

  private static final String SYSTEM_PROMPT = 
    "You are a contact information finder. Your ONLY task is to find phone numbers and email addresses for companies.\n\n"
    + "You will receive:\n"
    + "1. Company name\n"
    + "2. Company website URL\n"
    + "3. Company description (if available)\n\n"
    + "Use web search to find:\n"
    + "- Primary contact phone number (main office/HQ number preferred)\n"
    + "- Primary contact email (general contact email like info@, contact@, hello@, or sales@)\n\n"
    + "Search strategies:\n"
    + "1. Search for '[company name] contact phone email'\n"
    + "2. Visit their website's contact page if possible\n"
    + "3. Look for 'Contact Us' or 'About Us' pages\n"
    + "4. Check LinkedIn company pages\n"
    + "5. Search for '[company name] headquarters phone number'\n\n"
    + "IMPORTANT:\n"
    + "- Only return VERIFIED contact information you find through search\n"
    + "- Do NOT make up or guess contact information\n"
    + "- Prefer official company contact info over personal contacts\n"
    + "- If multiple options exist, choose the most general/primary one\n\n"
    + "Return ONLY this JSON format:\n"
    + "{\n"
    + "  \"phone_number\": \"\" (or null if not found),\n"
    + "  \"contact_email\": \"\" (or null if not found),\n"
    + "  \"confidence_scores\": {\n"
    + "    \"phone_number\": 0-100,\n"
    + "    \"contact_email\": 0-100\n"
    + "  },\n"
    + "  \"sources\": {\n"
    + "    \"phone_number\": \"URL where found\",\n"
    + "    \"contact_email\": \"URL where found\"\n"
    + "  }\n"
    + "}\n\n"
    + "Set confidence 90-100 for official website sources, 70-89 for reputable third-party sources, lower for uncertain sources.";

  /**
   * Backfill contact data for companies missing phone or email.
   * 
   * @param limit Maximum number of companies to process (e.g., limit=10 means process only 10 companies, null/0 means process ALL companies)
   * @param batchSize Number of companies to process in parallel
   * @return Summary of the backfill operation
   */
  @Transactional
  public Map<String, Object> backfillMissingContactData(Integer limit, Integer batchSize) {
    log.info("Starting contact data backfill process. Limit: {}, Batch size: {}", limit, batchSize);
    
    // Set defaults
    if (batchSize == null || batchSize <= 0) {
      batchSize = 5; // Process 5 at a time to avoid rate limits
    }
    
    // Get companies missing contact data
    List<CompanyExtractionData> companiesMissingData = findCompaniesMissingContactData(limit);
    
    log.info("Found {} companies missing contact data", companiesMissingData.size());
    
    // Track results
    AtomicInteger successCount = new AtomicInteger(0);
    AtomicInteger failureCount = new AtomicInteger(0);
    AtomicInteger phoneFoundCount = new AtomicInteger(0);
    AtomicInteger emailFoundCount = new AtomicInteger(0);
    List<Map<String, Object>> results = new ArrayList<>();
    
    // Process in batches
    for (int i = 0; i < companiesMissingData.size(); i += batchSize) {
      int endIndex = Math.min(i + batchSize, companiesMissingData.size());
      List<CompanyExtractionData> batch = companiesMissingData.subList(i, endIndex);
      
      log.info("Processing batch {}-{} of {}", i + 1, endIndex, companiesMissingData.size());
      
      // Process each company in the batch
      for (CompanyExtractionData company : batch) {
        try {
          Map<String, Object> result = processCompany(company);
          results.add(result);
          
          boolean foundPhone = result.get("phone_found") != null && (boolean) result.get("phone_found");
          boolean foundEmail = result.get("email_found") != null && (boolean) result.get("email_found");
          
          if (foundPhone || foundEmail) {
            successCount.incrementAndGet();
            if (foundPhone) {
              phoneFoundCount.incrementAndGet();
            }
            if (foundEmail) {
              emailFoundCount.incrementAndGet();
            }
          } else {
            failureCount.incrementAndGet();
          }
          
          // Small delay to avoid rate limiting
          Thread.sleep(1000); // 1 second between requests
          
        } catch (Exception e) {
          log.error("Error processing company {}: {}", company.getCompanyName(), e.getMessage());
          failureCount.incrementAndGet();
          
          Map<String, Object> errorResult = new HashMap<>();
          errorResult.put("company_id", company.getId());
          errorResult.put("company_name", company.getCompanyName());
          errorResult.put("error", e.getMessage());
          results.add(errorResult);
        }
      }
    }
    
    // Build summary
    Map<String, Object> summary = new HashMap<>();
    summary.put("total_processed", companiesMissingData.size());
    summary.put("success_count", successCount.get());
    summary.put("failure_count", failureCount.get());
    summary.put("phone_found_count", phoneFoundCount.get());
    summary.put("email_found_count", emailFoundCount.get());
    summary.put("details", results);
    
    log.info("Contact data backfill completed. Processed: {}, Success: {}, Failed: {}, Phones found: {}, Emails found: {}",
             companiesMissingData.size(), successCount.get(), failureCount.get(), 
             phoneFoundCount.get(), emailFoundCount.get());
    
    return summary;
  }

  /**
   * Find companies missing contact data.
   */
  private List<CompanyExtractionData> findCompaniesMissingContactData(Integer limit) {
    // Use pagination to handle large datasets
    List<CompanyExtractionData> allCompanies = new ArrayList<>();
    int pageSize = 100;
    int pageNumber = 0;
    
    while (true) {
      Pageable pageable = PageRequest.of(pageNumber, pageSize);
      Page<CompanyExtractionData> page = companyRepository.findCompaniesMissingContactData(pageable);
      
      allCompanies.addAll(page.getContent());
      
      // Check if we've reached the limit
      if (limit != null && allCompanies.size() >= limit) {
        return allCompanies.subList(0, Math.min(limit, allCompanies.size()));
      }
      
      // Check if there are more pages
      if (!page.hasNext()) {
        break;
      }
      
      pageNumber++;
    }
    
    return allCompanies;
  }

  /**
   * Process a single company to find contact data.
   */
  private Map<String, Object> processCompany(CompanyExtractionData company) throws Exception {
    log.info("Processing company: {} (ID: {})", company.getCompanyName(), company.getId());
    
    // Build prompt with company info
    String prompt = buildPrompt(company);
    
    // Call O3 model with web search
    String aiResponse = callO3WithWebSearch(prompt);
    
    // Parse response
    JsonNode responseJson = objectMapper.readTree(aiResponse);
    
    // Extract contact data
    String phoneNumber = getTextValue(responseJson, "phone_number");
    String contactEmail = getTextValue(responseJson, "contact_email");
    
    // Get confidence scores
    JsonNode confidenceScores = responseJson.get("confidence_scores");
    int phoneConfidence = confidenceScores != null && confidenceScores.has("phone_number") 
        ? confidenceScores.get("phone_number").asInt() : 0;
    int emailConfidence = confidenceScores != null && confidenceScores.has("contact_email") 
        ? confidenceScores.get("contact_email").asInt() : 0;
    
    // Update company if data was found with sufficient confidence
    boolean updated = false;
    boolean phoneFound = false;
    boolean emailFound = false;
    
    Map<String, Object> updates = new HashMap<>();
    
    if (phoneNumber != null && !phoneNumber.isEmpty() && phoneConfidence >= 60) {
      updates.put("phone_number", phoneNumber);
      phoneFound = true;
      log.info("Found phone number for {}: {} (confidence: {}%)", 
               company.getCompanyName(), phoneNumber, phoneConfidence);
    }
    
    if (contactEmail != null && !contactEmail.isEmpty() && emailConfidence >= 60) {
      updates.put("contact_email", contactEmail);
      emailFound = true;
      log.info("Found email for {}: {} (confidence: {}%)", 
               company.getCompanyName(), contactEmail, emailConfidence);
    }
    
    // Update the database if we found anything
    if (!updates.isEmpty()) {
      updateCompanyContactData(company.getId(), updates);
      updated = true;
    }
    
    // Build result
    Map<String, Object> result = new HashMap<>();
    result.put("company_id", company.getId());
    result.put("company_name", company.getCompanyName());
    result.put("phone_found", phoneFound);
    result.put("email_found", emailFound);
    result.put("phone_number", phoneNumber);
    result.put("contact_email", contactEmail);
    result.put("phone_confidence", phoneConfidence);
    result.put("email_confidence", emailConfidence);
    result.put("updated", updated);
    
    // Add sources if available
    if (responseJson.has("sources")) {
      result.put("sources", objectMapper.convertValue(responseJson.get("sources"), Map.class));
    }
    
    return result;
  }

  /**
   * Build prompt for the AI model.
   */
  private String buildPrompt(CompanyExtractionData company) {
    StringBuilder prompt = new StringBuilder();
    
    prompt.append("Find contact information for this company:\n\n");
    prompt.append("Company Name: ").append(company.getCompanyName()).append("\n");
    prompt.append("Website: ").append(company.getCompanyUrl()).append("\n");
    
    if (company.getCompanyDescription() != null && !company.getCompanyDescription().isEmpty()) {
      prompt.append("Description: ").append(company.getCompanyDescription()).append("\n");
    }
    
    if (company.getHeadquarterAddress() != null && !company.getHeadquarterAddress().isEmpty()) {
      prompt.append("Location: ").append(company.getHeadquarterAddress()).append("\n");
    }
    
    prompt.append("\nUse web search to find the primary contact phone number and email address for this company.");
    
    return prompt.toString();
  }

  /**
   * Call O3 model with web search capabilities using Responses API.
   */
  private String callO3WithWebSearch(String userPrompt) throws Exception {
    String combinedInput = SYSTEM_PROMPT + "\n\n" + userPrompt;
    log.debug("Making O3 API call with web search for contact data");
    String raw = openAiClient.makeO3CallWithWebSearch(
        null,
        combinedInput,
        null,
        true
    );
    return cleanJsonResponse(raw);
  }

  /**
   * Clean JSON response from potential markdown formatting.
   */
  private String cleanJsonResponse(String response) {
    // Remove potential markdown code blocks
    response = response.replaceAll("```json\\s*", "");
    response = response.replaceAll("```\\s*", "");
    response = response.trim();
    
    // Find the JSON object
    int startIndex = response.indexOf("{");
    int endIndex = response.lastIndexOf("}");
    
    if (startIndex >= 0 && endIndex > startIndex) {
      return response.substring(startIndex, endIndex + 1);
    }
    
    return response;
  }

  /**
   * Update company contact data in the database.
   */
  @Transactional
  private void updateCompanyContactData(Long companyId, Map<String, Object> updates) {
    CompanyExtractionData company = companyRepository.findById(companyId)
        .orElseThrow(() -> new RuntimeException("Company not found: " + companyId));
    
    // Update fields
    if (updates.containsKey("phone_number")) {
      company.setPhoneNumber((String) updates.get("phone_number"));
    }
    if (updates.containsKey("contact_email")) {
      company.setContactEmail((String) updates.get("contact_email"));
    }
    
    // Update raw data to maintain consistency
    Map<String, Object> rawData = company.getRawExtractionData();
    if (rawData == null) {
      rawData = new HashMap<>();
    }
    rawData.putAll(updates);
    company.setRawExtractionData(rawData);
    
    // Save
    companyRepository.save(company);
    log.debug("Updated contact data for company ID: {}", companyId);
  }

  /**
   * Helper method to get text value from JsonNode.
   */
  private String getTextValue(JsonNode node, String fieldName) {
    if (node != null && node.has(fieldName) && !node.get(fieldName).isNull()) {
      String value = node.get(fieldName).asText();
      return value.isEmpty() ? null : value;
    }
    return null;
  }
}
