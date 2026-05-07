package io.ventureplatform.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.ventureplatform.dto.response.PatentCountModel;
import io.ventureplatform.dto.response.PatentDetail;
import io.ventureplatform.dto.response.PatentTimelineEntry;
import io.ventureplatform.entity.CompanyPatent;
import io.ventureplatform.entity.CompanyExtractionData;
import io.ventureplatform.repository.CompanyPatentRepository;
import io.ventureplatform.repository.CompanyExtractionDataRepository;
import io.ventureplatform.repository.PatentEventRepository;
import io.ventureplatform.util.CompanyExtractorUtils;
import io.ventureplatform.service.external.OpenAiClient;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.TimeoutException;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.stereotype.Service;
import org.springframework.web.util.UriUtils;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import java.util.stream.Collectors;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.Calendar;
import java.util.Date;

/**
 * Service for counting patents for a company.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PatentCounterService {

  // Configurable constants for update frequency
  private static final int COMPANIES_PER_UPDATE = 100;
  
  @Autowired(required = false)
  private PatentEventService patentEventService;

  @Autowired(required = false)
  private PatentFamilyGroupingService patentFamilyGroupingService;

  /**
   * Inner class to represent patent information with its type.
   */
  @Data
  @AllArgsConstructor
  public static class PatentInfo {
    private String patentNumber;
    private boolean isGranted; // true if granted, false if application
    private String title;
    private String inventor;
    private String assignee;
    private String publicationDate;
    private String filedDate;
    private String priorityDate;
    private String grantDate;
    private String abstractText;
    private String pdfUrl;
    private String patentUrl;
    private String jurisdictions;

    // Constructor for backward compatibility
    public PatentInfo(String patentNumber, boolean isGranted) {
      this.patentNumber = patentNumber;
      this.isGranted = isGranted;
    }
  }

  private final ObjectMapper objectMapper;
  private final OpenAiClient openAiClient;

  /**
   * Enum to represent the result of a scraping attempt.
   */
  private enum ScrapeResult {
    NO_RESULTS,       // Legitimate "No results found" message detected
    RESULTS_FOUND,    // Patents were successfully extracted
    UNSUCCESSFUL      // No clear indication - might be blocked, page didn't load, etc.
  }

  @Autowired(required = false)
  private CompanyPatentRepository companyPatentRepository;

  @Autowired(required = false)
  private CompanyExtractionDataRepository companyExtractionDataRepository;

  @Autowired(required = false)
  private PatentDetailService patentDetailService;

  @Autowired(required = false)
  private PatentEventRepository patentEventRepository;

  private static final String OPENAI_RESPONSES_ENDPOINT =
      "https://api.openai.com/v1/responses";
  private static final String GOOGLE_PATENTS_URL =
      "https://patents.google.com/?assignee=";
  private static final int RESULTS_PER_PAGE = 100;
  private static final String GOOGLE_PATENTS_PARAMS =
      "&num=" + RESULTS_PER_PAGE + "&dups=language";
  private static final String GOOGLE_PATENTS_PARAMS_SORTED_NEW =
      "&num=" + RESULTS_PER_PAGE + "&dups=language&sort=new";
  private static final int MAX_PAGES_TO_CHECK = 50;

  // Flag to enable/disable detailed HTML logging
  private static final boolean ENABLE_HTML_LOGGING = false;

  /**
   * Extracts the company name from a URL using OpenAI Responses API with web search.
   *
   * @param companyUrl The company URL
   * @return The company name
   */
  public String extractCompanyName(String companyUrl) {
    try {
      String prompt = "You are a helpful assistant that extracts the legal company name from a URL. "
          + "Return ONLY the official legal name of the company that owns this website. "
          + "Do not include any explanations, just the company name. "
          + "If you cannot determine the company name, respond with 'Unknown'.\n\n"
          + "Extract the legal company name from this URL: " + companyUrl;

      String extractedText = openAiClient.makeO3TextWithWebSearch(prompt);

      if (extractedText != null) {
        extractedText = extractedText.trim();
        if (extractedText.startsWith("\"") && extractedText.endsWith("\"")) {
          extractedText = extractedText.substring(1, extractedText.length() - 1);
        }
        return extractedText;
      }

      throw new RuntimeException("Failed to extract company name from OpenAI response");
    } catch (Exception e) {
      log.warn("Error extracting company name from URL {}: {}", companyUrl, e.getMessage());
      return "Unknown";
    }
  }

  /**
   * Logs the HTML content of a page for debugging purposes.
   *
   * @param driver The WebDriver instance
   * @param url The URL the page was fetched from
   * @param companyName The company name being searched
   */
  private void logHtmlContent(WebDriver driver, String url, String companyName) {
    if (!ENABLE_HTML_LOGGING) {
      return;
    }

    try {
      // Log basic HTML structure
      log.info("HTML document title: {}", driver.getTitle());
      log.info("HTML document structure summary:");

      // Use JavaScript to count elements since we can't use Jsoup selectors
      JavascriptExecutor js = (JavascriptExecutor) driver;

      // Log key elements that might contain patent information
      log.info("Count elements: {}",
          executeJsCount(js, "document.querySelectorAll('div.count')"));
      log.info("Search result elements: {}",
          executeJsCount(js, "document.querySelectorAll('search-result, search-result-item')"));
      log.info("Patent span elements: {}",
          executeJsCount(js, "document.querySelectorAll('span[data-proto=\"OPEN_PATENT_PDF\"]')"));
      log.info("State modifier elements: {}",
          executeJsCount(js, "document.querySelectorAll('state-modifier.result-title[data-result]')"));

      // Log HTML structure of key elements
      String countElementsHtml = (String) js.executeScript(
          "var elements = document.querySelectorAll('div.count'); "
          + "return elements.length > 0 ? elements[0].outerHTML : '';");

      if (!countElementsHtml.isEmpty()) {
        log.info("Count element HTML: {}", countElementsHtml);
      }

      // Log a sample of search results if available
      String searchResultHtml = (String) js.executeScript(
          "var elements = document.querySelectorAll('search-result, search-result-item'); "
          + "return elements.length > 0 ? elements[0].outerHTML : '';");

      if (!searchResultHtml.isEmpty()) {
        // HTML content available but not logged to reduce log verbosity
      }


    } catch (Exception e) {
      log.error("Error logging HTML content: {}", e.getMessage(), e);
    }
  }

  /**
   * Helper method to execute JavaScript to count elements.
   *
   * @param js The JavascriptExecutor
   * @param selector The CSS selector to count
   * @return The count of elements
   */
  private int executeJsCount(JavascriptExecutor js, String selector) {
    try {
      Long count = (Long) js.executeScript("return " + selector + ".length;");
      return count.intValue();
    } catch (Exception e) {
      log.warn("Error counting elements with selector {}: {}", selector, e.getMessage());
      return 0;
    }
  }



  /**
   * Counts patents for a company by searching Google Patents with optional EU and grants filtering.
   *
   * @param companyName The company name
   * @param companyUrl The company URL
   * @param euOnly If true, search only European Patent Office (EP) patents
   * @param grantsOnly If true, search only granted patents (not applications)
   * @param countOnly If true, return only the total count without scraping all pages
   * @param saveToDatabase If true, save the patent data to the database
   * @return A PatentCountModel with the results
   */
  public PatentCountModel countPatents(String companyName, String companyUrl, boolean euOnly, boolean grantsOnly, boolean countOnly, boolean saveToDatabase) {
    WebDriver driver = null;
    try {
      // Encode the company name for the URL (with commas preserved)
      String encodedCompanyName = URLEncoder.encode(companyName, StandardCharsets.UTF_8.toString());
      String baseSearchUrl = GOOGLE_PATENTS_URL + encodedCompanyName + GOOGLE_PATENTS_PARAMS;

      // Add country parameter for EU-only search
      if (euOnly) {
        baseSearchUrl += "&country=EP";
      }

      // Add status parameter for grants-only search
      if (grantsOnly) {
        baseSearchUrl += "&status=GRANT";
      }

      log.info("Base search URL (EU only: {}, Grants only: {}): {}", euOnly, grantsOnly, baseSearchUrl);
      log.info("Starting patent count for company: {}", companyName);

      // Sets to store unique patent information
      Set<String> uniquePatentNumbers = new HashSet<>();
      Set<String> uniqueGrantedPatentNumbers = new HashSet<>();
      Set<String> uniqueApplicationNumbers = new HashSet<>();
      List<PatentDetail> patentDetails = new ArrayList<>();
      boolean hasMorePages = true;
      int currentPage = 0; // Start at page 0 (no page parameter for first page)

      // Create a ChromeDriver using our utility class
      driver = CompanyExtractorUtils.createChromeDriver();

      // Set up WebDriverWait for dynamic content - reduced for quick mode
      int waitTimeout = countOnly ? 10 : 30; // Use shorter timeout for quick count mode
      WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(waitTimeout));

      // Process pages until we hit the max or run out of results
      while (hasMorePages && currentPage <= MAX_PAGES_TO_CHECK) {
        String pageUrl = baseSearchUrl;
        if (currentPage > 0) {
          // For page 1 and above, add the page parameter
          pageUrl = baseSearchUrl + "&page=" + currentPage;
        }

        log.info("Fetching page {}: {}", currentPage, pageUrl);

        try {
          // Navigate to the Google Patents page
          driver.get(pageUrl);

          // Wait for the page to load - look for either search results or a "no results" indicator
          try {
            wait.until(ExpectedConditions.or(
                ExpectedConditions.presenceOfElementLocated(By.cssSelector("search-result, search-result-item")),
                ExpectedConditions.presenceOfElementLocated(By.cssSelector("div.count")),
                ExpectedConditions.presenceOfElementLocated(By.cssSelector("div.no-results"))
            ));
          } catch (TimeoutException e) {
            log.warn("Timeout waiting for page elements to load: {}", e.getMessage());
          }

          // Log successful page fetch
          log.debug("Successfully fetched HTML from Google Patents for page {}", currentPage);
          logHtmlContent(driver, pageUrl, companyName);

          // For quick count mode only, extract the total count from the first page
          if (currentPage == 0 && countOnly) {
            // Analyze the page to determine what we're dealing with
            ScrapeResult pageStatus = analyzePage(driver);
            
            if (pageStatus == ScrapeResult.UNSUCCESSFUL) {
              log.warn("Quick count mode: Page analysis unsuccessful for company: {} - not saving data", companyName);
              // Return null or a special indicator that we couldn't determine the count
              return PatentCountModel.builder()
                  .companyName(companyName)
                  .patentCount(-1)  // Use -1 to indicate unsuccessful scrape
                  .grantedPatentCount(0)
                  .applicationCount(0)
                  .searchUrl(baseSearchUrl)
                  .companyUrl(companyUrl)
                  .error("Unable to determine patent count - page might be blocked or failed to load")
                  .build();
            }
            
            if (pageStatus == ScrapeResult.NO_RESULTS) {
              log.info("Quick count mode: No patents found for company: {}", companyName);
              return PatentCountModel.builder()
                  .companyName(companyName)
                  .patentCount(0)
                  .grantedPatentCount(0)
                  .applicationCount(0)
                  .searchUrl(baseSearchUrl)
                  .companyUrl(companyUrl)
                  .build();
            }
            
            // Try to extract total count for quick mode
            String totalCountStr = extractTotalCount(driver);
            if (totalCountStr != null) {
              try {
                int totalCount = Integer.parseInt(totalCountStr.replace(",", ""));
                log.info("Quick count mode: returning total count {} without detailed scraping", totalCount);
                return PatentCountModel.builder()
                    .companyName(companyName)
                    .patentCount(totalCount)
                    .grantedPatentCount(grantsOnly ? totalCount : 0) // If grants only, assume all are granted
                    .applicationCount(grantsOnly ? 0 : totalCount) // If not grants only, assume all are applications
                    .searchUrl(baseSearchUrl)
                    .companyUrl(companyUrl)
                    .build();
              } catch (NumberFormatException e) {
                log.warn("Quick count mode: Could not parse total count: {}", totalCountStr);
                // Fall through to try counting actual results
              }
            } else {
              log.debug("Quick count mode: Could not extract total count from page");
              // Fall through to try counting actual results
            }
          }

          // Extract patent information from the current page
          List<PatentInfo> patents = extractPatentInformation(driver);
          if (patents.isEmpty()) {
            log.info("No patents found on page {}, stopping pagination", currentPage);
            hasMorePages = false;
          } else if (patents.size() < RESULTS_PER_PAGE) {
            // If we found fewer patents than the maximum per page, we've likely reached the end
            log.info("Found {} patents on page {} (less than the maximum {}), likely the last page",
                patents.size(), currentPage, RESULTS_PER_PAGE);

            // Process patents and separate granted from applications
            for (PatentInfo patentInfo : patents) {
              uniquePatentNumbers.add(patentInfo.getPatentNumber());
              if (patentInfo.isGranted()) {
                uniqueGrantedPatentNumbers.add(patentInfo.getPatentNumber());
              } else {
                uniqueApplicationNumbers.add(patentInfo.getPatentNumber());
              }

              // Convert PatentInfo to PatentDetail and add to list
              PatentDetail detail = PatentDetail.builder()
                  .patentNumber(patentInfo.getPatentNumber())
                  .title(patentInfo.getTitle())
                  .inventor(patentInfo.getInventor())
                  .assignee(patentInfo.getAssignee())
                  .publicationDate(patentInfo.getPublicationDate())
                  .filedDate(patentInfo.getFiledDate())
                  .priorityDate(patentInfo.getPriorityDate())
                  .grantDate(patentInfo.getGrantDate())
                  .abstractText(patentInfo.getAbstractText())
                  .pdfUrl(patentInfo.getPdfUrl())
                  .patentUrl(patentInfo.getPatentUrl())
                  .isGranted(patentInfo.isGranted())
                  .jurisdictions(patentInfo.getJurisdictions())
                  .build();
              patentDetails.add(detail);
            }
            hasMorePages = false; // Stop pagination as we've likely reached the end
          } else {
            log.info("Found {} patents on page {}", patents.size(), currentPage);

            // Process patents and separate granted from applications
            for (PatentInfo patentInfo : patents) {
              uniquePatentNumbers.add(patentInfo.getPatentNumber());
              if (patentInfo.isGranted()) {
                uniqueGrantedPatentNumbers.add(patentInfo.getPatentNumber());
              } else {
                uniqueApplicationNumbers.add(patentInfo.getPatentNumber());
              }

              // Convert PatentInfo to PatentDetail and add to list
              PatentDetail detail = PatentDetail.builder()
                  .patentNumber(patentInfo.getPatentNumber())
                  .title(patentInfo.getTitle())
                  .inventor(patentInfo.getInventor())
                  .assignee(patentInfo.getAssignee())
                  .publicationDate(patentInfo.getPublicationDate())
                  .filedDate(patentInfo.getFiledDate())
                  .priorityDate(patentInfo.getPriorityDate())
                  .grantDate(patentInfo.getGrantDate())
                  .abstractText(patentInfo.getAbstractText())
                  .pdfUrl(patentInfo.getPdfUrl())
                  .patentUrl(patentInfo.getPatentUrl())
                  .isGranted(patentInfo.isGranted())
                  .jurisdictions(patentInfo.getJurisdictions())
                  .build();
              patentDetails.add(detail);
            }
            currentPage++;
          }
        } catch (Exception e) {
          log.error("Error processing page {}: {}", currentPage, e.getMessage());
          hasMorePages = false;
        }
      }

      // Calculate final counts based on actual patents found
      int finalCount = uniquePatentNumbers.size();

      int grantedCount = uniqueGrantedPatentNumbers.size();
      int applicationCount = uniqueApplicationNumbers.size();

      List<String> patentList = new ArrayList<>(uniquePatentNumbers);
      List<String> grantedPatentList = new ArrayList<>(uniqueGrantedPatentNumbers);
      List<String> applicationList = new ArrayList<>(uniqueApplicationNumbers);

      log.info("Total unique patents found: {} (Granted: {}, Applications: {})",
               finalCount, grantedCount, applicationCount);

      PatentCountModel result = PatentCountModel.builder()
              .companyName(companyName)
              .patentCount(finalCount)
              .grantedPatentCount(grantedCount)
              .applicationCount(applicationCount)
              .searchUrl(baseSearchUrl)
              .companyUrl(companyUrl)
              .patentNumbers(patentList)
              .grantedPatentNumbers(grantedPatentList)
              .applicationNumbers(applicationList)
              .patentDetails(patentDetails)
              .build();
      
      // Save patents to database only if requested AND we didn't encounter issues
      if (saveToDatabase && finalCount >= 0) {  // Only save if count is valid (not -1)
        savePatentsToDatabase(companyName, result);
      } else if (finalCount < 0) {
        log.info("Not saving to database due to unsuccessful scrape for company: {}", companyName);
      } else {
        log.info("Skipping database save (read-only mode) for company: {}", companyName);
      }
      
      return result;

    } catch (Exception e) {
      log.error("Error counting patents: {}", e.getMessage(), e);
      return PatentCountModel.builder()
              .companyName(companyName)
              .patentCount(0)
              .grantedPatentCount(0)
              .applicationCount(0)
              .searchUrl(GOOGLE_PATENTS_URL + UriUtils.encode(companyName, StandardCharsets.UTF_8) + GOOGLE_PATENTS_PARAMS)
              .companyUrl(companyUrl)
              .error("Error counting patents: " + e.getMessage())
              .build();
    } finally {
      // Always close the WebDriver to avoid resource leaks
      if (driver != null) {
        try {
          driver.quit();
        } catch (Exception e) {
          log.warn("Error closing WebDriver: {}", e.getMessage());
        }
      }
    }
  }

  /**
   * Checks if the page shows "No results found" message.
   *
   * @param driver The WebDriver instance
   * @return true if no results were found, false otherwise
   */
  private boolean checkForNoResults(WebDriver driver) {
    try {
      // Check for "No results found" message using multiple selectors
      List<WebElement> noResultsElements = driver.findElements(By.cssSelector("#noResultsMessage"));
      if (!noResultsElements.isEmpty()) {
        String text = noResultsElements.get(0).getText();
        if (text != null && text.toLowerCase().contains("no results found")) {
          log.info("Found 'No results found' message on the page");
          return true;
        }
      }
      
      // Try alternative selector
      noResultsElements = driver.findElements(By.cssSelector("div.no-results"));
      if (!noResultsElements.isEmpty()) {
        log.info("Found no-results div on the page");
        return true;
      }
      
      // Check for text content containing "No results found" anywhere on the page
      JavascriptExecutor js = (JavascriptExecutor) driver;
      Boolean hasNoResults = (Boolean) js.executeScript(
          "return document.body.textContent.includes('No results found');"
      );
      
      if (Boolean.TRUE.equals(hasNoResults)) {
        log.info("Found 'No results found' text in page content");
        return true;
      }
      
    } catch (Exception e) {
      log.warn("Error checking for no results: {}", e.getMessage());
    }
    
    return false;
  }

  /**
   * Analyzes the page to determine if we found results, no results, or encountered an issue.
   *
   * @param driver The WebDriver instance
   * @return ScrapeResult indicating the outcome of the page analysis
   */
  private ScrapeResult analyzePage(WebDriver driver) {
    // First check if there's an explicit "no results" message
    if (checkForNoResults(driver)) {
      log.info("Page explicitly shows 'No results found'");
      return ScrapeResult.NO_RESULTS;
    }
    
    // Check if we can find any patent-related elements on the page
    try {
      List<WebElement> patentElements = driver.findElements(
          By.cssSelector("search-result-item, state-modifier.result-title[data-result], search-result"));
      
      if (!patentElements.isEmpty()) {
        log.info("Found {} potential patent elements on page", patentElements.size());
        return ScrapeResult.RESULTS_FOUND;
      }
      
      // No clear indication - might be blocked, error page, etc.
      log.warn("No patent elements found and no 'No results' message - page might be blocked or failed to load");
      return ScrapeResult.UNSUCCESSFUL;
      
    } catch (Exception e) {
      log.error("Error analyzing page: {}", e.getMessage());
      return ScrapeResult.UNSUCCESSFUL;
    }
  }

  /**
   * Extracts the total count of patents from the Google Patents page.
   *
   * @param driver The WebDriver instance
   * @return The total count as a string, or null if not found
   */
  private String extractTotalCount(WebDriver driver) {
    try {
      log.info("Attempting to extract total patent count from page");

      // Log the title of the page for context
      log.info("Page title: {}", driver.getTitle());

      // Use JavaScript to access elements
      JavascriptExecutor js = (JavascriptExecutor) driver;

      // Enhanced selectors - try the most likely ones first
      String[] enhancedSelectors = {
        "#numResultsLabel",                           // Direct ID from original example
        "#count span:not(.headerButton):not([class*='dropdown'])", // Count container but not dropdown
        "span.style-scope.search-results:not([class*='dropdown'])", // From current HTML structure
        "div.count",                                  // Original selector
        "div.count-number",
        "div.results-count", 
        "div.patent-count",
        "div[data-count]"
      };

      for (String selector : enhancedSelectors) {
        try {
          List<WebElement> elements = driver.findElements(By.cssSelector(selector));
          log.debug("Selector '{}' found {} elements", selector, elements.size());
          
          for (WebElement element : elements) {
            String text = element.getText();
            if (text != null && !text.trim().isEmpty()) {
              log.debug("Found text with selector '{}': {}", selector, text);
              
              // Extract the number from text like "About 1,234 results" or just "1,234"
              Pattern pattern = Pattern.compile("\\b(\\d{1,3}(?:,\\d{3})+|\\d{1,6})\\b");
              Matcher matcher = pattern.matcher(text);
              if (matcher.find()) {
                String count = matcher.group(1);
                log.info("Successfully extracted count '{}' using selector '{}'", count, selector);
                return count;
              }
            }
          }
        } catch (Exception e) {
          log.debug("Error with selector '{}': {}", selector, e.getMessage());
        }
      }

      // Try JavaScript approach for dynamic content
      try {
        String jsResult = (String) js.executeScript(
            "var allElements = document.querySelectorAll('*');" +
            "for (var i = 0; i < allElements.length; i++) {" +
            "  var text = allElements[i].textContent || '';" +
            "  if (text.match(/About\\s+[\\d,]+\\s+results/i) || text.match(/^[\\d,]+$/)) {" +
            "    return text;" +
            "  }" +
            "}" +
            "return '';");

        if (jsResult != null && !jsResult.isEmpty()) {
          log.debug("Found count text using JavaScript: {}", jsResult);
          Pattern pattern = Pattern.compile("\\b(\\d{1,3}(?:,\\d{3})+|\\d{1,6})\\b");
          Matcher matcher = pattern.matcher(jsResult);
          if (matcher.find()) {
            String count = matcher.group(1);
            log.info("Successfully extracted count from JavaScript: {}", count);
            return count;
          }
        }
      } catch (Exception e) {
        log.debug("Error executing JavaScript to find count: {}", e.getMessage());
      }

      // AI Fallback - when all selectors fail
      log.info("All selectors failed, trying AI extraction as fallback");
      String aiExtractedCount = extractCountUsingAI(driver);
      if (aiExtractedCount != null) {
        log.info("Successfully extracted count using AI: {}", aiExtractedCount);
        return aiExtractedCount;
      }

      log.warn("Failed to extract total count from any method (selectors + AI)");
      return null;
    } catch (Exception e) {
      log.error("Error extracting total count: {}", e.getMessage(), e);
      return null;
    }
  }

  /**
   * Extracts the patent count using OpenAI when CSS selectors fail.
   *
   * @param driver The WebDriver instance
   * @return The extracted count as a string, or null if extraction fails
   */
  private String extractCountUsingAI(WebDriver driver) {
    try {
      // Get page source and truncate to avoid token limits
      String pageSource = driver.getPageSource();
      String truncatedHtml = pageSource.length() > 8000 ? pageSource.substring(0, 8000) : pageSource;
      List<Map<String, String>> messages = new ArrayList<>();

      Map<String, String> systemMessage = new HashMap<>();
      systemMessage.put("role", "system");
      systemMessage.put("content", "You are a helpful assistant that extracts patent counts from HTML. "
          + "Look for text patterns like 'About X results', 'X results', or standalone numbers that represent "
          + "the total count of patent search results. Return ONLY a JSON response in this exact format: "
          + "{\"count\": \"NUMBER\"} where NUMBER is just the digits (no commas). If you cannot find a count, "
          + "return {\"count\": null}.");
      messages.add(systemMessage);

      Map<String, String> userMessage = new HashMap<>();
      userMessage.put("role", "user");
      userMessage.put("content", "Extract the total patent count from this Google Patents search results HTML: "
          + truncatedHtml);
      messages.add(userMessage);

      String aiResponse = openAiClient.makeChatCompletion(messages);

      return parseAiCountResponse(aiResponse);
    } catch (Exception e) {
      log.warn("Error during AI count extraction: {}", e.getMessage());
    }
    return null;
  }

  /**
   * Parses the OpenAI API response to extract the patent count.
   *
   * @param responseBody The JSON response from OpenAI
   * @return The extracted count as a string, or null if parsing fails
   */
  private String parseAiCountResponse(String responseBody) {
    try {
      Map<String, Object> aiResponse = objectMapper.readValue(responseBody, Map.class);
      Object countObj = aiResponse.get("count");

      if (countObj != null && !"null".equals(countObj.toString())) {
        String count = countObj.toString().replaceAll("[^0-9]", "");
        if (!count.isEmpty()) {
          log.info("AI successfully extracted count: {}", count);
          return count;
        }
      }
    } catch (Exception e) {
      log.warn("Error parsing AI response: {}", e.getMessage());
    }
    return null;
  }



  /**
   * Extracts patent information from a Google Patents search results page.
   *
   * @param driver The WebDriver instance
   * @return List of PatentInfo objects containing patent numbers and granted status
   */
  private List<PatentInfo> extractPatentInformation(WebDriver driver) {
    List<PatentInfo> patents = new ArrayList<>();
    try {
      log.info("Attempting to extract patent information from page");
      JavascriptExecutor js = (JavascriptExecutor) driver;

      // Look for search result items (articles)
      List<WebElement> searchResultItems = driver.findElements(By.cssSelector("search-result-item article.result"));
      log.info("Found {} search result items", searchResultItems.size());

      for (WebElement resultItem : searchResultItems) {
        try {
          // Extract patent number from state-modifier data-result attribute
          WebElement stateModifier = resultItem.findElement(By.cssSelector("state-modifier.result-title[data-result]"));
          String dataResult = stateModifier.getAttribute("data-result");

          if (dataResult != null && dataResult.startsWith("patent/")) {
            String[] parts = dataResult.split("/");
            if (parts.length > 1) {
              String patentNumber = parts[1];

              // Extract dates information to determine if granted
              List<WebElement> datesElements = resultItem.findElements(
                  By.cssSelector("h4.dates, h4.dates.style-scope, h4[class*='dates']"));
              boolean isGranted = false;
              String datesText = "";

              if (!datesElements.isEmpty()) {
                datesText = datesElements.get(0).getText();
                // log.info("Patent {} dates: {}", patentNumber, datesText);

                // Check if the dates text contains "Granted"
                isGranted = datesText.toLowerCase().contains("granted");
                // log.info("Patent {} - Dates text: '{}', isGranted: {}", patentNumber, datesText, isGranted);
              } else {
                log.warn("Patent {} - No dates elements found! Trying alternative selectors...", patentNumber);

                // Try alternative selectors for dates
                String[] alternativeSelectors = {"h4", ".dates", "[class*='dates']"};
                for (String selector : alternativeSelectors) {
                  List<WebElement> altElements = resultItem.findElements(By.cssSelector(selector));
                  log.info("Alternative selector '{}' found {} elements", selector, altElements.size());
                  for (WebElement element : altElements) {
                    String text = element.getText();
                    if (text.toLowerCase().contains("granted")
                        || text.toLowerCase().contains("filed")
                        || text.toLowerCase().contains("published")) {
                      log.info("Found dates-like text with selector '{}': {}", selector, text);
                      datesText = text;
                      isGranted = text.toLowerCase().contains("granted");
                      break;
                    }
                  }
                  if (!datesText.isEmpty()) {
                    break;
                  }
                }
              }

              // Extract detailed information
              String title = extractPatentTitle(resultItem);
              String inventor = extractPatentInventor(resultItem);
              String assignee = extractPatentAssignee(resultItem);
              String publicationDate = extractDateFromText(datesText, "Published");
              String filedDate = extractDateFromText(datesText, "Filed");
              String priorityDate = extractDateFromText(datesText, "Priority");
              String grantedDate = extractDateFromText(datesText, "Granted");
              String abstractText = extractPatentAbstract(resultItem, title);
              String pdfUrl = extractPdfUrl(resultItem);
              String patentUrl = "https://patents.google.com/patent/" + patentNumber;
              String jurisdictions = extractJurisdictions(resultItem);

              // Use granted date as publication date if patent is granted
              if (isGranted && !grantedDate.isEmpty()) {
                publicationDate = grantedDate;
              }

              PatentInfo patentInfo = new PatentInfo(
                  patentNumber, isGranted, title, inventor, assignee,
                  publicationDate, filedDate, priorityDate, grantedDate, abstractText, pdfUrl, 
                  patentUrl, jurisdictions
              );
              patents.add(patentInfo);
              // log.info("Found detailed patent: {} (granted: {}, title: {})", patentNumber, isGranted, title);
            }
          }
        } catch (Exception e) {
          log.warn("Error processing search result item: {}", e.getMessage());
        }
      }

      // If we didn't find any patents with the first method, try fallback methods
      if (patents.isEmpty()) {
        log.info("Primary method found no patents, trying fallback methods");

        // Fallback Method: Try state-modifier elements with data-result attribute (without dates context)
        List<WebElement> stateModifiers = driver.findElements(By.cssSelector("state-modifier.result-title[data-result]"));
        log.info("Fallback: Found {} state-modifier elements", stateModifiers.size());

        if (!stateModifiers.isEmpty()) {
          WebElement firstModifier = stateModifiers.get(0);
          log.info("Sample state-modifier HTML: {}", firstModifier.getAttribute("outerHTML"));
          log.info("Sample data-result attribute: {}", firstModifier.getAttribute("data-result"));
        }

        for (WebElement modifier : stateModifiers) {
          String dataResult = modifier.getAttribute("data-result");
          log.info("Processing data-result: {}", dataResult);

          // Parse patent number from format "patent/US9933271B2/en"
          if (dataResult != null && dataResult.startsWith("patent/")) {
            String[] parts = dataResult.split("/");
            if (parts.length > 1) {
              String patentNumber = parts[1];
              log.info("Extracted patent number from data-result: {}", patentNumber);

              // Since we can't determine granted status without dates context, mark as unknown (false)
              PatentInfo patentInfo = new PatentInfo(patentNumber, false);
              patents.add(patentInfo);
            }
          }
        }
      }

      // Method 3: As a last resort, look for search-result elements and count them
      if (patents.isEmpty()) {
        log.info("Fallback methods found no patents, trying final method");

        List<WebElement> searchResults = driver.findElements(By.cssSelector("search-result, search-result-item"));
        log.info("Final method: Found {} search-result elements", searchResults.size());

        if (!searchResults.isEmpty()) {
          WebElement firstResult = searchResults.get(0);
          log.info("Sample search-result HTML: {}", firstResult.getAttribute("outerHTML"));

          // Generate placeholder patent numbers as we couldn't extract the actual ones
          for (int i = 0; i < searchResults.size(); i++) {
            String placeholderNumber = "Unknown-" + i;
            log.info("Adding placeholder patent number: {}", placeholderNumber);
            PatentInfo patentInfo = new PatentInfo(placeholderNumber, false);
            patents.add(patentInfo);
          }
        }
      }

      // Method 4: Try using JavaScript to access shadow DOM elements
      if (patents.isEmpty()) {
        log.info("Previous methods found no patents, trying JavaScript to access shadow DOM");

        try {
          // Try to extract patent numbers using JavaScript
          @SuppressWarnings("unchecked")
          List<String> jsPatents = (List<String>) js.executeScript(
              "var patents = [];"
              + "var patentElements = document.querySelectorAll('span[data-proto=\"OPEN_PATENT_PDF\"]');"
              + "for (var i = 0; i < patentElements.length; i++) {"
              + "  var text = patentElements[i].textContent.trim();"
              + "  if (text) patents.push(text);"
              + "}"
              + "if (patents.length === 0) {"
              + "  var stateModifiers = document.querySelectorAll('state-modifier.result-title[data-result]');"
              + "  for (var i = 0; i < stateModifiers.length; i++) {"
              + "    var dataResult = stateModifiers[i].getAttribute('data-result');"
              + "    if (dataResult && dataResult.startsWith('patent/')) {"
              + "      var parts = dataResult.split('/');"
              + "      if (parts.length > 1) patents.push(parts[1]);"
              + "    }"
              + "  }"
              + "}"
              + "return patents;");

          if (jsPatents != null && !jsPatents.isEmpty()) {
            log.info("Found {} patent numbers using JavaScript", jsPatents.size());
            for (String patentNumber : jsPatents) {
              PatentInfo patentInfo = new PatentInfo(patentNumber, false); // Can't determine granted status via JS
              patents.add(patentInfo);
            }
          }
        } catch (Exception e) {
          log.warn("Error executing JavaScript to find patents: {}", e.getMessage());
        }
      }

      // Try additional selectors as a last resort
      if (patents.isEmpty()) {
        log.debug("All standard methods failed, trying additional selectors");

        // Try to find any elements that might contain patent information
        String[] additionalSelectors = {
          "a[href*='patent']",
          "div.result-title",
          "h3.result-title",
          "div.patent-result"
        };

        for (String selector : additionalSelectors) {
          List<WebElement> elements = driver.findElements(By.cssSelector(selector));
          log.debug("Additional selector {}: found {} elements", selector, elements.size());

          if (!elements.isEmpty()) {
            WebElement firstElement = elements.get(0);
            log.info("Sample element HTML for selector {}: {}", selector, firstElement.getAttribute("outerHTML"));

            // Try to extract patent numbers from href attributes
            if (selector.contains("href")) {
              for (WebElement element : elements) {
                String href = element.getAttribute("href");
                if (href != null && href.contains("patent/")) {
                  String[] parts = href.split("patent/");
                  if (parts.length > 1) {
                    String[] subParts = parts[1].split("/");
                    if (subParts.length > 0) {
                      String patentNumber = subParts[0];
                      log.info("Extracted patent number from href: {}", patentNumber);
                      PatentInfo patentInfo = new PatentInfo(patentNumber, false); // Can't determine granted status
                      patents.add(patentInfo);
                    }
                  }
                }
              }
            }
          }
        }
      }

      log.info("Total patent numbers extracted: {}", patents.size());
      return patents;
    } catch (Exception e) {
      log.error("Error extracting patent numbers: {}", e.getMessage(), e);
      return patents;
    }
  }

  /**
   * Process a company URL to get a quick patent count (first page only).
   *
   * @param companyUrl The company URL
   * @param euOnly If true, search only European Patent Office (EP) patents
   * @param grantsOnly If true, search only granted patents (not applications)
   * @return A PatentCountModel with just the total count (much faster)
   */
  public PatentCountModel processCompanyUrlQuick(String companyUrl, boolean euOnly, boolean grantsOnly) {
    // Company URL Extractor uses this, always saves to database
    return processCompanyUrlQuick(companyUrl, euOnly, grantsOnly, true);
  }

  /**
   * Process a company URL to get a quick patent count (first page only).
   *
   * @param companyUrl The company URL
   * @param euOnly If true, search only European Patent Office (EP) patents
   * @param grantsOnly If true, search only granted patents (not applications)
   * @param saveToDatabase If true, save the patent data to the database
   * @return A PatentCountModel with just the total count (much faster)
   */
  public PatentCountModel processCompanyUrlQuick(String companyUrl, boolean euOnly, boolean grantsOnly, boolean saveToDatabase) {
    try {
      // Format the URL properly
      String formattedUrl = CompanyExtractorUtils.formatUrl(companyUrl);
      log.debug("Processing URL for quick patent count: {}", formattedUrl);

      // Extract the company name
      String companyName = extractCompanyName(formattedUrl);
      log.debug("Extracted company name: {}", companyName);

      if ("Unknown".equals(companyName)) {
        return PatentCountModel.builder()
                .companyName("Unknown")
                .patentCount(0)
                .grantedPatentCount(0)
                .applicationCount(0)
                .searchUrl("")
                .companyUrl(formattedUrl)
                .error("Could not determine company name from URL")
                .build();
      }

      // Count patents with quick mode enabled
      return countPatents(companyName, formattedUrl, euOnly, grantsOnly, true, saveToDatabase);
    } catch (Exception e) {
      log.error("Error processing company URL for quick count: {}", e.getMessage(), e);
      return PatentCountModel.builder()
              .companyName("Error")
              .patentCount(0)
              .grantedPatentCount(0)
              .applicationCount(0)
              .searchUrl("")
              .companyUrl(companyUrl)
              .error("Error processing URL: " + e.getMessage())
              .build();
    }
  }


  /**
   * Process a company URL to count patents with optional EU and grants filtering.
   *
   * @param companyUrl The company URL
   * @param euOnly If true, search only European Patent Office (EP) patents
   * @param grantsOnly If true, search only granted patents (not applications)
   * @param saveToDatabase If true, save the patent data to the database
   * @return A PatentCountModel with the results
   */
  public PatentCountModel processCompanyUrl(String companyUrl, boolean euOnly, boolean grantsOnly, boolean saveToDatabase) {
    try {
      // Format the URL properly
      String formattedUrl = CompanyExtractorUtils.formatUrl(companyUrl);
      log.debug("Processing URL for patent count: {}", formattedUrl);

      // Extract the company name
      String companyName = extractCompanyName(formattedUrl);
      log.debug("Extracted company name: {}", companyName);

      if ("Unknown".equals(companyName)) {
        return PatentCountModel.builder()
                .companyName("Unknown")
                .patentCount(0)
                .grantedPatentCount(0)
                .applicationCount(0)
                .searchUrl("")
                .companyUrl(formattedUrl)
                .error("Could not determine company name from URL")
                .build();
      }

      // Count patents
      return countPatents(companyName, formattedUrl, euOnly, grantsOnly, false, saveToDatabase);
    } catch (Exception e) {
      log.error("Error processing company URL: {}", e.getMessage(), e);
      return PatentCountModel.builder()
              .companyName("Error")
              .patentCount(0)
              .grantedPatentCount(0)
              .applicationCount(0)
              .searchUrl("")
              .companyUrl(companyUrl)
              .error("Error processing URL: " + e.getMessage())
              .build();
    }
  }

  /**
   * Extracts patent title from a search result item.
   */
  private String extractPatentTitle(WebElement resultItem) {
    try {
      List<WebElement> titleElements = resultItem.findElements(
          By.cssSelector("h3.style-scope.search-result-item raw-html span"));
      if (!titleElements.isEmpty()) {
        return titleElements.get(0).getText().trim();
      }
      // Fallback: try other title selectors
      titleElements = resultItem.findElements(By.cssSelector("h3 span"));
      if (!titleElements.isEmpty()) {
        return titleElements.get(0).getText().trim();
      }
    } catch (Exception e) {
      log.debug("Could not extract title: {}", e.getMessage());
    }
    return "";
  }

  /**
   * Extracts patent inventor from a search result item.
   */
  private String extractPatentInventor(WebElement resultItem) {
    try {
      List<WebElement> metadataElements = resultItem.findElements(By.cssSelector("h4.metadata"));
      for (WebElement metadata : metadataElements) {
        String metadataText = metadata.getText();
        if (metadataText.toLowerCase().contains("inventor")) {
          return extractMetadataValue(metadataText, "inventor");
        }
      }
    } catch (Exception e) {
      log.debug("Could not extract inventor: {}", e.getMessage());
    }
    return "";
  }

  /**
   * Extracts patent assignee from a search result item.
   * The assignee is typically the last item in the metadata section.
   */
  private String extractPatentAssignee(WebElement resultItem) {
    try {
      List<WebElement> metadataElements = resultItem.findElements(By.cssSelector("h4.metadata"));
      for (WebElement metadata : metadataElements) {
        // Try to find spans with bullet-before class (these contain the individual metadata items)
        List<WebElement> bulletSpans = metadata.findElements(By.cssSelector("span.bullet-before"));
        if (!bulletSpans.isEmpty()) {
          // Get the last bullet span which should contain the assignee
          WebElement lastSpan = bulletSpans.get(bulletSpans.size() - 1);
          String assigneeText = lastSpan.getText().trim();
          if (!assigneeText.isEmpty()) {
            log.debug("Extracted assignee: {}", assigneeText);
            return assigneeText;
          }
        }

        // Fallback: split metadata text by bullet points and take the last item
        String metadataText = metadata.getText();
        String[] parts = metadataText.split("•");
        if (parts.length > 1) {
          String lastPart = parts[parts.length - 1].trim();
          if (!lastPart.isEmpty()) {
            log.debug("Extracted assignee from text: {}", lastPart);
            return lastPart;
          }
        }
      }
    } catch (Exception e) {
      log.debug("Could not extract assignee: {}", e.getMessage());
    }
    return "";
  }

  /**
   * Extracts patent abstract from a search result item.
   * Filters out text that matches the title to avoid duplicates.
   */
  private String extractPatentAbstract(
      final WebElement resultItem, final String title) {
    try {
      List<WebElement> abstractElements =
          resultItem.findElements(By.cssSelector("raw-html"));
      for (WebElement abstractElement : abstractElements) {
        String text = abstractElement.getText().trim();
        if (text.length() > 50) {
          // Skip if text matches or is similar to title
          if (isSimilarToTitle(text, title)) {
            continue;
          }
          return text;
        }
      }
    } catch (Exception e) {
      log.debug("Could not extract abstract: {}", e.getMessage());
    }
    return "";
  }

  /**
   * Checks if text is similar to the title (exact match, prefix match,
   * or high overlap).
   */
  private boolean isSimilarToTitle(final String text, final String title) {
    if (title == null || title.isEmpty()) {
      return false;
    }
    String textLower = text.toLowerCase();
    String titleLower = title.toLowerCase();
    // Exact match
    if (textLower.equals(titleLower)) {
      return true;
    }
    // Text starts with title (title may have been truncated)
    if (textLower.startsWith(titleLower)) {
      return true;
    }
    // Title starts with text (text may be truncated version of title)
    if (titleLower.startsWith(textLower)) {
      return true;
    }
    return false;
  }

  private String extractPdfUrl(WebElement resultItem) {
    try {
      List<WebElement> pdfLinks = resultItem.findElements(
          By.cssSelector("a.pdfLink"));
      if (!pdfLinks.isEmpty()) {
        String href = pdfLinks.get(0).getAttribute("href");
        if (href != null && !href.isEmpty() && href.contains(".pdf")) {
          log.debug("Found PDF URL: {}", href);
          return href;
        }
      }
      pdfLinks = resultItem.findElements(
          By.cssSelector("a[class*='pdfLink']"));
      if (!pdfLinks.isEmpty()) {
        String href = pdfLinks.get(0).getAttribute("href");
        if (href != null && !href.isEmpty() && href.contains(".pdf")) {
          log.debug("Found PDF URL with alternative selector: {}", href);
          return href;
        }
      }
    } catch (Exception e) {
      log.debug("Could not extract PDF URL: {}", e.getMessage());
    }
    return null;
  }

  private String extractJurisdictions(WebElement resultItem) {
    try {
      List<WebElement> metadataElements = resultItem.findElements(
          By.cssSelector("h4.metadata span[class*='style-scope']"));
      
      List<Map<String, String>> jurisdictionList = new ArrayList<>();
      
      for (WebElement span : metadataElements) {
        String className = span.getAttribute("class");
        String text = span.getText().trim();
        
        // Look for jurisdiction codes (usually 2-letter codes like WO, DE, US, EP, CN)
        if (text.length() <= 3 && text.matches("[A-Z]{2,3}")) {
          Map<String, String> jurisdiction = new HashMap<>();
          jurisdiction.put("code", text);
          
          if (className.contains("active")) {
            jurisdiction.put("status", "active");
          } else if (className.contains("not_active") 
                     || className.contains("unknown")) {
            jurisdiction.put("status", "not_active");
          } else {
            // Default to not_active if no clear status
            jurisdiction.put("status", "not_active");
          }
          
          jurisdictionList.add(jurisdiction);
        }
      }
      
      if (!jurisdictionList.isEmpty()) {
        // Convert to JSON string for storage
        ObjectMapper mapper = new ObjectMapper();
        String json = mapper.writeValueAsString(jurisdictionList);
        log.debug("Extracted jurisdictions: {}", json);
        return json;
      }
    } catch (Exception e) {
      log.debug("Could not extract jurisdictions: {}", e.getMessage());
    }
    return null;
  }

  /**
   * Extracts a specific date from dates text.
   * Handles formats like "Priority 2017-06-13 • Filed 2018-06-11 • Published 2018-12-19"
   */
  private String extractDateFromText(String datesText, String dateType) {
    try {
      // Pattern to match "dateType YYYY-MM-DD" (e.g., "Priority 2017-06-13")
      String pattern = dateType + "\\s+(\\d{4}-\\d{2}-\\d{2})";
      Pattern regex = Pattern.compile(pattern, Pattern.CASE_INSENSITIVE);
      Matcher matcher = regex.matcher(datesText);
      if (matcher.find()) {
        return matcher.group(1);
      }

      // Fallback pattern for other formats like "dateType: YYYY-MM-DD"
      String fallbackPattern = dateType + "\\s*[:\\-]\\s*(\\d{4}-\\d{2}-\\d{2})";
      Pattern fallbackRegex = Pattern.compile(fallbackPattern, Pattern.CASE_INSENSITIVE);
      Matcher fallbackMatcher = fallbackRegex.matcher(datesText);
      if (fallbackMatcher.find()) {
        return fallbackMatcher.group(1);
      }
    } catch (Exception e) {
      log.debug("Could not extract {} from dates text '{}': {}", dateType, datesText, e.getMessage());
    }
    return "";
  }

  /**
   * Extracts metadata value from metadata text.
   */
  private String extractMetadataValue(String metadataText, String metadataType) {
    try {
      String[] lines = metadataText.split("\n");
      for (String line : lines) {
        if (line.toLowerCase().contains(metadataType.toLowerCase())) {
          String[] parts = line.split(":", 2);
          if (parts.length > 1) {
            return parts[1].trim();
          }
        }
      }
    } catch (Exception e) {
      log.debug("Could not extract {} from metadata: {}", metadataType, e.getMessage());
    }
    return "";
  }
  
  /**
   * Gets existing patents for a company from the database.
   * @param companyId The company ID
   * @return PatentCountModel with existing patents or null if none found
   */
  public PatentCountModel getExistingPatents(Long companyId) {
    try {
      if (companyPatentRepository == null || companyExtractionDataRepository == null) {
        log.debug("Patent repositories not available");
        return null;
      }
      
      // Find the company
      CompanyExtractionData company = companyExtractionDataRepository.findById(companyId).orElse(null);
      if (company == null) {
        log.debug("Company not found with ID: {}", companyId);
        return null;
      }
      
      // Get all patents for this company
      List<CompanyPatent> patents = companyPatentRepository.findByCompanyExtractionDataIdOrderByScrapedAtDesc(companyId);
      
      if (patents.isEmpty()) {
        log.debug("No patents found for company ID: {}", companyId);
        return null;
      }
      
      // Convert to PatentDetail objects
      List<PatentDetail> patentDetails = patents.stream()
          .map(patent -> PatentDetail.builder()
              .patentNumber(patent.getPatentNumber())
              .title(patent.getTitle())
              .inventor(patent.getInventor())
              .assignee(patent.getAssignee())
              .publicationDate(patent.getPublicationDate())
              .filedDate(patent.getFiledDate())
              .priorityDate(patent.getPriorityDate())
              .grantDate(patent.getGrantDate())
              .expirationDate(patent.getExpirationDate())
              .abstractText(patent.getAbstractText())
              .pdfUrl(patent.getPdfUrl())
              .patentUrl(patent.getPatentUrl())
              .isGranted(patent.getIsGranted() != null ? patent.getIsGranted() : false)
              .jurisdictions(patent.getPatentJurisdictions())
              .citedByCount(patent.getCitedByCount())
              .citationsCount(patent.getCitationsCount())
              .patentStatus(patent.getPatentStatus())
              .primaryCpcCode(patent.getPrimaryCpcCode())
              .patentFamilyId(patent.getPatentFamilyId())
              .build())
          .collect(Collectors.toList());
      
      // Separate granted and applications
      List<String> grantedNumbers = patents.stream()
          .filter(p -> p.getIsGranted() != null && p.getIsGranted())
          .map(CompanyPatent::getPatentNumber)
          .collect(Collectors.toList());
      
      List<String> applicationNumbers = patents.stream()
          .filter(p -> p.getIsGranted() == null || !p.getIsGranted())
          .map(CompanyPatent::getPatentNumber)
          .collect(Collectors.toList());
      
      // Use the saved search URL if available, otherwise build a default one
      String searchUrl = company.getPatentSearchUrl();
      if (searchUrl == null || searchUrl.isEmpty()) {
        // Fallback: build URL if not saved (for backward compatibility)
        searchUrl = "https://patents.google.com/?assignee=" + 
            UriUtils.encode(company.getCompanyName(), StandardCharsets.UTF_8) + 
            "&num=100&dups=language";
        log.debug("No saved patent search URL for company {}, using default", company.getCompanyName());
      }
      
      // Build the result
      return PatentCountModel.builder()
          .companyName(company.getCompanyName())
          .patentCount(patents.size())
          .grantedPatentCount(grantedNumbers.size())
          .applicationCount(applicationNumbers.size())
          .patentNumbers(patents.stream().map(CompanyPatent::getPatentNumber).collect(Collectors.toList()))
          .grantedPatentNumbers(grantedNumbers)
          .applicationNumbers(applicationNumbers)
          .patentDetails(patentDetails)
          .searchUrl(searchUrl)
          .companyUrl(company.getCompanyUrl())
          .build();
      
    } catch (Exception e) {
      log.error("Error fetching existing patents: {}", e.getMessage(), e);
      return null;
    }
  }

  /**
   * Builds a per-year timeline of patent activity for a company.
   * Patents whose filed_date cannot be parsed into a year are excluded
   * from the timeline (but still exist in the underlying patent list).
   *
   * @param companyId The company ID
   * @return Sorted list of per-year entries; empty list if no patents
   */
  public List<PatentTimelineEntry> getPatentTimeline(Long companyId) {
    try {
      if (companyPatentRepository == null) {
        log.debug("Patent repository not available");
        return new ArrayList<>();
      }

      List<CompanyPatent> patents =
          companyPatentRepository.findByCompanyExtractionDataId(companyId);
      if (patents == null || patents.isEmpty()) {
        return new ArrayList<>();
      }

      Map<Integer, int[]> yearCounts = new TreeMap<>();
      for (CompanyPatent patent : patents) {
        Integer year = extractYear(patent.getFiledDate());
        if (year == null) {
          continue;
        }
        int[] counts = yearCounts.computeIfAbsent(year, y -> new int[2]);
        if (Boolean.TRUE.equals(patent.getIsGranted())) {
          counts[0]++;
        } else {
          counts[1]++;
        }
      }

      List<PatentTimelineEntry> result = new ArrayList<>();
      for (Map.Entry<Integer, int[]> entry : yearCounts.entrySet()) {
        result.add(PatentTimelineEntry.builder()
            .year(entry.getKey())
            .granted(entry.getValue()[0])
            .applications(entry.getValue()[1])
            .build());
      }
      return result;
    } catch (Exception e) {
      log.error("Error building patent timeline for company {}: {}",
          companyId, e.getMessage(), e);
      return new ArrayList<>();
    }
  }

  /**
   * Extracts a 4-digit year from a date string. The filed_date column is
   * VARCHAR(20) and may be YYYY-MM-DD, YYYY-MM, or YYYY. Returns null when
   * a sensible year cannot be parsed.
   *
   * @param dateStr Raw date string from the database
   * @return Parsed year or null if the input cannot be interpreted
   */
  private static Integer extractYear(String dateStr) {
    if (dateStr == null || dateStr.length() < 4) {
      return null;
    }
    String yearPart = dateStr.substring(0, 4);
    try {
      int year = Integer.parseInt(yearPart);
      if (year < 1800 || year > 2200) {
        return null;
      }
      return year;
    } catch (NumberFormatException e) {
      return null;
    }
  }

  /**
   * Saves patent data to the database if repositories are available.
   * @param companyName The company name to find the company record
   * @param result The PatentCountModel containing patent details to save
   */
  public void savePatentsToDatabase(String companyName, PatentCountModel result) {
    try {
      // Check if repositories are available (they might not be in test environments)
      if (companyPatentRepository == null || companyExtractionDataRepository == null) {
        log.debug("Patent repositories not available, skipping save");
        return;
      }
      
      // Skip if we had an unsuccessful scrape (indicated by -1 patent count)
      if (result.getPatentCount() < 0) {
        log.warn("Skipping database save for {} due to unsuccessful scrape", companyName);
        return;
      }
      
      // Skip if no patent details to save (but still update counts if it's a legitimate 0)
      if (result.getPatentDetails() == null || result.getPatentDetails().isEmpty()) {
        log.debug("No patent details to save for company: {}", companyName);
        // Continue to update counts even if no details
      }
      
      // Find the company by name
      List<CompanyExtractionData> companies = companyExtractionDataRepository.findByCompanyName(companyName);
      if (companies.isEmpty()) {
        log.warn("Company not found in database: {}", companyName);
        return;
      }
      
      CompanyExtractionData company = companies.get(0); // Take the first match
      if (companies.size() > 1) {
        log.warn("Multiple companies found with name '{}', using first match (ID: {})", companyName, company.getId());
      }
      
      // Check if we have previous patent data for this company
      boolean hasPreviousData = companyPatentRepository.findMostRecentScrapeDateForCompany(company).isPresent();
      
      // Update patent counts and search URL in company record
      company.setTotalPatents(result.getPatentCount());
      company.setGrantedPatents(result.getGrantedPatentCount());
      company.setPatentApplications(result.getApplicationCount());
      company.setPatentSearchUrl(result.getSearchUrl());
      companyExtractionDataRepository.save(company);
      log.info("Updated patent counts for company {}: total={}, granted={}, applications={}", 
               companyName, result.getPatentCount(), result.getGrantedPatentCount(), result.getApplicationCount());
      
      // Save each patent
      for (PatentDetail detail : result.getPatentDetails()) {
        try {
          // Check if patent already exists (with more detailed logging)
          boolean patentExists = companyPatentRepository.existsByCompanyExtractionDataAndPatentNumber(company, detail.getPatentNumber());
          if (patentExists) {
            log.debug("Patent {} already exists for company {}, skipping", detail.getPatentNumber(), companyName);
            continue;
          }

          log.debug("Creating new patent {} for company {}", detail.getPatentNumber(), companyName);

          // Create and save new patent
          CompanyPatent patent = new CompanyPatent()
              .setCompanyExtractionData(company)
              .setPatentNumber(detail.getPatentNumber())
              .setTitle(detail.getTitle())
              .setInventor(detail.getInventor())
              .setAssignee(detail.getAssignee())
              .setPublicationDate(detail.getPublicationDate())
              .setFiledDate(detail.getFiledDate())
              .setPriorityDate(detail.getPriorityDate())
              .setGrantDate(detail.getGrantDate())
              .setAbstractText(detail.getAbstractText())
              .setPatentUrl(detail.getPatentUrl())
              .setPdfUrl(detail.getPdfUrl())
              .setIsGranted(detail.isGranted())
              .setPatentJurisdictions(detail.getJurisdictions())
              .setScrapedAt(new java.util.Date());

          CompanyPatent savedPatent = companyPatentRepository.save(patent);
          log.info("Successfully saved new patent {} for company {}", detail.getPatentNumber(), companyName);

          // Only create event for new patent if we had previous data
          if (patentEventService != null && hasPreviousData) {
            // Double-check that we don't create duplicate events by checking if an event already exists
            boolean eventExists = patentEventRepository.existsByCompanyExtractionDataAndCompanyPatentAndEventType(
                company, savedPatent, "NEW_PATENT");

            if (!eventExists) {
              patentEventService.createEvent(
                  company,
                  savedPatent,
                  "NEW_PATENT"
              );
              log.info("Created NEW_PATENT event for {} (company had previous data)", detail.getPatentNumber());
            } else {
              log.warn("NEW_PATENT event already exists for patent {}, skipping duplicate", detail.getPatentNumber());
            }
          } else if (!hasPreviousData) {
            log.debug("Skipping NEW_PATENT event for {} (first time scraping company)", detail.getPatentNumber());
          }

        } catch (Exception e) {
          log.error("Error saving patent {} for company {}: {}", detail.getPatentNumber(), companyName, e.getMessage());
        }
      }
      
      log.info("Successfully saved {} patents for company {}", result.getPatentDetails().size(), companyName);

      // Group patents into families using AI
      if (patentFamilyGroupingService != null && result.getPatentCount() > 0) {
        try {
          int familyCount = patentFamilyGroupingService
              .groupPatentsForCompany(company.getId());
          log.info("Grouped patents into {} families for company {}",
              familyCount, companyName);
        } catch (Exception e) {
          log.warn("Failed to group patents into families for {}: {}",
              companyName, e.getMessage());
        }
      }

    } catch (Exception e) {
      log.error("Error saving patents to database for company {}: {}", companyName, e.getMessage(), e);
    }
  }
  
  /**
   * Checks for new patents for companies that haven't been checked recently.
   * This method is designed to be called periodically by a scheduled task.
   * 
   * @return Number of companies checked
   */
  @Transactional
  public int checkForNewPatents() {
    try {
      if (companyExtractionDataRepository == null || companyPatentRepository == null) {
        log.debug("Repositories not available, skipping patent check");
        return 0;
      }
      
      // Calculate date 3 months ago
      Calendar threeMonthsAgoCalendar = Calendar.getInstance();
      threeMonthsAgoCalendar.add(Calendar.MONTH, -3);
      Date threeMonthsAgo = threeMonthsAgoCalendar.getTime();
      
      // Find companies that haven't been checked recently (or ever)
      // Order by last_patent_check_at ASC (nulls first) to prioritize never-checked companies
      List<CompanyExtractionData> companies = companyExtractionDataRepository
          .findCompaniesForPatentUpdate(threeMonthsAgo,
              org.springframework.data.domain.PageRequest.of(0, COMPANIES_PER_UPDATE));
      
      if (companies.isEmpty()) {
        log.info("No companies need patent checking at this time");
        return 0;
      }
      
      log.info("Starting patent check for {} companies", companies.size());
      int companiesChecked = 0;
      
      for (CompanyExtractionData company : companies) {
        try {
          log.info("Checking patents for company: {} (ID: {})", 
                   company.getCompanyName(), company.getId());
          
          // Store the old patent count
          Integer oldPatentCount = company.getTotalPatents();
          
          // Perform optimized patent search for new patents only
          PatentCountModel result = checkForNewPatentsOptimized(company);

          if (result.getPatentCount() != null
              && result.getPatentCount() < 0) {
            log.warn("Skipping patent update for {} "
                + "(unsuccessful scrape)",
                company.getCompanyName());
            companiesChecked++;
            continue;
          }

          company.setTotalPatents(result.getPatentCount());
          company.setGrantedPatents(
              result.getGrantedPatentCount());
          company.setPatentApplications(
              result.getApplicationCount());
          company.setPatentSearchUrl(result.getSearchUrl());

          log.info("Updated patent counts for company {}: "
              + "total={}, granted={}, applications={}",
              company.getCompanyName(),
              result.getPatentCount(),
              result.getGrantedPatentCount(),
              result.getApplicationCount());

          company.setLastPatentCheckAt(new java.util.Date());
          companyExtractionDataRepository.save(company);
          
          // Check if we have previous patent data for this company
          boolean hasPreviousData = companyPatentRepository.findMostRecentScrapeDateForCompany(company).isPresent();
          
          // Check if patent count changed
          if (oldPatentCount != null && result.getPatentCount() > oldPatentCount) {
            int newPatents = result.getPatentCount() - oldPatentCount;
            log.info("Found {} new patent(s) for company: {}", newPatents, company.getCompanyName());
            
            // Only create event if we had previous data (not first scrape)
            if (patentEventService != null && hasPreviousData) {
              patentEventService.createEvent(
                  company,
                  null,  // No specific patent
                  "PATENT_COUNT_CHANGE",
                  String.valueOf(oldPatentCount),
                  String.valueOf(result.getPatentCount())
              );
              log.info("Created PATENT_COUNT_CHANGE event for {} ({}->{})", 
                  company.getCompanyName(), oldPatentCount, result.getPatentCount());
            } else if (!hasPreviousData) {
              log.debug("Skipping PATENT_COUNT_CHANGE event (first time scraping company)");
            }
            
            // If we want detailed info, trigger detail scraping for new patents
            if (patentDetailService != null && result.getPatentCount() > 0) {
              // Find patents without details
              List<Long> patentsNeedingDetails = companyPatentRepository
                  .findPatentIdsNeedingDetailsForCompany(company.getId(), 
                      org.springframework.data.domain.PageRequest.of(0, 10));
              if (!patentsNeedingDetails.isEmpty()) {
                log.info("Triggering detail scraping for {} new patents", patentsNeedingDetails.size());
                patentDetailService.scrapePatentDetailsManual(patentsNeedingDetails, -1); // Random delay
              }
            }
          }
          
          companiesChecked++;
          
          // Add variable delay between companies to avoid rate limiting
          if (companiesChecked < companies.size()) {
            int delaySeconds = CompanyExtractorUtils.getRandomDelaySeconds(20, 90);
            log.info("Waiting {} seconds before processing next company ({}/{})...", 
                     delaySeconds, companiesChecked, companies.size());
            Thread.sleep(delaySeconds * 1000L);
          }
          
        } catch (Exception e) {
          log.error("Error checking patents for company {}: {}", 
                   company.getCompanyName(), e.getMessage());
        }
      }
      
      log.info("Completed patent check for {} companies", companiesChecked);
      return companiesChecked;
      
    } catch (Exception e) {
      log.error("Error in checkForNewPatents: {}", e.getMessage(), e);
      return 0;
    }
  }
  
  /**
   * Optimized method to check for new patents using sort=new parameter.
   * Exits early when encountering a known patent.
   * 
   * @param company The company to check
   * @return PatentCountModel with the results
   */
  private PatentCountModel checkForNewPatentsOptimized(CompanyExtractionData company) {
    WebDriver driver = null;
    try {
      String encodedCompanyName = URLEncoder.encode(company.getCompanyName(), StandardCharsets.UTF_8.toString());
      // Use sort=new to get newest patents first
      String baseSearchUrl = GOOGLE_PATENTS_URL + encodedCompanyName + GOOGLE_PATENTS_PARAMS_SORTED_NEW;
      
      log.info("Checking for new patents with sort=new for company: {}", company.getCompanyName());
      
      // Get existing patent numbers for this company
      Set<String> existingPatentNumbers = new HashSet<>();
      List<CompanyPatent> existingPatents = companyPatentRepository
          .findByCompanyExtractionDataIdOrderByScrapedAtDesc(company.getId());
      for (CompanyPatent patent : existingPatents) {
        existingPatentNumbers.add(patent.getPatentNumber());
      }
      log.debug("Company has {} existing patents in database", existingPatentNumbers.size());
      
      // Initialize collections for new patents
      List<PatentDetail> newPatentDetails = new ArrayList<>();
      Set<String> newPatentNumbers = new HashSet<>();
      boolean foundExistingPatent = false;
      
      driver = CompanyExtractorUtils.createChromeDriver();
      WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(10));
      
      // Check first page (sorted by newest)
      driver.get(baseSearchUrl);
      
      // Wait for page to load
      try {
        wait.until(ExpectedConditions.or(
            ExpectedConditions.presenceOfElementLocated(By.cssSelector("search-result, search-result-item")),
            ExpectedConditions.presenceOfElementLocated(By.cssSelector("div.count")),
            ExpectedConditions.presenceOfElementLocated(By.cssSelector("div.no-results"))
        ));
      } catch (TimeoutException e) {
        log.warn("Timeout waiting for page elements to load: {}", e.getMessage());
      }
      
      // Check page status
      ScrapeResult pageStatus = analyzePage(driver);
      
      if (pageStatus == ScrapeResult.NO_RESULTS) {
        log.info("No patents found for company: {}", company.getCompanyName());
        return PatentCountModel.builder()
            .companyName(company.getCompanyName())
            .patentCount(0)
            .grantedPatentCount(0)
            .applicationCount(0)
            .searchUrl(baseSearchUrl)
            .companyUrl(company.getCompanyUrl())
            .build();
      }
      
      if (pageStatus == ScrapeResult.UNSUCCESSFUL) {
        log.warn("Page analysis unsuccessful for company: {}", company.getCompanyName());
        return PatentCountModel.builder()
            .companyName(company.getCompanyName())
            .patentCount(-1)
            .grantedPatentCount(0)
            .applicationCount(0)
            .searchUrl(baseSearchUrl)
            .companyUrl(company.getCompanyUrl())
            .error("Unable to determine patent count - page might be blocked")
            .build();
      }
      
      // Extract patents from page (they're sorted newest first)
      List<PatentInfo> patents = extractPatentInformation(driver);
      
      for (PatentInfo patentInfo : patents) {
        String patentNumber = patentInfo.getPatentNumber();
        
        // Check if we've seen this patent before
        if (existingPatentNumbers.contains(patentNumber)) {
          log.info("Found existing patent {}, stopping search (all newer patents processed)", patentNumber);
          foundExistingPatent = true;
          break;
        }
        
        // This is a new patent
        newPatentNumbers.add(patentNumber);
        
        // Convert to PatentDetail
        PatentDetail detail = PatentDetail.builder()
            .patentNumber(patentNumber)
            .title(patentInfo.getTitle())
            .inventor(patentInfo.getInventor())
            .assignee(patentInfo.getAssignee())
            .publicationDate(patentInfo.getPublicationDate())
            .filedDate(patentInfo.getFiledDate())
            .priorityDate(patentInfo.getPriorityDate())
            .grantDate(patentInfo.getGrantDate())
            .abstractText(patentInfo.getAbstractText())
            .pdfUrl(patentInfo.getPdfUrl())
            .patentUrl(patentInfo.getPatentUrl())
            .isGranted(patentInfo.isGranted())
            .jurisdictions(patentInfo.getJurisdictions())
            .build();
        newPatentDetails.add(detail);
      }
      
      // If we didn't find any existing patents on first page and there are more pages,
      // we might need to check more pages (but this is rare for regular checks)
      if (!foundExistingPatent && patents.size() == RESULTS_PER_PAGE) {
        log.warn("First page had {} new patents, may need to check more pages", patents.size());
        // For now, we'll just log this - in practice, 100 new patents at once is extremely rare
      }
      
      // Calculate new total count
      int newPatentsFound = newPatentNumbers.size();
      int totalPatents = existingPatentNumbers.size() + newPatentsFound;
      
      log.info("Found {} new patents for company {}", newPatentsFound, company.getCompanyName());
      
      // Build result
      PatentCountModel result = PatentCountModel.builder()
          .companyName(company.getCompanyName())
          .patentCount(totalPatents)
          .grantedPatentCount(0) // We'd need to count these properly
          .applicationCount(0)    // We'd need to count these properly
          .searchUrl(baseSearchUrl)
          .companyUrl(company.getCompanyUrl())
          .patentNumbers(new ArrayList<>(newPatentNumbers))
          .patentDetails(newPatentDetails)
          .build();
      
      // Save new patents to database
      if (!newPatentDetails.isEmpty()) {
        savePatentsToDatabase(company.getCompanyName(), result);
      }
      
      return result;
      
    } catch (Exception e) {
      log.error("Error checking for new patents: {}", e.getMessage(), e);
      return PatentCountModel.builder()
          .companyName(company.getCompanyName())
          .patentCount(-1)
          .grantedPatentCount(0)
          .applicationCount(0)
          .searchUrl("")
          .companyUrl(company.getCompanyUrl())
          .error("Error checking patents: " + e.getMessage())
          .build();
    } finally {
      if (driver != null) {
        try {
          driver.quit();
        } catch (Exception e) {
          log.warn("Error closing WebDriver: {}", e.getMessage());
        }
      }
    }
  }
}
