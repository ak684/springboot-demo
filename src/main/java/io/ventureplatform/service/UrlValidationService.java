package io.ventureplatform.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.ventureplatform.entity.CompanyExtractionData;
import io.ventureplatform.entity.UrlValidationEvent;
import io.ventureplatform.repository.CompanyExtractionDataRepository;
import io.ventureplatform.repository.UrlValidationEventRepository;
import io.ventureplatform.service.external.OpenAiClient;
import io.ventureplatform.util.CompanyExtractorUtils;

import java.time.Duration;
import java.util.Date;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

/**
 * Service for validating company URLs using AI web search.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UrlValidationService {

  private final CompanyExtractionDataRepository companyRepository;
  private final UrlValidationEventRepository eventRepository;
  private final ObjectMapper objectMapper;
  private final RestTemplate restTemplate;
  private final OpenAiClient openAiClient;

  /**
   * Result of URL validation check.
   */
  @Data
  public static class UrlCheckResult {
    private String status; // OK | NEEDS_UPDATE | BROKEN
    private String currentUrl;
    private String explanation;

    public boolean shouldUpdateUrl() {
      return "NEEDS_UPDATE".equals(status) && currentUrl != null;
    }

    public boolean hasIssue() {
      return "BROKEN".equals(status);
    }

    public boolean isOk() {
      return "OK".equals(status);
    }
  }

  /**
   * Result of Selenium HTML fetch.
   */
  @Data
  @AllArgsConstructor
  private static class SeleniumFetchResult {
    private final String html;
    private final String finalUrl;
    private final String pageTitle;
    private final int statusCode;
    private String errorMessage;

    public SeleniumFetchResult(final String html,
      final String finalUrl,
      final String pageTitle,
      final int statusCode) {
      this.html = html;
      this.finalUrl = finalUrl;
      this.pageTitle = pageTitle;
      this.statusCode = statusCode;
      this.errorMessage = null;
    }

    public boolean isSuccess() {
      return html != null && !html.isEmpty();
    }
  }


  /**
   * Check a specific URL by fetching HTML and analyzing with AI.
   *
   * @param url The URL to check
   * @param companyName The company name for context
   * @return Result of the URL validation
   */
  public UrlCheckResult checkUrl(final String url,
    final String companyName) {
    return checkUrl(url, companyName, null);
  }

  /**
   * Check URL with optional context from previous attempts.
   *
   * @param url The URL to check
   * @param companyName The company name
   * @param previousAttemptContext Context from previous attempts
   * @return Result of the URL validation
   */
  public UrlCheckResult checkUrl(final String url,
    final String companyName,
    final String previousAttemptContext) {

    log.info("Checking URL {} for company: {}", url, companyName);

    try {
      SeleniumFetchResult fetchResult = fetchHtmlWithSelenium(url);

      if (!fetchResult.isSuccess()) {
        UrlCheckResult result = new UrlCheckResult();
        result.setStatus("BROKEN");
        result.setExplanation("Could not fetch URL: "
          + fetchResult.getErrorMessage());
        return result;
      }

      String html = fetchResult.getHtml();
      log.info("Fetched {} chars of HTML from {}", html.length(), url);

      // Build comprehensive prompt
      String prompt = buildComprehensivePrompt(
        url,
        companyName,
        html,
        fetchResult.getPageTitle(),
        fetchResult.getFinalUrl(),
        previousAttemptContext
      );

      log.info("Sending prompt to AI (length: {} chars)", prompt.length());
      String aiResponse = makeO3ApiCall(prompt);
      log.info("AI response for {}: {}", url, aiResponse);

      UrlCheckResult result = parseAiResponse(aiResponse);

      // If technical issue found, try web search for replacement
      if (result.hasIssue() && result.getCurrentUrl() == null) {
        log.info("Site is broken, searching for new URL...");
        UrlCheckResult searchResult = searchForNewUrl(
          url, companyName, result.getExplanation()
        );
        if (searchResult.getCurrentUrl() != null) {
          result.setStatus("NEEDS_UPDATE");
          result.setCurrentUrl(searchResult.getCurrentUrl());
          result.setExplanation(searchResult.getExplanation());
        }
      }

      return result;

    } catch (Exception e) {
      log.error("Error checking URL {}: {}", url, e.getMessage(), e);
      UrlCheckResult result = new UrlCheckResult();
      result.setStatus("BROKEN");
      result.setExplanation("Error checking URL: " + e.getMessage());
      return result;
    }
  }

  /**
   * Validate company URL and create approval event if update needed.
   * Tests AI suggestions and retries up to 3 times if URL doesn't work.
   *
   * @param companyId The company ID to validate
   * @return Result of the validation
   */
  @Transactional
  public UrlCheckResult validateAndCreateApprovalEvent(final Long companyId) {
    CompanyExtractionData company = companyRepository.findById(companyId)
      .orElseThrow(() ->
        new IllegalArgumentException("Company not found: " + companyId));

    String oldUrl = company.getCompanyUrl();

    // Use 3 retries with context passing between attempts
    UrlCheckResult result = validateUrlWithRetries(oldUrl,
      company.getCompanyName(), 3);

    // Create event for any non-OK status
    if (result.shouldUpdateUrl() || result.hasIssue()) {
      log.info("Creating approval event for {}: {} -> {}",
        company.getCompanyName(), oldUrl, result.getCurrentUrl());

      UrlValidationEvent event = new UrlValidationEvent();
      event.setCompanyExtractionData(company);
      event.setEventType(
        result.shouldUpdateUrl() ? "URL_UPDATE_SUGGESTED" : "URL_BROKEN"
      );
      event.setOldUrl(oldUrl);
      event.setNewUrl(result.getCurrentUrl());
      event.setErrorMessage(result.getExplanation());
      event.setApprovalStatus("PENDING_APPROVAL");
      event.setCreatedAt(new Date());
      eventRepository.save(event);

      log.info("Created pending approval event for company: {}",
        company.getCompanyName());
    }

    return result;
  }

  /**
   * Validate URL with smart retry logic that learns from previous attempts.
   *
   * @param url The URL to check
   * @param companyName The company name
   * @param maxRetries Maximum number of retry attempts (typically 3)
   * @return Result of validation
   */
  private UrlCheckResult validateUrlWithRetries(final String url,
    final String companyName,
    final int maxRetries) {

    StringBuilder attemptContext = new StringBuilder();

    for (int attempt = 1; attempt <= maxRetries; attempt++) {
      log.info("URL validation attempt {} of {} for: {}",
        attempt, maxRetries, companyName);

      // Pass context from previous attempts
      String previousContext = attempt > 1 ? attemptContext.toString() : null;

      // Check URL with context
      UrlCheckResult result = checkUrl(url, companyName, previousContext);

      // If suggested a new URL, test it
      if (result.shouldUpdateUrl() && result.getCurrentUrl() != null) {
        log.info("AI suggested URL: {}, testing...", result.getCurrentUrl());

        if (testUrl(result.getCurrentUrl())) {
          log.info("AI suggested URL verified working: {}", result.getCurrentUrl());
          return result; // Success!
        } else {
          log.warn("AI suggested URL failed validation: {}, retrying...",
            result.getCurrentUrl());
          // Add to context for next attempt
          attemptContext.append("Attempt ").append(attempt).append(": ")
            .append("Suggested ").append(result.getCurrentUrl())
            .append(" but it failed validation. ")
            .append(result.getExplanation()).append("\n");
        }
      } else if (result.isOk()) {
        // URL is fine, no changes needed
        return result;
      } else {
        // Add failure context for next attempt
        attemptContext.append("Attempt ").append(attempt).append(": ")
          .append(result.getExplanation()).append("\n");
      }

      // If this was last attempt, return the result with explanation
      if (attempt >= maxRetries) {
        log.error("Failed to find valid URL after {} attempts for: {}",
          maxRetries, companyName);
        result.setExplanation(result.getExplanation() +
          " (Unable to find valid replacement after " + maxRetries + " attempts)");
        return result;
      }
    }

    // Shouldn't reach here, but just in case
    UrlCheckResult failedResult = new UrlCheckResult();
    failedResult.setStatus("BROKEN");
    failedResult.setExplanation("Unable to validate URL after " + maxRetries + " attempts");
    return failedResult;
  }


  /**
   * Test if a URL is accessible.
   *
   * @param url The URL to test
   * @return true if URL returns 200-399 status
   */
  private boolean testUrl(final String url) {
    try {
      String normalizedUrl = url;
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        normalizedUrl = "https://" + url;
      }

      HttpHeaders headers = new HttpHeaders();
      headers.set("User-Agent",
        "Mozilla/5.0 (compatible; URLValidator/1.0)");
      HttpEntity<String> entity = new HttpEntity<>(headers);

      ResponseEntity<String> response = restTemplate.exchange(
        normalizedUrl,
        HttpMethod.HEAD,
        entity,
        String.class
      );

      int statusCode = response.getStatusCode().value();
      boolean isValid = statusCode >= 200 && statusCode < 400;

      log.info("URL test for {}: status={}, valid={}",
        url, statusCode, isValid);

      return isValid;

    } catch (Exception e) {
      log.warn("URL test failed for {}: {}", url, e.getMessage());
      return false;
    }
  }

  /**
   * Fetch rendered HTML using Selenium browser automation.
   * This ensures we see JavaScript-rendered content like humans do.
   *
   * @param url The URL to fetch
   * @return Rendered HTML after JavaScript execution
   */
  private SeleniumFetchResult fetchHtmlWithSelenium(final String url) {
    WebDriver driver = null;
    try {
      String normalizedUrl = url;
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        normalizedUrl = "https://" + url;
      }

      driver = CompanyExtractorUtils.createChromeDriver();

      log.info("Navigating to URL: {}", normalizedUrl);
      driver.get(normalizedUrl);

      Duration maxWait = Duration.ofSeconds(7);
      WebDriverWait wait = new WebDriverWait(driver, maxWait);
      wait.pollingEvery(Duration.ofSeconds(1));

      try {
        wait.until(webDriver -> {
          if (!(webDriver instanceof JavascriptExecutor executor)) {
            return false;
          }
          Object readyState = executor.executeScript("return document.readyState");
          if (readyState == null
            || !"complete".equalsIgnoreCase(readyState.toString())) {
            return false;
          }
          Object bodyText = executor.executeScript(
            "return document.body ? document.body.innerText : ''");
          return bodyText != null && !bodyText.toString().trim().isEmpty();
        });
      } catch (Exception waitError) {
        log.debug("Timed out waiting for full page render on {}: {}",
          normalizedUrl, waitError.getMessage());
      }

      String finalUrl = driver.getCurrentUrl();
      String html = driver.getPageSource();
      String pageTitle = driver.getTitle();

      log.info("Fetched {} chars of HTML from {} (final URL: {})",
        html.length(), url, finalUrl);

      return new SeleniumFetchResult(html, finalUrl, pageTitle, 200);

    } catch (Exception e) {
      log.error("Failed to fetch HTML with Selenium: {}", e.getMessage());
      return new SeleniumFetchResult(
        null,
        url,
        null,
        0,
        "Error: " + e.getMessage()
      );
    } finally {
      if (driver != null) {
        try {
          driver.quit();
        } catch (Exception e) {
          log.error("Error closing Selenium driver", e);
        }
      }
    }
  }

  private UrlCheckResult searchForNewUrl(final String oldUrl,
    final String companyName,
    final String step1Explanation) {
    try {
      String searchPrompt = String.format(
        "The website %s for company '%s' appears to be broken.\n\n"
          + "Initial analysis found: %s\n\n"
          + "Please use web search to investigate:\n"
          + "1. Was this company acquired by another company?\n"
          + "2. Did they rebrand or change their website URL?\n"
          + "3. What is their current official website URL?\n"
          + "4. If the company shut down, indicate that.\n\n"
          + "Respond ONLY with valid JSON (no markdown, no code blocks):\n"
          + "{\n"
          + "  \"currentUrl\": \"new official URL if found, or null\",\n"
          + "  \"explanation\": \"A complete explanation combining what you "
          + "found AND the initial analysis. Make it flow naturally.\"\n"
          + "}\n\n"
          + "Examples of good explanations:\n"
          + "1. \"The company was acquired by Kopin Corporation. "
          + "The original site displays an account suspension page.\"\n"
          + "2. \"The company rebranded and moved to a new domain. "
          + "The old URL shows a 404 error page.\"\n"
          + "3. \"The company appears to have shut down. "
          + "The website shows a domain parking page.\"\n"
          + "4. \"The company merged with TechCo and now operates under "
          + "their website. The original URL returns a server error.\"\n"
          + "5. \"The domain has changed to a new URL. "
          + "The old site shows a suspended account notice.\"",
        oldUrl, companyName, step1Explanation
      );

      String aiResponse = makeO3ApiCall(searchPrompt);

      log.info("Web search result for {}: {}", companyName, aiResponse);

      return parseSearchResponse(aiResponse);

    } catch (Exception e) {
      log.error("Error searching for new URL: {}", e.getMessage());
      UrlCheckResult result = new UrlCheckResult();
      result.setCurrentUrl(null);
      result.setExplanation("");
      return result;
    }
  }

  private UrlCheckResult parseSearchResponse(final String aiResponse) {
    try {
      String cleanedResponse = aiResponse.trim()
        .replaceAll("^```json\\s*", "")
        .replaceAll("```$", "")
        .trim();

      JsonNode node = objectMapper.readTree(cleanedResponse);

      UrlCheckResult result = new UrlCheckResult();
      result.setCurrentUrl(
        node.has("currentUrl") && !node.get("currentUrl").isNull()
          ? node.get("currentUrl").asText()
          : null
      );
      result.setExplanation(
        node.has("explanation") ? node.get("explanation").asText() : ""
      );

      return result;

    } catch (Exception e) {
      log.error("Failed to parse search response: {}", aiResponse, e);
      UrlCheckResult result = new UrlCheckResult();
      result.setCurrentUrl(null);
      result.setExplanation("");
      return result;
    }
  }

  /**
   * Build comprehensive prompt that checks BOTH technical issues
   * AND business status.
   * Addresses requirement: detect closures/acquisitions even when URL works.
   */
  private String buildComprehensivePrompt(final String url,
    final String companyName,
    final String html,
    final String pageTitle,
    final String finalUrl,
    final String previousAttemptContext) {

    StringBuilder prompt = new StringBuilder();

    prompt.append("I fetched HTML from this URL using a browser: ")
      .append(url).append("\n");
    prompt.append("Company name: ").append(companyName).append("\n");
    prompt.append("Page title: ").append(pageTitle).append("\n");
    prompt.append("Final URL after redirects: ").append(finalUrl).append("\n\n");

    if (previousAttemptContext != null) {
      prompt.append("PREVIOUS ATTEMPTS:\n");
      prompt.append(previousAttemptContext).append("\n\n");
      prompt.append("Please try a DIFFERENT approach than previous attempts.\n\n");
    }

    prompt.append("Here is the full HTML content:\n");
    prompt.append("---\n").append(html).append("\n---\n\n");

    prompt.append("Please perform TWO types of analysis:\n\n");

    prompt.append("ANALYSIS 1 - TECHNICAL CHECK:\n");
    prompt.append("1. Is this a working website, or an error page?\n");
    prompt.append("2. Look for error messages in ANY language ");
    prompt.append("(suspended account, domain unavailable, 404, 403, etc.)\n");
    prompt.append("3. Check if it's a domain parking page or placeholder\n\n");

    prompt.append("ANALYSIS 2 - BUSINESS STATUS CHECK (CRITICAL):\n");
    prompt.append("Even if the URL technically works, investigate:\n");
    prompt.append("1. Use web search to check for public records indicating:\n");
    prompt.append("   - Company closure or shutdown\n");
    prompt.append("   - Merger or acquisition by another company\n");
    prompt.append("   - Rebranding or name change\n");
    prompt.append("   - Move to a new domain/URL\n");
    prompt.append("2. Does the website content actually match '");
    prompt.append(companyName).append("'?\n");
    prompt.append("3. Are there signs the company no longer operates ");
    prompt.append("under this brand?\n\n");

    prompt.append("If you find the company was acquired, merged, closed, ");
    prompt.append("or rebranded:\n");
    prompt.append("- Set status to 'NEEDS_UPDATE' if you find a new URL\n");
    prompt.append("- Set status to 'BROKEN' if there's no replacement\n");
    prompt.append("- Explain what happened to the company in the explanation\n\n");

    prompt.append("Respond ONLY with valid JSON (no markdown, no code blocks):\n");
    prompt.append("{\n");
    prompt.append("  \"status\": \"OK\" | \"NEEDS_UPDATE\" | \"BROKEN\",\n");
    prompt.append("  \"currentUrl\": \"new official URL if found, or null\",\n");
    prompt.append("  \"explanation\": \"2-3 sentence explanation combining ");
    prompt.append("technical AND business findings\"\n");
    prompt.append("}");

    return prompt.toString();
  }

  private UrlCheckResult parseAiResponse(final String aiResponse) {
    try {
      String cleanedResponse = aiResponse.trim()
        .replaceAll("^```json\\s*", "")
        .replaceAll("```$", "")
        .trim();

      JsonNode node = objectMapper.readTree(cleanedResponse);

      UrlCheckResult result = new UrlCheckResult();
      result.setStatus(node.get("status").asText());
      result.setCurrentUrl(
        node.has("currentUrl") && !node.get("currentUrl").isNull()
          ? node.get("currentUrl").asText()
          : null
      );
      result.setExplanation(node.get("explanation").asText());

      return result;

    } catch (Exception e) {
      log.error("Failed to parse AI response: {}", aiResponse, e);
      UrlCheckResult result = new UrlCheckResult();
      result.setStatus("BROKEN");
      result.setExplanation("Failed to parse AI response: " + aiResponse);
      return result;
    }
  }

  /**
   * Make an API call to OpenAI o3 with web search enabled.
   * Delegates to OpenAiClient for consistent retry logic and error handling.
   *
   * @param prompt The prompt to send to the AI
   * @return The AI response text
   */
  private String makeO3ApiCall(final String prompt) {
    return openAiClient.makeO3CallWithWebSearch(prompt);
  }
}
