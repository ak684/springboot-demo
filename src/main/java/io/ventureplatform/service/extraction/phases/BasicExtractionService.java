package io.ventureplatform.service.extraction.phases;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.ventureplatform.service.extraction.pipeline.BaseExtractionPhase;
import io.ventureplatform.service.external.OpenAiClient;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Phase 1: Intelligent AI Orchestrator.
 * Analyzes scraped data from Phase 0 and uses AI with selective web search to extract comprehensive company information.
 * This is the single point of intelligence that decides when to use scraped data vs. when to search the web.
 */
@Service
@Slf4j
public class BasicExtractionService extends BaseExtractionPhase {

  private static final String SYSTEM_PROMPT =
    "You are an intelligent company data extraction agent. You will receive:\n"
    + "1. A company URL\n"
    + "2. Raw structured data from web scraping (if available)\n\n"
    + "Your task: Extract comprehensive company information using the scraped data as a starting foundation. "
    + "Use web search tools strategically and as much as possible to fill gaps or verify information.\n\n"
    + "Process:\n"
    + "1. Analyze the provided scraped data first\n"
    + "2. Identify what information is missing or needs verification\n"
    + "3. Use web search tools as much as possible to verify any gaps (funding, financials, partnerships, competitors)\n"
    + "4. Make sure the CEO name is populated\n"
    + "5. Extract phone_number and contact_email from scraped data or search for them\n"
    + "6. Extract annual sales data BY YEAR - search for revenue/sales figures for 2022, 2023, and 2024 specifically\n"
    + "7. For each sales figure, detect the currency and return the 3-letter ISO currency code "
    + "(e.g., USD for $, EUR for €, GBP for £, SEK for Swedish Krona, etc.). "
    + "Supported currencies: EUR, USD, GBP, JPY, CNY, CHF, CAD, AUD, SEK, NOK, DKK, INR, SGD, HKD. "
    + "Leave empty if currency cannot be determined.\n"
    + "8. Return complete JSON with confidence scores\n\n"
    + "IMPORTANT FIELD REQUIREMENTS:\n"
    + "- number_of_employees: Must be either a specific number (e.g., '50', '1200') or a number range "
    + "(e.g., '10-50', '100-500', '1000+', '500-1000'). "
    + "Do NOT use descriptive text like 'small team', 'large company', or 'startup'. "
    + "If you cannot find exact numbers, use appropriate ranges like '1-10', '11-50', '51-200', "
    + "'201-500', '501-1000', '1000+'.\n"
    + "- legal_form: CRITICAL - Return ONLY the official legal abbreviation/suffix (e.g., 'LLC', 'Inc.', "
    + "'Corp.', 'Ltd.', 'GmbH', 'AG', 'SA', 'SAS', 'BV', 'Pty Ltd', 'PLC', 'LP', 'LLP'). "
    + "DO NOT return full words like 'Incorporation', 'Corporation', 'Limited Liability Company'. "
    + "Extract ONLY the abbreviated legal entity suffix exactly as it appears in official company documents. "
    + "If no legal form is found, return empty string. "
    + "Examples of CORRECT responses: 'LLC', 'Inc.', 'GmbH', 'Ltd.', 'Corp.' "
    + "Examples of WRONG responses: 'Limited Liability Company', 'Incorporated', 'Corporation', "
    + "'a Delaware corporation', 'LLC company'.\n\n"
    + "YOU MUSTReturn the information in this exact JSON format:\n\n"
    + "{\n"
    + "  \"company_name\": \"\",\n"
    + "  \"company_description\": \"\",\n"
    + "  \"legal_entity_formed\": true/false,\n"
    + "  \"legal_entity_formation_date\": \"\",\n"
    + "  \"legal_form\": \"\",\n"
    + "  \"headquarter_address\": \"\",\n"
    + "  \"headquarter_country\": \"\",\n"
    + "  \"number_of_employees\": \"\",\n"
    + "  \"ceo_name\": \"\",\n"
    + "  \"annual_sales_2022\": \"\",\n"
    + "  \"annual_sales_2023\": \"\",\n"
    + "  \"annual_sales_2024\": \"\",\n"
    + "  \"currency_2022\": \"\",\n"
    + "  \"currency_2023\": \"\",\n"
    + "  \"currency_2024\": \"\",\n"
    + "  \"phone_number\": \"\",\n"
    + "  \"contact_email\": \"\",\n"
    + "  \"mission\": \"\",\n"
    + "  \"industry_sectors\": [\"\"],\n"
    + "  \"business_model\": \"\",\n"
    + "  \"target_market\": \"\",\n"
    + "  \"revenue_model\": \"\",\n"
    + "  \"funding_stage\": \"\",\n"
    + "  \"total_funding_amount\": \"\",\n"
    + "  \"key_investors\": [\"\"],\n"
    + "  \"partnerships\": [\"\"],\n"
    + "  \"competitors\": [\"\"],\n"
    + "  \"technology_stack\": [\"\"],\n"
    + "  \"company_logo\": \"\",\n"
    + "  \"social_media_links\": {\n"
    + "    \"linkedin\": \"\",\n"
    + "    \"twitter\": \"\",\n"
    + "    \"facebook\": \"\",\n"
    + "    \"instagram\": \"\",\n"
    + "    \"youtube\": \"\"\n"
    + "  },\n"
    + "  \"confidence_scores\": {\n"
    + "    \"company_name\": 0,\n"
    + "    \"company_description\": 0,\n"
    + "    \"legal_entity_formed\": 0,\n"
    + "    \"legal_entity_formation_date\": 0,\n"
    + "    \"legal_form\": 0,\n"
    + "    \"headquarter_address\": 0,\n"
    + "    \"headquarter_country\": 0,\n"
    + "    \"number_of_employees\": 0,\n"
    + "    \"ceo_name\": 0,\n"
    + "    \"annual_sales_2022\": 0,\n"
    + "    \"annual_sales_2023\": 0,\n"
    + "    \"annual_sales_2024\": 0,\n"
    + "    \"currency_2022\": 0,\n"
    + "    \"currency_2023\": 0,\n"
    + "    \"currency_2024\": 0,\n"
    + "    \"phone_number\": 0,\n"
    + "    \"contact_email\": 0,\n"
    + "    \"mission\": 0,\n"
    + "    \"industry_sectors\": 0,\n"
    + "    \"business_model\": 0,\n"
    + "    \"target_market\": 0,\n"
    + "    \"revenue_model\": 0,\n"
    + "    \"funding_stage\": 0,\n"
    + "    \"total_funding_amount\": 0,\n"
    + "    \"key_investors\": 0,\n"
    + "    \"partnerships\": 0,\n"
    + "    \"competitors\": 0,\n"
    + "    \"technology_stack\": 0,\n"
    + "    \"company_logo\": 0,\n"
    + "    \"social_media_links\": 0\n"
    + "  },\n"
    + "  \"sources\": {\n"
    + "    \"company_name\": \"\",\n"
    + "    \"company_description\": \"\",\n"
    + "    \"legal_entity_formed\": \"\",\n"
    + "    \"legal_entity_formation_date\": \"\",\n"
    + "    \"legal_form\": \"\",\n"
    + "    \"headquarter_address\": \"\",\n"
    + "    \"headquarter_country\": \"\",\n"
    + "    \"number_of_employees\": \"\",\n"
    + "    \"ceo_name\": \"\",\n"
    + "    \"annual_sales_2022\": \"\",\n"
    + "    \"annual_sales_2023\": \"\",\n"
    + "    \"annual_sales_2024\": \"\",\n"
    + "    \"currency_2022\": \"\",\n"
    + "    \"currency_2023\": \"\",\n"
    + "    \"currency_2024\": \"\",\n"
    + "    \"phone_number\": \"\",\n"
    + "    \"contact_email\": \"\",\n"
    + "    \"mission\": \"\",\n"
    + "    \"industry_sectors\": \"\",\n"
    + "    \"business_model\": \"\",\n"
    + "    \"target_market\": \"\",\n"
    + "    \"revenue_model\": \"\",\n"
    + "    \"funding_stage\": \"\",\n"
    + "    \"total_funding_amount\": \"\",\n"
    + "    \"key_investors\": \"\",\n"
    + "    \"partnerships\": \"\",\n"
    + "    \"competitors\": \"\",\n"
    + "    \"technology_stack\": \"\",\n"
    + "    \"company_logo\": \"\",\n"
    + "    \"social_media_links\": \"\"\n"
    + "  }\n"
    + "}\n\n"
    + "RESPOND ONLY WITH THE JSON OBJECT. "
    + "If you cannot find information for a particular field, leave it as an empty string or appropriate default value. "
    + "For confidence scores, provide any number from 0-100 indicating your confidence in the accuracy of the information, "
    + "where 0 means no confidence and 100 means complete 100% confidence. Set high confidence (90-100) for information "
    + "from scraped data, medium confidence (70-89) for verified web search results, "
    + "and lower confidence for inferred data.\n\n"
    + "For the sources field, provide the URL where you found each piece of information. "
    + "For scraped data, use 'website_scraping'. For web search results, provide the specific webpage URL.\n\n"
    + "IMPORTANT: Always answer in English, regardless of the language of the source website or content. "
    + "IMPORTANT: Return ONLY the JSON object without any markdown formatting, code blocks, or additional text.";

