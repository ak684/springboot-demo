package io.ventureplatform.service.extraction.phases;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import io.ventureplatform.entity.CompanyExtractionData;
import io.ventureplatform.service.extraction.pipeline.BaseExtractionPhase;
import io.ventureplatform.service.extraction.prompt.PromptLoader;
import io.ventureplatform.service.external.OpenAiClient;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Phase 8: Carbon Emissions Calculation.
 * Estimates GHG emissions for companies based on available data from previous phases.
 * Calculates Scope 1, Scope 2, and Scope 3 emissions.
 */
@Service
@Slf4j
public class CarbonEmissionsService extends BaseExtractionPhase {

  private static final Pattern NUMERIC_PATTERN = Pattern.compile("[-+]?\\d*\\.?\\d+");
  private static final int MAX_EMISSIONS_RETRIES = 2;
  private static final String ALL_SCOPES_PROMPT_PATH =
      "prompts/carbon_emissions_all_scopes.md";
  private final PromptLoader promptLoader;

  public CarbonEmissionsService(final ObjectMapper objectMapper,
                                final OpenAiClient openAiClient,
                                final PromptLoader promptLoader) {
    super(objectMapper, openAiClient);
    this.promptLoader = promptLoader;
  }

  /**
   * Phase label for logging and UI.
   */
  @Override
  public String getPhaseName() {
    return "Phase 8: Carbon Emissions Calculation";
  }

  /**
   * Phase index in the extraction pipeline.
   */
  @Override
  public int getPhaseNumber() {
    return 8;
  }

  /**
   * Executes carbon emissions calculation for the provided company data.
   */
  @Override
  protected JsonNode executePhase(JsonNode companyData, String companyUrl) {
    try {
      log.info("=== PHASE 8: CARBON EMISSIONS CALCULATION ===");
      log.info("Starting carbon emissions calculation for: {}", companyUrl);

      String companyName = getFieldValue(companyData, "company_name", "Unknown Company");
      String headquarters = getFieldValue(companyData, "headquarter_address", "Unknown Location");
      String country = getFieldValue(companyData, "headquarter_country", "Unknown Country");
      String employeesRaw = getFieldValue(companyData, "number_of_employees", "Unknown");
      String employees = parseEmployeeCountForPrompt(employeesRaw);
      String industry = extractIndustryInformation(companyData);
      String revenue = extractLatestRevenue(companyData);
      String description = getFieldValue(companyData, "company_description", "No description available");
      String operationalNotes = extractOperationalNotes(companyData);
      String productsServices = extractProductsServicesAsString(companyData);
      String certifications = getFieldValue(companyData, "certification_name", "None identified");
      String legalForm = getFieldValue(companyData, "legal_form", "Unknown");

      log.info("Company context - Name: {}, Country: {}, Employees: {}, Industry: {}",
               companyName, country, employees, industry);

      String promptTemplate = promptLoader.loadPrompt(ALL_SCOPES_PROMPT_PATH);
      String allScopesPrompt = buildPrompt(promptTemplate,
          companyName, headquarters, country, employees, industry, revenue,
          description, operationalNotes, productsServices, certifications, legalForm);

      log.info("Making combined Scope 1, 2, and 3 emissions calculation call");
      JsonNode allScopesData = makeEmissionsCallWithRetry(
          allScopesPrompt, "Scopes 1, 2, and 3");

      ObjectNode result = processAllEmissionsData(companyData, allScopesData);

      log.info("=== PHASE 8 COMPLETED (All Scopes) ===");
      return result;

    } catch (Exception e) {
      log.error("Error in carbon emissions calculation for {}: {}", companyUrl, e.getMessage(), e);
      return companyData != null ? companyData : objectMapper.createObjectNode();
    }
  }

  private String getFieldValue(JsonNode data, String field, String defaultValue) {
    if (data.has(field) && !data.get(field).isNull()) {
      String value = data.get(field).asText();
      return value.isEmpty() ? defaultValue : value;
    }
    return defaultValue;
  }

