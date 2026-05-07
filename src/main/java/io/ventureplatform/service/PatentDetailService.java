package io.ventureplatform.service;

import io.ventureplatform.entity.CompanyPatent;
import io.ventureplatform.repository.CompanyPatentRepository;
import io.ventureplatform.util.CompanyExtractorUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.openqa.selenium.By;
import org.openqa.selenium.NoSuchElementException;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;

@Service
@RequiredArgsConstructor
@Slf4j
public class PatentDetailService {

  private final CompanyPatentRepository patentRepository;
  private final PatentEventService patentEventService;
  private final ObjectMapper objectMapper = new ObjectMapper();

  @Transactional
  public void scrapePatentDetailsManual(List<Long> patentIds) {
    scrapePatentDetailsManual(patentIds, 3); // Default 3 second delay
  }
  
  @Transactional
  public void scrapePatentDetailsManual(List<Long> patentIds, int delaySeconds) {
    log.info("Starting patent detail scraping for {} patents with {} second delay",
        patentIds.size(), delaySeconds);

    List<CompanyPatent> patents = patentRepository.findAllById(patentIds);

    WebDriver driver = null;
    int consecutiveFailures = 0;
    final int maxConsecutiveFailures = 3;

    try {
      driver = CompanyExtractorUtils.createChromeDriver();

      for (int i = 0; i < patents.size(); i++) {
        CompanyPatent patent = patents.get(i);
        try {
          log.info("[{}/{}] Scraping details for patent {}",
              i + 1, patents.size(), patent.getPatentNumber());

          boolean success = scrapeAndUpdatePatentDetails(driver, patent);

          if (success) {
            consecutiveFailures = 0;
          } else {
            consecutiveFailures++;
            if (consecutiveFailures >= maxConsecutiveFailures) {
              log.warn("Stopping patent detail scraping after {} consecutive "
                  + "page load failures. Likely hit CAPTCHA or rate limit. "
                  + "Processed {}/{} patents.", maxConsecutiveFailures,
                  i + 1, patents.size());
              break;
            }
          }

          // Apply delay if not the last patent
          if (i < patents.size() - 1) {
            int actualDelay;
            if (delaySeconds == -1) {
              // Random delay between 20-90 seconds
              actualDelay = CompanyExtractorUtils.getRandomDelaySeconds(20, 90);
              log.info("Waiting {} seconds before next patent...", actualDelay);
            } else {
              actualDelay = delaySeconds;
            }
            Thread.sleep(actualDelay * 1000);
          }
        } catch (Exception e) {
          log.error("Failed to scrape details for patent {}: {}",
              patent.getPatentNumber(), e.getMessage());
        }
      }

    } finally {
      if (driver != null) {
        driver.quit();
      }
    }
  }

