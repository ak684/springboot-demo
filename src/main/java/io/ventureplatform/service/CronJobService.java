package io.ventureplatform.service;

import io.ventureplatform.entity.CompanyExtractionData;
import io.ventureplatform.entity.Followers;
import io.ventureplatform.entity.Venture;
import io.ventureplatform.entity.enums.FollowerType;
import io.ventureplatform.repository.CompanyExtractionDataRepository;
import io.ventureplatform.repository.CompanyPatentRepository;
import io.ventureplatform.repository.FollowersRepository;
import io.ventureplatform.repository.VentureRepository;
import io.ventureplatform.service.external.FacebookService;
import io.ventureplatform.service.external.LinkedinService;
import io.ventureplatform.service.external.StripeService;
import io.ventureplatform.util.CompanyExtractorUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.openqa.selenium.WebDriver;
import org.codehaus.plexus.util.StringUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.net.MalformedURLException;
import java.net.URL;
import java.util.Calendar;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.function.Function;

@Service
@RequiredArgsConstructor
@Slf4j
public class CronJobService {
  private static final int NEWS_SCRAPE_PAGE_SIZE = 25;

  private final VentureRepository ventureRepository;
  private final StripeService stripeService;
  private final FacebookService facebookService;
  private final LinkedinService linkedinService;
  private final ScrapeService scrapeService;
  private final FollowersRepository followersRepository;
  private final PatentCounterService patentCounterService;
  private final PatentDetailService patentDetailService;
  private final CompanyPatentRepository companyPatentRepository;
  private final CompanyExtractionDataRepository companyExtractionDataRepository;
  private final UrlValidationService urlValidationService;
  private final NewsEventService newsEventService;

  @Scheduled(cron = "0 0 6 * * *")
  public void checkVentureSubscriptionStatus() {
    try {
      long totalVentures = ventureRepository.count();

      for (int i = 0; i <= totalVentures / 100; i++) {
        Page<Venture> page = ventureRepository.findAll(PageRequest.of(i, 100));
        List<Venture> ventures = page.getContent();
        for (Venture venture : ventures) {
          if (venture.getSubscriptionId() == null || !stripeService.checkSubscriptionStatus(venture.getSubscriptionId())) {
            if (!Boolean.TRUE.equals(venture.getActive())) {
              log.info("Deactivating venture due to absence of active subscription " + venture.getId());
            }
            venture.setActive(false);
            ventureRepository.save(venture);
          }
        }
      }
    } catch (Exception ex) {
      throw new RuntimeException("Could not finish CRON job to check for subscription status", ex);
    }
  }

  @Scheduled(cron = "0 0 5 * * *")
  public void updateExpiringFacebookTokens() {
    List<Venture> ventures = ventureRepository.findAllByFacebookTokenIsNotNull();
    ventures.forEach(venture -> {
      Long tokenExpiration = facebookService.getTokenExpiration(venture.getFacebookToken());

      if (facebookService.isExpired(tokenExpiration)) {
        venture.setFacebookToken(null);
        ventureRepository.save(venture);
      } else if (facebookService.isExpiringWithinTenDays(tokenExpiration)) {
        venture.setFacebookToken(facebookService.getNewToken(venture.getFacebookToken()));
        ventureRepository.save(venture);
      }
    });
  }

  @Scheduled(cron = "0 0 4 * * *")
  public void fetchSocialMediaFollowers() {
    try {
      long totalVentures = ventureRepository.count();

      for (int i = 0; i <= totalVentures / 100; i++) {
        Page<Venture> page = ventureRepository.findAll(PageRequest.of(i, 100));
        List<Venture> ventures = page.getContent();
        ventures.forEach(this::fetchFollowersForVenture);
      }
    } catch (Exception ex) {
      throw new RuntimeException("Could not finish CRON job to fetch social media followers", ex);
    }
  }