  private String extractProductsServicesAsString(JsonNode companyData) {
    try {
      if (companyData.has("core_products_services")) {
        JsonNode cps = companyData.get("core_products_services");
        if (cps.has("items") && cps.get("items").isArray()) {
          StringBuilder sb = new StringBuilder();
          for (JsonNode item : cps.get("items")) {
            if (sb.length() > 0) {
              sb.append("; ");
            }
            String title = item.has("title") ? item.get("title").asText() : "";
            String desc = item.has("description")
                ? item.get("description").asText() : "";
            if (!title.isEmpty()) {
              sb.append(title);
              if (!desc.isEmpty()) {
                sb.append(" - ").append(desc);
              }
            }
          }
          if (sb.length() > 0) {
            return sb.toString();
          }
        }
      }
    } catch (Exception e) {
      log.debug("Could not extract products/services: {}", e.getMessage());
    }
    return "Not available";
  }

  private String buildPrompt(String template, String companyName, String headquarters,
                            String country, String employees, String industry,
                            String revenue, String description, String operationalNotes,
                            String productsServices, String certifications,
                            String legalForm) {
    return template
        .replace("{COMPANY_NAME}", companyName)
        .replace("{HEADQUARTERS}", headquarters)
        .replace("{EMPLOYEES}", employees)
        .replace("{INDUSTRY}", industry)
        .replace("{REVENUE}", revenue)
        .replace("{DESCRIPTION}", description)
        .replace("{OPERATIONAL_NOTES}", operationalNotes)
        .replace("{PRODUCTS_SERVICES}", productsServices)
        .replace("{CERTIFICATIONS}", certifications)
        .replace("{LEGAL_FORM}", legalForm);
  }

  /**
   * Parse employee count from various string formats for use in AI prompts.
   * Handles ranges by taking the middle value for more accurate emissions calculations.
   * Examples: "2-10" -> "6", "50-100" -> "75", "100+" -> "100"
   */
  private String parseEmployeeCountForPrompt(String employeesStr) {
    if (employeesStr == null || employeesStr.trim().isEmpty() || "Unknown".equals(employeesStr) || "N/A".equals(employeesStr)) {
      return "Unknown";
    }

    String cleaned = employeesStr.trim();

    try {
      // Handle ranges - take the middle value
      if (cleaned.contains("-")) {
        String[] parts = cleaned.split("-");
        if (parts.length >= 2) {
          String lowerBound = parts[0].replaceAll("[^0-9]", "");
          String upperBound = parts[1].replaceAll("[^0-9]", "");
          if (!lowerBound.isEmpty() && !upperBound.isEmpty()) {
            long lower = Long.parseLong(lowerBound);
            long upper = Long.parseLong(upperBound);
            long middle = (lower + upper) / 2;
            log.info("Parsed employee range '{}' as middle value: {} for carbon calculations", employeesStr, middle);
            return String.valueOf(middle);
          }
        }
      }

      // Handle plus signs (e.g., "100+") - just use the number
      if (cleaned.contains("+")) {
        String withoutPlus = cleaned.replace("+", "").replaceAll("[^0-9]", "");
        if (!withoutPlus.isEmpty()) {
          return withoutPlus;
        }
      }

      // Handle regular numbers (remove commas, spaces, etc.)
      String numbersOnly = cleaned.replaceAll("[^0-9]", "");
      if (!numbersOnly.isEmpty()) {
        return numbersOnly;
      }

    } catch (NumberFormatException e) {
      log.warn("Could not parse employee count for carbon emissions: '{}'", employeesStr);
    }

    // Return original if we can't parse it
    return employeesStr;
  }

  /**
   * Extract industry information from multiple possible fields in the company data.
   * Tries various field names and formats to find the most relevant industry information.
   */
  private String extractIndustryInformation(JsonNode data) {
    log.debug("Extracting industry information from company data");

    // Try primary field first
    String industry = getFieldValue(data, "industry_sectors", null);
    if (industry != null && !industry.trim().isEmpty() && !"null".equalsIgnoreCase(industry)) {
      log.debug("Found industry in 'industry_sectors' field: {}", industry);
      return industry;
    }

    // Try primary industry standard
    String primaryIndustry = getFieldValue(data, "primary_industry_standard", null);
    if (primaryIndustry != null && !primaryIndustry.trim().isEmpty() && !"null".equalsIgnoreCase(primaryIndustry)) {
      String secondaryIndustry = getFieldValue(data, "secondary_industry_standard", null);
      if (secondaryIndustry != null && !secondaryIndustry.trim().isEmpty() && !"null".equalsIgnoreCase(secondaryIndustry)) {
        String combined = primaryIndustry + ", " + secondaryIndustry;
        log.debug("Found industry in industry standards: {}", combined);
        return combined;
      }
      log.debug("Found industry in 'primary_industry_standard' field: {}", primaryIndustry);
      return primaryIndustry;
    }

    // Try other possible industry field names
    String[] industryFields = {"industry", "sector", "business_sector", "primary_industry", "secondary_industry"};
    for (String fieldName : industryFields) {
      String value = getFieldValue(data, fieldName, null);
      if (value != null && !value.trim().isEmpty() && !"null".equalsIgnoreCase(value)) {
        return value;
      }
    }

    log.warn("No industry information found in company data for URL: {}, using fallback",
             getFieldValue(data, "company_url", "unknown"));
    return "Unknown Industry";
  }