  private boolean scrapeAndUpdatePatentDetails(
      WebDriver driver, CompanyPatent patent) {
    if (patent.getPatentUrl() == null || patent.getPatentUrl().isEmpty()) {
      log.warn("Patent {} has no URL, skipping", patent.getPatentNumber());
      return true; // Not a page load failure, just skip
    }
    
    log.info("Scraping details for patent {}", patent.getPatentNumber());
    
    driver.get(patent.getPatentUrl());

    // Wait for page to load
    try {
      Thread.sleep(3000);
    } catch (InterruptedException e) {
      Thread.currentThread().interrupt();
    }

    // Validate page loaded correctly by checking for patent title
    // If title element is missing, we likely hit a CAPTCHA or block
    String pageTitle = extractPatentTitle(driver);
    if (pageTitle == null || pageTitle.isEmpty()) {
      log.warn("Patent {} page did not load correctly (no title found). "
          + "Possible CAPTCHA or temporary block. Skipping to retry later.",
          patent.getPatentNumber());
      return false; // Page load failure
    }

    // Extract cited by count
    Integer citedByCount = extractCitedByCount(driver);
    if (citedByCount != null) {
      Integer oldCitedByCount = patent.getCitedByCount();
      patent.setCitedByCount(citedByCount);
      
      // Only create event if we had previous detail data and count changed
      if (oldCitedByCount != null && !oldCitedByCount.equals(citedByCount) && patent.getDetailsScrapedAt() != null) {
        patentEventService.createEvent(
            patent.getCompanyExtractionData(),
            patent,
            "CITED_BY_CHANGE",
            String.valueOf(oldCitedByCount),
            String.valueOf(citedByCount)
        );
        log.info("Created CITED_BY_CHANGE event for patent {} ({} -> {})", 
            patent.getPatentNumber(), oldCitedByCount, citedByCount);
      }
    }
    
    // Extract citations count
    Integer citationsCount = extractCitationsCount(driver);
    if (citationsCount != null) {
      patent.setCitationsCount(citationsCount);
    }
    
    // Extract patent status
    String patentStatus = extractPatentStatus(driver);
    if (patentStatus != null) {
      String oldStatus = patent.getPatentStatus();
      patent.setPatentStatus(patentStatus);
      
      // Only create event if we had previous detail data and status changed
      if (oldStatus != null && !oldStatus.equals(patentStatus) && patent.getDetailsScrapedAt() != null) {
        patentEventService.createEvent(
            patent.getCompanyExtractionData(),
            patent,
            "STATUS_CHANGE",
            oldStatus,
            patentStatus
        );
        log.info("Created STATUS_CHANGE event for patent {} ({} -> {})", 
            patent.getPatentNumber(), oldStatus, patentStatus);
      }
    }
    
    // Extract primary CPC code
    String primaryCpc = extractPrimaryCpcCode(driver);
    if (primaryCpc != null) {
      patent.setPrimaryCpcCode(primaryCpc);
    }
    
    // Extract inventor names from knowledge card
    String inventors = extractInventors(driver);
    if (inventors != null && !inventors.isEmpty()) {
      patent.setInventor(inventors);
    }
    
    // Extract grant date from timeline
    String grantDate = extractGrantDate(driver);
    if (grantDate != null) {
      patent.setGrantDate(grantDate);
    }
    
    // Extract expiration date from timeline
    String expirationDate = extractExpirationDate(driver);
    if (expirationDate != null) {
      patent.setExpirationDate(expirationDate);
    }
    
    // Update title if different (reuse pageTitle from validation check)
    if (!pageTitle.equals(patent.getTitle())) {
      patent.setTitle(pageTitle);
      log.info("Updated patent title for {}: {} characters",
          patent.getPatentNumber(), pageTitle.length());
    }

    // Extract full patent abstract
    String fullAbstract = extractPatentAbstract(driver);
    if (fullAbstract != null && !fullAbstract.isEmpty()
        && !fullAbstract.equals(patent.getAbstractText())) {
      patent.setAbstractText(fullAbstract);
      log.info("Updated patent abstract for {}: {} characters",
          patent.getPatentNumber(), fullAbstract.length());
    }

    // Extract and update jurisdiction data from knowledge card
    String updatedJurisdictions = extractJurisdictionData(driver);
    if (updatedJurisdictions != null) {
      patent.setPatentJurisdictions(updatedJurisdictions);
    }
    
    // Update scrape timestamp
    patent.setDetailsScrapedAt(new Date());
    
    patentRepository.save(patent);
    
    log.info("Successfully updated details for patent {}: citedBy={}, "
        + "citations={}, status={}, cpc={}, grant={}, expiration={}, abstract={}",
        patent.getPatentNumber(), citedByCount, citationsCount, patentStatus,
        primaryCpc, grantDate, expirationDate,
        fullAbstract != null ? "updated" : "unchanged");

    return true; // Success
  }

  private Integer extractCitedByCount(WebDriver driver) {
    try {
      WebElement citedByHeader = driver.findElement(By.id("citedBy"));
      String citedByText = citedByHeader.getText(); // "Cited By (20)"
      
      Pattern pattern = Pattern.compile("\\((\\d+)\\)");
      Matcher matcher = pattern.matcher(citedByText);
      
      if (matcher.find()) {
        return Integer.parseInt(matcher.group(1));
      }
      // If we found the header but no number, it's likely 0
      return 0;
    } catch (NoSuchElementException e) {
      log.debug("No cited by section found");
      return null; // No data available
    } catch (Exception e) {
      log.error("Error extracting cited by count: {}", e.getMessage());
      return null; // Error occurred, data unknown
    }
  }