  private void fetchFollowersForVenture(Venture venture) {
    if (venture.getFacebookCompanyId() != null && venture.getFacebookToken() != null) {
      fetchFollowersForMedia(
        venture,
        FollowerType.FACEBOOK,
        v -> facebookService.getNumberOfFollowers(v.getId(), v.getFacebookCompanyId(), v.getFacebookToken())
      );
    }

    if (venture.getInstagramCompanyId() != null && venture.getFacebookToken() != null) {
      fetchFollowersForMedia(
        venture,
        FollowerType.INSTAGRAM,
        v -> facebookService.getNumberOfFollowers(v.getId(), v.getInstagramCompanyId(), v.getFacebookToken())
      );
    }

    if (StringUtils.isNotEmpty(venture.getLinkedin()) && isValidUrl(venture.getLinkedin())) {
      fetchFollowersForMedia(venture, FollowerType.LINKEDIN,
        v -> linkedinService.getNumberOfFollowers(v.getLinkedin()));
    }

    if (StringUtils.isNotEmpty(venture.getTwitter()) && isValidUrl(venture.getTwitter())) {
      fetchFollowersForMedia(venture, FollowerType.TWITTER, v -> scrapeService.getTwitterFollowers(v.getTwitter()));
    }

    if (StringUtils.isNotEmpty(venture.getYoutube()) && isValidUrl(venture.getYoutube())) {
      fetchFollowersForMedia(venture, FollowerType.YOUTUBE, v -> scrapeService.getYoutubeFollowers(v.getYoutube()));
    }
  }

  private void fetchFollowersForMedia(Venture venture, FollowerType type, Function<Venture, Long> fetchFunction) {
    try {
      Long followers = fetchFunction.apply(venture);
      if (followers != null && followers > 0) {
        Followers newRecord = new Followers().setType(type).setValue(followers).setVenture(venture);
        followersRepository.save(newRecord);
      }
    } catch (Exception ex) {
      // continue fetching followers
    }
  }

  private boolean isValidUrl(String url) {
    try {
      new URL(url);
      return true;
    } catch (MalformedURLException e) {
      return false;
    }
  }
  
  /**
   * Check for new patents nightly.
   * Runs at 2 AM every day.
   */
  @Scheduled(cron = "0 0 2 * * *")
  @Async
  public void checkForNewPatents() {
    try {
      log.info("Starting scheduled patent check");
      int companiesChecked = patentCounterService.checkForNewPatents();
      log.info("Scheduled patent check completed. Checked {} companies", companiesChecked);
    } catch (Exception e) {
      log.error("Error in scheduled patent check", e);
    }
  }
  
  /**
   * Update patent details nightly.
   * Runs at 8 PM every day.
   * This job finds patents that either:
   * 1. Never had details scraped (detailsScrapedAt is null)
   * 2. Haven't been updated in over 3 months (cited_by_count changes over time)
   * Processes up to 400 patents per run, prioritizing those with no details or oldest updates.
   */
  @Scheduled(cron = "0 0 20 * * *")
  @Async
  public void updatePatentDetailsNightly() {
    try {
      log.info("Starting nightly patent detail update job");
      
      // Calculate date 3 months ago
      Calendar cal = Calendar.getInstance();
      cal.add(Calendar.MONTH, -3);
      Date threeMonthsAgo = cal.getTime();
      
      // Find patents that need detail updates (max 300 per run)
      List<Long> patentIds = companyPatentRepository.findPatentsNeedingDetailUpdates(
          threeMonthsAgo, PageRequest.of(0, 400));
      
      if (patentIds.isEmpty()) {
        log.info("No patents need detail updates");
        return;
      }
      
      log.info("Found {} patents needing detail updates (null or older than 3 months)", 
          patentIds.size());
      
      // Scrape details with random delays between 20-90 seconds
      patentDetailService.scrapePatentDetailsManual(patentIds, -1);
      
      log.info("Nightly patent detail update job completed");
    } catch (Exception e) {
      log.error("Error in nightly patent detail update job", e);
    }
  }

