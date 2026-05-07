package io.ventureplatform.util;

import lombok.extern.slf4j.Slf4j;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.regex.Pattern;

/**
 * Utility class for extracting and normalizing domains from URLs.
 * Used for domain-based caching in company data extraction.
 */
@Slf4j
public class DomainExtractionUtil {

  // Pattern to match common subdomains that should be removed for domain matching
  private static final Pattern WWW_PATTERN = Pattern.compile("^www\\.", Pattern.CASE_INSENSITIVE);

  // Pattern to match common academic/research subdomains
  private static final Pattern ACADEMIC_SUBDOMAIN_PATTERN = Pattern.compile("^(web|www|portal|research)\\.", Pattern.CASE_INSENSITIVE);

  /**
   * Extract the root domain from a URL for caching purposes.
   *
   * Examples:
   * - https://www.tesla.com/about -> tesla.com
   * - http://web.mit.edu/something -> mit.edu
   * - https://portal.company.org/page -> company.org
   * - tesla.com -> tesla.com
   *
   * @param url The URL to extract domain from
   * @return The root domain, or null if extraction fails
   */
  public static String extractRootDomain(String url) {
    if (url == null || url.trim().isEmpty()) {
      return null;
    }

    try {
      // Normalize the URL first
      String normalizedUrl = normalizeUrl(url);

      // Parse as URI
      URI uri = new URI(normalizedUrl);
      String host = uri.getHost();

      if (host == null) {
        // Try parsing as if it's just a domain without protocol
        if (!url.contains("://")) {
          host = url.split("/")[0]; // Take everything before first slash
        } else {
          log.warn("Could not extract host from URL: {}", url);
          return null;
        }
      }

      // Remove common subdomains
      String domain = removeCommonSubdomains(host.toLowerCase());

      log.debug("Extracted domain '{}' from URL '{}'", domain, url);
      return domain;

    } catch (URISyntaxException e) {
      log.warn("Invalid URL format: {}", url, e);
      return null;
    } catch (Exception e) {
      log.error("Error extracting domain from URL: {}", url, e);
      return null;
    }
  }

  /**
   * Normalize a URL for consistent processing.
   * 
   * @param url The URL to normalize
   * @return The normalized URL
   */
  public static String normalizeUrl(String url) {
    if (url == null || url.trim().isEmpty()) {
      return url;
    }
    
    String normalized = url.trim();
    
    // Add protocol if missing
    if (!normalized.startsWith("http://") && !normalized.startsWith("https://")) {
      normalized = "https://" + normalized;
    }
    
    // Remove trailing slash
    if (normalized.endsWith("/")) {
      normalized = normalized.substring(0, normalized.length() - 1);
    }
    
    return normalized;
  }

  /**
   * Remove common subdomains that should be ignored for domain matching.
   * 
   * @param host The hostname to process
   * @return The hostname with common subdomains removed
   */
  private static String removeCommonSubdomains(String host) {
    if (host == null) {
      return null;
    }
    
    // Remove www.
    String result = WWW_PATTERN.matcher(host).replaceFirst("");
    
    // Remove common academic/portal subdomains
    result = ACADEMIC_SUBDOMAIN_PATTERN.matcher(result).replaceFirst("");
    
    return result;
  }

  /**
   * Check if two URLs belong to the same domain for caching purposes.
   * 
   * @param url1 First URL
   * @param url2 Second URL
   * @return true if they belong to the same root domain
   */
  public static boolean isSameDomain(String url1, String url2) {
    String domain1 = extractRootDomain(url1);
    String domain2 = extractRootDomain(url2);
    
    if (domain1 == null || domain2 == null) {
      return false;
    }
    
    return domain1.equals(domain2);
  }

  /**
   * Create a normalized URL for storage and comparison.
   * This is more specific than domain matching but less specific than exact URL matching.
   * 
   * Examples:
   * - https://www.tesla.com/about -> tesla.com/about
   * - http://Tesla.COM/ -> tesla.com
   * 
   * @param url The URL to normalize
   * @return The normalized URL for storage
   */
  public static String createNormalizedUrl(String url) {
    if (url == null || url.trim().isEmpty()) {
      return null;
    }

    try {
      String normalizedUrl = normalizeUrl(url);
      URI uri = new URI(normalizedUrl);
      
      String host = uri.getHost();
      if (host == null) {
        return null;
      }
      
      // Remove common subdomains and convert to lowercase
      String domain = removeCommonSubdomains(host.toLowerCase());
      
      // Get the path (without query parameters or fragments)
      String path = uri.getPath();
      if (path == null || path.equals("/")) {
        path = "";
      }
      
      // Combine domain and path
      String result = domain + path;
      
      log.debug("Created normalized URL '{}' from '{}'", result, url);
      return result;
      
    } catch (Exception e) {
      log.error("Error creating normalized URL from: {}", url, e);
      return null;
    }
  }
}