  private String extractOperationalNotes(JsonNode data) {
    StringBuilder notes = new StringBuilder();

    // Check for mentions of fleet, vehicles, logistics
    String description = getFieldValue(data, "company_description", "");
    String businessModel = getFieldValue(data, "business_model", "");

    if (description.toLowerCase().contains("fleet") || description.toLowerCase().contains("vehicle") ||
        description.toLowerCase().contains("logistics") || description.toLowerCase().contains("delivery")) {
      notes.append("Company appears to have logistics fleet. ");
    }
    
    if (description.toLowerCase().contains("manufactur") || description.toLowerCase().contains("production") ||
        description.toLowerCase().contains("factory") || description.toLowerCase().contains("plant")) {
      notes.append("Company has manufacturing/production facilities. ");
    }
    
    if (description.toLowerCase().contains("fermentation") || description.toLowerCase().contains("biotech")) {
      notes.append("Company uses fermentation processes. ");
    }
    
    if (description.toLowerCase().contains("data center") || description.toLowerCase().contains("cloud")) {
      notes.append("Company operates data centers. ");
    }
    
    // Check business model for additional insights
    if (businessModel.toLowerCase().contains("saas") || businessModel.toLowerCase().contains("software")) {
      notes.append("Primarily software-based operations. ");
    }
    
    String result = notes.toString().trim();
    return result.isEmpty() ? "No specific operational notes identified" : result;
  }

  private String extractLatestRevenue(JsonNode data) {
    // Try to get the most recent revenue data
    String revenue2024 = getFieldValue(data, "annual_sales_2024", null);
    String revenue2023 = getFieldValue(data, "annual_sales_2023", null);
    String revenue2022 = getFieldValue(data, "annual_sales_2022", null);
    
    if (revenue2024 != null && !revenue2024.equals("N/A")) {
      return revenue2024 + " (2024)";
    } else if (revenue2023 != null && !revenue2023.equals("N/A")) {
      return revenue2023 + " (2023)";
    } else if (revenue2022 != null && !revenue2022.equals("N/A")) {
      return revenue2022 + " (2022)";
    }
    
    return "Unknown";
  }

  private JsonNode parseAiResponse(String aiResponse, String scopeDescription) {
    try {
      String cleaned = cleanJsonResponse(aiResponse);
      JsonNode responseJson = objectMapper.readTree(cleaned);

      if (!responseJson.has("emissions_breakdown")) {
        log.error("AI response missing 'emissions_breakdown' field for {}", scopeDescription);
        return objectMapper.createObjectNode();
      }

      return responseJson;
    } catch (Exception e) {
      log.error("Failed to parse AI response for {}: {}", scopeDescription, e.getMessage());
      return objectMapper.createObjectNode();
    }
  }

  /**
   * Makes emissions API call with retry logic for missing emissions_breakdown.
   */
  private JsonNode makeEmissionsCallWithRetry(String prompt, String scopeDescription) {
    for (int attempt = 1; attempt <= MAX_EMISSIONS_RETRIES + 1; attempt++) {
      String response = makeOpenAiCallWithO3WebSearch(prompt);
      JsonNode parsed = parseAiResponse(response, scopeDescription);

      if (parsed.has("emissions_breakdown")) {
        if (attempt > 1) {
          log.info("{} succeeded on retry attempt {}", scopeDescription, attempt);
        }
        return parsed;
      }

      if (attempt <= MAX_EMISSIONS_RETRIES) {
        log.warn("{} missing emissions_breakdown, retrying ({}/{})",
            scopeDescription, attempt, MAX_EMISSIONS_RETRIES);
      }
    }

    log.error("{} failed after {} retries - returning empty result",
        scopeDescription, MAX_EMISSIONS_RETRIES);
    return objectMapper.createObjectNode();
  }

