package io.ventureplatform.util;

import lombok.extern.slf4j.Slf4j;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;

import java.nio.file.Files;
import java.nio.file.Paths;
import java.time.Duration;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;
import java.util.Random;

/**
 * Utility class for company data extraction functionality.
 * This class is separate from ScrapingUtils to avoid impacting existing functionality.
 */
@Slf4j
public final class CompanyExtractorUtils {
  private CompanyExtractorUtils() {
    // Private constructor to prevent instantiation
  }

  /**
   * Chrome options for company data extraction.
   * These are the same as ScrapingUtils.DEFAULT_CHROME_OPTIONS to maintain consistency.
   */
  public static final ChromeOptions CHROME_OPTIONS = new ChromeOptions();

  // Common locations where ChromeDriver might be installed
  private static final String[] CHROME_DRIVER_LOCATIONS = {
    "/usr/local/bin/chromedriver",
    "/usr/bin/chromedriver",
    "/opt/homebrew/bin/chromedriver",  // For macOS with Homebrew on Apple Silicon
    System.getProperty("user.home") + "/chromedriver",
    System.getProperty("user.dir") + "/chromedriver",
    System.getProperty("user.dir") + "/drivers/chromedriver"
  };

  static {
    // Initialize with the same options as ScrapingUtils.DEFAULT_CHROME_OPTIONS
    CHROME_OPTIONS.addArguments("--no-sandbox");
    CHROME_OPTIONS.addArguments("start-maximized");
    CHROME_OPTIONS.addArguments("disable-infobars");
    CHROME_OPTIONS.addArguments("--disable-extensions");
    CHROME_OPTIONS.addArguments("--disable-dev-shm-usage");
    CHROME_OPTIONS.addArguments("--headless");
    CHROME_OPTIONS.addArguments("--remote-allow-origins=*");
  }

  /**
   * Attempts to find ChromeDriver in common locations and sets the system property
   * if found. This only affects the current JVM instance.
   */
  public static void setupChromeDriverPath() {
    // Check if the system property is already set
    if (System.getProperty("webdriver.chrome.driver") != null) {
      log.info("ChromeDriver path already set to: {}", System.getProperty("webdriver.chrome.driver"));
      return;
    }

    // Check common locations
    for (String location : CHROME_DRIVER_LOCATIONS) {
      if (Files.exists(Paths.get(location))) {
        System.setProperty("webdriver.chrome.driver", location);
        log.info("Found ChromeDriver at: {}", location);
        return;
      }
    }

    // If not found in common locations, log a warning
    log.warn("ChromeDriver not found in common locations. Please install ChromeDriver "
        + "or set the 'webdriver.chrome.driver' system property.");
  }

  /**
   * Creates a new ChromeDriver with the default options.
   * This method handles ChromeDriver path setup and provides better error messages.
   *
   * @return A new ChromeDriver instance
   * @throws RuntimeException if ChromeDriver setup fails
   */
  public static ChromeDriver createChromeDriver() {
    return createChromeDriver(false);
  }
  
