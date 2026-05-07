package io.ventureplatform.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.ventureplatform.entity.Portfolio;
import io.ventureplatform.entity.User;
import io.ventureplatform.entity.Venture;
import io.ventureplatform.service.external.ImpactAiService;
import io.ventureplatform.service.external.CloudinaryService;
import io.ventureplatform.service.external.FacebookService;
import io.ventureplatform.service.external.GoogleService;
import io.ventureplatform.service.external.LinkedinService;
import io.sentry.Sentry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.thymeleaf.util.StringUtils;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.net.URISyntaxException;
import java.net.URL;
import java.net.URLEncoder;
import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.TimeUnit;
import java.net.URLEncoder;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static io.ventureplatform.util.ScrapingUtils.DEFAULT_CHROME_OPTIONS;
import io.ventureplatform.util.CompanyExtractorUtils;

@Service
@RequiredArgsConstructor
@Slf4j
public class ScrapeService {
  private final ObjectMapper objectMapper;
  private final LinkedinService linkedinService;
  private final FacebookService facebookService;
  private final ImpactAiService impactAiService;
  private final GoogleService googleService;
  private final RestTemplate restTemplate;
  private final CloudinaryService cloudinaryService;

  public Map<String, String> getSocialMediaLinks(String website) {
    Map<String, String> result = new HashMap<>();

    try {
      if (!website.startsWith("http")) {
        website = "https://" + website;
      }
      new URL(website).toURI(); // checking if URL is valid
      WebDriver driver = CompanyExtractorUtils.createChromeDriver();
      driver.get(website);
      driver.manage().timeouts().implicitlyWait(3, TimeUnit.SECONDS);
      // Page load timeout already set to 60 seconds in CompanyExtractorUtils
      String pageHtml = driver.getPageSource();
      Document doc = Jsoup.parse(pageHtml);
      String[] platforms = {"twitter", "facebook", "linkedin", "instagram", "youtube"};

      for (Element link : doc.select("a[href]")) {
        for (String platform : platforms) {
          if (link.attr("href").toLowerCase().contains(platform + ".com")) {
            result.put(platform, link.attr("href"));
            break;
          }
        }
      }
    } catch (MalformedURLException | URISyntaxException ex) {
      log.info("Provided URL is not valid: " + website);
    } catch (Exception ex) {
      log.error("Website parsing failed", ex);
      Sentry.captureException(ex);
    }

    return result;
  }

  public Long getFollowers(Map<String, Object> body, Venture venture) {
    return getFollowers(
      body,
      venture.getId(),
      venture.getFacebookCompanyId(),
      venture.getInstagramCompanyId(),
      venture.getFacebookToken()
    );
  }

  public Long getFollowers(Map<String, Object> body, Portfolio portfolio) {
    return getFollowers(
      body,
      portfolio.getId(),
      portfolio.getFacebookCompanyId(),
      portfolio.getInstagramCompanyId(),
      portfolio.getFacebookToken()
    );
  }

  private Long getFollowers(
    Map<String, Object> body, Long id, String facebookId, String instagramId, String facebookToken
  ) {
    String media = String.valueOf(body.get("media"));
    String website = String.valueOf(body.get("website"));

    if ("facebook".equals(media)) {
      // First try with authentication if available
      if (facebookToken != null && !facebookToken.isEmpty() && facebookId != null && !facebookId.isEmpty()) {
        Long authResult = facebookService.getNumberOfFollowers(id, facebookId, facebookToken);
        if (authResult != null) {
          return authResult;
        }
      }
      // Fall back to scraping
      return getFacebookFollowers(website);
    } else if ("instagram".equals(media)) {
      return facebookService.getNumberOfFollowers(id, instagramId, facebookToken);
    } else if ("twitter".equals(media)) {
      return getTwitterFollowers(website);
    } else if ("youtube".equals(media)) {
      return getYoutubeFollowers(website);
    } else if ("linkedin".equals(media)) {
      return linkedinService.getNumberOfFollowers(website);
    }

    return null;
  }

  /**
   * Extract Twitter/X follower count from a Twitter profile URL.
   * Uses simple text extraction similar to Facebook approach.
   */
  public Long getTwitterFollowers(String twitterUrl) {
    log.info("Starting Twitter follower extraction for URL: {}", twitterUrl);
    
    WebDriver driver = null;
    try {
      driver = CompanyExtractorUtils.createChromeDriver();
      driver.get(twitterUrl);
      
      // Wait for page to load
      Thread.sleep(5000); // Twitter/X can be slow to load
      
      // Get visible text from the page body
      WebElement body = driver.findElement(By.tagName("body"));
      String visibleText = body.getText();
      
      // Log preview for debugging
      String preview = visibleText.length() > 500 ? 
                      visibleText.substring(0, 500) + "..." : visibleText;
      log.debug("Twitter page text preview: {}", preview);
      
      // Look for follower patterns in visible text
      // Twitter/X shows followers as "XXX Followers" or "X.XK Followers" or "X.XM Followers"
      Pattern followerPattern = Pattern.compile("([0-9.,]+[KMB]?)\\s+Followers", Pattern.CASE_INSENSITIVE);
      Matcher matcher = followerPattern.matcher(visibleText);
      
      if (matcher.find()) {
        String followerText = matcher.group(1);
        log.debug("Found follower text: {}", followerText);
        
        // Remove commas
        followerText = followerText.replaceAll(",", "");
        
        // Check if it has K/M/B suffix
        if (followerText.matches(".*[KMB]$")) {
          Long count = parseAbbreviatedNumber(followerText);
          log.info("SUCCESS: Twitter extraction found {} followers", count);
          return count;
        } else {
          // Parse as regular number
          Long count = Long.parseLong(followerText);
          log.info("SUCCESS: Twitter extraction found {} followers", count);
          return count;
        }
      }
      
      // Try alternative pattern (sometimes it's lowercase or has different spacing)
      Pattern altPattern = Pattern.compile("([0-9.,]+[KMB]?)\\s+followers", Pattern.CASE_INSENSITIVE);
      Matcher altMatcher = altPattern.matcher(visibleText);
      
      if (altMatcher.find()) {
        String followerText = altMatcher.group(1);
        followerText = followerText.replaceAll(",", "");
        
        if (followerText.matches(".*[KMB]$")) {
          Long count = parseAbbreviatedNumber(followerText);
          log.info("SUCCESS: Twitter extraction found {} followers (alt pattern)", count);
          return count;
        } else {
          Long count = Long.parseLong(followerText);
          log.info("SUCCESS: Twitter extraction found {} followers (alt pattern)", count);
          return count;
        }
      }
      
      log.warn("No follower count found in Twitter page");
      return null;
      
    } catch (Exception e) {
      log.error("Twitter follower extraction failed: {}", e.getMessage());
      return null;
    } finally {
      if (driver != null) {
        try {
          driver.quit();
        } catch (Exception e) {
          log.error("Error closing Twitter driver", e);
        }
      }
    }
  }