  private BigDecimal parseEmissionsValue(JsonNode entry) {
    if (entry == null || !entry.has("estimated_co2e")) {
      log.warn("Missing estimated_co2e field in emissions entry");
      return BigDecimal.ZERO;
    }

    String rawValue = entry.get("estimated_co2e").asText("");
    if (rawValue == null || rawValue.trim().isEmpty()) {
      log.warn("Empty estimated_co2e value for scope {}", entry.get("scope").asText("unknown"));
      return BigDecimal.ZERO;
    }

    String cleaned = rawValue.replace(",", "").trim();
    Matcher matcher = NUMERIC_PATTERN.matcher(cleaned);
    if (matcher.find()) {
      try {
        return new BigDecimal(matcher.group());
      } catch (NumberFormatException e) {
        log.warn("Could not parse estimated_co2e '{}' for scope {}: {}",
            rawValue, entry.get("scope").asText("unknown"), e.getMessage());
        return BigDecimal.ZERO;
      }
    }

    log.warn("No numeric estimated_co2e found in '{}' for scope {}",
        rawValue, entry.get("scope").asText("unknown"));
    return BigDecimal.ZERO;
  }

  private ObjectNode processAllEmissionsData(JsonNode originalData, JsonNode emissionsData) {
    ObjectNode result = (ObjectNode) originalData.deepCopy();

    try {
      if (!emissionsData.has("emissions_breakdown")) {
        log.warn("No emissions breakdown data available; preserving existing data");
        return (ObjectNode) originalData.deepCopy();
      }

      ArrayNode breakdown = (ArrayNode) emissionsData.get("emissions_breakdown");
      if (breakdown == null || breakdown.isEmpty()) {
        log.warn("Emissions breakdown array is empty; preserving existing data");
        return (ObjectNode) originalData.deepCopy();
      }

      for (int i = 0; i < breakdown.size(); i++) {
        JsonNode entry = breakdown.get(i);
        if (entry.has("assumptions")) {
          ObjectNode entryObj = (ObjectNode) entry;
          String originalAssumptions = entry.get("assumptions").asText();
          String formattedAssumptions = formatAssumptionText(originalAssumptions);
          entryObj.put("assumptions", formattedAssumptions);
        }
      }

      BigDecimal totalEmissions = BigDecimal.ZERO;
      BigDecimal scope1Total = BigDecimal.ZERO;
      BigDecimal scope2Total = BigDecimal.ZERO;
      BigDecimal scope3Total = BigDecimal.ZERO;

      for (JsonNode entry : breakdown) {
        String scope = entry.get("scope").asText();
        BigDecimal emissions = parseEmissionsValue(entry);

        if ("Scope 1".equals(scope)) {
          scope1Total = scope1Total.add(emissions);
        } else if ("Scope 2".equals(scope)) {
          scope2Total = scope2Total.add(emissions);
        } else if ("Scope 3".equals(scope)) {
          scope3Total = scope3Total.add(emissions);
        }

        totalEmissions = totalEmissions.add(emissions);
      }

      result.put("total_carbon_emissions", totalEmissions.setScale(2, RoundingMode.HALF_UP).toString());
      result.put("scope1_emissions", scope1Total.setScale(2, RoundingMode.HALF_UP).toString());
      result.put("scope2_emissions", scope2Total.setScale(2, RoundingMode.HALF_UP).toString());
      result.put("scope3_emissions", scope3Total.setScale(2, RoundingMode.HALF_UP).toString());
      result.set("emissions_breakdown", breakdown);

      log.info("All emissions calculated - Total: {} tCO2e, Scope 1: {} tCO2e, Scope 2: {} tCO2e, Scope 3: {} tCO2e",
               totalEmissions, scope1Total, scope2Total, scope3Total);

      int scope1Count = 0;
      int scope2Count = 0;
      int scope3Count = 0;
      for (JsonNode entry : breakdown) {
        String scope = entry.get("scope").asText();
        if ("Scope 1".equals(scope)) {
          scope1Count++;
        } else if ("Scope 2".equals(scope)) {
          scope2Count++;
        } else if ("Scope 3".equals(scope)) {
          scope3Count++;
        }
      }
      log.info("Emissions breakdown entries - Scope 1: {}, Scope 2: {}, Scope 3: {} (expected 17)",
               scope1Count, scope2Count, scope3Count);

    } catch (Exception e) {
      log.error("Error processing all emissions data: {}", e.getMessage());
    }

    return result;
  }