  public BasicExtractionService(ObjectMapper objectMapper, OpenAiClient openAiClient) {
    super(objectMapper, openAiClient);
  }

  @Override
  public String getPhaseName() {
    return "Phase 1: Intelligent AI Orchestrator";
  }

  @Override
  public int getPhaseNumber() {
    return 1;
  }

  @Override
  protected JsonNode executePhase(JsonNode companyData, String companyUrl) {
    try {
      log.info("=== PHASE 1: INTELLIGENT AI ORCHESTRATOR ===");

      // Extract raw scraped data from Phase 0
      Map<String, Object> scrapedData = extractScrapedData(companyData);

      // Build intelligent prompt with scraped data context
      String intelligentPrompt = buildIntelligentPrompt(companyUrl, scrapedData);
      
      // Log prompt details for debugging contact extraction
      if (log.isDebugEnabled()) {
        log.debug("=== FULL PROMPT BEING SENT TO AI ===");
        log.debug("Prompt length: {} characters", intelligentPrompt.length());
        // Log the contact-related part of the prompt
        int contactStart = intelligentPrompt.indexOf("CONTACT INFORMATION");
        if (contactStart > 0) {
          int contactEnd = Math.min(contactStart + 1000, intelligentPrompt.length());
          log.debug("Contact section of prompt: {}", intelligentPrompt.substring(contactStart, contactEnd));
        }
      }

      log.info("Phase 1: Making intelligent OpenAI call with scraped context");
      log.info("Scraped data summary: {} fields available", scrapedData.size());

      String aiResponse = makeOpenAiCallWithO3WebSearch(
          SYSTEM_PROMPT,
          intelligentPrompt,
          null
      );

      // Parse the response - no complex merging needed anymore
      JsonNode result = objectMapper.readTree(aiResponse);
      
      // Log contact field extraction results
      boolean hasPhone = result.has("phone_number");
      boolean hasEmail = result.has("contact_email");
      String phoneValue = hasPhone ? result.get("phone_number").asText() : "FIELD_NOT_PRESENT";
      String emailValue = hasEmail ? result.get("contact_email").asText() : "FIELD_NOT_PRESENT";
      
      log.info("=== CONTACT EXTRACTION RESULTS ===");
      log.info("AI Response includes phone_number field: {} (value: '{}')", hasPhone, phoneValue);
      log.info("AI Response includes contact_email field: {} (value: '{}')", hasEmail, emailValue);
      
      // Log all fields returned by AI for debugging
      log.debug("AI returned these fields: {}", result.fieldNames());

      log.info("=== PHASE 1 COMPLETED ===");
      log.info("Phase 1: Intelligent extraction completed with {} fields", result.size());

      return result;

    } catch (Exception e) {
      log.error("Error in Phase 1 intelligent extraction for {}: {}", companyUrl, e.getMessage());
      // Return original data on error, or empty object if no original data
      return companyData != null ? companyData : objectMapper.createObjectNode();
    }
  }