  private Integer extractCitationsCount(WebDriver driver) {
    try {
      WebElement citationsHeader = driver.findElement(By.id("patentCitations"));
      String citationsText = citationsHeader.getText(); // "Patent Citations (7)"
      
      Pattern pattern = Pattern.compile("\\((\\d+)\\)");
      Matcher matcher = pattern.matcher(citationsText);
      
      if (matcher.find()) {
        return Integer.parseInt(matcher.group(1));
      }
      // If we found the header but no number, it's likely 0
      return 0;
    } catch (NoSuchElementException e) {
      log.debug("No patent citations section found");
      return null; // No data available
    } catch (Exception e) {
      log.error("Error extracting citations count: {}", e.getMessage());
      return null; // Error occurred, data unknown
    }
  }

  private String extractPatentStatus(WebDriver driver) {
    try {
      // Try to find status in the timeline
      WebElement timeline = driver.findElement(By.tagName("application-timeline"));
      
      // Look for current status event
      List<WebElement> statusElements = timeline.findElements(
          By.cssSelector(".event[current] .legal-status + * .title-text"));
      
      if (!statusElements.isEmpty()) {
        return statusElements.get(0).getText().trim();
      }
      
      // Fallback: look for any status text
      List<WebElement> titleTexts = timeline.findElements(
          By.cssSelector(".event[current] .title-text"));
      
      for (WebElement element : titleTexts) {
        String text = element.getText().trim();
        if (text.contains("Active") || text.contains("Expired") || 
            text.contains("Pending") || text.contains("Granted") ||
            text.contains("Ceased") || text.contains("Abandoned") ||
            text.contains("Withdrawn") || text.contains("Lapsed") || 
            text.contains("Revoked")) {
          return text;
        }
      }
      
    } catch (Exception e) {
      log.debug("Could not extract patent status: {}", e.getMessage());
    }
    return null;
  }

  private String extractPrimaryCpcCode(WebDriver driver) {
    try {
      // Look for the primary CPC code (marked with first="true")
      WebElement primaryCpc = driver.findElement(
          By.cssSelector("state-modifier[first='true']"));
      return primaryCpc.getAttribute("data-cpc");
      
    } catch (NoSuchElementException e) {
      // Fallback: get the first CPC code
      try {
        List<WebElement> cpcElements = driver.findElements(
            By.cssSelector("state-modifier.code[data-cpc]"));
        if (!cpcElements.isEmpty()) {
          return cpcElements.get(0).getAttribute("data-cpc");
        }
      } catch (Exception ex) {
        log.debug("No CPC codes found");
      }
    }
    return null;
  }

  private String extractInventors(WebDriver driver) {
    try {
      // Look for inventor names in the knowledge card
      List<WebElement> inventorElements = driver.findElements(
          By.cssSelector("dl.important-people dd state-modifier[data-inventor] a"));
      
      if (!inventorElements.isEmpty()) {
        String inventors = inventorElements.stream()
            .map(WebElement::getText)
            .filter(text -> text != null && !text.trim().isEmpty())
            .collect(Collectors.joining(", "));
        return inventors;
      }
    } catch (Exception e) {
      log.debug("Could not extract inventors: {}", e.getMessage());
    }
    return null;
  }

  private String extractGrantDate(WebDriver driver) {
    try {
      // Look for grant date in timeline
      List<WebElement> grantedElements = driver.findElements(
          By.cssSelector("application-timeline .event .granted"));
      
      if (!grantedElements.isEmpty()) {
        String dateText = grantedElements.get(0).getAttribute("date");
        if (dateText != null && !dateText.isEmpty()) {
          return dateText;
        }
        // Fallback to text content
        return grantedElements.get(0).getText().trim();
      }
    } catch (Exception e) {
      log.debug("Could not extract grant date: {}", e.getMessage());
    }
    return null;
  }