  /**
   * Filter company data to exclude existing carbon emissions.
   * Excludes data that could bias recalculation.
   * Uses exclusion approach to be robust against future schema changes.
   *
   * @param rawData the raw company data
   * @return filtered data without emissions fields
   */
  public JsonNode filterDataForCarbonCalculation(final JsonNode rawData) {
    // Create a copy of the original data
    ObjectNode filteredData = rawData.deepCopy();

    // Remove existing carbon emissions data to prevent bias
    filteredData.remove("total_carbon_emissions");
    filteredData.remove("scope1_emissions");
    filteredData.remove("scope2_emissions");
    filteredData.remove("scope3_emissions");
    filteredData.remove("emissions_breakdown");

    // Also remove any interim calculation fields that might exist
    filteredData.remove("carbon_emissions_calculated");
    filteredData.remove("emissions_calculation_date");

    int originalSize = rawData.size();
    int filteredSize = filteredData.size();
    int removedFields = originalSize - filteredSize;

    log.debug("Filtered carbon emissions data - kept {} fields, "
             + "removed {} emissions-related fields",
             filteredSize, removedFields);

    return filteredData;
  }

  /**
   * Format assumption text with AI + regex hybrid approach.
   * Step 1: Clean up malformed text with regex.
   * Step 2: Use AI to convert word numbers to numeric.
   * Step 3: Add line breaks with regex.
   *
   * @param text the text to format
   * @return formatted text with numeric values and line breaks
   */
  public String formatAssumptionText(final String text) {
    if (text == null || text.trim().isEmpty()) {
      return text;
    }

    // STEP 1: Regex cleanup - fix AI's .n mistakes
    String cleaned = text;
    cleaned = cleaned.replaceAll("\\\\n", "\n");
    cleaned = cleaned.replaceAll("\\.n([A-Z])", ". $1");

    // STEP 2: AI conversion - word numbers to numeric
    String withNumericNumbers = convertWordNumbersWithAi(cleaned);

    // STEP 3: Normalize to double newlines for consistency
    String formatted = withNumericNumbers;

    // First, fix numbered lists - remove newlines immediately after "1.", "2.", etc.
    formatted = formatted.replaceAll("(\\d+\\.)\n+", "$1 ");

    // Then collapse multiple newlines (3+) down to exactly 2
    formatted = formatted.replaceAll("\n{3,}", "\n\n");

    // Then add double newlines after periods
    // Skip if:
    //   - followed by newline (already has line break)
    //   - preceded by digit (numbered lists like "1.")
    //   - preceded by single capital letter (abbreviations like "U.S." or "Ph.D.")
    formatted = formatted.replaceAll("(?<!\\d)(?<![A-Z])\\.\\s+(?!\n)", ".\n\n");

    // Also handle bullet points (• followed by space) - add newlines before them
    formatted = formatted.replaceAll("\\s+•\\s+", "\n\n• ");

    // Finally, ensure single newlines become double (but don't touch existing doubles)
    formatted = formatted.replaceAll("(?<!\n)\n(?!\n)", "\n\n");

    return formatted;
  }

  /**
   * Use AI to convert word numbers to numeric values.
   * Uses OpenAiClient for consistent retry logic and error handling.
   *
   * @param text the text with potential word numbers
   * @return text with numeric numbers
   */
  private String convertWordNumbersWithAi(final String text) {
    try {
      List<Map<String, String>> messages = new ArrayList<>();

      Map<String, String> systemMsg = new HashMap<>();
      systemMsg.put("role", "system");
      systemMsg.put("content",
          "Convert all word numbers to numeric format. "
          + "Return ONLY the text with numbers converted, nothing else.");

      Map<String, String> userMsg = new HashMap<>();
      userMsg.put("role", "user");
      userMsg.put("content", text);

      messages.add(systemMsg);
      messages.add(userMsg);

      String result = openAiClient.makeChatCompletionText(messages, "gpt-4o-mini");

      // Remove quotes if AI wrapped the response
      if (result.startsWith("\"") && result.endsWith("\"")) {
        result = result.substring(1, result.length() - 1);
      }

      return result;

    } catch (Exception e) {
      log.warn("AI number conversion failed, using original: {}",
               e.getMessage());
      return text; // Fallback to original text
    }
  }