  /**
   * Extract raw scraped data from Phase 0 results.
   */
  private Map<String, Object> extractScrapedData(JsonNode companyData) {
    Map<String, Object> scrapedData = new HashMap<>();

    if (companyData == null || companyData.isEmpty()) {
      log.info("No scraped data available from Phase 0");
      return scrapedData;
    }

    // Extract all available fields from Phase 0
    companyData.fields().forEachRemaining(entry -> {
      String key = entry.getKey();
      JsonNode value = entry.getValue();

      // Convert JsonNode back to appropriate Java object
      if (value.isTextual()) {
        String textValue = value.asText();
        if (!textValue.trim().isEmpty()) {
          scrapedData.put(key, textValue);
        }
      } else if (value.isObject() || value.isArray()) {
        scrapedData.put(key, objectMapper.convertValue(value, Object.class));
      }
    });

    log.info("Phase 1: Extracted {} scraped data fields from Phase 0: {}",
             scrapedData.size(), scrapedData.keySet());
    return scrapedData;
  }

  /**
   * Build intelligent prompt with scraped data context.
   */
  private String buildIntelligentPrompt(String companyUrl, Map<String, Object> scrapedData) {
    StringBuilder prompt = new StringBuilder();
    prompt.append("Company URL: ").append(companyUrl).append("\n\n");

    if (scrapedData != null && !scrapedData.isEmpty()) {
      prompt.append("=== SCRAPED DATA ANALYSIS ===\n");
      prompt.append("I've already extracted this structured data from the website:\n\n");

      // Add each piece of scraped data with context
      for (Map.Entry<String, Object> entry : scrapedData.entrySet()) {
        String key = entry.getKey();
        Object value = entry.getValue();

        prompt.append("- ").append(formatFieldName(key)).append(": ");

        if (value instanceof Map) {
          Map<?, ?> mapValue = (Map<?, ?>) value;
          prompt.append(formatMapForPrompt(mapValue));
        } else if (value instanceof List) {
          List<?> listValue = (List<?>) value;
          prompt.append(formatListForPrompt(listValue));
        } else {
          prompt.append(value.toString());
        }
        prompt.append("\n");
      }

      // Add contact information highlighting
      highlightContactInformation(prompt, scrapedData);
      
      prompt.append("\n=== YOUR TASK ===\n");
      prompt.append("1. Use the scraped data above as your foundation - trust this data highly\n");
      prompt.append("2. Identify what key information is missing for a complete company profile\n");
      prompt.append("3. Use web search strategically to find missing information, focusing on:\n");
      prompt.append("   - Funding stage, total funding amount, key investors\n");
      prompt.append("   - Employee count (if not in scraped data) - MUST be a number or range ")
          .append("like '50', '10-50', '100+'\n");
      prompt.append("   - Annual sales/revenue by year (2022, 2023, 2024) with currency\n");
      prompt.append("   - Business model and revenue model details\n");
      prompt.append("   - Key partnerships and competitors\n");
      prompt.append("   - Technology stack and products/services\n");
      prompt.append("   - Contact information (phone_number/contact_email) - CHECK SCRAPED DATA FIRST\n");
      prompt.append("4. Don't re-search for information already provided in scraped data\n");
      prompt.append("5. Set high confidence scores (90-100) for scraped data\n\n");
    } else {
      prompt.append("=== NO SCRAPED DATA AVAILABLE ===\n");
      prompt.append("No pre-scraped data is available. Please extract all company information using web search.\n");
      prompt.append("Focus on finding comprehensive company information from reliable sources.\n\n");
    }

    prompt.append("Return the complete company profile in the specified JSON format. ");
    prompt.append("Use the scraped data as the foundation and fill gaps with targeted web searches.");

    return prompt.toString();
  }