  /**
   * Creates a new ChromeDriver with optional visible mode for debugging.
   *
   * @param visible If true, runs Chrome in visible mode (not headless)
   * @return A new ChromeDriver instance
   * @throws RuntimeException if ChromeDriver setup fails
   */
  public static ChromeDriver createChromeDriver(boolean visible) {
    try {
      setupChromeDriverPath();
      
      ChromeOptions options = new ChromeOptions();
      options.addArguments("--no-sandbox");
      options.addArguments("start-maximized");
      options.addArguments("disable-infobars");
      options.addArguments("--disable-extensions");
      options.addArguments("--disable-dev-shm-usage");
      options.addArguments("--remote-allow-origins=*");
      
      // Add anti-bot detection measures
      options.addArguments("--disable-blink-features=AutomationControlled");
      options.addArguments("--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) " +
          "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
      
      // Exclude automation switches
      options.setExperimentalOption("excludeSwitches", new String[]{"enable-automation"});
      
      // Set additional prefs to avoid detection
      Map<String, Object> prefs = new HashMap<>();
      prefs.put("credentials_enable_service", false);
      prefs.put("profile.password_manager_enabled", false);
      options.setExperimentalOption("prefs", prefs);
      
      // Only add headless if not in visible mode
      if (!visible) {
        options.addArguments("--headless");
        // Use new headless mode if available
        options.addArguments("--headless=new");
      } else {
        log.info("Running Chrome in VISIBLE mode for debugging");
      }
      
      ChromeDriver driver = new ChromeDriver(options);
      // Set a reasonable page load timeout (60 seconds)
      driver.manage().timeouts().pageLoadTimeout(Duration.ofSeconds(60));
      return driver;
    } catch (Exception e) {
      log.error("Failed to create ChromeDriver. Please ensure ChromeDriver is installed and in your PATH.", e);
      throw new RuntimeException("ChromeDriver setup failed. See logs for details.", e);
    }
  }

  /**
   * Cleans and formats a URL for web scraping.
   *
   * @param url The URL to clean and format
   * @return A properly formatted URL with https:// prefix
   */
  public static String formatUrl(String url) {
    if (url == null) {
      return null;
    }

    String formattedUrl = url.trim();

    // Remove quotes and other problematic characters
    formattedUrl = formattedUrl.replace("\"", "").replace("'", "").trim();

    // Remove any existing protocol prefixes to avoid double prefixing
    if (formattedUrl.startsWith("https://")) {
      formattedUrl = formattedUrl.substring(8);
    } else if (formattedUrl.startsWith("http://")) {
      formattedUrl = formattedUrl.substring(7);
    }

    // Add the https:// prefix
    return "https://" + formattedUrl;
  }

  /**
   * Standardizes a YouTube URL to a clean channel format.
   * This method removes extra path segments like '/featured', '/videos', etc.
   * and attempts to convert various YouTube URL formats to a standard channel URL.
   *
   * @param youtubeUrl The YouTube URL to standardize
   * @return A standardized YouTube URL, or the original URL if it's not a valid YouTube URL
   */
  public static String standardizeYoutubeUrl(String youtubeUrl) {
    if (youtubeUrl == null || youtubeUrl.isEmpty()) {
      return youtubeUrl;
    }

    log.debug("Standardizing YouTube URL: {}", youtubeUrl);

    // Ensure URL has a protocol
    String url = youtubeUrl;
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }

    try {
      // Check if it's a YouTube URL
      if (!isYoutubeUrl(url)) {
        return youtubeUrl; // Return original if not a YouTube URL
      }

      // Extract channel ID or username
      Pattern channelPattern = Pattern.compile("(?:youtube\\.com/(?:(?:channel/)|(?:c/)|(?:user/))?)([a-zA-Z0-9_-]+)");
      Matcher matcher = channelPattern.matcher(url);

      if (matcher.find()) {
        String channelId = matcher.group(1);

        // If URL contains /channel/, it's already a channel ID
        if (url.contains("/channel/")) {
          // Just clean up any extra path segments
          return "https://www.youtube.com/channel/" + channelId;
        }

        // If URL contains /c/ or /user/, it's a custom URL or username
        // We'll keep the format but remove extra path segments
        if (url.contains("/c/")) {
          return "https://www.youtube.com/c/" + channelId;
        }

        if (url.contains("/user/")) {
          return "https://www.youtube.com/user/" + channelId;
        }

        // If we get here, it might be a direct channel name without /c/ or /user/
        return "https://www.youtube.com/" + channelId;
      }

      // If we couldn't extract a channel ID, just remove extra path segments
      Pattern extraPathPattern = Pattern.compile("(https?://(?:www\\.)?youtube\\.com/[@a-zA-Z0-9_-]+)(?:/.*)?");
      matcher = extraPathPattern.matcher(url);

      if (matcher.find()) {
        return matcher.group(1);
      }

      // If all else fails, return the original URL
      return youtubeUrl;
    } catch (Exception e) {
      log.warn("Error standardizing YouTube URL: {}", e.getMessage());
      return youtubeUrl; // Return original URL if any error occurs
    }
  }

  /**
   * Checks if a URL is a YouTube URL.
   *
   * @param url The URL to check
   * @return true if the URL is a YouTube URL, false otherwise
   */
  public static boolean isYoutubeUrl(String url) {
    if (url == null || url.isEmpty()) {
      return false;
    }

    return url.contains("youtube.com") || url.contains("youtu.be");
  }

  private static final Random random = new Random();

  /**
   * Generate a random delay in seconds for rate limiting.
   * 
   * @param minSeconds minimum delay in seconds
   * @param maxSeconds maximum delay in seconds
   * @return random delay in seconds between min and max (inclusive)
   */
  public static int getRandomDelaySeconds(int minSeconds, int maxSeconds) {
    if (minSeconds > maxSeconds) {
      throw new IllegalArgumentException("minSeconds must be <= maxSeconds");
    }
    return minSeconds + random.nextInt(maxSeconds - minSeconds + 1);
  }
}