  /**
   * Update emissions based on user instructions with surgical precision.
   * Intelligently updates affected categories AND their logical dependencies
   * while preserving all unaffected data.
   *
   * @param company the company entity with existing emissions data
   * @param userInstructions natural language instructions from user
   * @return updated emissions data with selective changes
   */
  public JsonNode updateEmissionsWithUserInstructions(
      final CompanyExtractionData company,
      final String userInstructions) {

    try {
      log.info("=== TARGETED EMISSIONS UPDATE ===");
      log.info("User instructions: {}", userInstructions);

      // Get existing emissions breakdown
      Map<String, Object> rawData = company.getRawExtractionData();
      if (rawData == null || !rawData.containsKey("emissions_breakdown")) {
        throw new IllegalStateException(
            "No existing emissions data to update"
        );
      }

      List<Map<String, Object>> existingBreakdown =
          (List<Map<String, Object>>) rawData.get("emissions_breakdown");

      log.info("Existing breakdown has {} entries", existingBreakdown.size());

      // Extract company context for AI
      String companyName = company.getCompanyName();
      String headquarters = company.getHeadquarterAddress();
      String employees = parseEmployeeCountForPrompt(
          company.getNumberOfEmployees()
      );
      String industry = company.getIndustrySectors();

      // Convert existing breakdown to formatted JSON string
      String existingBreakdownJson = objectMapper
          .writerWithDefaultPrettyPrinter()
          .writeValueAsString(existingBreakdown);

      // Build the surgical update prompt with dependency awareness
      String updatePrompt = String.format("""
          You are an expert in GHG Protocol emissions calculations.

          CRITICAL TASK:
          The user wants to update SPECIFIC data in their emissions calculation.
          You must return the COMPLETE emissions breakdown with ONLY the
          requested changes AND their logical downstream impacts applied.

          COMPANY CONTEXT:
          - Name: %s
          - Location: %s
          - Employees: %s
          - Industry: %s

          USER'S CORRECTION REQUEST:
          "%s"

          CURRENT EMISSIONS BREAKDOWN (17 categories):
          %s

          INSTRUCTIONS:

          Step 1: IDENTIFY AFFECTED CATEGORIES
          Think through which categories are directly OR indirectly affected:

          - Employee count changes affect:
            * Scope 2: Electricity (office consumption scales with employees)
            * Scope 3 Cat 1: Purchased goods (supplies scale with employees)
            * Scope 3 Cat 5: Waste (waste generation scales with employees)
            * Scope 3 Cat 6: Business travel (travel scales with employees)
            * Scope 3 Cat 7: Commuting (directly proportional to employees)

          - Fleet changes affect:
            * Scope 1: Mobile combustion (direct impact)
            * Potentially Scope 3 Cat 4: Upstream transport (if fleet used for deliveries)

          - Building size changes affect:
            * Scope 1: Stationary combustion (heating/cooling scales with area)
            * Scope 2: Electricity (lighting, HVAC scales with area)

          - Revenue/sales changes affect:
            * Scope 3 Cat 1: Purchased goods (may scale with revenue)
            * Scope 3 Cat 4: Transportation (shipping volume scales with sales)

          - Office location/country changes affect:
            * Scope 2: Electricity (grid intensity varies by country)
            * All categories using country-specific emission factors

          Step 2: UPDATE ALL AFFECTED CATEGORIES
          For each affected category:
          1. Update assumptions to reflect the user's correction
          2. Recalculate emissions proportionally and accurately
          3. Use proper GHG Protocol formulas
          4. Show clear math in assumptions field
          5. If scaling (e.g., employees doubled), apply proportional changes

          Step 3: PRESERVE UNAFFECTED CATEGORIES
          For categories NOT affected by the user's change:
          - Keep EXACTLY as is
          - Same assumptions text (word-for-word)
          - Same emissions values
          - Same strategies
          - Same confidence levels
          - Same everything

          DETAILED EXAMPLES:

          Example 1: Fleet Change (Narrow Impact)
          User: "We have 4 electric vehicles, not 2 petrol cars"

          Categories to UPDATE (1 category):
          - Scope 1 Mobile Combustion:
            * Change from "2 petrol cars" to "4 electric vehicles"
            * Recalculate: 4 EVs × 15,000 km × 0.05 kg CO₂e/km / 1000 = 3.0 tonnes
            * Update assumptions text to show new calculation

          Categories to PRESERVE (16 categories):
          - All other categories stay EXACTLY the same

          Example 2: Employee Count Change (Broad Impact)
          User: "We have 100 employees, not 50" (2x increase)

          Categories to UPDATE (5 categories):
          - Scope 2 Electricity:
            * Double the employee-based consumption component
            * 100 employees × 8,000 kWh/employee × 0.25 kg/kWh = NEW value

          - Scope 3 Cat 1 Purchased goods:
            * Double employee-related operating expenditures
            * Update OPEX estimate proportionally

          - Scope 3 Cat 5 Waste:
            * Double employee-generated waste
            * 100 employees × waste per employee = NEW value

          - Scope 3 Cat 6 Business travel:
            * Double number of trips
            * 100 employees × 0.5 trips/year × distance = NEW value

          - Scope 3 Cat 7 Commuting:
            * Double commuting emissions
            * 100 employees × commute distance × days = NEW value

          Categories to PRESERVE (12 categories):
          - Scope 1 Fleet: Keep same (unless fleet scales with employees)
          - Scope 1 Stationary combustion: Keep same (building size unchanged)
          - Scope 1 Refrigerants: Keep same (equipment unchanged)
          - Scope 3 Cat 2: Capital goods: Keep same
          - Scope 3 Cat 3: Fuel/energy upstream: Keep same
          - Scope 3 Cat 4: Upstream transport: Keep same
          - Scope 3 Cat 8: Upstream leased assets: Keep same
          - Scope 3 Cat 9-15: Keep same (downstream categories)

          Example 3: Building Size Change (Medium Impact)
          User: "Our office is 5,000 m² not 2,000 m²" (2.5x increase)

          Categories to UPDATE (2 categories):
          - Scope 1 Stationary combustion:
            * 2.5x heating energy consumption
            * 5,000 m² × energy per m² × emission factor = NEW value

          - Scope 2 Electricity:
            * 2.5x building-related electricity
            * Keep employee-based portion, scale building portion

          Categories to PRESERVE (15 categories):
          - Scope 1 Fleet: Not building-related
          - Scope 3 Cat 6 Business travel: Not building-related
          - Scope 3 Cat 7 Commuting: Employees didn't change
          - All other categories: Not affected by building size

          Example 4: Specific Equipment Change
          User: "We use natural gas heating, not oil heating"

          Categories to UPDATE (1 category):
          - Scope 1 Stationary combustion:
            * Change fuel type from oil to natural gas
            * Same energy amount, different emission factor
            * Recalculate with natural gas factor (~0.202 kg CO₂e/kWh)

          Categories to PRESERVE (16 categories):
          - All other categories unchanged

          CRITICAL DECISION RULES:

          1. Proportional Scaling: If user changes a base metric (employees, area,
             revenue) by factor X, multiply all dependent emissions by X

          2. Conservative Approach: When uncertain if a category is affected,
             PRESERVE it unchanged rather than risk incorrect modification

          3. Check Dependencies: Ask yourself "Does this category's calculation
             logically depend on what the user changed?"

          4. Preserve Precision: Keep exact same wording, numbers, and structure
             for unchanged categories

          5. Update Assumptions Text: When you update a category, rewrite the
             assumptions to show the new calculation clearly

          OUTPUT FORMAT:
          Return ONLY a JSON array with ALL 17 categories in the same order:

          [
            {
              "scope": "Scope 1",
              "source": "Direct emissions - stationary combustion...",
              "category": "",
              "relevancy": "...",
              "estimated_co2e": number,
              "confidence": "medium",
              "assumptions": "Updated or preserved assumptions text...",
              "primary_strategy": "...",
              "primary_reduction_percent": number,
              "secondary_strategy": "...",
              "secondary_reduction_percent": number
            },
            {
              "scope": "Scope 2",
              "source": "Purchased electricity, heat, and cooling",
              "category": "",
              "relevancy": "...",
              "estimated_co2e": number,
              "confidence": "medium",
              "assumptions": "...",
              "primary_strategy": "...",
              "primary_reduction_percent": number,
              "secondary_strategy": "...",
              "secondary_reduction_percent": number
            },
            {
              "scope": "Scope 3",
              "source": "Purchased goods and services",
              "category": "1",
              "relevancy": "...",
              "estimated_co2e": number,
              "confidence": "low",
              "assumptions": "...",
              "primary_strategy": "...",
              "primary_reduction_percent": number,
              "secondary_strategy": "...",
              "secondary_reduction_percent": number
            },
            ... (continue for all 17 categories)
          ]

          FINAL REMINDERS:
          - Return ONLY the JSON array, no markdown, no explanations
          - Include ALL 17 categories in order
          - Use exact same structure as input
          - Think through dependencies carefully
          - When in doubt, preserve rather than change
          - Show clear math in updated assumptions
          """,
          companyName,
          headquarters,
          employees,
          industry,
          userInstructions,
          existingBreakdownJson
      );

      log.debug("Surgical update prompt length: {} chars",
                updatePrompt.length());

      // Make AI call
      List<Map<String, String>> messages = new ArrayList<>();
      Map<String, String> userMsg = new HashMap<>();
      userMsg.put("role", "user");
      userMsg.put("content", updatePrompt);
      messages.add(userMsg);

      String aiResponse = openAiClient.makeChatCompletion(messages);

      log.info("Received AI response, length: {} chars", aiResponse.length());

      // Parse AI response
      ArrayNode updatedBreakdown = (ArrayNode) objectMapper.readTree(
          aiResponse
      );

      // Validate response
      if (updatedBreakdown.size() != existingBreakdown.size()) {
        log.warn("AI returned {} entries, expected {}. Using original.",
                 updatedBreakdown.size(), existingBreakdown.size());
        throw new IllegalStateException(
            "AI did not return correct number of categories"
        );
      }

      // Recalculate totals from updated breakdown
      BigDecimal scope1Total = BigDecimal.ZERO;
      BigDecimal scope2Total = BigDecimal.ZERO;
      BigDecimal scope3Total = BigDecimal.ZERO;

      for (JsonNode entry : updatedBreakdown) {
        String scope = entry.get("scope").asText();
        BigDecimal emissions = new BigDecimal(
            entry.get("estimated_co2e").asText("0")
        );

        if ("Scope 1".equals(scope)) {
          scope1Total = scope1Total.add(emissions);
        } else if ("Scope 2".equals(scope)) {
          scope2Total = scope2Total.add(emissions);
        } else if ("Scope 3".equals(scope)) {
          scope3Total = scope3Total.add(emissions);
        }
      }

      BigDecimal totalEmissions = scope1Total.add(scope2Total)
          .add(scope3Total);

      // Build result
      ObjectNode result = objectMapper.createObjectNode();
      result.put("total_carbon_emissions",
                 totalEmissions.setScale(2, RoundingMode.HALF_UP).toString());
      result.put("scope1_emissions",
                 scope1Total.setScale(2, RoundingMode.HALF_UP).toString());
      result.put("scope2_emissions",
                 scope2Total.setScale(2, RoundingMode.HALF_UP).toString());
      result.put("scope3_emissions",
                 scope3Total.setScale(2, RoundingMode.HALF_UP).toString());
      result.set("emissions_breakdown", updatedBreakdown);

      log.info("Updated totals - Total: {} tCO2e, Scope 1: {}, "
              + "Scope 2: {}, Scope 3: {}",
               totalEmissions, scope1Total, scope2Total, scope3Total);

      // Log what changed for debugging
      logChanges(existingBreakdown, updatedBreakdown);

      log.info("=== TARGETED UPDATE COMPLETED ===");
      return result;

    } catch (Exception e) {
      log.error("Error in targeted emissions update: {}", e.getMessage(), e);
      throw new RuntimeException("Failed to update emissions: "
                                + e.getMessage(), e);
    }
  }

