package io.ventureplatform.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

/**
 * Service dedicated to social media follower extraction and processing.
 * Handles both sequential and parallel extraction of follower counts from various social media platforms.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SocialMediaExtractionService {

  private final ScrapeService scrapeService;



  /**
   * Extracts social media follower counts for the given social media links (sequential processing).
   * This method is used for backward compatibility and when parallel processing is not needed.
   */
  public Map<String, Long> extractSocialMediaFollowerCounts(Map<String, String> socialMediaLinks) {
    Map<String, Long> followerCounts = new HashMap<>();

    if (socialMediaLinks == null || socialMediaLinks.isEmpty()) {
      log.info("No social media links provided for follower count extraction");
      return followerCounts;
    }

    log.info("Extracting follower counts for {} social media links: {}", socialMediaLinks.size(), socialMediaLinks);

    // Process each social media link sequentially
    for (Map.Entry<String, String> entry : socialMediaLinks.entrySet()) {
      String platform = entry.getKey();
      String url = entry.getValue();

      if (url == null || url.trim().isEmpty()) {
        continue;
      }

      try {
        Long followerCount = extractFollowerCountForPlatform(platform, url);

        if (followerCount != null) {
          // Validate follower count before saving - don't store obviously wrong data
          if (isReasonableFollowerCount(followerCount)) {
            followerCounts.put(platform, followerCount);
            log.info("Extracted {} follower count: {}", platform, followerCount);
          } else {
            log.warn("Discarding unrealistic {} follower count: {} (likely extraction error)",
                platform, followerCount);
          }
        }
      } catch (Exception e) {
        log.error("Error extracting follower count for {} ({}): {}", platform, url, e.getMessage());
      }
    }

    return followerCounts;
  }



  /**
   * Extracts follower count for a specific platform and URL.
   * Centralizes the platform-specific logic for easier maintenance.
   */
  private Long extractFollowerCountForPlatform(String platform, String url) {
    try {
      // Use the existing ScrapeService methods to get follower counts
      if ("twitter".equals(platform)) {
        return scrapeService.getTwitterFollowers(url);
      } else if ("youtube".equals(platform)) {
        return scrapeService.getYoutubeFollowers(url);
      } else if ("linkedin".equals(platform)) {
        // Try public LinkedIn scraping (no authentication required)
        log.debug("Attempting LinkedIn follower extraction via web scraping");
        Long followerCount = scrapeService.getLinkedInFollowerCount(url);
        if (followerCount != null) {
          log.info("Successfully extracted LinkedIn followers: {}", followerCount);
          return followerCount;
        } else {
          log.warn("LinkedIn follower extraction failed for URL: {}", url);
          return null;
        }
      } else if ("facebook".equals(platform)) {
        // Try public Facebook scraping (no authentication required)
        log.debug("Attempting Facebook follower extraction via web scraping");
        Long followerCount = scrapeService.getFacebookFollowers(url);
        if (followerCount != null) {
          log.info("Successfully extracted Facebook followers: {}", followerCount);
          return followerCount;
        } else {
          log.warn("Facebook follower extraction failed for URL: {}", url);
          return null;
        }
      } else if ("instagram".equals(platform)) {
        // Try public Instagram scraping (similar to Facebook)
        log.debug("Attempting Instagram follower extraction via web scraping");
        Long followerCount = scrapeService.getInstagramFollowers(url);
        if (followerCount != null) {
          log.info("Successfully extracted Instagram followers: {}", followerCount);
          return followerCount;
        } else {
          log.warn("Instagram follower extraction failed for URL: {}", url);
          return null;
        }
      }

      return null;
    } catch (Exception e) {
      log.error("Error extracting follower count for {} ({}): {}", platform, url, e.getMessage());
      return null;
    }
  }

  /**
   * Extracts Instagram follower count from a given Instagram URL.
   * This is the main entry point for Instagram follower extraction testing.
   * 
   * @param instagramUrl The Instagram URL to extract followers from
   * @return Follower count if successful, null otherwise
   */
  public Long extractInstagramFollowers(String instagramUrl) {
    return extractInstagramFollowers(instagramUrl, null);
  }
  
  /**
   * Extracts Instagram follower count with company name fallback.
   * 
   * @param instagramUrl The Instagram URL to extract followers from
   * @param companyUrl The company website URL (for extracting company name as fallback)
   * @return Follower count if successful, null otherwise
   */
  public Long extractInstagramFollowers(String instagramUrl, String companyUrl) {
    log.info("Starting Instagram follower extraction for: {}", instagramUrl);
    
    try {
      // First try using the existing scrape service method
      Long followerCount = scrapeService.getInstagramFollowers(instagramUrl, companyUrl);
      
      if (followerCount != null) {
        log.info("Successfully extracted Instagram followers: {}", followerCount);
        return followerCount;
      } else {
        log.warn("Instagram follower extraction returned null for URL: {}", instagramUrl);
        return null;
      }
    } catch (Exception e) {
      log.error("Error extracting Instagram followers: {}", e.getMessage(), e);
      return null;
    }
  }
  
  /**
   * Extracts Twitter follower count from a given Twitter URL.
   * This is a convenience method that delegates to the ScrapeService.
   * 
   * @param twitterUrl The Twitter URL
   * @return Follower count or null if extraction fails
   */
  public Long extractTwitterFollowers(String twitterUrl) {
    log.info("Starting Twitter follower extraction for: {}", twitterUrl);
    
    try {
      Long followerCount = scrapeService.getTwitterFollowers(twitterUrl);
      if (followerCount != null) {
        log.info("Successfully extracted Twitter followers: {}", followerCount);
        return followerCount;
      } else {
        log.warn("Twitter follower extraction returned null");
        return null;
      }
    } catch (Exception e) {
      log.error("Error extracting Twitter followers", e);
      return null;
    }
  }
  
  
  /**
   * Extracts Instagram username from a given Instagram URL.
   * Helper method for Instagram-specific processing.
   */
  public String extractInstagramUsername(String instagramUrl) {
    try {
      if (instagramUrl == null || instagramUrl.trim().isEmpty()) {
        return null;
      }

      // Remove trailing slash if present
      String cleanUrl = instagramUrl.trim();
      if (cleanUrl.endsWith("/")) {
        cleanUrl = cleanUrl.substring(0, cleanUrl.length() - 1);
      }

      // Extract username from URL patterns like:
      // https://www.instagram.com/username
      // https://instagram.com/username
      // www.instagram.com/username
      String[] parts = cleanUrl.split("/");
      if (parts.length >= 2) {
        String username = parts[parts.length - 1];

        // Remove any query parameters
        if (username.contains("?")) {
          username = username.split("\\?")[0];
        }

        // Basic validation - Instagram usernames can contain letters, numbers, periods, and underscores
        if (username.matches("^[a-zA-Z0-9._]+$") && username.length() > 0) {
          return username;
        }
      }

      return null;
    } catch (Exception e) {
      log.error("Error extracting Instagram username: {}", e.getMessage());
      return null;
    }
  }

  /**
   * Validates that a follower count is reasonable for a business/company account.
   * Filters out obviously incorrect extraction results.
   */
  private boolean isReasonableFollowerCount(Long followerCount) {
    if (followerCount == null || followerCount <= 0) {
      return false;
    }

    // Set a reasonable upper limit - most B2B companies have <10M followers
    // Even major brands rarely exceed 50M on individual platforms
    final long MAX_REASONABLE_FOLLOWERS = 50_000_000L; // 50M threshold

    return followerCount <= MAX_REASONABLE_FOLLOWERS;
  }
}