  private String extractExpirationDate(WebDriver driver) {
    try {
      // Look for "Anticipated expiration" in timeline
      List<WebElement> events = driver.findElements(
          By.cssSelector("application-timeline .event"));
      
      for (WebElement event : events) {
        try {
          WebElement titleElement = event.findElement(By.cssSelector(".title-text"));
          if (titleElement.getText().contains("Anticipated expiration")) {
            // Get the date from the preceding element
            WebElement dateElement = event.findElement(By.cssSelector(".legal-status"));
            String dateText = dateElement.getText().trim();
            if (!dateText.equals("Status")) {
              return dateText;
            }
          }
        } catch (NoSuchElementException ignored) {
          // Continue to next event
        }
      }
    } catch (Exception e) {
      log.debug("Could not extract expiration date: {}", e.getMessage());
    }
    return null;
  }

  private String extractJurisdictionData(WebDriver driver) {
    try {
      // Extract worldwide applications from timeline
      List<WebElement> worldwideApps = driver.findElements(
          By.cssSelector("application-timeline .event .block state-modifier"));
      
      if (!worldwideApps.isEmpty()) {
        List<java.util.Map<String, String>> jurisdictions = new java.util.ArrayList<>();
        
        for (WebElement app : worldwideApps) {
          try {
            WebElement countryElement = app.findElement(By.cssSelector("span[id='cc']"));
            String countryCode = countryElement.getText().trim();
            
            // Get status from class name
            String className = countryElement.getAttribute("class");
            String status = "unknown";
            if (className.contains("active")) {
              status = "active";
            } else if (className.contains("not_active")) {
              status = "not_active";
            }
            
            java.util.Map<String, String> jurisdiction = new java.util.HashMap<>();
            jurisdiction.put("code", countryCode);
            jurisdiction.put("status", status);
            jurisdictions.add(jurisdiction);
            
          } catch (Exception e) {
            // Skip this jurisdiction
          }
        }
        
        if (!jurisdictions.isEmpty()) {
          // Convert to JSON string
          return objectMapper.writeValueAsString(jurisdictions);
        }
      }
    } catch (Exception e) {
      log.debug("Could not extract jurisdiction data: {}", e.getMessage());
    }
    return null; // Return null to keep existing data if extraction fails
  }

  /**
   * Extracts the full patent title from the patent detail page.
   * On patent detail pages, titles are not truncated like in search results.
   */
  private String extractPatentTitle(WebDriver driver) {
    try {
      List<WebElement> titleElements = driver.findElements(
          By.cssSelector("h1#title.style-scope.patent-result"));

      if (!titleElements.isEmpty()) {
        String fullTitle = titleElements.get(0).getText().trim();
        if (!fullTitle.isEmpty()) {
          log.debug("Extracted full patent title: {} characters", fullTitle.length());
          return fullTitle;
        }
      }

      // Fallback: try alternative selectors
      titleElements = driver.findElements(By.cssSelector("h1#title"));
      if (!titleElements.isEmpty()) {
        String fullTitle = titleElements.get(0).getText().trim();
        if (!fullTitle.isEmpty()) {
          return fullTitle;
        }
      }

    } catch (Exception e) {
      log.debug("Could not extract patent title: {}", e.getMessage());
    }
    return null; // Return null to keep existing title if extraction fails
  }

  /**
   * Extracts the full patent abstract from the patent detail page.
   * Abstracts on detail pages contain the complete text.
   */
  private String extractPatentAbstract(WebDriver driver) {
    try {
      List<WebElement> abstractElements = driver.findElements(
          By.cssSelector("div.abstract.style-scope.patent-text"));

      if (!abstractElements.isEmpty()) {
        String fullAbstract = abstractElements.get(0).getText().trim();
        if (!fullAbstract.isEmpty()) {
          log.debug("Extracted full patent abstract: {} characters", fullAbstract.length());
          return fullAbstract;
        }
      }

      // Fallback: try alternative selectors
      abstractElements = driver.findElements(By.cssSelector("div.abstract"));
      if (!abstractElements.isEmpty()) {
        String fullAbstract = abstractElements.get(0).getText().trim();
        if (!fullAbstract.isEmpty()) {
          return fullAbstract;
        }
      }

    } catch (Exception e) {
      log.debug("Could not extract patent abstract: {}", e.getMessage());
    }
    return null; // Return null to keep existing abstract if extraction fails
  }
}