  /**
   * Log which categories changed for debugging/auditing.
   * Helps verify that surgical precision is working correctly.
   */
  private void logChanges(
      final List<Map<String, Object>> original,
      final ArrayNode updated) {

    try {
      int changedCount = 0;
      List<String> changedCategories = new ArrayList<>();

      for (int i = 0; i < original.size(); i++) {
        Map<String, Object> origEntry = original.get(i);
        JsonNode updEntry = updated.get(i);

        String origEmissions = origEntry.get("estimated_co2e").toString();
        String newEmissions = updEntry.get("estimated_co2e").asText();

        if (!origEmissions.equals(newEmissions)) {
          changedCount++;
          String categoryName = updEntry.get("source").asText();
          changedCategories.add(categoryName);
          log.info("Category changed: {} | {} -> {} tCO2e",
                   categoryName,
                   origEmissions,
                   newEmissions);
        }
      }

      log.info("=== UPDATE SUMMARY ===");
      log.info("Total categories changed: {} out of {}",
               changedCount, original.size());
      log.info("Total categories preserved: {} out of {}",
               original.size() - changedCount, original.size());

      if (changedCount > 0) {
        log.info("Changed categories: {}", String.join(", ", changedCategories));
      }

    } catch (Exception e) {
      log.debug("Could not log changes: {}", e.getMessage());
    }
  }
}