  public Long getYoutubeFollowers(String website) {
    try {
      Document doc = Jsoup.connect(website).cookie("SOCS", "CAESEwgDEgk0ODE3Nzk3MjQaAmVuIAEaBgiA_LyaBg").get();
      Element scriptElement = doc.select("script:containsData(ytInitialData)").first();
      String scriptText = scriptElement.html();
      String jsonText = scriptText.substring(scriptText.indexOf("{"), scriptText.lastIndexOf("}") + 1);
      JsonNode rootNode = objectMapper.readTree(jsonText);
      JsonNode valueNode = rootNode.path("header")
        .findPath("contentMetadataViewModel")
        .findPath("metadataRows")
        .get(1)
        .path("metadataParts")
        .get(0)
        .findPath("content");
      String result = valueNode.textValue();
      Pattern pattern = Pattern.compile("(\\d+(?:\\.\\d+)?)([KM]?)");
      Matcher matcher = pattern.matcher(result);

      if (matcher.find()) {
        float number = Float.parseFloat(matcher.group(1));
        String multiplier = matcher.group(2);

        if ("K".equals(multiplier)) {
          number *= 1000;
        } else if ("M".equals(multiplier)) {
          number *= 1000000;
        }

        return (long) number;
      }

      return null;
    } catch (Exception ex) {
      log.error("Cannot fetch followers from YouTube", ex);
      Sentry.captureException(ex);
      return null;
    }
  }

  /**
   * Gets LinkedIn follower count from a LinkedIn company URL.
   * First tries lightweight Jsoup approach, then falls back to Selenium if needed.
   *
   * @param linkedInUrl The LinkedIn company page URL
   * @return Follower count or null if extraction fails
   */
  public Long getLinkedInFollowerCount(String linkedInUrl) {
    log.info("Starting LinkedIn follower extraction for URL: {}", linkedInUrl);
    
    // First try with Jsoup (fast but might get blocked)
    log.debug("Attempting Jsoup extraction for LinkedIn");
    Long jsoupResult = tryJsoupLinkedInExtraction(linkedInUrl);
    
    if (jsoupResult != null && jsoupResult > 0) {
      log.info("SUCCESS: Jsoup extraction found {} followers", jsoupResult);
      return jsoupResult;
    }
    
    log.debug("Jsoup extraction failed, attempting Selenium extraction");
    
    // Fallback to Selenium (slower but more reliable)
    Long seleniumResult = trySeleniumLinkedInExtraction(linkedInUrl);
    
    if (seleniumResult != null && seleniumResult > 0) {
      log.info("SUCCESS: Selenium extraction found {} followers", seleniumResult);
      return seleniumResult;
    }
    
    log.warn("Both Jsoup and Selenium extraction failed for LinkedIn URL: {}", linkedInUrl);
    return null;
  }

  /**
   * Try to extract LinkedIn followers using Jsoup (lightweight approach).
   */
  private Long tryJsoupLinkedInExtraction(String linkedInUrl) {
    try {
      Document doc = Jsoup.connect(linkedInUrl)
          .userAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
          .header("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8")
          .header("Accept-Language", "en-US,en;q=0.5")
          .header("Accept-Encoding", "gzip, deflate, br")
          .header("Connection", "keep-alive")
          .header("Upgrade-Insecure-Requests", "1")
          .timeout(15000)
          .get();
      
      // Check if we got redirected to login page
      if (doc.title().toLowerCase().contains("log in") || doc.title().toLowerCase().contains("sign in")) {
        log.debug("Jsoup: Got redirected to login page");
        return null;
      }
      
      // Look for follower count in the page text
      String pageText = doc.text();
      
      // Try multiple patterns as LinkedIn might use different formats
      String[] patterns = {
        "([0-9,]+)\\s+followers",
        "([0-9,]+)\\s+follower",
        "([0-9.]+[KMB]?)\\s+followers"  // Handles 1.2K, 5M, etc.
      };
      
      for (String patternStr : patterns) {
        Pattern pattern = Pattern.compile(patternStr, Pattern.CASE_INSENSITIVE);
        Matcher matcher = pattern.matcher(pageText);
        
        if (matcher.find()) {
          String followerText = matcher.group(1);
          
          // Handle K, M, B suffixes
          if (followerText.matches(".*[KMB]$")) {
            return parseAbbreviatedNumber(followerText);
          } else {
            // Remove commas and parse
            followerText = followerText.replaceAll(",", "");
            return Long.parseLong(followerText);
          }
        }
      }
      
      return null;
      
    } catch (Exception e) {
      log.debug("Jsoup extraction error: {}", e.getMessage());
      return null;
    }
  }

