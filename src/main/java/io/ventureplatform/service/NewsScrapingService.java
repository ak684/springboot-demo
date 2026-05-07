package io.ventureplatform.service;

import io.ventureplatform.util.CompanyExtractorUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.openqa.selenium.By;
import org.openqa.selenium.NoSuchElementException;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.springframework.stereotype.Service;
import org.springframework.web.util.HtmlUtils;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Service for scraping news articles from Google News.
 * Uses Selenium WebDriver for JavaScript-rendered content.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class NewsScrapingService {

  /**
   * Base URL for Google News search (German localization).
   */
  private static final String GOOGLE_NEWS_SEARCH_URL =
      "https://news.google.com/search?q=%s&hl=de&gl=DE&ceid=DE:de";

  /**
   * Time to wait in milliseconds for page to load.
   */
  private static final int PAGE_LOAD_WAIT_MS = 3000;

  /**
   * Maximum text length for source detection.
   */
  private static final int MAX_SOURCE_TEXT_LENGTH = 100;

  /**
   * Minimum summary length to extract.
   */
  private static final int MIN_SUMMARY_LENGTH = 100;

  /**
   * Maximum summary length to extract.
   */
  private static final int MAX_SUMMARY_LENGTH = 300;

  /**
   * Milliseconds in one second.
   */
  private static final long MILLIS_PER_SECOND = 1000L;

  /**
   * Seconds in one minute.
   */
  private static final int SECONDS_PER_MINUTE = 60;

  /**
   * Minutes in one hour.
   */
  private static final int MINUTES_PER_HOUR = 60;

  /**
   * Hours in one day.
   */
  private static final int HOURS_PER_DAY = 24;

  /**
   * Days in one week.
   */
  private static final int DAYS_PER_WEEK = 7;

  /**
   * Default value for extracting numbers from text.
   */
  private static final int DEFAULT_NUMBER_VALUE = 1;

  /**
   * Maximum age of articles to scrape (in months).
   */
  private static final int MAX_ARTICLE_AGE_MONTHS = 1;

  /**
   * Regex to strip common legal suffixes from company names.
   */
  private static final String LEGAL_SUFFIX_REGEX =
      "(?i)\\s+(gmbh|inc|ltd|llc|ag|sa|sarl|bv)\\.?$";

  /**
   * Enum to represent the result of a scraping attempt.
   */
  private enum ScrapeResult {
    NO_RESULTS,
    RESULTS_FOUND,
    UNSUCCESSFUL
  }

  /**
   * Scrape news articles for a company from Google News.
   * Uses Selenium WebDriver to handle JavaScript rendering.
   *
   * @param companyName the name of the company to search for
   * @return list of article data maps containing title, url, source, etc.
   */
  public List<Map<String, Object>> scrapeGoogleNews(final String companyName) {
    WebDriver driver = null;
    try {
      driver = CompanyExtractorUtils.createChromeDriver();
      return scrapeGoogleNews(companyName, driver);
    } finally {
      if (driver != null) {
        driver.quit();
      }
    }
  }

  /**
   * Scrape news using an existing WebDriver (allows reuse between companies).
   *
   * @param companyName company to search
   * @param driver shared WebDriver instance
   * @return scraped articles
   */
  public List<Map<String, Object>> scrapeGoogleNews(final String companyName,
                                                    final WebDriver driver) {
    if (driver == null) {
      throw new IllegalArgumentException("WebDriver must not be null");
    }
    return scrapeGoogleNewsInternal(companyName, driver);
  }

  private List<Map<String, Object>> scrapeGoogleNewsInternal(
      final String companyName,
      final WebDriver driver) {
    List<Map<String, Object>> articles = new ArrayList<>();
    String searchUrl = null;

    try {
      log.info("=== NEWS SCRAPING START ===");
      log.info("Scraping news for company: {}", companyName);

      // Build search URL
      String searchQuery = buildExactMatchQuery(companyName);
      if (searchQuery == null || searchQuery.isEmpty()) {
        searchQuery = companyName != null ? companyName.trim() : "";
      }
      if (searchQuery.isEmpty()) {
        log.warn("Skipping news scrape due to missing company name");
        return articles;
      }
      String encodedName = URLEncoder.encode(searchQuery,
          StandardCharsets.UTF_8);
      searchUrl = String.format(GOOGLE_NEWS_SEARCH_URL, encodedName);
      log.info("Search URL: {}", searchUrl);

      // Load page
      driver.get(searchUrl);
      log.info("Loaded Google News page");

      // Wait for JavaScript to render
      Thread.sleep(PAGE_LOAD_WAIT_MS);

      // Analyze page to detect blocking or errors
      ScrapeResult pageStatus = analyzePage(driver);

      if (pageStatus == ScrapeResult.UNSUCCESSFUL) {
        log.warn("=== GOOGLE NEWS ACCESS ISSUE DETECTED ===");
        log.warn("Company: {}, URL: {}", companyName, searchUrl);
        log.warn("Unable to access Google News - page might be "
            + "blocked, rate limited, or failed to load");
        log.warn("No article elements found and no clear 'no results' "
            + "message - possible access restriction");
        return articles;
      }

      if (pageStatus == ScrapeResult.NO_RESULTS) {
        log.info("Google News returned no results for company: {}",
            companyName);
        return articles;
      }

      // Find all article containers
      List<WebElement> articleElements = driver.findElements(
          By.cssSelector("[data-n-tid='38']"));
      log.info("Found {} article containers", articleElements.size());

      int articleCount = 0;
      int articlesSkipped = 0;

      for (WebElement article : articleElements) {
        try {
          Map<String, Object> articleData =
              extractArticleData(article, companyName, searchUrl);
          if (articleData != null && !articleData.isEmpty()) {
            articles.add(articleData);
            articleCount++;
            log.info("Article {}: {}", articleCount, articleData.get("title"));
          }
        } catch (Exception e) {
          log.warn("Failed to extract article from Google News. "
              + "Company: {}, Search URL: {}",
              companyName, searchUrl);
          articlesSkipped++;
        }
      }

      log.info("=== NEWS SCRAPING COMPLETE ===");
      log.info("Successfully scraped {} articles for {} (skipped: {})",
          articles.size(), companyName, articlesSkipped);

    } catch (Exception e) {
      log.error("Failed to scrape news for company: {}. Search URL: {}",
          companyName, searchUrl, e);
    }

    return articles;
  }

  /**
   * Build an exact-match query for the given company name.
   *
   * @param companyName the raw company name
   * @return quoted search query for Google News
   */
  private String buildExactMatchQuery(final String companyName) {
    if (companyName == null) {
      return "";
    }
    String sanitized = sanitizeCompanyName(companyName);
    if (sanitized.isEmpty()) {
      sanitized = companyName.trim();
    }
    if (sanitized.isEmpty()) {
      return "";
    }
    return "\"" + sanitized + "\"";
  }

  /**
   * Sanitize company names by removing legal suffixes and extra whitespace.
   *
   * @param companyName the raw company name
   * @return sanitized company name
   */
  private String sanitizeCompanyName(final String companyName) {
    if (companyName == null) {
      return "";
    }
    String sanitized = companyName.trim();
    sanitized = sanitized.replace(",", "");
    sanitized = sanitized.replaceAll("\\s+", " ");
    sanitized = sanitized.replaceAll(LEGAL_SUFFIX_REGEX, "");
    return sanitized.trim();
  }

  /**
   * Analyzes the page to determine if we found results, no results,
   * or encountered an issue (blocked/error).
   *
   * @param driver the WebDriver instance
   * @return ScrapeResult indicating the outcome
   */
  private ScrapeResult analyzePage(final WebDriver driver) {
    try {
      // Check if we can find article elements on the page
      List<WebElement> articleElements = driver.findElements(
          By.cssSelector("[data-n-tid='38']"));

      if (!articleElements.isEmpty()) {
        log.debug("Found {} article elements on page", articleElements.size());
        return ScrapeResult.RESULTS_FOUND;
      }

      // Check for explicit "no results" indicators
      List<WebElement> noResultsElements = driver.findElements(
          By.cssSelector("div.no-results, div[class*='no-results'], "
              + "div[class*='empty']"));

      if (!noResultsElements.isEmpty()) {
        log.debug("Found 'no results' indicator on page");
        return ScrapeResult.NO_RESULTS;
      }

      // Check page text for "no results" messages
      String pageText = driver.getPageSource().toLowerCase();
      if (pageText.contains("no results")
          || pageText.contains("keine ergebnisse")
          || pageText.contains("no news found")) {
        log.debug("Found 'no results' text in page content");
        return ScrapeResult.NO_RESULTS;
      }

      // No clear indication - might be blocked, error page, etc.
      log.warn("No article elements found and no 'no results' message - "
          + "page might be blocked or failed to load");
      log.debug("Page title: {}", driver.getTitle());

      return ScrapeResult.UNSUCCESSFUL;

    } catch (Exception e) {
      log.error("Error analyzing page: {}", e.getMessage());
      return ScrapeResult.UNSUCCESSFUL;
    }
  }

  /**
   * Extract data from a single article element using robust selectors.
   *
   * @param article the article web element
   * @param companyName the company name being searched
   * @param searchUrl the search URL used
   * @return map of article data or null if extraction failed
   */
  private Map<String, Object> extractArticleData(
      final WebElement article,
      final String companyName,
      final String searchUrl) {
    Map<String, Object> data = new HashMap<>();

    // Extract headline and URL
    String headline = extractHeadline(article);
    String url = extractUrl(article);

    if (headline == null || headline.isEmpty()) {
      log.debug("No headline found, skipping article");
      return null;
    }

    data.put("title", headline);
    data.put("url", url);

    // Extract source
    String source = extractSource(article);
    data.put("source", source != null ? source : "Unknown");

    // Extract date
    Date publishedDate = extractDate(article);

    // Filter: Skip articles older than MAX_ARTICLE_AGE_MONTHS
    java.util.Calendar cutoffDate = java.util.Calendar.getInstance();
    cutoffDate.add(java.util.Calendar.MONTH, -MAX_ARTICLE_AGE_MONTHS);
    if (publishedDate.before(cutoffDate.getTime())) {
      log.debug("Skipping article older than {} month(s): {} (published: {})",
          MAX_ARTICLE_AGE_MONTHS, headline, publishedDate);
      return null;
    }

    data.put("publishedDate", publishedDate);

    // Extract summary (optional)
    String summary = extractSummary(article);
    data.put("summary", summary);

    return data;
  }

  /**
   * Extract headline using stable selectors with fallbacks.
   *
   * @param article the article web element
   * @return the headline text or null if not found
   */
  private String extractHeadline(final WebElement article) {
    try {
      // Primary: Use data-n-tid attribute (most stable)
      WebElement headlineLink = article.findElement(
          By.cssSelector("a[data-n-tid='29']"));

      // Try aria-label first (often more complete)
      String ariaLabel = headlineLink.getAttribute("aria-label");
      if (ariaLabel != null && !ariaLabel.isEmpty()) {
        return HtmlUtils.htmlUnescape(ariaLabel);
      }

      // Fallback to text content
      String text = headlineLink.getText();
      if (text != null && !text.isEmpty()) {
        return HtmlUtils.htmlUnescape(text);
      }
    } catch (NoSuchElementException e) {
      log.debug("Primary headline selector failed, trying fallback");
    }

    try {
      // Fallback: Find first <a> tag in article
      WebElement link = article.findElement(By.tagName("a"));
      String ariaLabel = link.getAttribute("aria-label");
      if (ariaLabel != null && !ariaLabel.isEmpty()) {
        return HtmlUtils.htmlUnescape(ariaLabel);
      }
      String text = link.getText();
      if (text != null && !text.isEmpty()) {
        return HtmlUtils.htmlUnescape(text);
      }
    } catch (NoSuchElementException e) {
      log.debug("Fallback headline selector also failed");
    }

    return null;
  }

  /**
   * Extract source using stable selectors with fallbacks.
   *
   * @param article the article web element
   * @return the source name or null if not found
   */
  private String extractSource(final WebElement article) {
    try {
      // Primary: Use data-n-tid="9" (most stable for source)
      WebElement sourceDiv = article.findElement(
          By.cssSelector("div[data-n-tid='9']"));
      String source = sourceDiv.getText();
      if (source != null && !source.isEmpty()) {
        return HtmlUtils.htmlUnescape(source);
      }
    } catch (NoSuchElementException e) {
      log.debug("Primary source selector failed, trying fallback");
    }

    try {
      // Fallback: Find any div that looks like a source
      List<WebElement> divs = article.findElements(By.tagName("div"));
      for (WebElement div : divs) {
        String text = div.getText();
        if (text != null && text.length() > 0
            && text.length() < MAX_SOURCE_TEXT_LENGTH
            && !text.contains("\n")) {
          // Likely a source if it's short, single-line text
          return HtmlUtils.htmlUnescape(text);
        }
      }
    } catch (Exception e) {
      log.debug("Fallback source selector failed");
    }

    return null;
  }

  /**
   * Extract URL using stable selectors with fallbacks.
   *
   * @param article the article web element
   * @return the article URL or null if not found
   */
  private String extractUrl(final WebElement article) {
    try {
      // Primary: Use data-n-tid attribute
      WebElement link = article.findElement(
          By.cssSelector("a[data-n-tid='29']"));
      String href = link.getAttribute("href");
      if (href != null && !href.isEmpty()) {
        return normalizeGoogleNewsUrl(href);
      }
    } catch (NoSuchElementException e) {
      log.debug("Primary URL selector failed, trying fallback");
    }

    try {
      // Fallback: Find first <a> tag
      WebElement link = article.findElement(By.tagName("a"));
      String href = link.getAttribute("href");
      if (href != null && !href.isEmpty()) {
        return normalizeGoogleNewsUrl(href);
      }
    } catch (NoSuchElementException e) {
      log.debug("Fallback URL selector failed");
    }

    return null;
  }

  /**
   * Normalize Google News URLs (convert relative to absolute).
   *
   * @param href the href attribute from the link
   * @return normalized absolute URL
   */
  private String normalizeGoogleNewsUrl(final String href) {
    if (href.startsWith("./articles/") || href.startsWith("./read/")) {
      return "https://news.google.com" + href.substring(1);
    }
    return href;
  }

  /**
   * Extract date using stable selectors with fallbacks.
   *
   * @param article the article web element
   * @return the published date or current date if not found
   */
  private Date extractDate(final WebElement article) {
    try {
      // Primary: Use time.hvbAAd selector
      WebElement timeElement = article.findElement(
          By.cssSelector("time.hvbAAd"));

      // Try datetime attribute first
      String datetime = timeElement.getAttribute("datetime");
      if (datetime != null && !datetime.isEmpty()) {
        try {
          SimpleDateFormat isoFormat =
              new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'");
          return isoFormat.parse(datetime);
        } catch (ParseException e) {
          log.debug("Could not parse datetime: {}", datetime);
        }
      }

      // Fallback to parsing text
      String timeText = timeElement.getText();
      if (timeText != null && !timeText.isEmpty()) {
        return parseRelativeTime(timeText);
      }
    } catch (NoSuchElementException e) {
      log.debug("Primary date selector failed, trying fallback");
    }

    try {
      // Fallback: Find any <time> tag
      WebElement timeElement = article.findElement(By.tagName("time"));
      String datetime = timeElement.getAttribute("datetime");
      if (datetime != null && !datetime.isEmpty()) {
        try {
          SimpleDateFormat isoFormat =
              new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'");
          return isoFormat.parse(datetime);
        } catch (ParseException e) {
          log.debug("Could not parse datetime: {}", datetime);
        }
      }
      String timeText = timeElement.getText();
      if (timeText != null && !timeText.isEmpty()) {
        return parseRelativeTime(timeText);
      }
    } catch (NoSuchElementException e) {
      log.debug("Fallback date selector failed");
    }

    return new Date(); // Default to now if no date found
  }

  /**
   * Parse relative time strings like "2 hours ago", "yesterday".
   *
   * @param timeText the relative time text to parse
   * @return the calculated date or current date if parsing failed
   */
  private Date parseRelativeTime(final String timeText) {
    Date now = new Date();
    long currentTime = now.getTime();

    try {
      String lowerText = timeText.toLowerCase();

      if (lowerText.contains("minute")) {
        int minutes = extractNumber(lowerText, DEFAULT_NUMBER_VALUE);
        long millisOffset = minutes * SECONDS_PER_MINUTE * MILLIS_PER_SECOND;
        return new Date(currentTime - millisOffset);
      } else if (lowerText.contains("hour")) {
        int hours = extractNumber(lowerText, DEFAULT_NUMBER_VALUE);
        long millisOffset = hours * MINUTES_PER_HOUR
            * SECONDS_PER_MINUTE * MILLIS_PER_SECOND;
        return new Date(currentTime - millisOffset);
      } else if (lowerText.contains("day")
          || lowerText.contains("yesterday")) {
        int days = lowerText.contains("yesterday")
            ? DEFAULT_NUMBER_VALUE
            : extractNumber(lowerText, DEFAULT_NUMBER_VALUE);
        long millisOffset = days * HOURS_PER_DAY * MINUTES_PER_HOUR
            * SECONDS_PER_MINUTE * MILLIS_PER_SECOND;
        return new Date(currentTime - millisOffset);
      } else if (lowerText.contains("week")) {
        int weeks = extractNumber(lowerText, DEFAULT_NUMBER_VALUE);
        long millisOffset = weeks * DAYS_PER_WEEK * HOURS_PER_DAY
            * MINUTES_PER_HOUR * SECONDS_PER_MINUTE * MILLIS_PER_SECOND;
        return new Date(currentTime - millisOffset);
      }
    } catch (Exception e) {
      log.debug("Could not parse relative time: {}", timeText);
    }

    return now;
  }

  /**
   * Extract number from text, with default fallback.
   *
   * @param text the text to extract number from
   * @param defaultValue the default value if no number found
   * @return the extracted number or default value
   */
  private int extractNumber(final String text, final int defaultValue) {
    String[] parts = text.split(" ");
    for (String part : parts) {
      try {
        return Integer.parseInt(part);
      } catch (NumberFormatException e) {
        // Continue to next part
      }
    }
    return defaultValue;
  }

  /**
   * Extract summary/snippet from article.
   * Summary is optional, so we don't try too hard if not found.
   *
   * @param article the article web element
   * @return the summary text or null if not found
   */
  private String extractSummary(final WebElement article) {
    try {
      // Just get all text from article and truncate
      String fullText = article.getText();
      if (fullText != null && fullText.length() > MIN_SUMMARY_LENGTH) {
        // Take first 300 chars as summary
        int endIndex = Math.min(MAX_SUMMARY_LENGTH, fullText.length());
        String summary = fullText.substring(0, endIndex) + "...";
        return HtmlUtils.htmlUnescape(summary);
      }
    } catch (Exception e) {
      log.debug("Could not extract summary");
    }
    return null;
  }
}
