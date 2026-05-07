package io.ventureplatform.service;

import io.ventureplatform.entity.CompanyExtractionData;
import io.ventureplatform.entity.NewsEvent;
import io.ventureplatform.entity.User;
import io.ventureplatform.entity.enums.NewsSourceType;
import io.ventureplatform.repository.CompanyExtractionDataRepository;
import io.ventureplatform.repository.NewsEventRepository;
import io.ventureplatform.util.CompanyExtractorUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.openqa.selenium.WebDriver;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Calendar;
import java.util.Collections;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Service for managing news events for companies.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class NewsEventService {

  /**
   * Maximum length for article title.
   */
  private static final int TITLE_MAX_LENGTH = 500;

  /**
   * Truncation suffix length.
   */
  private static final int TRUNCATION_SUFFIX_LENGTH = 3;

  /**
   * Maximum length for source URL.
   */
  private static final int URL_MAX_LENGTH = 1000;

  /**
   * Organization ID to use when user has no organization.
   */
  private static final long NO_ORGANIZATION_ID = -1L;

  /**
   * Repository for news event persistence.
   */
  private final NewsEventRepository newsEventRepository;

  /**
   * Repository for company extraction data.
   */
  private final CompanyExtractionDataRepository companyExtractionDataRepository;

  /**
   * Service for scraping news articles.
   */
  private final NewsScrapingService newsScrapingService;

  /**
   * Service for security and authorization.
   */
  private final SecurityService securityService;

  /**
   * Fetch and save news for all tracked companies.
   * This is the same logic as the scheduled job, but without weekday
   * rotation - processes ALL tracked companies immediately.
   *
   * @param limit optional limit on number of companies to process
   *              (null or -1 means no limit)
   * @return map containing success status and processing statistics
   */
  public Map<String, Object> fetchAndSaveNewsForAllTrackedCompanies(
      final Integer limit) {
    Map<String, Object> result = new HashMap<>();

    try {
      log.info("=== BULK NEWS SCRAPING START ===");
      log.info("Starting manual news scraping for all tracked companies");

      List<CompanyExtractionData> trackedCompanies =
        companyExtractionDataRepository.findByTrackNews(true);

      if (trackedCompanies.isEmpty()) {
        log.info("No companies are currently tracking news");
        result.put("success", true);
        result.put("message", "No companies tracking news");
        result.put("companiesProcessed", 0);
        result.put("totalArticlesSaved", 0);
        return result;
      }

      log.info("Found {} companies with news tracking enabled",
        trackedCompanies.size());

      // Filter to only companies that have never been scraped
      List<CompanyExtractionData> neverScrapedCompanies =
        trackedCompanies.stream()
          .filter(company -> {
            List<NewsEvent> existingNews = newsEventRepository
              .findByCompanyExtractionDataIdOrderByPublishedDateDesc(
                company.getId());
            return existingNews.isEmpty();
          })
          .collect(java.util.stream.Collectors.toList());

      log.info("Filtered to {} companies that have never been scraped "
          + "(skipping {} already-scraped companies)",
        neverScrapedCompanies.size(),
        trackedCompanies.size() - neverScrapedCompanies.size());

      if (neverScrapedCompanies.isEmpty()) {
        log.info("All tracked companies have already been scraped");
        result.put("success", true);
        result.put("message", "All companies have already been scraped");
        result.put("companiesProcessed", 0);
        result.put("totalArticlesSaved", 0);
        result.put("companiesSkipped",
          trackedCompanies.size());
        return result;
      }

      // Apply limit if specified
      List<CompanyExtractionData> companiesToProcess = neverScrapedCompanies;
      if (limit != null && limit > 0
          && limit < neverScrapedCompanies.size()) {
        companiesToProcess = neverScrapedCompanies.subList(0, limit);
        log.info("Limiting to first {} companies (limit parameter applied)",
          limit);
      }

      int successCount = 0;
      int failureCount = 0;
      int totalArticlesSaved = 0;

      WebDriver sharedDriver = null;
      try {
        sharedDriver = CompanyExtractorUtils.createChromeDriver();

        for (CompanyExtractionData company : companiesToProcess) {
          try {
            log.info("Scraping news for: {} (ID: {})",
              company.getCompanyName(), company.getId());

            Map<String, Object> companyResult =
              fetchAndSaveNewsForCompany(company.getId(), sharedDriver);

            if (Boolean.TRUE.equals(companyResult.get("success"))) {
              successCount++;
              Object saved = companyResult.get("articlesSaved");
              if (saved != null) {
                totalArticlesSaved += (Integer) saved;
              }
              log.info("Successfully scraped company {} - saved {} articles",
                company.getCompanyName(),
                companyResult.get("articlesSaved"));
            } else {
              failureCount++;
              log.warn("Failed to scrape company {}: {}",
                company.getCompanyName(),
                companyResult.get("message"));
            }

            // Add delay between companies (20-90 seconds) to avoid rate
            // limiting
            if (successCount + failureCount < companiesToProcess.size()) {
              int delaySeconds = CompanyExtractorUtils
                .getRandomDelaySeconds(20, 90);
              log.debug("Waiting {} seconds before next company ({}/{})",
                delaySeconds, successCount + failureCount,
                companiesToProcess.size());
              Thread.sleep(delaySeconds * 1000L);
            }

          } catch (Exception e) {
            log.error("Error scraping news for company {} ({}): {}",
              company.getId(),
              company.getCompanyName(),
              e.getMessage());
            failureCount++;
          }
        }
      } finally {
        if (sharedDriver != null) {
          sharedDriver.quit();
        }
      }

      log.info("=== BULK NEWS SCRAPING COMPLETE ===");
      log.info("Processed {}/{} companies. Success: {}, Failed: {}, "
          + "Total articles saved: {}",
        companiesToProcess.size(), companiesToProcess.size(),
        successCount, failureCount, totalArticlesSaved);

      result.put("success", true);
      result.put("message",
        String.format("Processed %d companies, saved %d articles total",
          companiesToProcess.size(), totalArticlesSaved));
      result.put("companiesTotal", companiesToProcess.size());
      result.put("companiesAvailable", trackedCompanies.size());
      result.put("companiesSkipped",
        trackedCompanies.size() - neverScrapedCompanies.size());
      result.put("companiesSuccess", successCount);
      result.put("companiesFailed", failureCount);
      result.put("totalArticlesSaved", totalArticlesSaved);

    } catch (Exception e) {
      log.error("Unexpected error in bulk news scraping", e);
      result.put("success", false);
      result.put("message", "Error: " + e.getMessage());
      result.put("companiesProcessed", 0);
      result.put("totalArticlesSaved", 0);
    }

    return result;
  }

  /**
   * Fetch and save news for a specific company.
   * Returns a result map with article count and status.
   *
   * @param companyId the company ID to fetch news for
   * @return map containing success status, article counts, and messages
   */
  @Transactional
  public Map<String, Object> fetchAndSaveNewsForCompany(
      final Long companyId) {
    return fetchAndSaveNewsForCompanyInternal(companyId, null);
  }

  /**
   * Variant that reuses a shared WebDriver (cron job/manual batch).
   *
   * @param companyId the company ID
   * @param sharedDriver shared WebDriver instance
   * @return map containing success status, article counts, and messages
   */
  @Transactional
  public Map<String, Object> fetchAndSaveNewsForCompany(
      final Long companyId,
      final WebDriver sharedDriver) {
    return fetchAndSaveNewsForCompanyInternal(companyId, sharedDriver);
  }

  private Map<String, Object> fetchAndSaveNewsForCompanyInternal(
      final Long companyId,
      final WebDriver sharedDriver) {
    Map<String, Object> result = new HashMap<>();

    try {
      log.info("=== FETCH NEWS START ===");
      log.info("Fetching news for company ID: {}", companyId);

      // Get company data
      Optional<CompanyExtractionData> companyOpt =
          companyExtractionDataRepository.findById(companyId);

      if (!companyOpt.isPresent()) {
        log.error("Company not found with ID: {}", companyId);
        result.put("success", false);
        result.put("message", "Company not found");
        result.put("articlesFound", 0);
        return result;
      }

      CompanyExtractionData company = companyOpt.get();
      String companyName = company.getCompanyName();
      log.info("Company found: {}", companyName);

      // Update last scraped timestamp
      company.setLastNewsScrapedAt(new Date());
      companyExtractionDataRepository.save(company);
      log.info("Updated last_news_scraped_at timestamp for company: {}",
        companyName);

      // Scrape news articles
      log.info("Starting news scraping for: {}", companyName);
      List<Map<String, Object>> articles =
          sharedDriver == null
              ? newsScrapingService.scrapeGoogleNews(companyName)
              : newsScrapingService.scrapeGoogleNews(companyName, sharedDriver);
      log.info("Scraping returned {} articles", articles.size());

      // Save articles to database
      int savedCount = 0;
      int skippedCount = 0;
      int duplicateCount = 0;

      for (Map<String, Object> articleData : articles) {
        try {
          NewsEvent newsEvent = createNewsEvent(articleData, company);

          if (newsEvent.getTitle() == null
              || newsEvent.getTitle().isEmpty()) {
            log.debug("Skipping article with empty title");
            skippedCount++;
            continue;
          }

          // Check for duplicates by title
          Optional<NewsEvent> existing = newsEventRepository
              .findByCompanyExtractionDataIdAndTitle(
                  company.getId(),
                  newsEvent.getTitle());

          if (existing.isPresent()) {
            log.debug("Duplicate article found, skipping: {}",
              newsEvent.getTitle());
            duplicateCount++;
            continue;
          }

          NewsEvent saved = newsEventRepository.save(newsEvent);
          savedCount++;

          log.info("Saved article #{}: {}", savedCount, saved.getTitle());
          log.debug("Article details - Source: {}, Date: {}, URL: {}",
              saved.getSource(), saved.getPublishedDate(),
              saved.getSourceUrl());

        } catch (Exception e) {
          log.error("Failed to save article: {}", articleData.get("title"), e);
          skippedCount++;
        }
      }

      log.info("=== FETCH NEWS COMPLETE ===");
      log.info("Company: {}, Articles found: {}, Saved: {}, "
          + "Duplicates: {}, Skipped: {}",
          companyName, articles.size(), savedCount,
          duplicateCount, skippedCount);

      result.put("success", true);
      result.put("message",
          String.format("Successfully fetched %d articles", savedCount));
      result.put("articlesFound", articles.size());
      result.put("articlesSaved", savedCount);
      result.put("articlesDuplicate", duplicateCount);
      result.put("articlesSkipped", skippedCount);
      result.put("companyName", companyName);

    } catch (Exception e) {
      log.error("Unexpected error fetching news for company {}", companyId, e);
      result.put("success", false);
      result.put("message", "Error: " + e.getMessage());
      result.put("articlesFound", 0);
    }

    return result;
  }

  /**
   * Create NewsEvent entity from scraped article data.
   *
   * @param articleData the map of scraped article data
   * @param company the company this article is about
   * @return the created NewsEvent entity
   */
  private NewsEvent createNewsEvent(final Map<String, Object> articleData,
                                    final CompanyExtractionData company) {
    NewsEvent newsEvent = new NewsEvent();
    newsEvent.setCompanyExtractionData(company);

    // Set source type (default to GOOGLE_NEWS for now)
    newsEvent.setSourceType(NewsSourceType.GOOGLE_NEWS);

    // Set title
    String title = (String) articleData.get("title");
    if (title != null) {
      // Truncate if too long
      if (title.length() > TITLE_MAX_LENGTH) {
        int endIndex = TITLE_MAX_LENGTH - TRUNCATION_SUFFIX_LENGTH;
        newsEvent.setTitle(title.substring(0, endIndex) + "...");
      } else {
        newsEvent.setTitle(title);
      }
    }

    // Set source
    String source = (String) articleData.get("source");
    newsEvent.setSource(source != null ? source : "Unknown");

    // Set URL
    String url = (String) articleData.get("url");
    if (url != null && url.length() > URL_MAX_LENGTH) {
      int endIndex = URL_MAX_LENGTH - TRUNCATION_SUFFIX_LENGTH;
      url = url.substring(0, endIndex) + "...";
    }
    newsEvent.setSourceUrl(url);

    // Set published date
    Date publishedDate = (Date) articleData.get("publishedDate");
    newsEvent.setPublishedDate(publishedDate != null
        ? publishedDate
        : new Date());

    // Set summary
    String summary = (String) articleData.get("summary");
    newsEvent.setSummary(summary);

    log.debug("Created NewsEvent - Title: {}, Source: {}, Date: {}, "
        + "Type: {}",
        newsEvent.getTitle(), newsEvent.getSource(),
        newsEvent.getPublishedDate(), newsEvent.getSourceType());

    return newsEvent;
  }

  /**
   * Get recent news events for a specific company.
   *
   * @param companyId the company ID
   * @param days number of days to look back
   * @return list of news events
   */
  public List<NewsEvent> getCompanyNews(final Long companyId,
                                        final int days) {
    Calendar cal = Calendar.getInstance();
    cal.add(Calendar.DAY_OF_YEAR, -days);
    Date since = cal.getTime();

    log.info("Fetching news for company {} from last {} days (since: {})",
        companyId, days, since);

    List<NewsEvent> events = newsEventRepository.findByCompanyIdAndDateAfter(
        companyId, since);
    log.info("Found {} news events", events.size());

    return events;
  }

  /**
   * Get news events for companies the user has access to.
   * If portfolioId is provided, filters to only that portfolio.
   * Otherwise, superadmins see all events and regular users see events
   * for companies in portfolios they are members of or in their
   * organization's portfolios.
   *
   * @param user the current user
   * @param days number of days to look back
   * @param portfolioId optional portfolio ID to filter by
   * @return list of news events accessible to the user
   */
  public List<NewsEvent> getNewsForUser(
      final User user,
      final int days,
      final Long portfolioId) {
    Calendar cal = Calendar.getInstance();
    cal.add(Calendar.DAY_OF_YEAR, -days);
    Date since = cal.getTime();

    // If portfolioId specified, verify access then filter to that portfolio
    if (portfolioId != null) {
      if (!securityService.isSuperAdmin()
          && !securityService.isPortfolioMember(null, portfolioId)) {
        log.warn("User {} requested news for portfolioId {} they don't"
            + " have access to", user.getEmail(), portfolioId);
        return Collections.emptyList();
      }
      log.info("Fetching news events for portfolioId: {} since: {}",
          portfolioId, since);
      List<NewsEvent> events = newsEventRepository
          .findEventsForPortfolioSince(portfolioId, since);
      log.info("Found {} news events for portfolio {}",
          events.size(), portfolioId);
      return events;
    }

    // If superadmin and no portfolioId, see all events
    if (securityService.isSuperAdmin()) {
      log.info("Superadmin {} requesting all news events since: {}",
          user.getEmail(), since);
      List<NewsEvent> events = newsEventRepository
          .findByCreatedAtAfterOrderByPublishedDateDesc(since);
      log.info("Found {} total news events for superadmin",
          events.size());
      return events;
    }

    Long organizationId = user.getOrganization() != null
        ? user.getOrganization().getId()
        : NO_ORGANIZATION_ID;

    log.info("Querying news events for userId: {}, orgId: {}, since: {}",
        user.getId(), organizationId, since);

    List<NewsEvent> events = newsEventRepository.findEventsForUserSince(
        user.getId(), organizationId, since);

    log.info("Found {} news events for user {}",
        events.size(), user.getEmail());

    return events;
  }

  /**
   * Get all recent news events (for sysadmin/superadmin testing).
   * No user access filtering applied.
   *
   * @param days number of days to look back
   * @return list of all recent news events
   */
  public List<NewsEvent> getAllRecentNews(final int days) {
    Calendar cal = Calendar.getInstance();
    cal.add(Calendar.DAY_OF_YEAR, -days);
    Date since = cal.getTime();

    log.info("Fetching ALL news events since: {}", since);

    List<NewsEvent> events = newsEventRepository
        .findByCreatedAtAfterOrderByPublishedDateDesc(since);

    log.info("Found {} total news events", events.size());

    return events;
  }

  /**
   * Get news events for a specific portfolio.
   *
   * @param portfolioId the portfolio ID
   * @param days number of days to look back
   * @return list of news events for the portfolio
   */
  public List<NewsEvent> getNewsForPortfolio(final Long portfolioId,
                                             final int days) {
    Calendar cal = Calendar.getInstance();
    cal.add(Calendar.DAY_OF_YEAR, -days);
    Date since = cal.getTime();

    log.info("Fetching news events for portfolio {} since: {}",
        portfolioId, since);

    List<NewsEvent> events = newsEventRepository
        .findEventsForPortfolioSince(portfolioId, since);

    log.info("Found {} news events for portfolio {}", events.size(),
        portfolioId);

    return events;
  }
}