  /**
   * Try to extract LinkedIn followers using Selenium (browser automation).
   */
  private Long trySeleniumLinkedInExtraction(String linkedInUrl) {
    WebDriver driver = null;
    try {
      driver = CompanyExtractorUtils.createChromeDriver();
      driver.get(linkedInUrl);
      
      // Wait for page to load
      Thread.sleep(3000);
      
      String currentUrl = driver.getCurrentUrl();
      
      // Check if redirected to login
      if (currentUrl.contains("/login") || currentUrl.contains("/authwall")) {
        log.debug("Selenium: Redirected to login page");
        return null;
      }
      
      // Get page source
      String pageSource = driver.getPageSource();
      
      // Search for follower count with regex
      Pattern sourcePattern = Pattern.compile("([0-9,]+)\\s+followers?", Pattern.CASE_INSENSITIVE);
      Matcher sourceMatcher = sourcePattern.matcher(pageSource);
      
      while (sourceMatcher.find()) {
        try {
          String followerText = sourceMatcher.group(1).replaceAll(",", "");
          Long count = Long.parseLong(followerText);
          // Sanity check - follower count should be reasonable
          if (count > 0 && count < 1000000000) { // Less than 1 billion
            return count;
          }
        } catch (NumberFormatException e) {
          // Continue searching
        }
      }
      
      return null;
      
    } catch (Exception e) {
      log.debug("Selenium extraction error: {}", e.getMessage());
      return null;
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

  /**
   * Gets Facebook follower count from a Facebook page URL.
   * Facebook shows follower counts even with login modal present.
   * Pattern: "XXX likes • XXX followers" in visible text.
   *
   * @param facebookUrl The Facebook page URL
   * @return Follower count or null if extraction fails
   */
  
  public Long getFacebookFollowers(String facebookUrl) {
    log.info("Starting Facebook follower extraction for URL: {}", facebookUrl);
    
    WebDriver driver = null;
    try {
      driver = CompanyExtractorUtils.createChromeDriver(); // headless mode
      driver.get(facebookUrl);
      
      // Wait for page to load
      Thread.sleep(3000);
      
      // Get visible text from the page body
      WebElement body = driver.findElement(By.tagName("body"));
      String visibleText = body.getText();
      
      // Look for follower pattern in visible text
      // Pattern can be "XXX followers" or "XXX likes • XXX followers"
      Pattern followerPattern = Pattern.compile("([0-9.,]+[KMB]?)\\s+followers", Pattern.CASE_INSENSITIVE);
      Matcher matcher = followerPattern.matcher(visibleText);
      
      if (matcher.find()) {
        String followerText = matcher.group(1);
        log.debug("Found follower text: {}", followerText);
        
        // Remove commas
        followerText = followerText.replaceAll(",", "");
        
        // Check if it has K/M/B suffix
        if (followerText.matches(".*[KMB]$")) {
          Long count = parseAbbreviatedNumber(followerText);
          log.info("SUCCESS: Facebook extraction found {} followers", count);
          return count;
        } else {
          // Parse as regular number
          Long count = Long.parseLong(followerText);
          log.info("SUCCESS: Facebook extraction found {} followers", count);
          return count;
        }
      }
      
      log.warn("No follower count found in Facebook page");
      return null;
      
    } catch (Exception e) {
      log.error("Facebook follower extraction failed: {}", e.getMessage());
      return null;
    } finally {
      if (driver != null) {
        try {
          driver.quit();
        } catch (Exception e) {
          log.error("Error closing Facebook driver", e);
        }
      }
    }
  }

  /**
   * Extract Instagram follower count - main entry point.
   */
  public Long getInstagramFollowers(String instagramUrl) {
    return getInstagramFollowers(instagramUrl, null);
  }
  
  
  /**
   * Extract Instagram follower count with company name fallback.
   * Uses two attempts: first with the Instagram handle, then with company name if needed.
   */
  public Long getInstagramFollowers(String instagramUrl, String companyUrl) {
    log.info("Starting Instagram follower extraction for URL: {}", instagramUrl);
    
    // Extract username from Instagram URL
    String instagramUsername = extractInstagramUsername(instagramUrl);
    
    // Track results from both attempts
    Long attempt1Count = null;
    boolean attempt1PageExists = false;
    Long attempt2Count = null;
    boolean attempt2PageExists = false;
    
    // ATTEMPT 1: Try with the Instagram handle we found
    log.info("=== ATTEMPT 1: Searching Bing with Instagram handle '{}' ===", instagramUsername);
    InstagramResult result1 = searchBingAndClickThroughToInstagramEnhanced(instagramUsername, instagramUrl);
    
    if (result1 != null) {
      attempt1Count = result1.followerCount;
      attempt1PageExists = result1.pageExists;
      
      if (attempt1PageExists && attempt1Count != null) {
        log.info("SUCCESS: Found {} followers from active Instagram page using handle", attempt1Count);
        // If we found an active page with followers, that's our best result
        return attempt1Count;
      }
    }
    
    // ATTEMPT 2: Try with company name if we have it
    if (companyUrl != null) {
      String companyName = extractCompanyNameFromUrl(companyUrl);
      if (companyName != null && !companyName.equalsIgnoreCase(instagramUsername)) {
        log.info("=== ATTEMPT 2: Searching Bing with company name '{}' ===", companyName);
        InstagramResult result2 = searchBingAndClickThroughToInstagramEnhanced(companyName, null);
        
        if (result2 != null) {
          attempt2Count = result2.followerCount;
          attempt2PageExists = result2.pageExists;
        }
      }
    }
    
    // Decide which result to return - prioritize higher count and active pages
    if (attempt2PageExists && attempt2Count != null) {
      log.info("SUCCESS: Found {} followers from active Instagram page using company name", attempt2Count);
      return attempt2Count;
    } else if (attempt1PageExists && attempt1Count != null) {
      log.info("SUCCESS: Found {} followers from active Instagram page using handle", attempt1Count);
      return attempt1Count;
    } else if (attempt2Count != null && attempt1Count != null) {
      // Both have counts but no active pages - return the higher count
      Long higherCount = attempt2Count > attempt1Count ? attempt2Count : attempt1Count;
      log.info("Both attempts found counts but no active pages. Returning higher count: {} (Attempt 1: {}, Attempt 2: {})", 
               higherCount, attempt1Count, attempt2Count);
      return higherCount;
    } else if (attempt1Count != null) {
      log.info("Using follower count from Attempt 1: {}", attempt1Count);
      return attempt1Count;
    } else if (attempt2Count != null) {
      log.info("Using follower count from Attempt 2: {}", attempt2Count);
      return attempt2Count;
    }
    
    log.warn("Failed to extract Instagram followers after both attempts");
    return null;
  }
  
  /**
   * Get the discovered Instagram URL (for use by the controller).
   * This is kept separate to maintain backward compatibility.
   */
  public String getDiscoveredInstagramUrl(String instagramUrl, String companyUrl) {
    log.info("Getting discovered Instagram URL for: {}", instagramUrl);
    
    // Extract username from Instagram URL
    String instagramUsername = extractInstagramUsername(instagramUrl);
    
    // ATTEMPT 1: Try with the Instagram handle we found
    InstagramResult result1 = searchBingAndClickThroughToInstagramEnhanced(instagramUsername, instagramUrl);
    
    // ATTEMPT 2: Try with company name if we have it
    InstagramResult result2 = null;
    if (companyUrl != null) {
      String companyName = extractCompanyNameFromUrl(companyUrl);
      if (companyName != null && !companyName.equalsIgnoreCase(instagramUsername)) {
        result2 = searchBingAndClickThroughToInstagramEnhanced(companyName, null);
      }
    }
    
    // Return the Instagram URL from whichever attempt had the better result
    // Prioritize based on follower count
    if (result2 != null && result2.followerCount != null) {
      if (result1 == null || result1.followerCount == null || 
          (result2.followerCount >= result1.followerCount)) {
        // Attempt 2 has higher or equal count, use its URL if available
        if (result2.instagramUrl != null && result2.instagramUrl.contains("instagram.com")) {
          log.info("Using Instagram URL from Attempt 2: {}", result2.instagramUrl);
          return result2.instagramUrl;
        }
      }
    }
    
    if (result1 != null && result1.instagramUrl != null && result1.instagramUrl.contains("instagram.com")) {
      log.info("Using Instagram URL from Attempt 1: {}", result1.instagramUrl);
      return result1.instagramUrl;
    }
    
    // Default to original if we couldn't find anything
    log.info("No better Instagram URL found, returning original: {}", instagramUrl);
    return instagramUrl;
  }
  
  /**
   * Helper class to return both follower count and page existence status
   */
  private static class InstagramResult {
    Long followerCount;
    boolean pageExists;
    String instagramUrl;  // URL to track discovered Instagram URLs
    
    InstagramResult(Long followerCount, boolean pageExists) {
      this.followerCount = followerCount;
      this.pageExists = pageExists;
      this.instagramUrl = null;
    }
    
    InstagramResult(Long followerCount, boolean pageExists, String instagramUrl) {
      this.followerCount = followerCount;
      this.pageExists = pageExists;
      this.instagramUrl = instagramUrl;
    }
  }
  
  /**
   * Enhanced version that returns both follower count and page existence status.
   * 
   * @param searchTerm The term to search (username or company name)
   * @param expectedUrl The expected Instagram URL (optional, for validation)
   * @return InstagramResult with follower count and page status
   */
  private InstagramResult searchBingAndClickThroughToInstagramEnhanced(String searchTerm, String expectedUrl) {
    WebDriver driver = null;
    Long bingFollowerCount = null;
    
    try {
      driver = CompanyExtractorUtils.createChromeDriver();
      
      // Step 1: Search Bing
      String searchQuery = searchTerm + " instagram site:instagram.com";
      String bingUrl = "https://www.bing.com/search?q=" + URLEncoder.encode(searchQuery, "UTF-8");
      log.info("Bing search URL: {}", bingUrl);
      
      driver.get(bingUrl);
      Thread.sleep(3000); // Wait for results
      
      // Extract follower count from Bing search results first (as backup)
      String pageText = driver.findElement(By.tagName("body")).getText();
      
      // Log first 500 chars to see what Bing is showing us (helps detect captchas)
      log.info("Bing page preview (first 500 chars): {}", 
               pageText.length() > 500 ? pageText.substring(0, 500) + "..." : pageText);
      
      bingFollowerCount = extractFollowerCountFromText(pageText);
      if (bingFollowerCount != null) {
        log.info("Found {} followers in Bing search results (backup)", bingFollowerCount);
      }
      
      // Try to extract Instagram username from Bing results
      String extractedUsername = extractInstagramUsernameFromBingText(pageText);
      String extractedInstagramUrl = null;
      if (extractedUsername != null) {
        extractedInstagramUrl = "https://www.instagram.com/" + extractedUsername;
        log.info("Extracted Instagram username from Bing: @{} -> {}", extractedUsername, extractedInstagramUrl);
      }
      
      // Step 2: Find and click the first Instagram link using XPath
      WebElement firstResult = null;
      String instagramLink = null;
      
      try {
        // Use XPath to find the FIRST Instagram link in search results
        firstResult = driver.findElement(By.xpath("(//li[@class='b_algo']//a[contains(@href, 'instagram.com')])[1]"));
        instagramLink = firstResult.getAttribute("href");
        log.info("Found Instagram link using XPath: {}", instagramLink);
      } catch (Exception e) {
        log.warn("No Instagram links found in Bing search results using XPath");
        // Try alternative selector for Bing's different HTML structures
        try {
          firstResult = driver.findElement(By.cssSelector("a[href*='instagram.com']"));
          instagramLink = firstResult.getAttribute("href");
          log.info("Found Instagram link using CSS selector fallback: {}", instagramLink);
        } catch (Exception e2) {
          log.warn("No Instagram links found with CSS selector either");
          
          // Could not find Instagram links in Bing results
          log.warn("No Instagram links found in Bing search results for: {}", searchTerm);
          
          // Return Bing count if we have it, with pageExists=false and extracted URL
          if (bingFollowerCount != null || extractedInstagramUrl != null) {
            log.info("Returning Bing data - count: {}, URL: {}", bingFollowerCount, extractedInstagramUrl);
            return new InstagramResult(bingFollowerCount, false, extractedInstagramUrl);
          }
          return null;
        }
      }
      
      // Verify we have a valid Instagram profile link (not stories, reels, etc)
      if (instagramLink != null && 
          (instagramLink.contains("/stories/") || 
           instagramLink.contains("/reels/") || 
           instagramLink.contains("/p/"))) {
        log.warn("First result is not a profile page: {}", instagramLink);
        // Try to find a profile link
        try {
          firstResult = driver.findElement(By.xpath("(//li[@class='b_algo']//a[contains(@href, 'instagram.com/') and not(contains(@href, '/stories/')) and not(contains(@href, '/reels/')) and not(contains(@href, '/p/'))])[1]"));
          instagramLink = firstResult.getAttribute("href");
          log.info("Found Instagram profile link: {}", instagramLink);
        } catch (Exception e) {
          log.warn("No Instagram profile links found");
          return bingFollowerCount != null ? new InstagramResult(bingFollowerCount, false) : null;
        }
      }
      
      log.info("Clicking on Instagram link from Bing: {}", instagramLink);
      
      // Get current window handle before clicking
      String originalWindow = driver.getWindowHandle();
      int tabCountBefore = driver.getWindowHandles().size();
      log.info("Tab count before click: {}", tabCountBefore);
      
      // Use JavaScript click to avoid interception
      JavascriptExecutor js = (JavascriptExecutor) driver;
      js.executeScript("arguments[0].click();", firstResult);
      
      // Wait for new tab to open
      Thread.sleep(2000);
      
      // Check if new tab opened and switch to it
      Set<String> allWindows = driver.getWindowHandles();
      int tabCountAfter = allWindows.size();
      log.info("Tab count after click: {}", tabCountAfter);
      
      if (tabCountAfter > tabCountBefore) {
        // Switch to the new tab
        for (String window : allWindows) {
          if (!window.equals(originalWindow)) {
            driver.switchTo().window(window);
            log.info("Switched to new tab");
            break;
          }
        }
      } else {
        log.warn("No new tab opened, staying on current page");
      }
      
      // Wait for page to load
      Thread.sleep(4000);
      
      // Step 3: Extract followers from Instagram page
      String currentUrl = driver.getCurrentUrl();
      String pageTitle = driver.getTitle();
      log.info("Current URL after navigation: {}", currentUrl);
      log.info("Page title: {}", pageTitle);
      
      // If we're still on Bing, try direct navigation as fallback
      if (currentUrl.contains("bing.com")) {
        log.warn("Still on Bing after tab switch, trying direct navigation");
        driver.get(instagramLink);
        Thread.sleep(4000);
        currentUrl = driver.getCurrentUrl();
        pageTitle = driver.getTitle();
        log.info("URL after direct navigation: {}", currentUrl);
      }
      
      // Check if page exists - we must be on Instagram, not Bing
      boolean pageExists = currentUrl.contains("instagram.com");
      if (pageExists && (pageTitle.toLowerCase().contains("page not found") || 
          pageTitle.toLowerCase().contains("sorry, this page"))) {
        log.warn("Instagram page not found - account may have been deleted or renamed");
        pageExists = false;
      }
      
      if (!currentUrl.contains("instagram.com")) {
        log.warn("Failed to navigate to Instagram - still on search engine");
        pageExists = false;
      }
      
      // Get page text and extract followers
      WebElement body = driver.findElement(By.tagName("body"));
      String instagramPageText = body.getText();
      
      // Log preview
      String preview = instagramPageText.length() > 500 ? 
                      instagramPageText.substring(0, 500) + "..." : instagramPageText;
      log.info("Instagram page text preview: {}", preview);
      
      // Check if we hit login page
      boolean isLoginPage = instagramPageText.toLowerCase().contains("log in") && 
                           instagramPageText.toLowerCase().contains("password");
      
      if (!pageExists) {
        // Page doesn't exist, return Bing count with pageExists=false
        return new InstagramResult(bingFollowerCount, false, extractedInstagramUrl);
      }
      
      if (isLoginPage) {
        log.warn("Hit Instagram login page despite click-through");
        // Return Bing count if we have it, with pageExists=false (since we can't access the page)
        return bingFollowerCount != null ? new InstagramResult(bingFollowerCount, false, extractedInstagramUrl) : null;
      }
      
      // Extract follower count from Instagram page
      Long instagramCount = extractFollowerCountFromText(instagramPageText);
      if (instagramCount != null) {
        log.info("SUCCESS: Extracted {} followers from Instagram page", instagramCount);
        // Return the Instagram URL we extracted from Bing (not login pages)
        return new InstagramResult(instagramCount, true, extractedInstagramUrl);
      }
      
      log.warn("No follower count found on Instagram page, using Bing fallback");
      // If we navigated to Instagram successfully but didn't find count, use Bing count
      // Return the Instagram URL we extracted from Bing (not the login/redirect URL)
      return new InstagramResult(bingFollowerCount, pageExists, extractedInstagramUrl);
      
    } catch (Exception e) {
      log.error("Failed during Bing search and click-through: {}", e.getMessage());
      return bingFollowerCount != null ? new InstagramResult(bingFollowerCount, false) : null;
    } finally {
      if (driver != null) {
        try {
          // Close all tabs and quit
          driver.quit();
        } catch (Exception e) {
          log.error("Error closing driver", e);
        }
      }
    }
  }
  
  /**
   * Search Bing for Instagram account and click through to Instagram page.
   * This mimics real user behavior and may bypass login walls.
   * 
   * @param searchTerm The term to search (username or company name)
   * @param expectedUrl The expected Instagram URL (optional, for validation)
   * @return Follower count if successful, null otherwise
   */
  private Long searchBingAndClickThroughToInstagram(String searchTerm, String expectedUrl) {
    InstagramResult result = searchBingAndClickThroughToInstagramEnhanced(searchTerm, expectedUrl);
    return result != null ? result.followerCount : null;
  }
  
  /**
   * Extract follower count from text using various patterns.
   */
  private Long extractFollowerCountFromText(String text) {
    // Try multiple patterns
    Pattern[] patterns = {
      Pattern.compile("([0-9.,]+[KMB]?)\\s+[Ff]ollowers", Pattern.CASE_INSENSITIVE),
      Pattern.compile("([0-9.,]+)\\s+[Ff]ollowers", Pattern.CASE_INSENSITIVE),
      Pattern.compile("[Ff]ollowers\\s*[:·•]?\\s*([0-9.,]+[KMB]?)", Pattern.CASE_INSENSITIVE)
    };
    
    for (Pattern pattern : patterns) {
      Matcher matcher = pattern.matcher(text);
      if (matcher.find()) {
        String followerText = matcher.group(1).replaceAll("[, ]", "");
        
        if (followerText.matches(".*[KMB]$")) {
          return parseAbbreviatedNumber(followerText);
        } else {
          try {
            return Long.parseLong(followerText);
          } catch (NumberFormatException e) {
            log.debug("Failed to parse follower count: {}", followerText);
          }
        }
      }
    }
    
    return null;
  }
  
  /**
   * Extract company name from URL.
   */
  private String extractCompanyNameFromUrl(String websiteUrl) {
    try {
      URL url = new URL(websiteUrl);
      String host = url.getHost();
      
      // Remove common prefixes
      host = host.replaceFirst("^(www\\.|m\\.|mobile\\.)", "");
      
      // Extract the main part before TLD
      String[] parts = host.split("\\.");
      if (parts.length > 0) {
        String companyName = parts[0];
        
        // Clean up common patterns
        companyName = companyName.replaceAll("-", " ");
        companyName = companyName.replaceAll("_", " ");
        
        // Capitalize first letter of each word
        String[] words = companyName.split(" ");
        StringBuilder cleanName = new StringBuilder();
        for (String word : words) {
          if (!word.isEmpty()) {
            cleanName.append(Character.toUpperCase(word.charAt(0)))
                     .append(word.substring(1).toLowerCase())
                     .append(" ");
          }
        }
        
        String result = cleanName.toString().trim();
        log.debug("Extracted company name '{}' from URL '{}'", result, websiteUrl);
        return result;
      }
    } catch (Exception e) {
      log.error("Failed to extract company name from URL: {}", websiteUrl, e);
    }
    
    return null;
  }
  
  /**
   * Extract Instagram follower count from Bing search results.
   * This serves as a fallback when direct Instagram access fails.
   */
  private Long getInstagramFollowersFromBingSearch(String instagramUrl) {
    log.info("Searching Bing for Instagram follower count fallback");
    
    WebDriver driver = null;
    try {
      // Extract username from Instagram URL
      String username = extractInstagramUsername(instagramUrl);
      if (username == null) {
        log.warn("Could not extract username from Instagram URL: {}", instagramUrl);
        return null;
      }
      
      driver = CompanyExtractorUtils.createChromeDriver();
      
      // Search Bing for the Instagram page
      String searchQuery = username + " instagram site:instagram.com";
      String bingUrl = "https://www.bing.com/search?q=" + URLEncoder.encode(searchQuery, "UTF-8");
      log.info("Bing search URL: {}", bingUrl);
      
      driver.get(bingUrl);
      Thread.sleep(3000); // Wait for results
      
      // Look for follower counts in search results
      // Pattern: "XXX Followers" in the search result snippets
      String pageText = driver.findElement(By.tagName("body")).getText();
      
      // Try multiple patterns that Bing might use
      Pattern[] patterns = {
        Pattern.compile("([0-9.,]+[KMB]?)\\s+Followers", Pattern.CASE_INSENSITIVE),
        Pattern.compile("([0-9.,]+)\\s+Followers", Pattern.CASE_INSENSITIVE),
        Pattern.compile("Followers\\s*[:·•]?\\s*([0-9.,]+[KMB]?)", Pattern.CASE_INSENSITIVE)
      };
      
      for (Pattern pattern : patterns) {
        Matcher matcher = pattern.matcher(pageText);
        if (matcher.find()) {
          String followerText = matcher.group(1).replaceAll("[, ]", "");
          log.info("Found follower count in Bing results: {}", followerText);
          
          if (followerText.matches(".*[KMB]$")) {
            Long count = parseAbbreviatedNumber(followerText);
            log.info("Bing search found {} followers (may be outdated)", count);
            return count;
          } else {
            try {
              Long count = Long.parseLong(followerText);
              log.info("Bing search found {} followers (may be outdated)", count);
              return count;
            } catch (NumberFormatException e) {
              log.warn("Failed to parse Bing follower count: {}", followerText);
            }
          }
        }
      }
      
      log.warn("No follower count found in Bing search results");
      return null;
      
    } catch (Exception e) {
      log.error("Failed to get Instagram followers from Bing: {}", e.getMessage());
      return null;
    } finally {
      if (driver != null) {
        try {
          driver.quit();
        } catch (Exception e) {
          log.error("Error closing Bing search driver", e);
        }
      }
    }
  }
  
  /**
   * Extract Instagram username from URL.
   */
  private String extractInstagramUsername(String instagramUrl) {
    try {
      // Remove trailing slash
      if (instagramUrl.endsWith("/")) {
        instagramUrl = instagramUrl.substring(0, instagramUrl.length() - 1);
      }
      
      // Extract username from URL like https://www.instagram.com/lyft
      String[] parts = instagramUrl.split("/");
      if (parts.length >= 2) {
        String username = parts[parts.length - 1];
        // Remove any query parameters
        if (username.contains("?")) {
          username = username.split("\\?")[0];
        }
        return username;
      }
    } catch (Exception e) {
      log.error("Error extracting Instagram username from URL: {}", instagramUrl, e);
    }
    return null;
  }
  
  /**
   * Extract Instagram username from Bing search result text.
   * Looks for patterns like "@username" or "username (@username)"
   */
  private String extractInstagramUsernameFromBingText(String text) {
    try {
      // Pattern 1: Look for "@username" pattern
      Pattern atPattern = Pattern.compile("@([a-zA-Z0-9._]+)");
      Matcher atMatcher = atPattern.matcher(text);
      if (atMatcher.find()) {
        String username = atMatcher.group(1);
        log.debug("Found Instagram username with @ pattern: {}", username);
        return username;
      }
      
      // Pattern 2: Look for "Something (@username)" pattern
      Pattern parenPattern = Pattern.compile("\\(@([a-zA-Z0-9._]+)\\)");
      Matcher parenMatcher = parenPattern.matcher(text);
      if (parenMatcher.find()) {
        String username = parenMatcher.group(1);
        log.debug("Found Instagram username with parentheses pattern: {}", username);
        return username;
      }
      
      // Pattern 3: Look for Instagram URL pattern in text
      Pattern urlPattern = Pattern.compile("instagram\\.com/([a-zA-Z0-9._]+)");
      Matcher urlMatcher = urlPattern.matcher(text);
      if (urlMatcher.find()) {
        String username = urlMatcher.group(1);
        // Filter out common Instagram paths
        if (!username.equals("p") && !username.equals("stories") && !username.equals("reels")) {
          log.debug("Found Instagram username from URL pattern: {}", username);
          return username;
        }
      }
    } catch (Exception e) {
      log.error("Error extracting Instagram username from Bing text", e);
    }
    return null;
  }
  
  /**
   * Parse abbreviated numbers like 1.2K, 5M, etc.
   */
  private Long parseAbbreviatedNumber(String text) {
    try {
      text = text.trim().toUpperCase();
      double multiplier = 1;
      
      if (text.endsWith("K")) {
        multiplier = 1000;
        text = text.substring(0, text.length() - 1);
      } else if (text.endsWith("M")) {
        multiplier = 1000000;
        text = text.substring(0, text.length() - 1);
      } else if (text.endsWith("B")) {
        multiplier = 1000000000;
        text = text.substring(0, text.length() - 1);
      }
      
      double value = Double.parseDouble(text) * multiplier;
      return Math.round(value);
    } catch (Exception e) {
      log.error("Failed to parse abbreviated number: {}", text, e);
      return null;
    }
  }
  
  /**
   * Dumps HTML around Instagram-related content for debugging purposes.
   * This helps understand why Instagram links might not be found in Bing results.
   */
  private void dumpHtmlAroundInstagramData(WebDriver driver, Long followerCount) {
    try {
      String pageSource = driver.getPageSource();
      
      // Find HTML around Instagram mentions
      Pattern instagramPattern = Pattern.compile("(?i)(instagram[^<]{0,200})", Pattern.DOTALL);
      Matcher matcher = instagramPattern.matcher(pageSource);
      
      int matchCount = 0;
      while (matcher.find() && matchCount < 3) { // Limit to first 3 matches
        int start = Math.max(0, matcher.start() - 200);
        int end = Math.min(pageSource.length(), matcher.end() + 200);
        String context = pageSource.substring(start, end);
        
        // Clean up the HTML for logging
        context = context.replaceAll("\\s+", " ").trim();
        
        log.info("Instagram mention {} context:\n{}", ++matchCount, context);
      }
      
      // If we found a follower count, look for HTML around that too
      if (followerCount != null) {
        String followerText = String.format("%,d", followerCount).replaceAll(",", "[,]?");
        Pattern followerPattern = Pattern.compile("(?i)(" + followerText + "[^<]{0,100})", Pattern.DOTALL);
        Matcher followerMatcher = followerPattern.matcher(pageSource);
        
        if (followerMatcher.find()) {
          int start = Math.max(0, followerMatcher.start() - 300);
          int end = Math.min(pageSource.length(), followerMatcher.end() + 300);
          String context = pageSource.substring(start, end);
          
          // Clean up the HTML
          context = context.replaceAll("\\s+", " ").trim();
          
          log.info("Follower count {} HTML context:\n{}", followerCount, context);
          
          // Look for any URLs in this context
          Pattern urlPattern = Pattern.compile("(?i)(?:href|data-href|data-url)=[\"']([^\"']+)[\"']");
          Matcher urlMatcher = urlPattern.matcher(context);
          
          List<String> foundUrls = new ArrayList<>();
          while (urlMatcher.find()) {
            foundUrls.add(urlMatcher.group(1));
          }
          
          if (!foundUrls.isEmpty()) {
            log.info("URLs found near follower count: {}", foundUrls);
          }
        }
      }
      
      // Also check for special Bing result containers
      List<WebElement> resultContainers = driver.findElements(By.cssSelector(
          ".b_algo, .b_ans, .b_top, .b_rich, .b_card"
      ));
      
      log.info("Found {} Bing result containers", resultContainers.size());
      
      for (int i = 0; i < Math.min(3, resultContainers.size()); i++) {
        WebElement container = resultContainers.get(i);
        String containerHtml = (String) ((JavascriptExecutor) driver)
            .executeScript("return arguments[0].outerHTML;", container);
        
        if (containerHtml.toLowerCase().contains("instagram")) {
          log.info("Bing container {} with Instagram mention:\n{}", 
                   i, containerHtml.replaceAll("\\s+", " ").substring(0, Math.min(500, containerHtml.length())));
        }
      }
      
    } catch (Exception e) {
      log.warn("Failed to dump HTML for debugging: {}", e.getMessage());
    }
  }

  public Map<String, Object> getVentureAddress(String website) {
    try {
      String gptAddress = getGptAddress(website);
      Map<String, Object> result = objectMapper.readValue(gptAddress, new TypeReference<HashMap<String, Object>>() {
      });
      Object address = result.get("fullAddress");
      if (address != null && !StringUtils.isEmpty(address.toString())) {
        GoogleService.LatLng coordinates = googleService.geocodeAddress(address.toString());
        if (coordinates != null) {
          result.put("lat", coordinates.getLat());
          result.put("lng", coordinates.getLng());
        }
      }
      return result;
    } catch (Exception ex) {
      return new HashMap<>();
    }
  }

  public String getGptAddress(String website) throws IOException {
    Document doc = Jsoup.connect(website).get();
    String content = doc.html();

    String footerContent = extractAndCleanSection(content, "footer");
    if (!footerContent.isEmpty()) {
      String result = impactAiService.findAddress(footerContent);
      if (result.length() > 10) {
        return result;
      }
    }

    String headerContent = extractAndCleanSection(content, "header");
    if (!headerContent.isEmpty()) {
      String result = impactAiService.findAddress(headerContent);
      if (result.length() > 10) {
        return result;
      }
    }

    removeSection(doc, "header");
    removeSection(doc, "footer");
    String mainContent = doc.html();

    if (!mainContent.isEmpty()) {
      String result = impactAiService.findAddress(mainContent);
      if (result.length() > 10) {
        return result;
      }
    }

    return "";
  }

  private void removeSection(Document doc, String tagName) {
    Elements elements = doc.select(tagName);
    for (Element element : elements) {
      element.remove();
    }
  }

  private String extractAndCleanSection(String html, String tagName) {
    Document doc = Jsoup.parse(html);
    Element element = doc.selectFirst(tagName);
    return element != null ? element.html() : "";
  }

  public String getVentureLogo(String twitter, User user) {
    String url = getLogoUrlFromTwitter(twitter);
    if (!StringUtils.isEmpty(url)) {
      InputStream in = getImageBytes(url);
      return cloudinaryService.upload(in, user.getId());
    }
    return null;
  }

  private InputStream getImageBytes(String url) {
    byte[] imageBytes = restTemplate.getForObject(url, byte[].class);
    if (imageBytes != null) {
      return new ByteArrayInputStream(imageBytes);
    }
    return null;
  }

  private String getLogoUrlFromTwitter(String twitter) {
    WebDriver driver = CompanyExtractorUtils.createChromeDriver();
    try {
      driver.get(twitter);
      // Page load timeout already set to 60 seconds in CompanyExtractorUtils

      WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(15)); // Adjust time as needed
      By imgSelector = By.cssSelector("img[alt='Square profile picture and Opens profile photo']");
      wait.until(ExpectedConditions.presenceOfElementLocated(imgSelector));

      WebElement logoImg = driver.findElement(imgSelector);
      return logoImg.getAttribute("src");
    } catch (Exception ex) {
      log.error("Cannot find venture logo on Twitter", ex);
      Sentry.captureException(ex);
      return null;
    } finally {
      if (driver != null) {
        driver.quit(); // Close the browser
      }
    }
  }

  public Map<String, Object> getPortfolioManagerData(String website) throws IOException {
    if (!website.startsWith("http")) {
      website = "https://" + website;
    }

    Map<String, Object> response = new HashMap<>();

    response.put("website", website);
    response.put("address", getVentureAddress(website));

    Document doc = Jsoup.connect(website).get();
    String content = doc.html();

    String headerContent = extractAndCleanSection(content, "header");
    if (!headerContent.isEmpty()) {
      response.put("name", impactAiService.findCompanyName(headerContent));
      response.put("logo", impactAiService.findCompanyLogo(headerContent));
    }

    String footerContent = extractAndCleanSection(content, "footer");
    if (!footerContent.isEmpty()) {
      String gptSocial = impactAiService.findSocialMedia(footerContent);
      Map<String, String> social = objectMapper.readValue(gptSocial, new TypeReference<HashMap<String, String>>() {
      });
      response.put("social", social);
    }

    removeSection(doc, "header");
    removeSection(doc, "footer");
    String mainContent = doc.text();

    if (!mainContent.isEmpty()) {
      response.put("description", impactAiService.findCompanyDescription(mainContent));
      response.put("mission", impactAiService.findCompanyMission(mainContent));
    }

    return response;
  }

  public String getWebsiteData(String url) {
    if (StringUtils.isEmpty(url)) {
      return "";
    }

    try {
      if (!url.startsWith("http")) {
        url = "https://" + url;
      }

      Document doc = Jsoup.connect(url).get();
      removeSection(doc, "header");
      removeSection(doc, "footer");
      return doc.text();
    } catch (Exception ex) {
      log.error("Method 'getWebsiteData'. Cannot get website contents for URL: " + url);
      return "";
    }
  }
}