  /**
   * Highlight contact information found in scraped data for the AI.
   * This helps the AI prioritize using already-found contact info.
   */
  private void highlightContactInformation(StringBuilder prompt, Map<String, Object> scrapedData) {
    log.info("=== CONTACT EXTRACTION: Starting contact information highlighting ===");
    prompt.append("\n=== CONTACT INFORMATION FOUND ===\n");
    boolean foundContact = false;
    
    // Check footer extraction
    if (scrapedData.containsKey("footer_phone")) {
      String footerPhone = String.valueOf(scrapedData.get("footer_phone"));
      log.info("CONTACT FOUND: footer_phone = '{}'", footerPhone);
      prompt.append("Phone number: ").append(footerPhone).append(" (source: footer)\n");
      foundContact = true;
    } else {
      log.debug("CONTACT MISSING: No footer_phone in scraped data");
    }

    if (scrapedData.containsKey("footer_email")) {
      String footerEmail = String.valueOf(scrapedData.get("footer_email"));
      log.info("CONTACT FOUND: footer_email = '{}'", footerEmail);
      prompt.append("Email: ").append(footerEmail).append(" (source: footer)\n");
      foundContact = true;
    } else {
      log.debug("CONTACT MISSING: No footer_email in scraped data");
    }

    // Check meta tags
    if (scrapedData.containsKey("meta_contact_phone")) {
      String metaPhone = String.valueOf(scrapedData.get("meta_contact_phone"));
      log.info("CONTACT FOUND: meta_contact_phone = '{}'", metaPhone);
      prompt.append("Phone number: ").append(metaPhone).append(" (source: meta tags)\n");
      foundContact = true;
    } else {
      log.debug("CONTACT MISSING: No meta_contact_phone in scraped data");
    }

    if (scrapedData.containsKey("meta_contact_email")) {
      String metaEmail = String.valueOf(scrapedData.get("meta_contact_email"));
      log.info("CONTACT FOUND: meta_contact_email = '{}'", metaEmail);
      prompt.append("Email: ").append(metaEmail).append(" (source: meta tags)\n");
      foundContact = true;
    } else {
      log.debug("CONTACT MISSING: No meta_contact_email in scraped data");
    }

    // Check extracted phones from various HTML sources
    if (scrapedData.containsKey("extracted_phones")) {
      Map<String, String> extractedPhones = (Map<String, String>) scrapedData.get("extracted_phones");
      if (extractedPhones != null && !extractedPhones.isEmpty()) {
        log.info("CONTACT FOUND: extracted_phones contains {} phone numbers", extractedPhones.size());
        // Prefer tel: link, then schema.org, then body context, then contact section
        String phoneToUse = null;
        String source = "";
        if (extractedPhones.containsKey("tel_link")) {
          phoneToUse = extractedPhones.get("tel_link");
          source = "tel: link";
        } else if (extractedPhones.containsKey("schema_org")) {
          phoneToUse = extractedPhones.get("schema_org");
          source = "Schema.org";
        } else if (extractedPhones.containsKey("body_context")) {
          phoneToUse = extractedPhones.get("body_context");
          source = "page content";
        } else if (extractedPhones.containsKey("contact_section")) {
          phoneToUse = extractedPhones.get("contact_section");
          source = "contact section";
        }

        if (phoneToUse != null) {
          prompt.append("Phone number: ").append(phoneToUse).append(" (source: ").append(source).append(")\n");
          foundContact = true;
        }
      }
    } else {
      log.debug("CONTACT MISSING: No extracted_phones in scraped data");
    }

    // Check structured data
    if (scrapedData.containsKey("structured_data")) {
      Map<String, Object> structured = (Map<String, Object>) scrapedData.get("structured_data");
      if (structured != null && structured.containsKey("local_business")) {
        Map<String, String> business = (Map<String, String>) structured.get("local_business");
        if (business != null) {
          if (business.containsKey("telephone")) {
            prompt.append("Phone number: ").append(business.get("telephone")).append(" (source: structured data)\n");
            foundContact = true;
          }
          if (business.containsKey("email")) {
            prompt.append("Email: ").append(business.get("email")).append(" (source: structured data)\n");
            foundContact = true;
          }
        }
      }
    }
    
    // Check contact sections
    if (scrapedData.containsKey("contact_sections") && !foundContact) {
      List<String> sections = (List<String>) scrapedData.get("contact_sections");
      if (sections != null && !sections.isEmpty()) {
        prompt.append("\n📋 Contact sections found - extract phone/email from these:\n");
        for (String section : sections) {
          if (section != null && section.length() > 20 && section.length() < 500) {
            prompt.append("\"").append(section.substring(0, Math.min(section.length(), 200)))
                  .append("...\"\n");
          }
        }
        foundContact = true;
      }
    }
    
    if (foundContact) {
      log.info("CONTACT EXTRACTION: Found contact information in scraped data - instructing AI to use it");
      prompt.append("\nUse the contact information above for phone_number and contact_email fields.\n");
      prompt.append("Set confidence score 95-100 for contact info found in scraped data.\n");
    } else {
      log.warn("CONTACT EXTRACTION: No contact information found in scraped data - instructing AI to search for it");
      prompt.append("Please search for '{company name} contact email' and '{company name} phone number'.\n");
    }
    
    log.info("=== CONTACT EXTRACTION: Completed highlighting (foundContact: {}) ===", foundContact);
  }

  /**
   * Format field names for better readability in prompts.
   */
  private String formatFieldName(String fieldName) {
    return fieldName.replace("_", " ").toUpperCase();
  }

  /**
   * Format map values for prompt display.
   */
  private String formatMapForPrompt(Map<?, ?> map) {
    if (map.isEmpty()) {
      return "(empty)";
    }

    StringBuilder sb = new StringBuilder();
    map.entrySet().forEach(entry -> {
      sb.append(entry.getKey()).append("=").append(entry.getValue()).append("; ");
    });
    return sb.toString();
  }

  /**
   * Format list values for prompt display.
   */
  private String formatListForPrompt(List<?> list) {
    if (list.isEmpty()) {
      return "(empty)";
    }

    if (list.size() > 5) {
      return list.subList(0, 5) + "... (+" + (list.size() - 5) + " more)";
    }

    return list.toString();
  }
}