  /**
   * Validate company URLs monthly.
   * Runs at 1 AM every Sunday, but only executes on the first Sunday of
   * the month. Checks all company URLs sequentially and creates pending
   * approval events for any broken URLs or suggested updates.
   */
  @Scheduled(cron = "0 0 1 * * SUN")
  @Async
  public void validateCompanyUrlsMonthly() {
    try {
      // Only run on the first Sunday of the month (day 1-7)
      Calendar cal = Calendar.getInstance();
      int dayOfMonth = cal.get(Calendar.DAY_OF_MONTH);
      if (dayOfMonth > 7) {
        log.info(
          "Skipping URL validation - not first Sunday (day {})",
          dayOfMonth
        );
        return;
      }

      log.info("Starting monthly URL validation job (first Sunday)");

      long totalCompanies = companyExtractionDataRepository.count();
      int companiesChecked = 0;

      for (int i = 0; i <= totalCompanies / 100; i++) {
        Page<CompanyExtractionData> page =
          companyExtractionDataRepository.findAll(PageRequest.of(i, 100));
        List<CompanyExtractionData> companies = page.getContent();

        for (CompanyExtractionData company : companies) {
          if (company.getCompanyUrl() != null
            && !company.getCompanyUrl().isEmpty()) {
            try {
              urlValidationService.validateAndCreateApprovalEvent(
                company.getId()
              );
              companiesChecked++;
            } catch (Exception e) {
              log.error(
                "Error checking URL for company {} ({}): {}",
                company.getId(),
                company.getCompanyName(),
                e.getMessage()
              );
            }
          }
        }
      }

      log.info(
        "Monthly URL validation job completed. Checked {} companies",
        companiesChecked
      );
    } catch (Exception e) {
      log.error("Error in monthly URL validation job", e);
    }
  }

  /**
   * Scrape news for tracked companies using weekday rotation.
   * Runs at 7 AM on weekdays only (Monday-Friday).
   * Uses hash-based rotation to scrape 1/5 of companies per day (each company scraped once per work week).
   * Only scrapes companies where track_news = true.
   */
  @Scheduled(cron = "0 0 7 * * MON-FRI")
  @Async
  public void scrapeNewsForTrackedCompanies() {
    WebDriver driver = null;
    try {
      log.info("Starting scheduled news scraping for tracked companies");

      long totalTracked = companyExtractionDataRepository.countByTrackNews(true);
      if (totalTracked == 0) {
        log.info("No companies are currently tracking news");
        return;
      }

      // Determine today's bucket (0-4) based on day of week
      // Using LocalDate for cleaner API (1=Mon, 2=Tue, ..., 5=Fri)
      int dayOfWeek = java.time.LocalDate.now().getDayOfWeek().getValue();
      int todayBucket = (dayOfWeek - 1) % 5;

      int pageNumber = 0;
      long bucketTotal = -1;
      int successCount = 0;
      int failureCount = 0;
      int processed = 0;

      while (true) {
        Page<Long> page = companyExtractionDataRepository
          .findTrackedCompanyIdsByBucket(
            todayBucket,
            PageRequest.of(pageNumber, NEWS_SCRAPE_PAGE_SIZE, Sort.by("id"))
          );

        if (!page.hasContent()) {
          if (pageNumber == 0) {
            log.info("No companies in today's bucket");
          }
          break;
        }

        if (bucketTotal == -1) {
          bucketTotal = page.getTotalElements();
          log.info(
            "Found {} companies in bucket {} (out of {} total tracked companies)",
            bucketTotal,
            todayBucket,
            totalTracked
          );

          if (bucketTotal == 0) {
            break;
          }

          driver = CompanyExtractorUtils.createChromeDriver();
        }

        for (Long companyId : page.getContent()) {
          try {
            log.info("Scraping news for company ID: {}", companyId);
            Map<String, Object> scrapeResult =
              newsEventService.fetchAndSaveNewsForCompany(companyId, driver);
            successCount++;

            Object companyName = scrapeResult.get("companyName");
            if (companyName != null) {
              log.info("Completed news scraping for {} (ID: {})",
                companyName, companyId);
            }
          } catch (Exception e) {
            log.error("Error scraping news for company {}: {}",
              companyId, e.getMessage());
            failureCount++;
          }

          processed++;
          if (bucketTotal > 0 && processed < bucketTotal) {
            int delaySeconds = CompanyExtractorUtils
              .getRandomDelaySeconds(20, 90);
            log.debug("Waiting {} seconds before next company ({}/{})",
              delaySeconds, processed, bucketTotal);
            try {
              Thread.sleep(delaySeconds * 1000L);
            } catch (InterruptedException interruptedException) {
              Thread.currentThread().interrupt();
              log.warn("News scraping delay interrupted, stopping job");
              return;
            }
          }
        }

        if (!page.hasNext()) {
          break;
        }

        pageNumber++;
      }

      log.info("Scheduled news scraping completed. Success: {}, Failed: {}",
        successCount, failureCount);

    } catch (Exception e) {
      log.error("Error in scheduled news scraping job", e);
    } finally {
      if (driver != null) {
        driver.quit();
      }
    }
  }
}
