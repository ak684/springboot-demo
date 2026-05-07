package io.ventureplatform.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.ventureplatform.entity.User;
import io.ventureplatform.service.external.CloudinaryService;
import io.ventureplatform.service.external.GoogleService;
import io.ventureplatform.util.CompanyExtractorUtils;

import static io.ventureplatform.util.CompanyExtractorUtils.standardizeYoutubeUrl;
import io.sentry.Sentry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.thymeleaf.util.StringUtils;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URI;
import java.net.MalformedURLException;
import java.net.URISyntaxException;
import java.net.URL;
import java.net.URLEncoder;
import java.time.Duration;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.ArrayList;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

import com.fasterxml.jackson.databind.JsonNode;
import org.openqa.selenium.JavascriptExecutor;

/**
 * A specialized service for scraping company data for the SuperAdmin company extractor feature.
 * Focused on extracting structured data without AI processing - AI analysis happens in Phase 1.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CompanyExtractorScrapeService {
  private final ObjectMapper objectMapper;
  private final GoogleService googleService;
  private final RestTemplate restTemplate;
  private final CloudinaryService cloudinaryService;

  /**
   * Gets comprehensive but raw company data - no AI processing, just structured extraction.
   * This is the simplified version that focuses on reliable structured data only.
   *
   * @param website The company website URL
   * @return A map containing raw extracted company data
   * @throws IOException If there's an error connecting to the website
   */
  public Map<String, Object> getComprehensiveCompanyData(String website) throws IOException {
    log.info("=== PHASE 0: RAW DATA EXTRACTION ===");
    log.info("Extracting structured data from: {}", website);

    if (!website.startsWith("http")) {
      website = "https://" + website;
    }

    Map<String, Object> response = new HashMap<>();
    response.put("website", website);

    try {
      // Get website content with timeout
      Document doc = Jsoup.connect(website)
          .timeout(15000) // 15 seconds timeout
          .get();

      // Extract basic page metadata
      response.put("page_title", doc.title());
      response.put("meta_description", getMetaDescription(doc));

      // Extract structured data (Schema.org, etc.)
      Map<String, Object> structuredData = extractSchemaOrgData(doc);
      if (!structuredData.isEmpty()) {
        response.put("structured_data", structuredData);
      }

      // Extract social media links (DOM-based detection)
      Map<String, String> socialLinks = getSocialMediaLinks(website);
      if (!socialLinks.isEmpty()) {
        response.put("social_media_links", socialLinks);
      }

      // Extract contact sections (raw text)
      List<String> contactSections = extractContactSections(doc);
      if (!contactSections.isEmpty()) {
        response.put("contact_sections", contactSections);
      }

      // Extract phone numbers from various HTML locations
      Map<String, String> phoneNumbers = extractPhoneNumbers(doc);
      if (!phoneNumbers.isEmpty()) {
        response.put("extracted_phones", phoneNumbers);
      }

      // Extract potential logo URLs
      List<String> potentialLogos = extractPotentialLogos(doc, website);
      if (!potentialLogos.isEmpty()) {
        response.put("potential_logos", potentialLogos);
      }

      // Extract potential address elements
      List<String> addressElements = extractAddressElements(doc);
      if (!addressElements.isEmpty()) {
        response.put("address_elements", addressElements);
      }

      // Extract legal/about section text
      List<String> legalSections = extractLegalSections(doc);
      if (!legalSections.isEmpty()) {
        response.put("legal_sections", legalSections);
      }

      // Enhanced extraction with WebDriver for dynamic content
      Map<String, Object> enhancedData = performEnhancedExtraction(website);
      if (!enhancedData.isEmpty()) {
        response.putAll(enhancedData);
        log.info("Enhanced extraction added {} additional fields", enhancedData.size());
      }

      // Extract header and footer content for AI to process later
      String headerContent = extractSectionText(doc, "header");
      if (!headerContent.isEmpty()) {
        response.put("header_content", headerContent);
      }

      String footerContent = extractSectionText(doc, "footer");
      if (!footerContent.isEmpty()) {
        response.put("footer_content", footerContent);
      }

      // Extract main content (excluding header/footer)
      Document mainDoc = doc.clone();
      removeSection(mainDoc, "header");
      removeSection(mainDoc, "footer");
      String mainContent = mainDoc.text();
      if (!mainContent.isEmpty()) {
        // Truncate very long content
        if (mainContent.length() > 5000) {
          mainContent = mainContent.substring(0, 5000) + "...";
        }
        response.put("main_content", mainContent);
      }

      log.debug("Raw data extraction completed with {} fields", response.size());

    } catch (Exception e) {
      log.error("Error in raw data extraction for {}: {}", website, e.getMessage());
    }

    return response;
  }

  /**
   * Extract meta description from document.
   */
  private String getMetaDescription(Document doc) {
    Element metaDesc = doc.selectFirst("meta[name=description]");
    if (metaDesc != null) {
      return metaDesc.attr("content");
    }

    metaDesc = doc.selectFirst("meta[property=og:description]");
    if (metaDesc != null) {
      return metaDesc.attr("content");
    }

    return "";
  }

  /**
   * Extract Schema.org structured data from the document.
   */
  private Map<String, Object> extractSchemaOrgData(Document doc) {
    Map<String, Object> structuredData = new HashMap<>();

    try {
      // Extract Organization schema
      Elements orgElements = doc.select("[itemtype*='schema.org/Organization']");
      if (!orgElements.isEmpty()) {
        Map<String, String> orgData = new HashMap<>();
        Element org = orgElements.first();

        // Extract common organization properties
        extractItemprop(org, "name", orgData);
        extractItemprop(org, "description", orgData);
        extractItemprop(org, "url", orgData);
        extractItemprop(org, "logo", orgData);
        extractItemprop(org, "foundingDate", orgData);
        extractItemprop(org, "numberOfEmployees", orgData);
        extractItemprop(org, "legalName", orgData);

        if (!orgData.isEmpty()) {
          structuredData.put("organization", orgData);
        }
      }

      // Extract LocalBusiness schema
      Elements businessElements = doc.select("[itemtype*='schema.org/LocalBusiness']");
      if (!businessElements.isEmpty()) {
        Map<String, String> businessData = new HashMap<>();
        Element business = businessElements.first();

        extractItemprop(business, "name", businessData);
        extractItemprop(business, "description", businessData);
        extractItemprop(business, "telephone", businessData);
        extractItemprop(business, "email", businessData);

        if (!businessData.isEmpty()) {
          structuredData.put("local_business", businessData);
        }
      }

      // Extract PostalAddress schema
      Elements addressElements = doc.select("[itemtype*='schema.org/PostalAddress']");
      if (!addressElements.isEmpty()) {
        Map<String, String> addressData = new HashMap<>();
        Element address = addressElements.first();

        extractItemprop(address, "streetAddress", addressData);
        extractItemprop(address, "addressLocality", addressData);
        extractItemprop(address, "addressRegion", addressData);
        extractItemprop(address, "postalCode", addressData);
        extractItemprop(address, "addressCountry", addressData);

        if (!addressData.isEmpty()) {
          structuredData.put("postal_address", addressData);
        }
      }

    } catch (Exception e) {
      log.warn("Error extracting Schema.org data: {}", e.getMessage());
    }

    return structuredData;
  }

  /**
   * Helper to extract itemprop values from Schema.org markup.
   */
  private void extractItemprop(Element parent, String propName, Map<String, String> data) {
    Elements propElements = parent.select("[itemprop=" + propName + "]");
    if (!propElements.isEmpty()) {
      Element prop = propElements.first();
      String value = prop.attr("content");
      if (value.isEmpty()) {
        value = prop.text();
      }
      if (!value.isEmpty()) {
        data.put(propName, value);
      }
    }
  }

  /**
   * Extract contact sections from the document.
   */
  private List<String> extractContactSections(Document doc) {
    List<String> contactSections = new ArrayList<>();

    try {
      // Common contact section selectors
      String[] contactSelectors = {
        ".contact", "#contact", "[id*=contact]", "[class*=contact]",
        ".imprint", "#imprint", ".impressum", "#impressum",
        ".about", "#about", "[id*=about]", "[class*=about]",
        ".company", "#company", "[id*=company]", "[class*=company]"
      };

      for (String selector : contactSelectors) {
        Elements elements = doc.select(selector);
        for (Element element : elements) {
          String text = element.text();
          if (!text.isEmpty() && text.length() > 20) { // Skip very short sections
            contactSections.add(text);
          }
        }
      }

    } catch (Exception e) {
      log.warn("Error extracting contact sections: {}", e.getMessage());
    }

    return contactSections;
  }

  /**
   * Extract phone numbers from various HTML locations.
   */
  private Map<String, String> extractPhoneNumbers(Document doc) {
    Map<String, String> phoneNumbers = new HashMap<>();

    try {
      // 1. Extract from tel: links (most reliable)
      Elements telLinks = doc.select("a[href^='tel:']");
      for (Element telLink : telLinks) {
        String phone = telLink.attr("href").replaceFirst("^tel:", "").trim();
        if (!phone.isEmpty()) {
          phoneNumbers.put("tel_link", phone);
          log.info("Found phone in tel: link: {}", phone);
          break; // Take first one
        }
      }

      // 2. Extract from Schema.org Organization (not just LocalBusiness)
      Elements orgElements = doc.select("[itemtype*='schema.org/Organization']");
      for (Element org : orgElements) {
        Element phoneElement = org.selectFirst("[itemprop='telephone']");
        if (phoneElement != null) {
          String phone = phoneElement.text().trim();
          if (!phone.isEmpty() && !phoneNumbers.containsKey("schema_org")) {
            phoneNumbers.put("schema_org", phone);
            log.info("Found phone in Schema.org Organization: {}", phone);
          }
        }
      }

      // 3. Look for phone patterns in main body text with context
      String[] phoneContexts = {
        "Call us at", "Phone:", "Tel:", "Telephone:", "Contact us at",
        "Reach us at", "Call:", "Mobile:", "Office:", "Fax:",
        "Telefon:", "Téléphone:", "Telefono:", "Ring oss:"
      };

      Elements bodyElements = doc.select("p, div, span, li");
      Pattern contextPattern = Pattern.compile(
          "(?i)(" + String.join("|", phoneContexts) + ")\\s*:?\\s*([+]?[0-9][0-9\\s.()-]{7,20}[0-9])"
      );

      for (Element element : bodyElements) {
        String text = element.text();
        Matcher matcher = contextPattern.matcher(text);
        if (matcher.find() && !phoneNumbers.containsKey("body_context")) {
          String phone = matcher.group(2).trim();
          phoneNumbers.put("body_context", phone);
          log.info("Found phone with context '{}': {}", matcher.group(1), phone);
          break; // Take first contextual match
        }
      }

      // 4. Check contact/about page headers specifically
      Elements contactHeaders = doc.select("h1, h2, h3, h4");
      for (Element header : contactHeaders) {
        String headerText = header.text().toLowerCase();
        if (headerText.contains("contact") || headerText.contains("about") ||
            headerText.contains("reach") || headerText.contains("call")) {
          // Look at the next sibling or parent's text for phone
          Element nextElement = header.nextElementSibling();
          if (nextElement != null) {
            Pattern simplePhonePattern = Pattern.compile("[+]?[0-9][0-9\\s.()-]{7,20}[0-9]");
            Matcher matcher = simplePhonePattern.matcher(nextElement.text());
            if (matcher.find() && !phoneNumbers.containsKey("contact_section")) {
              String phone = matcher.group(0).trim();
              phoneNumbers.put("contact_section", phone);
              log.info("Found phone near contact header: {}", phone);
            }
          }
        }
      }

    } catch (Exception e) {
      log.warn("Error extracting phone numbers: {}", e.getMessage());
    }

    return phoneNumbers;
  }

  /**
   * Extract potential logo URLs from the document.
   */
  private List<String> extractPotentialLogos(Document doc, String baseUrl) {
    List<String> logoUrls = new ArrayList<>();

    try {
      // Method 1: Images with "logo" in attributes
      Elements logoElements = doc.select("img[class*=logo], img[id*=logo], img[alt*=logo], img[src*=logo]");
      for (Element img : logoElements) {
        String src = img.attr("src");
        if (!StringUtils.isEmpty(src)) {
          logoUrls.add(validateAndFixLogoUrl(src, baseUrl));
        }
      }

      // Method 2: Header images
      Elements headerLogos = doc.select("header img, .header img, #header img");
      for (Element img : headerLogos) {
        if (isLikelyLogo(img)) {
          String src = img.attr("src");
          if (!StringUtils.isEmpty(src)) {
            logoUrls.add(validateAndFixLogoUrl(src, baseUrl));
          }
        }
      }

      // Method 3: Navbar images
      Elements navbarLogos = doc.select("nav img, .navbar img, .nav img");
      for (Element img : navbarLogos) {
        if (isLikelyLogo(img)) {
          String src = img.attr("src");
          if (!StringUtils.isEmpty(src)) {
            logoUrls.add(validateAndFixLogoUrl(src, baseUrl));
          }
        }
      }

      // Remove null values and duplicates
      logoUrls.removeIf(url -> url == null || url.isEmpty());

    } catch (Exception e) {
      log.warn("Error extracting logo URLs: {}", e.getMessage());
    }

    return logoUrls;
  }

  /**
   * Extract potential address elements from the document.
   */
  private List<String> extractAddressElements(Document doc) {
    List<String> addressElements = new ArrayList<>();

    try {
      // Look for address-specific elements
      Elements addresses = doc.select("address, .address, .contact-address, .location");
      for (Element element : addresses) {
        String text = element.text();
        if (!text.isEmpty()) {
          addressElements.add(text);
        }
      }

      // Look for text containing address patterns
      Pattern addressPattern = Pattern.compile(
          "(?i)\\b(?:address|location|headquarters)\\s*(?::|\\n|\\r)\\s*([^\\n\\r]+(?:\\n|\\r|,)[^\\n\\r]+)");
      Matcher matcher = addressPattern.matcher(doc.text());
      while (matcher.find()) {
        String potentialAddress = matcher.group(1);
        if (!potentialAddress.isEmpty()) {
          addressElements.add(potentialAddress);
        }
      }

    } catch (Exception e) {
      log.warn("Error extracting address elements: {}", e.getMessage());
    }

    return addressElements;
  }

  /**
   * Extract legal/about section content.
   */
  private List<String> extractLegalSections(Document doc) {
    List<String> legalSections = new ArrayList<>();

    try {
      String[] legalSelectors = {
        ".legal", "#legal", ".terms", "#terms",
        ".privacy", "#privacy", ".imprint", "#imprint",
        ".impressum", "#impressum", ".about-us", "#about-us"
      };

      for (String selector : legalSelectors) {
        Elements elements = doc.select(selector);
        for (Element element : elements) {
          String text = element.text();
          if (!text.isEmpty() && text.length() > 50) { // Skip very short sections
            legalSections.add(text);
          }
        }
      }

    } catch (Exception e) {
      log.warn("Error extracting legal sections: {}", e.getMessage());
    }

    return legalSections;
  }

  /**
   * Extract text content from a specific section.
   */
  private String extractSectionText(Document doc, String tagName) {
    try {
      Element element = doc.selectFirst(tagName);
      return element != null ? element.text() : "";
    } catch (Exception e) {
      log.warn("Error extracting {} content: {}", tagName, e.getMessage());
      return "";
    }
  }

  /**
   * Gets social media links from a company website.
   * This is a specialized version focused on DOM-based detection only.
   */
  public Map<String, String> getSocialMediaLinks(String website) {
    Map<String, String> result = new HashMap<>();

    log.debug("Scraping social media links from: {}", website);

    try {
      // Ensure the URL has a protocol prefix
      if (!website.startsWith("http")) {
        website = "https://" + website;
      }

      // Validate the URL
      new URL(website).toURI();

      // Create a ChromeDriver using our utility class
      WebDriver driver = CompanyExtractorUtils.createChromeDriver(); // headless mode
      log.info("Extracting social media links from: {}", website);

      try {
        // Navigate to the website
        driver.get(website);

        // Set implicit wait (keeping at 3 seconds as it's for element lookups)
        driver.manage().timeouts().implicitlyWait(Duration.ofSeconds(3));
        // Page load timeout already set to 60 seconds in CompanyExtractorUtils

        // Get the page HTML
        String pageHtml = driver.getPageSource();
        final Document doc = Jsoup.parse(pageHtml);

        // Define enhanced social media platform patterns
        Map<String, List<String>> platformPatterns = new HashMap<>();
        platformPatterns.put("twitter", Arrays.asList("twitter.com", "x.com", "t.co"));
        platformPatterns.put("facebook", Arrays.asList("facebook.com", "fb.com", "fb.me"));
        platformPatterns.put("linkedin", Arrays.asList("linkedin.com", "lnkd.in"));
        platformPatterns.put("instagram", Arrays.asList("instagram.com", "instagr.am"));
        platformPatterns.put("youtube", Arrays.asList("youtube.com", "youtu.be"));
        platformPatterns.put("tiktok", Arrays.asList("tiktok.com", "vm.tiktok.com"));
        platformPatterns.put("bluesky", Arrays.asList("bsky.app", "bluesky.social"));

        // Find links containing social media platform patterns
        Elements allLinks = doc.select("a[href]");
        log.info("Total links found on {}: {}", website, allLinks.size());
        
        for (Element link : allLinks) {
          String href = link.attr("href").toLowerCase();

          // Skip empty or javascript links
          if (href.isEmpty() || href.startsWith("javascript:") || href.equals("#")) {
            continue;
          }
          
          // Log first few links for debugging
          if (allLinks.indexOf(link) < 10) {
            log.debug("Link {}: href='{}', text='{}'", allLinks.indexOf(link), href, link.text());
          }

          // Check URL patterns
          for (Map.Entry<String, List<String>> entry : platformPatterns.entrySet()) {
            String platform = entry.getKey();
            List<String> patterns = entry.getValue();

            for (String pattern : patterns) {
              if (href.contains(pattern)) {
                String socialUrl = link.attr("href");

                // Standardize YouTube URLs
                if ("youtube".equals(platform)) {
                  socialUrl = standardizeYoutubeUrl(socialUrl);
                  log.debug("Standardized YouTube URL: {} -> {}", link.attr("href"), socialUrl);
                }

                // Validate that this isn't a generic social media homepage
                if (isValidSocialMediaUrl(platform, socialUrl)) {
                  result.put(platform, socialUrl);
                } else {
                  log.warn("Skipping generic {} URL: {}", platform, socialUrl);
                }
                break;
              }
            }
          }

          // If we haven't found a match by URL, check for social media icons in the link
          if (result.size() < platformPatterns.size()) {
            // Check for common social media icon classes
            Elements icons = link.select("i[class*=fa-], i[class*=icon-], svg");

            if (!icons.isEmpty()) {
              Element icon = icons.first();
              String className = icon.className().toLowerCase();
              String svgContent = icon.html().toLowerCase();

              // Check for common social media icon patterns
              if (className.contains("facebook") || svgContent.contains("facebook")) {
                result.putIfAbsent("facebook", link.attr("href"));
              } else if (className.contains("twitter") || className.contains("x-twitter")
                  || svgContent.contains("twitter") || svgContent.contains("x-twitter")) {
                result.putIfAbsent("twitter", link.attr("href"));
              } else if (className.contains("linkedin") || svgContent.contains("linkedin")) {
                result.putIfAbsent("linkedin", link.attr("href"));
              } else if (className.contains("instagram") || svgContent.contains("instagram")) {
                result.putIfAbsent("instagram", link.attr("href"));
              } else if (className.contains("youtube") || svgContent.contains("youtube")) {
                String youtubeUrl = link.attr("href");
                result.putIfAbsent("youtube", standardizeYoutubeUrl(youtubeUrl));
              } else if (className.contains("tiktok") || svgContent.contains("tiktok")) {
                result.putIfAbsent("tiktok", link.attr("href"));
              } else if (className.contains("bluesky") || svgContent.contains("bluesky")) {
                result.putIfAbsent("bluesky", link.attr("href"));
              }
            }
          }
        }

        // Normalize URLs (add https:// if missing)
        for (Map.Entry<String, String> entry : result.entrySet()) {
          String url = entry.getValue();
          if (!url.startsWith("http://") && !url.startsWith("https://")) {
            result.put(entry.getKey(), "https://" + url.replaceFirst("^//", ""));
          }
        }
      } finally {
        // Always close the driver to avoid resource leaks
        driver.quit();
      }
    } catch (MalformedURLException | URISyntaxException ex) {
      log.info("Provided URL is not valid: " + website);
    } catch (Exception ex) {
      log.error("Website parsing failed", ex);
      Sentry.captureException(ex);
    }

    // If no LinkedIn URL found, try DuckDuckGo search as fallback
    if (!result.containsKey("linkedin")) {
      log.info("No LinkedIn URL found on website, attempting DuckDuckGo search fallback");
      String companyName = extractCompanyNameFromUrl(website);
      if (!StringUtils.isEmpty(companyName)) {
        String linkedInUrl = findLinkedInUrlViaGoogle(companyName);
        if (!StringUtils.isEmpty(linkedInUrl)) {
          result.put("linkedin", linkedInUrl);
          log.info("SUCCESS: Found LinkedIn URL via DuckDuckGo search: {}", linkedInUrl);
        } else {
          log.warn("Could not find LinkedIn URL via DuckDuckGo search for company: {}", companyName);
        }
      }
    }

    // If no Instagram URL found, try DuckDuckGo search as fallback
    if (!result.containsKey("instagram")) {
      log.info("No Instagram URL found on website, attempting DuckDuckGo search fallback");
      String companyName = extractCompanyNameFromUrl(website);
      if (!StringUtils.isEmpty(companyName)) {
        String instagramUrl = findInstagramUrlViaDuckDuckGo(companyName);
        if (!StringUtils.isEmpty(instagramUrl)) {
          result.put("instagram", instagramUrl);
          log.info("SUCCESS: Found Instagram URL via DuckDuckGo search: {}", instagramUrl);
        } else {
          log.warn("Could not find Instagram URL via DuckDuckGo search for company: {}", companyName);
        }
      }
    }

    // If no Facebook URL found, try direct URL first, then DuckDuckGo search as fallback
    if (!result.containsKey("facebook")) {
      log.info("No Facebook URL found on website, attempting fallback methods");
      
      String companyName = extractCompanyNameFromUrl(website);
      if (!StringUtils.isEmpty(companyName)) {
        // First, try direct Facebook URL
        String directFacebookUrl = tryDirectFacebookUrl(companyName);
        if (!StringUtils.isEmpty(directFacebookUrl)) {
          result.put("facebook", directFacebookUrl);
          log.info("SUCCESS: Found Facebook URL via direct URL check: {}", directFacebookUrl);
        } else {
          // If direct URL doesn't work, try DuckDuckGo search
          log.info("Direct Facebook URL not found, trying DuckDuckGo search...");
          
          // Add delay to avoid bot detection
          try {
            log.info("Adding 3-second delay between searches to avoid bot detection...");
            Thread.sleep(3000);
          } catch (InterruptedException e) {
            log.warn("Sleep interrupted: {}", e.getMessage());
          }
          
          String facebookUrl = findFacebookUrlViaDuckDuckGo(companyName);
          if (!StringUtils.isEmpty(facebookUrl)) {
            result.put("facebook", facebookUrl);
            log.info("SUCCESS: Found Facebook URL via DuckDuckGo search: {}", facebookUrl);
          } else {
            log.warn("Could not find Facebook URL via DuckDuckGo search for company: {}", companyName);
          }
        }
      }
    }

    log.info("=== SOCIAL MEDIA EXTRACTION COMPLETED ===");
    log.info("Found {} social media links: {}", result.size(), result);

    return result;
  }

  /**
   * Removes a section from an HTML document.
   */
  private void removeSection(Document doc, String tagName) {
    Elements elements = doc.select(tagName);
    for (Element element : elements) {
      element.remove();
    }
  }

  /**
   * Checks if an image element is likely to be a logo based on various heuristics.
   */
  private boolean isLikelyLogo(Element img) {
    // Check if the image has dimensions that are typical for logos
    String width = img.attr("width");
    String height = img.attr("height");

    // If dimensions are specified, check if they're reasonable for a logo
    if (!StringUtils.isEmpty(width) && !StringUtils.isEmpty(height)) {
      try {
        int w = Integer.parseInt(width);
        int h = Integer.parseInt(height);

        // Logos are typically not very large
        if (w > 500 || h > 200) {
          return false;
        }

        // Logos typically have a reasonable aspect ratio
        float ratio = (float) w / h;
        if (ratio > 5 || ratio < 0.2) {
          return false;
        }
      } catch (NumberFormatException e) {
        // If we can't parse the dimensions, continue with other checks
      }
    }

    // Check alt text for keywords that suggest it's a logo
    String alt = img.attr("alt").toLowerCase();
    if (alt.contains("logo") || alt.contains("brand") || alt.contains("company")) {
      return true;
    }

    // Check if the image is in a typical logo location
    Element parent = img.parent();
    if (parent != null) {
      String parentClass = parent.attr("class").toLowerCase();
      String parentId = parent.attr("id").toLowerCase();

      if (parentClass.contains("logo")
          || parentId.contains("logo")
          || parentClass.contains("brand")
          || parentId.contains("brand")) {
        return true;
      }
    }

    // Check the image source for keywords that suggest it's a logo
    String src = img.attr("src").toLowerCase();
    if (src.contains("logo") || src.contains("brand")) {
      return true;
    }

    // If none of the above checks passed, it's less likely to be a logo
    return false;
  }

  /**
   * Validates and fixes a logo URL to ensure it's a valid, absolute URL.
   */
  private String validateAndFixLogoUrl(String logoUrl, String baseUrl) {
    if (StringUtils.isEmpty(logoUrl)) {
      return null;
    }

    try {
      // Remove any quotes or whitespace
      logoUrl = logoUrl.trim().replace("\"", "").replace("'", "");

      // Skip data URLs (they're usually small icons or tracking pixels)
      if (logoUrl.startsWith("data:")) {
        return null;
      }

      // Handle relative URLs
      if (logoUrl.startsWith("/")) {
        // Absolute path relative to domain root
        URI baseUri = new URI(baseUrl);
        String domain = baseUri.getScheme() + "://" + baseUri.getHost()
                       + (baseUri.getPort() != -1 ? ":" + baseUri.getPort() : "");
        logoUrl = domain + logoUrl;
      } else if (!logoUrl.startsWith("http://") && !logoUrl.startsWith("https://")) {
        // Relative path
        if (!baseUrl.endsWith("/") && !logoUrl.startsWith("/")) {
          baseUrl += "/";
        }
        logoUrl = baseUrl + logoUrl;
      }

      // Validate the URL format
      new URL(logoUrl).toURI();

      return logoUrl;
    } catch (Exception e) {
      log.debug("Invalid logo URL: {} - {}", logoUrl, e.getMessage());
      return null;
    }
  }

  // Legacy methods for backward compatibility (if needed elsewhere)

  /**
   * Extracts a company logo from Twitter and uploads it to Cloudinary.
   */
  public String getVentureLogo(String twitter, User user) {
    log.debug("Extracting company logo from Twitter profile: {}", twitter);
    String url = getLogoUrlFromTwitter(twitter);
    if (!StringUtils.isEmpty(url)) {
      InputStream in = getImageBytes(url);
      if (in != null) {
        String cloudinaryUrl = cloudinaryService.upload(in, user.getId());
        log.debug("Successfully uploaded logo to Cloudinary: {}", cloudinaryUrl);
        return cloudinaryUrl;
      }
    }
    log.warn("Failed to extract logo from Twitter profile: {}", twitter);
    return null;
  }

  /**
   * Fetches image bytes from a URL.
   */
  private InputStream getImageBytes(String url) {
    try {
      byte[] imageBytes = restTemplate.getForObject(url, byte[].class);
      if (imageBytes != null) {
        return new ByteArrayInputStream(imageBytes);
      }
    } catch (Exception ex) {
      log.error("Failed to fetch image bytes from URL: {}", url, ex);
      Sentry.captureException(ex);
    }
    return null;
  }

  /**
   * Extracts a logo URL from a Twitter profile.
   */
  private String getLogoUrlFromTwitter(String twitter) {
    log.debug("Extracting logo URL from Twitter profile: {}", twitter);

    // Create a ChromeDriver using our utility class
    WebDriver driver = CompanyExtractorUtils.createChromeDriver();

    try {
      driver.get(twitter);
      // Page load timeout already set to 60 seconds in CompanyExtractorUtils

      WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(15));
      By imgSelector = By.cssSelector("img[alt='Square profile picture and Opens profile photo']");
      wait.until(ExpectedConditions.presenceOfElementLocated(imgSelector));

      WebElement logoImg = driver.findElement(imgSelector);
      String logoUrl = logoImg.getAttribute("src");
      log.debug("Found logo URL: {}", logoUrl);
      return logoUrl;
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

  /**
   * Performs enhanced extraction using WebDriver for dynamic content and structured data.
   * This includes JSON-LD, enhanced meta tags, and footer extraction.
   */
  private Map<String, Object> performEnhancedExtraction(String website) {
    Map<String, Object> result = new HashMap<>();
    WebDriver driver = null;

    try {
      log.info("Starting enhanced extraction for: {}", website);
      driver = CompanyExtractorUtils.createChromeDriver();
      driver.get(website);

      // Wait for dynamic content to load
      WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(10));
      wait.until(webDriver -> ((JavascriptExecutor) webDriver)
          .executeScript("return document.readyState").equals("complete"));

      // Extract structured data from JSON-LD
      Map<String, Object> jsonLdData = extractJsonLdData(driver);
      if (!jsonLdData.isEmpty()) {
        result.putAll(jsonLdData);
        log.info("JSON-LD extraction found {} fields", jsonLdData.size());
      }

      // Extract enhanced meta tag data
      Map<String, Object> metaData = extractEnhancedMetaTagData(driver);
      if (!metaData.isEmpty()) {
        result.putAll(metaData);
        log.debug("Enhanced meta extraction found {} fields", metaData.size());
      }

      // Extract footer data for legal information
      Map<String, Object> footerData = extractFooterData(driver);
      if (!footerData.isEmpty()) {
        result.putAll(footerData);
        log.debug("Footer extraction found {} fields", footerData.size());
      }

      // Extract tel: links (dynamic content that might not be in initial HTML)
      Map<String, String> dynamicPhones = extractDynamicPhoneNumbers(driver);
      if (!dynamicPhones.isEmpty()) {
        // Only add if we don't already have phone data
        if (!result.containsKey("extracted_phones") && !result.containsKey("footer_phone")) {
          result.put("extracted_phones", dynamicPhones);
          log.info("Dynamic phone extraction found {} phone numbers", dynamicPhones.size());
        }
      }

      log.debug("Enhanced extraction completed with {} total fields", result.size());
      return result;

    } catch (Exception e) {
      log.error("Enhanced extraction failed for {}: {}", website, e.getMessage());
      return result;
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

  /**
   * Extract structured data from JSON-LD scripts.
   * Many modern websites include structured data for SEO.
   */
  private Map<String, Object> extractJsonLdData(WebDriver driver) {
    Map<String, Object> data = new HashMap<>();

    try {
      List<WebElement> jsonLdScripts = driver.findElements(
          By.cssSelector("script[type='application/ld+json']")
      );

      log.debug("Found {} JSON-LD scripts", jsonLdScripts.size());

      for (WebElement script : jsonLdScripts) {
        String jsonContent = script.getAttribute("innerHTML");
        if (jsonContent != null && !jsonContent.trim().isEmpty()) {
          try {
            JsonNode jsonNode = objectMapper.readTree(jsonContent);

            // Handle arrays of JSON-LD objects
            if (jsonNode.isArray()) {
              for (JsonNode item : jsonNode) {
                extractOrganizationData(item, data);
              }
            } else {
              extractOrganizationData(jsonNode, data);
            }

          } catch (Exception e) {
            log.debug("Failed to parse JSON-LD content: {}", e.getMessage());
          }
        }
      }
    } catch (Exception e) {
      log.error("Error extracting JSON-LD data", e);
    }

    return data;
  }

  /**
   * Extract organization data from a JSON-LD node.
   */
  private void extractOrganizationData(JsonNode jsonNode, Map<String, Object> data) {
    try {
      // Check if this is an Organization type
      if (jsonNode.has("@type")) {
        String type = jsonNode.get("@type").asText();
        if (type.contains("Organization") || type.contains("Corporation") || type.contains("LocalBusiness")) {

          // Extract basic organization info
          if (jsonNode.has("name") && !data.containsKey("company_name")) {
            data.put("company_name", jsonNode.get("name").asText());
          }

          if (jsonNode.has("description") && !data.containsKey("company_description")) {
            data.put("company_description", jsonNode.get("description").asText());
          }

          if (jsonNode.has("url") && !data.containsKey("website")) {
            data.put("website", jsonNode.get("url").asText());
          }

          // Extract logo
          if (jsonNode.has("logo") && !data.containsKey("company_logo")) {
            JsonNode logoNode = jsonNode.get("logo");
            String logoUrl = logoNode.isObject() && logoNode.has("url")
                ? logoNode.get("url").asText()
                : logoNode.asText();
            if (!logoUrl.isEmpty()) {
              data.put("company_logo", logoUrl);
            }
          }

          // Extract founding date
          if (jsonNode.has("foundingDate") && !data.containsKey("legal_entity_formation_date")) {
            data.put("legal_entity_formation_date", jsonNode.get("foundingDate").asText());
          }

          // Extract employee count
          if (jsonNode.has("numberOfEmployees") && !data.containsKey("number_of_employees")) {
            String employeeCount = extractEmployeeCount(jsonNode.get("numberOfEmployees"));
            if (!employeeCount.isEmpty()) {
              data.put("number_of_employees", employeeCount);
            }
          }

          // Extract address
          if (jsonNode.has("address") && !data.containsKey("headquarters_address")) {
            String address = extractStructuredAddress(jsonNode.get("address"));
            if (!address.isEmpty()) {
              data.put("headquarters_address", address);
            }
          }

          // Extract social profiles from sameAs
          if (jsonNode.has("sameAs") && !data.containsKey("json_ld_social_links")) {
            Map<String, String> socialLinks = extractSameAsLinks(jsonNode.get("sameAs"));
            if (!socialLinks.isEmpty()) {
              data.put("json_ld_social_links", socialLinks);
            }
          }

          // Extract legal name
          if (jsonNode.has("legalName") && !data.containsKey("legal_name")) {
            data.put("legal_name", jsonNode.get("legalName").asText());
          }
        }
      }
    } catch (Exception e) {
      log.debug("Error extracting organization data from JSON-LD: {}", e.getMessage());
    }
  }

  /**
   * Extract employee count from JSON-LD numberOfEmployees field.
   */
  private String extractEmployeeCount(JsonNode employeeNode) {
    try {
      if (employeeNode.isTextual()) {
        return employeeNode.asText();
      } else if (employeeNode.isNumber()) {
        return String.valueOf(employeeNode.asInt());
      } else if (employeeNode.isObject()) {
        // Handle QuantitativeValue structure
        if (employeeNode.has("value")) {
          return employeeNode.get("value").asText();
        }
        if (employeeNode.has("minValue") && employeeNode.has("maxValue")) {
          return employeeNode.get("minValue").asText() + "-" + employeeNode.get("maxValue").asText();
        }
      }
    } catch (Exception e) {
      log.debug("Error extracting employee count: {}", e.getMessage());
    }
    return "";
  }

  /**
   * Extract structured address from JSON-LD.
   */
  private String extractStructuredAddress(JsonNode addressNode) {
    try {
      if (addressNode.isTextual()) {
        return addressNode.asText();
      } else if (addressNode.isObject()) {
        List<String> addressParts = new ArrayList<>();

        if (addressNode.has("streetAddress")) {
          addressParts.add(addressNode.get("streetAddress").asText());
        }
        if (addressNode.has("addressLocality")) {
          addressParts.add(addressNode.get("addressLocality").asText());
        }
        if (addressNode.has("addressRegion")) {
          addressParts.add(addressNode.get("addressRegion").asText());
        }
        if (addressNode.has("postalCode")) {
          addressParts.add(addressNode.get("postalCode").asText());
        }
        if (addressNode.has("addressCountry")) {
          String country = addressNode.get("addressCountry").isObject()
              ? addressNode.get("addressCountry").get("name").asText()
              : addressNode.get("addressCountry").asText();
          addressParts.add(country);
        }

        return String.join(", ", addressParts);
      }
    } catch (Exception e) {
      log.debug("Error extracting structured address: {}", e.getMessage());
    }
    return "";
  }

  /**
   * Extract social media links from sameAs array.
   */
  private Map<String, String> extractSameAsLinks(JsonNode sameAsNode) {
    Map<String, String> socialLinks = new HashMap<>();

    try {
      if (sameAsNode.isArray()) {
        for (JsonNode urlNode : sameAsNode) {
          String url = urlNode.asText().toLowerCase();
          categorizeSemanticSocialLink(url, urlNode.asText(), socialLinks);
        }
      } else if (sameAsNode.isTextual()) {
        String url = sameAsNode.asText().toLowerCase();
        categorizeSemanticSocialLink(url, sameAsNode.asText(), socialLinks);
      }
    } catch (Exception e) {
      log.debug("Error extracting sameAs links: {}", e.getMessage());
    }

    return socialLinks;
  }

  /**
   * Categorize social media links from semantic data.
   */
  private void categorizeSemanticSocialLink(String lowerUrl, String originalUrl, Map<String, String> socialLinks) {
    if (lowerUrl.contains("twitter.com") || lowerUrl.contains("x.com")) {
      socialLinks.putIfAbsent("twitter", originalUrl);
    } else if (lowerUrl.contains("facebook.com")) {
      socialLinks.putIfAbsent("facebook", originalUrl);
    } else if (lowerUrl.contains("linkedin.com")) {
      socialLinks.putIfAbsent("linkedin", originalUrl);
    } else if (lowerUrl.contains("instagram.com")) {
      socialLinks.putIfAbsent("instagram", originalUrl);
    } else if (lowerUrl.contains("youtube.com") || lowerUrl.contains("youtu.be")) {
      socialLinks.putIfAbsent("youtube", originalUrl);
    } else if (lowerUrl.contains("tiktok.com")) {
      socialLinks.putIfAbsent("tiktok", originalUrl);
    }
  }

  /**
   * Extract enhanced data from meta tags (OpenGraph, Twitter Cards, standard meta).
   */
  private Map<String, Object> extractEnhancedMetaTagData(WebDriver driver) {
    Map<String, Object> data = new HashMap<>();

    try {
      // OpenGraph tags - more reliable for company info
      extractMetaProperty(driver, "og:site_name", "og_site_name", data);
      extractMetaProperty(driver, "og:title", "og_title", data);
      extractMetaProperty(driver, "og:description", "og_description", data);
      extractMetaProperty(driver, "og:image", "og_image", data);
      extractMetaProperty(driver, "og:url", "canonical_url", data);

      // Twitter Card tags
      extractMetaName(driver, "twitter:site", "twitter_handle", data);
      extractMetaName(driver, "twitter:creator", "twitter_creator", data);
      extractMetaName(driver, "twitter:description", "twitter_description", data);
      extractMetaName(driver, "twitter:image", "twitter_image", data);

      // Standard meta tags
      extractMetaName(driver, "description", "enhanced_meta_description", data);
      extractMetaName(driver, "author", "meta_author", data);
      extractMetaName(driver, "company", "meta_company", data);
      extractMetaName(driver, "keywords", "meta_keywords", data);

      // Business-specific meta tags (less common but valuable when present)
      extractMetaName(driver, "business:contact_data:email", "meta_contact_email", data);
      extractMetaName(driver, "business:contact_data:phone_number", "meta_contact_phone", data);
      extractMetaName(driver, "business:contact_data:street_address", "meta_street_address", data);
      extractMetaName(driver, "business:contact_data:locality", "meta_city", data);
      extractMetaName(driver, "business:contact_data:country_name", "meta_country", data);

      // Application name (often company name)
      extractMetaName(driver, "application-name", "application_name", data);

    } catch (Exception e) {
      log.error("Error extracting enhanced meta tag data", e);
    }

    return data;
  }

  /**
   * Extract meta property values (for OpenGraph tags).
   */
  private void extractMetaProperty(WebDriver driver, String property, String dataKey, Map<String, Object> data) {
    try {
      List<WebElement> elements = driver.findElements(
          By.cssSelector("meta[property='" + property + "']")
      );

      if (!elements.isEmpty()) {
        String content = elements.get(0).getAttribute("content");
        if (content != null && !content.trim().isEmpty()) {
          data.put(dataKey, content.trim());
        }
      }
    } catch (Exception e) {
      log.debug("Error extracting meta property {}: {}", property, e.getMessage());
    }
  }

  /**
   * Extract meta name values (for standard meta tags).
   */
  private void extractMetaName(WebDriver driver, String name, String dataKey, Map<String, Object> data) {
    try {
      List<WebElement> elements = driver.findElements(
          By.cssSelector("meta[name='" + name + "']")
      );

      if (!elements.isEmpty()) {
        String content = elements.get(0).getAttribute("content");
        if (content != null && !content.trim().isEmpty()) {
          data.put(dataKey, content.trim());
        }
      }
    } catch (Exception e) {
      log.debug("Error extracting meta name {}: {}", name, e.getMessage());
    }
  }

  /**
   * Extract data from footer which often contains legal and contact information.
   */
  private Map<String, Object> extractFooterData(WebDriver driver) {
    Map<String, Object> data = new HashMap<>();

    try {
      List<WebElement> footers = driver.findElements(By.cssSelector(
          "footer, .footer, #footer, [role='contentinfo'], .site-footer"
      ));

      for (WebElement footer : footers) {
        String footerText = footer.getText();
        
        log.debug("=== FOOTER EXTRACTION: Processing footer with {} characters ===", 
                  footerText != null ? footerText.length() : 0);

        if (footerText != null && !footerText.trim().isEmpty()) {
          // Log first 500 chars of footer for debugging
          log.debug("Footer text preview: {}", 
                    footerText.substring(0, Math.min(footerText.length(), 500)));
          
          // Extract copyright year as potential founding year
          Pattern copyrightPattern = Pattern.compile("©\\s*(\\d{4})(?:-(\\d{4}))?\\s*([^\\n\\r]{1,100})");
          Matcher matcher = copyrightPattern.matcher(footerText);
          if (matcher.find() && !data.containsKey("copyright_year")) {
            data.put("copyright_year", matcher.group(1));

            // Extract company name from copyright notice
            String copyrightText = matcher.group(3).trim();
            if (!copyrightText.isEmpty() && copyrightText.length() < 100) {
              // Clean up common copyright suffixes
              copyrightText = copyrightText.replaceAll("(?i)\\s*(all rights reserved|inc\\.?|ltd\\.?|llc).*$", "").trim();
              if (!copyrightText.isEmpty() && !data.containsKey("footer_company_name")) {
                data.put("footer_company_name", copyrightText);
              }
            }
          }

          // Look for legal form indicators
          Pattern legalPattern = Pattern.compile(
              "\\b(Inc\\.?|LLC|Ltd\\.?|GmbH|AG|S\\.A\\.|B\\.V\\.|Pty\\s+Ltd|Corporation|Corp\\.?)\\b");
          matcher = legalPattern.matcher(footerText);
          if (matcher.find() && !data.containsKey("legal_form")) {
            data.put("legal_form", matcher.group(1));
          }

          // Extract registration numbers
          Pattern regPattern = Pattern.compile(
              "(?i)(?:Company|Registration|Reg(?:istered)?|VAT)\\s*(?:No|Number|#)?:?\\s*([A-Z0-9][A-Z0-9\\s\\-]{4,20})");
          matcher = regPattern.matcher(footerText);
          if (matcher.find() && !data.containsKey("registration_number")) {
            String regNumber = matcher.group(1).trim();
            if (regNumber.length() >= 5 && regNumber.length() <= 20) {
              data.put("registration_number", regNumber);
            }
          }

          // Extract phone numbers from footer - enhanced for international formats
          // Supports: +49 30 123456, (030) 123-456, +33 1 23 45 67 89, etc.
          // Use [ \t] instead of \s to avoid matching newlines
          Pattern phonePattern = Pattern.compile(
              "(?i)(?:phone|tel|telephone|telefon|téléphone|mobile|fax)?:?[ \\t]*" +
              "([+]?[\\d]{1,4}[ \\t.\\-]?)?\\(?[\\d]{1,5}\\)?[ \\t.\\-]?[\\d]{1,4}[ \\t.\\-]?[\\d]{1,4}[ \\t.\\-]?[\\d]{1,5}"
          );
          matcher = phonePattern.matcher(footerText);
          if (matcher.find() && !data.containsKey("footer_phone")) {
            String phone = matcher.group(0).trim();
            // Clean up the phone number but keep international format
            phone = phone.replaceFirst("(?i)^(phone|tel|telephone|telefon|téléphone|mobile|fax):?\\s*", "");
            log.info("FOOTER EXTRACTION: Found phone number: '{}'", phone);
            data.put("footer_phone", phone);
          } else {
            // Try a simpler pattern for standalone phone numbers
            // Use [ \t] instead of \s to avoid matching newlines (which causes false matches)
            Pattern simplePhonePattern = Pattern.compile("[+]?[0-9][0-9 \\t.\\-]{7,20}[0-9]");
            matcher = simplePhonePattern.matcher(footerText);
            if (matcher.find() && !data.containsKey("footer_phone")) {
              String phone = matcher.group(0).trim();
              log.info("FOOTER EXTRACTION: Found phone number (simple pattern): '{}'", phone);
              data.put("footer_phone", phone);
            } else {
              log.debug("FOOTER EXTRACTION: No phone number found with pattern in footer");
            }
          }

          // Extract email addresses from footer
          Pattern emailPattern = Pattern.compile("\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b");
          matcher = emailPattern.matcher(footerText);
          if (matcher.find() && !data.containsKey("footer_email")) {
            String email = matcher.group().toLowerCase();
            log.info("FOOTER EXTRACTION: Found email address: '{}'", email);
            data.put("footer_email", email);
          } else {
            log.debug("FOOTER EXTRACTION: No email address found with pattern in footer");
          }
        }
      }
    } catch (Exception e) {
      log.error("Error extracting footer data", e);
    }

    return data;
  }

  /**
   * Extract phone numbers from dynamically loaded tel: links.
   * This catches phones that might be loaded via JavaScript after page load.
   */
  private Map<String, String> extractDynamicPhoneNumbers(WebDriver driver) {
    Map<String, String> phoneNumbers = new HashMap<>();

    try {
      // Find all tel: links on the page (including dynamically loaded ones)
      List<WebElement> telLinks = driver.findElements(By.cssSelector("a[href^='tel:']"));

      if (!telLinks.isEmpty()) {
        for (WebElement telLink : telLinks) {
          try {
            String href = telLink.getAttribute("href");
            if (href != null && href.startsWith("tel:")) {
              String phone = href.replaceFirst("^tel:", "").trim();
              if (!phone.isEmpty()) {
                phoneNumbers.put("tel_link", phone);
                log.info("Found dynamic phone in tel: link: {}", phone);
                break; // Take first one
              }
            }
          } catch (Exception e) {
            log.debug("Error extracting tel link: {}", e.getMessage());
          }
        }
      }

      // Also check for phones in elements with common phone-related classes/ids
      String[] phoneSelectors = {
        ".phone", "#phone", "[class*='phone']", "[id*='phone']",
        ".tel", "#tel", "[class*='tel']", "[id*='tel']",
        ".contact-phone", ".phone-number"
      };

      for (String selector : phoneSelectors) {
        try {
          List<WebElement> phoneElements = driver.findElements(By.cssSelector(selector));
          for (WebElement element : phoneElements) {
            String text = element.getText().trim();
            if (text.matches(".*[+]?[0-9][0-9\\s.()-]{7,20}[0-9].*")) {
              // Extract just the phone number
              Pattern phonePattern = Pattern.compile("[+]?[0-9][0-9\\s.()-]{7,20}[0-9]");
              Matcher matcher = phonePattern.matcher(text);
              if (matcher.find() && !phoneNumbers.containsKey("dynamic_element")) {
                String phone = matcher.group(0).trim();
                phoneNumbers.put("dynamic_element", phone);
                log.info("Found dynamic phone in element: {}", phone);
                break;
              }
            }
          }
        } catch (Exception e) {
          log.debug("Error checking selector {}: {}", selector, e.getMessage());
        }
      }

    } catch (Exception e) {
      log.warn("Error extracting dynamic phone numbers: {}", e.getMessage());
    }

    return phoneNumbers;
  }

  /**
   * Extract company name from website URL for Google searching.
   * Attempts to extract a clean company name from the domain.
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
   * Find Facebook URL for a company by searching DuckDuckGo.
   * This is a fallback when we don't have the Facebook URL from the company website.
   * Similar to LinkedIn search but for Facebook pages.
   */
  private String findFacebookUrlViaDuckDuckGo(String companyName) {
    log.info("Searching DuckDuckGo for Facebook URL of company: {}", companyName);
    
    WebDriver driver = null;
    try {
      String searchQuery = companyName + " Facebook site:facebook.com";
      String duckDuckGoUrl = "https://duckduckgo.com/?q=" + URLEncoder.encode(searchQuery, "UTF-8");
      
      log.info("DuckDuckGo search query: '{}'", searchQuery);
      log.info("Full DuckDuckGo URL: {}", duckDuckGoUrl);
      
      // Use Selenium for DuckDuckGo search
      driver = CompanyExtractorUtils.createChromeDriver(); // headless mode
      log.info("Searching DuckDuckGo for Facebook URL...");
      driver.get(duckDuckGoUrl);
      
      // Wait for results to load (longer for Facebook searches as they seem slower)
      log.info("Waiting for search results to load...");
      Thread.sleep(5000); // Increased from 3000 to 5000
      
      // Find search result links using the correct selector
      List<WebElement> links = driver.findElements(By.cssSelector("a[data-testid='result-title-a']"));
      log.info("Found {} search result links with data-testid='result-title-a'", links.size());
      
      // If no results, try to see what's on the page
      if (links.isEmpty()) {
        log.warn("No results found with primary selector. Page title: {}", driver.getTitle());
        log.warn("Current URL: {}", driver.getCurrentUrl());
        
        // Try alternative selectors
        links = driver.findElements(By.cssSelector("article[data-nrn='result'] a"));
        log.info("Found {} links with alternative selector", links.size());
        
        // Log first 500 chars of page text to see what's there
        String pageText = driver.findElement(By.tagName("body")).getText();
        if (pageText.length() > 500) {
          pageText = pageText.substring(0, 500) + "...";
        }
        log.info("Page text preview: {}", pageText);
        
        // Try more alternative selectors if still empty
        if (links.isEmpty()) {
          log.info("Trying additional selectors...");
          // Try all anchor tags
          List<WebElement> allAnchors = driver.findElements(By.tagName("a"));
          log.info("Total anchor tags on page: {}", allAnchors.size());
          
          // Log first few anchor hrefs
          int anchorCount = 0;
          for (WebElement anchor : allAnchors) {
            String href = anchor.getAttribute("href");
            if (href != null && !href.isEmpty() && anchorCount < 5) {
              log.info("Anchor {}: href='{}', text='{}'", anchorCount++, href, anchor.getText());
            }
          }
          
          // Check if we're on a captcha or different page
          if (pageText.toLowerCase().contains("captcha") || pageText.toLowerCase().contains("verify")) {
            log.warn("Possible CAPTCHA or verification page detected");
          }
        }
      }
      
      // Check the first few search results for Facebook URLs
      int linkCount = 0;
      for (WebElement link : links) {
        String href = link.getAttribute("href");
        String text = link.getText();
        
        if (href != null && !href.isEmpty()) {
          log.info("Link {}: text='{}', href='{}'", linkCount++, text, href);
          
          // Check if it's a Facebook page URL
          if ((href.contains("facebook.com/") || href.contains("fb.com/")) 
              && !href.contains("/sharer") // Exclude share buttons
              && !href.contains("/login")) { // Exclude login pages
            log.info("Found Facebook page URL in search results: {}", href);
            
            // Clean up the URL if needed
            if (href.startsWith("//")) {
              href = "https:" + href;
            } else if (!href.startsWith("http")) {
              href = "https://" + href;
            }
            
            log.info("Returning Facebook URL from DuckDuckGo: {}", href);
            return href;
          }
        }
        
        // Only check first 5 results
        if (linkCount >= 5) {
          break;
        }
      }
      
      log.warn("No Facebook URL found in DuckDuckGo results for company: {}", companyName);
      return null;
      
    } catch (Exception e) {
      log.error("Failed to search DuckDuckGo for Facebook URL", e);
      return null;
    } finally {
      if (driver != null) {
        try {
          log.info("Closing browser after Facebook search");
          driver.quit();
        } catch (Exception e) {
          log.error("Error closing DuckDuckGo search driver", e);
        }
      }
    }
  }

  /**
   * Find LinkedIn URL for a company by searching DuckDuckGo.
   * This is a fallback when we don't have the LinkedIn URL from the company website.
   * Using DuckDuckGo instead of Google to avoid captcha issues.
   */
  private String findLinkedInUrlViaGoogle(String companyName) {
    log.info("Searching DuckDuckGo for LinkedIn URL of company: {}", companyName);
    
    WebDriver driver = null;
    try {
      String searchQuery = companyName + " LinkedIn site:linkedin.com";
      // Using regular DuckDuckGo - the HTML version seems to redirect now
      String duckDuckGoUrl = "https://duckduckgo.com/?q=" + URLEncoder.encode(searchQuery, "UTF-8");
      
      log.info("DuckDuckGo search query: '{}'", searchQuery);
      log.info("Full DuckDuckGo URL: {}", duckDuckGoUrl);
      
      // Use Selenium for DuckDuckGo search
      driver = CompanyExtractorUtils.createChromeDriver(); // headless mode
      log.info("Searching DuckDuckGo for LinkedIn URL...");
      driver.get(duckDuckGoUrl);
      
      // Wait for results to load
      log.info("Waiting 3 seconds for DuckDuckGo results to load...");
      Thread.sleep(3000);
      
      // Find search result links using the correct selector based on the provided HTML
      // DuckDuckGo uses data-testid="result-title-a" for result title links
      List<WebElement> links = driver.findElements(By.cssSelector("a[data-testid='result-title-a']"));
      log.info("Found {} search result links with data-testid='result-title-a'", links.size());
      
      // If no results with that selector, try alternative selectors
      if (links.isEmpty()) {
        log.info("No links found with data-testid selector, trying alternative selectors...");
        // Try links within article elements
        links = driver.findElements(By.cssSelector("article[data-nrn='result'] a"));
        log.info("Found {} links within article elements", links.size());
      }
      
      // Check the first few search results for LinkedIn URLs
      int linkCount = 0;
      for (WebElement link : links) {
        String href = link.getAttribute("href");
        String text = link.getText();
        
        if (href != null && !href.isEmpty()) {
          log.info("Link {}: text='{}', href='{}'", linkCount++, text, href);
          
          // Check if it's a LinkedIn company URL
          if (href.contains("linkedin.com/company/") || href.contains("linkedin.com/school/")) {
            log.info("Found LinkedIn company URL in search results: {}", href);
            
            // Clean up the URL if needed
            if (href.startsWith("//")) {
              href = "https:" + href;
            } else if (!href.startsWith("http")) {
              href = "https://" + href;
            }
            
            // For DuckDuckGo, URLs are direct (not wrapped like Google)
            log.info("Returning LinkedIn URL from DuckDuckGo: {}", href);
            return href;
          }
        }
        
        // Only check first 5-10 results
        if (linkCount >= 10) {
          break;
        }
      }
      
      log.warn("No LinkedIn URL found in DuckDuckGo results for company: {}", companyName);
      return null;
      
    } catch (Exception e) {
      log.error("Failed to search DuckDuckGo for LinkedIn URL", e);
      return null;
    } finally {
      if (driver != null) {
        try {
          driver.quit();
        } catch (Exception e) {
          log.error("Error closing DuckDuckGo search driver", e);
        }
      }
    }
  }
  
  /**
   * Try common Facebook URL patterns directly.
   * This avoids search engines and bot detection.
   * 
   * @param companyName The company name to check
   * @return Facebook URL if found, null otherwise
   */
  private String tryDirectFacebookUrl(String companyName) {
    log.info("Trying direct Facebook URL for company: {}", companyName);
    
    // Clean up company name for URL
    String urlName = companyName.toLowerCase()
        .replaceAll("\\s+", "")  // Remove spaces
        .replaceAll("[^a-z0-9]", "");  // Remove special characters
    
    // Common Facebook URL patterns to try
    String[] patterns = {
      "https://www.facebook.com/" + urlName,
      "https://www.facebook.com/" + companyName.toLowerCase().replaceAll("\\s+", ""),
      "https://www.facebook.com/" + companyName.toLowerCase().replaceAll("\\s+", "-"),
      "https://www.facebook.com/" + companyName.toLowerCase().replaceAll("\\s+", "_")
    };
    
    for (String testUrl : patterns) {
      try {
        log.debug("Testing Facebook URL: {}", testUrl);
        
        // Use HttpURLConnection for a quick check
        HttpURLConnection connection = (HttpURLConnection) new URL(testUrl).openConnection();
        connection.setRequestMethod("HEAD");
        connection.setConnectTimeout(5000);
        connection.setReadTimeout(5000);
        connection.setInstanceFollowRedirects(true);
        connection.setRequestProperty("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36");
        
        int responseCode = connection.getResponseCode();
        
        // Check if we get a successful response
        if (responseCode == 200) {
          log.info("Found valid Facebook URL: {}", testUrl);
          return testUrl;
        } else if (responseCode == 301 || responseCode == 302) {
          // Follow redirect
          String redirectUrl = connection.getHeaderField("Location");
          if (redirectUrl != null && redirectUrl.contains("facebook.com") && !redirectUrl.contains("login")) {
            log.info("Found Facebook URL via redirect: {}", redirectUrl);
            return redirectUrl;
          }
        }
        
        connection.disconnect();
      } catch (Exception e) {
        log.debug("Failed to check URL {}: {}", testUrl, e.getMessage());
      }
    }
    
    log.info("No direct Facebook URL found for company: {}", companyName);
    return null;
  }
  
  /**
   * Find Twitter URL for a company using multiple strategies.
   * This is the main entry point for Twitter URL discovery.
   *
   * @param companyUrl The company website URL
   * @return Twitter URL if found, null otherwise
   */
  public String findTwitterUrl(String companyUrl) {
    log.info("Starting Twitter URL search for: {}", companyUrl);

    try {
      // First, check if we already have it from regular social media extraction
      Map<String, String> socialLinks = getSocialMediaLinks(companyUrl);
      if (socialLinks.containsKey("twitter")) {
        log.info("Twitter URL already found in social media links: {}", socialLinks.get("twitter"));
        return socialLinks.get("twitter");
      }

      // If not found, try DuckDuckGo fallback
      String companyName = extractCompanyNameFromUrl(companyUrl);
      if (!StringUtils.isEmpty(companyName)) {
        log.info("Twitter not found on website, trying DuckDuckGo search for: {}", companyName);
        return findTwitterUrlViaDuckDuckGo(companyName);
      }

      log.warn("Could not extract company name from URL: {}", companyUrl);
      return null;

    } catch (Exception e) {
      log.error("Error finding Twitter URL for {}: {}", companyUrl, e.getMessage());
      return null;
    }
  }

  /**
   * Find Instagram URL for a company using multiple strategies.
   * This is the main entry point for Instagram URL discovery.
   *
   * @param companyUrl The company website URL
   * @return Instagram URL if found, null otherwise
   */
  public String findInstagramUrl(String companyUrl) {
    log.info("Starting Instagram URL search for: {}", companyUrl);
    
    try {
      // First, check if we already have it from regular social media extraction
      Map<String, String> socialLinks = getSocialMediaLinks(companyUrl);
      if (socialLinks.containsKey("instagram")) {
        log.info("Instagram URL already found in social media links: {}", socialLinks.get("instagram"));
        return socialLinks.get("instagram");
      }
      
      // If not found, the DuckDuckGo fallback should have been triggered in getSocialMediaLinks
      // But let's double-check by extracting company name and searching directly
      String companyName = extractCompanyNameFromUrl(companyUrl);
      if (!StringUtils.isEmpty(companyName)) {
        log.info("Instagram not found on website, trying DuckDuckGo search for: {}", companyName);
        return findInstagramUrlViaDuckDuckGo(companyName);
      }
      
      log.warn("Could not extract company name from URL: {}", companyUrl);
      return null;
      
    } catch (Exception e) {
      log.error("Error finding Instagram URL for {}: {}", companyUrl, e.getMessage());
      return null;
    }
  }
  
  /**
   * Find Twitter URL for a company by searching DuckDuckGo.
   * This is a fallback when we don't have the Twitter URL from the company website.
   * 
   * @param companyName The company name to search for
   * @return Twitter URL if found, null otherwise
   */
  private String findTwitterUrlViaDuckDuckGo(String companyName) {
    log.info("Searching DuckDuckGo for Twitter URL of company: {}", companyName);

    WebDriver driver = null;
    try {
      String searchQuery = companyName + " Twitter site:twitter.com OR site:x.com";
      String duckDuckGoUrl = "https://duckduckgo.com/?q=" + URLEncoder.encode(searchQuery, "UTF-8");

      log.info("DuckDuckGo search query: '{}'", searchQuery);
      log.info("Full DuckDuckGo URL: {}", duckDuckGoUrl);

      // Use Selenium for DuckDuckGo search
      driver = CompanyExtractorUtils.createChromeDriver();
      log.info("Searching DuckDuckGo for Twitter URL...");
      driver.get(duckDuckGoUrl);

      // Wait for results to load
      log.info("Waiting for search results to load...");
      Thread.sleep(5000);

      // Find search result links
      List<WebElement> links = driver.findElements(By.cssSelector("a[data-testid='result-title-a']"));
      log.info("Found {} search result links", links.size());

      // Check the first few search results for Twitter URLs
      for (WebElement link : links) {
        String href = link.getAttribute("href");
        String text = link.getText();

        log.debug("Checking link: href='{}', text='{}'", href, text);

        if (href != null && (href.contains("twitter.com") || href.contains("x.com"))) {
          // Clean up the URL
          String twitterUrl = href;
          
          // Remove any tracking parameters
          if (twitterUrl.contains("?")) {
            twitterUrl = twitterUrl.split("\\?")[0];
          }
          
          // Normalize to https://twitter.com format
          if (twitterUrl.contains("x.com")) {
            twitterUrl = twitterUrl.replace("x.com", "twitter.com");
          }
          
          log.info("Found Twitter URL in search results: {}", twitterUrl);
          return twitterUrl;
        }
      }

      log.warn("No Twitter URL found in DuckDuckGo search results for: {}", companyName);
      return null;

    } catch (Exception e) {
      log.error("Error searching DuckDuckGo for Twitter URL: {}", e.getMessage());
      return null;
    } finally {
      if (driver != null) {
        driver.quit();
      }
    }
  }

  /**
   * Find Instagram URL for a company by searching DuckDuckGo.
   * This is a fallback when we don't have the Instagram URL from the company website.
   * 
   * @param companyName The company name to search for
   * @return Instagram URL if found, null otherwise
   */
  private String findInstagramUrlViaDuckDuckGo(String companyName) {
    log.info("Searching DuckDuckGo for Instagram URL of company: {}", companyName);
    
    WebDriver driver = null;
    try {
      String searchQuery = companyName + " Instagram site:instagram.com";
      String duckDuckGoUrl = "https://duckduckgo.com/?q=" + URLEncoder.encode(searchQuery, "UTF-8");
      
      log.info("DuckDuckGo search query: '{}'", searchQuery);
      log.info("Full DuckDuckGo URL: {}", duckDuckGoUrl);
      
      // Use Selenium for DuckDuckGo search
      driver = CompanyExtractorUtils.createChromeDriver(); // headless mode with anti-bot measures
      log.info("Searching DuckDuckGo for Instagram URL...");
      driver.get(duckDuckGoUrl);
      
      // Wait for results to load
      log.info("Waiting for search results to load...");
      Thread.sleep(5000); // Same as Facebook search
      
      // Find search result links using the correct selector
      List<WebElement> links = driver.findElements(By.cssSelector("a[data-testid='result-title-a']"));
      log.info("Found {} search result links with data-testid='result-title-a'", links.size());
      
      // If no results, try to see what's on the page
      if (links.isEmpty()) {
        log.warn("No results found with primary selector. Page title: {}", driver.getTitle());
        log.warn("Current URL: {}", driver.getCurrentUrl());
        
        // Try alternative selectors
        links = driver.findElements(By.cssSelector("article[data-nrn='result'] a"));
        log.info("Found {} links with alternative selector", links.size());
        
        // Log first 500 chars of page text to see what's there
        String pageText = driver.findElement(By.tagName("body")).getText();
        if (pageText.length() > 500) {
          pageText = pageText.substring(0, 500) + "...";
        }
        log.info("Page text preview: {}", pageText);
        
        // Check for bot detection
        if (pageText.toLowerCase().contains("captcha") || pageText.toLowerCase().contains("verify") 
            || pageText.toLowerCase().contains("bot")) {
          log.warn("Possible CAPTCHA or bot detection page detected");
        }
      }
      
      // Check the first few search results for Instagram URLs
      int linkCount = 0;
      for (WebElement link : links) {
        String href = link.getAttribute("href");
        String text = link.getText();
        
        if (href != null && !href.isEmpty()) {
          log.info("Link {}: text='{}', href='{}'", linkCount++, text, href);
          
          // Check if it's an Instagram page URL
          if ((href.contains("instagram.com/") || href.contains("instagr.am/")) 
              && !href.contains("/p/") // Exclude individual posts
              && !href.contains("/reel/") // Exclude reels
              && !href.contains("/stories/")) { // Exclude stories
            log.info("Found Instagram page URL in search results: {}", href);
            
            // Clean up the URL if needed
            if (href.startsWith("//")) {
              href = "https:" + href;
            } else if (!href.startsWith("http")) {
              href = "https://" + href;
            }
            
            log.info("Returning Instagram URL from DuckDuckGo: {}", href);
            return href;
          }
        }
        
        // Only check first 5 results
        if (linkCount >= 5) {
          break;
        }
      }
      
      log.warn("No Instagram URL found in DuckDuckGo results for company: {}", companyName);
      return null;
      
    } catch (Exception e) {
      log.error("Failed to search DuckDuckGo for Instagram URL", e);
      return null;
    } finally {
      if (driver != null) {
        try {
          log.info("Closing browser after Instagram search");
          driver.quit();
        } catch (Exception e) {
          log.error("Error closing DuckDuckGo search driver", e);
        }
      }
    }
  }
  
  /**
   * Analyze a Facebook page to understand what content is accessible without authentication.
   * This method helps determine if follower extraction is possible.
   * 
   * @param facebookUrl The Facebook page URL to analyze
   * @return Map containing analysis results
   */
  public Map<String, Object> analyzeFacebookPage(String facebookUrl) {
    Map<String, Object> result = new HashMap<>();
    
    // Step 1: Try Jsoup first (likely to be blocked)
    log.info("Step 1: Attempting Jsoup access to Facebook page...");
    try {
      Document doc = Jsoup.connect(facebookUrl)
          .userAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
          .header("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8")
          .header("Accept-Language", "en-US,en;q=0.5")
          .timeout(10000)
          .get();
      
      result.put("jsoup_success", true);
      result.put("jsoup_title", doc.title());
      result.put("jsoup_body_length", doc.body().text().length());
      
      // Look for follower-related text in Jsoup
      String bodyText = doc.body().text();
      Pattern followerPattern = Pattern.compile("([0-9,]+)\\s*(followers?|likes?|people follow this)", Pattern.CASE_INSENSITIVE);
      Matcher matcher = followerPattern.matcher(bodyText);
      
      List<String> jsoupFollowerMatches = new ArrayList<>();
      while (matcher.find()) {
        jsoupFollowerMatches.add(matcher.group());
      }
      result.put("jsoup_follower_matches", jsoupFollowerMatches);
      
    } catch (Exception e) {
      log.warn("Jsoup access failed (expected): {}", e.getMessage());
      result.put("jsoup_success", false);
      result.put("jsoup_error", e.getMessage());
    }
    
    // Step 2: Use Selenium with visible browser
    log.info("Step 2: Opening Facebook page in VISIBLE Chrome browser...");
    WebDriver driver = null;
    
    try {
      driver = CompanyExtractorUtils.createChromeDriver(true); // Visible mode
      driver.get(facebookUrl);
      
      // Wait for page to load
      log.info("Waiting 5 seconds for Facebook page to load...");
      Thread.sleep(5000);
      
      // Get page info
      result.put("selenium_title", driver.getTitle());
      result.put("selenium_url", driver.getCurrentUrl());
      
      // Get page source
      String pageSource = driver.getPageSource();
      result.put("selenium_page_length", pageSource.length());
      
      // Check for login modal/popup
      boolean hasLoginModal = false;
      try {
        // Common selectors for Facebook login modals
        List<WebElement> loginElements = driver.findElements(By.cssSelector(
            "[data-testid='royal_login_button'], " +
            "[role='dialog'] form, " +
            "div[aria-label*='Log in'], " +
            "div[aria-label*='Sign up']"
        ));
        hasLoginModal = !loginElements.isEmpty();
      } catch (Exception e) {
        log.debug("Error checking for login modal: {}", e.getMessage());
      }
      result.put("has_login_modal", hasLoginModal);
      
      // Try to find follower count elements
      log.info("Searching for follower count elements...");
      Map<String, String> followerSelectors = new HashMap<>();
      followerSelectors.put("followers_text", "//span[contains(text(), 'followers')]");
      followerSelectors.put("likes_text", "//span[contains(text(), 'likes')]"); 
      followerSelectors.put("people_follow", "//span[contains(text(), 'people follow')]");
      followerSelectors.put("meta_description", "meta[name='description']");
      followerSelectors.put("data_follower_count", "[data-follower-count]");
      followerSelectors.put("page_likes_div", "div[data-overviewsection='PageLikes']");
      
      Map<String, Object> foundElements = new HashMap<>();
      for (Map.Entry<String, String> entry : followerSelectors.entrySet()) {
        try {
          List<WebElement> elements;
          if (entry.getValue().startsWith("//")) {
            // XPath
            elements = driver.findElements(By.xpath(entry.getValue()));
          } else if (entry.getValue().startsWith("[") || entry.getValue().contains(".") || entry.getValue().contains("#")) {
            // CSS selector
            elements = driver.findElements(By.cssSelector(entry.getValue()));
          } else {
            // Tag name
            elements = driver.findElements(By.tagName(entry.getValue()));
          }
          
          if (!elements.isEmpty()) {
            List<String> texts = new ArrayList<>();
            for (WebElement elem : elements) {
              String text = elem.getText();
              if (text.isEmpty()) {
                text = elem.getAttribute("content"); // For meta tags
              }
              if (!text.isEmpty()) {
                texts.add(text);
              }
            }
            if (!texts.isEmpty()) {
              foundElements.put(entry.getKey(), texts);
            }
          }
        } catch (Exception e) {
          log.debug("Error finding {}: {}", entry.getKey(), e.getMessage());
        }
      }
      result.put("found_elements", foundElements);
      
      // Search page source for follower patterns
      Pattern sourcePattern = Pattern.compile("([0-9,]+)\\s*(followers?|likes?|people follow this)", Pattern.CASE_INSENSITIVE);
      Matcher sourceMatcher = sourcePattern.matcher(pageSource);
      
      List<String> sourceMatches = new ArrayList<>();
      int matchCount = 0;
      while (sourceMatcher.find() && matchCount < 10) { // Limit to first 10 matches
        sourceMatches.add(sourceMatcher.group());
        matchCount++;
      }
      result.put("page_source_follower_matches", sourceMatches);
      
      // Log first 2000 characters of visible text
      try {
        WebElement body = driver.findElement(By.tagName("body"));
        String visibleText = body.getText();
        if (visibleText.length() > 2000) {
          visibleText = visibleText.substring(0, 2000) + "...";
        }
        result.put("visible_text_sample", visibleText);
      } catch (Exception e) {
        log.debug("Error getting visible text: {}", e.getMessage());
      }
      
      log.info("Pausing for 15 seconds so you can see the Facebook page...");
      Thread.sleep(15000); // 15 second pause
      
    } catch (Exception e) {
      log.error("Selenium analysis failed", e);
      result.put("selenium_error", e.getMessage());
    } finally {
      if (driver != null) {
        try {
          log.info("Closing browser after Facebook analysis");
          driver.quit();
        } catch (Exception e) {
          log.error("Error closing driver", e);
        }
      }
    }

    return result;
  }

  /**
   * Validates that a social media URL is not a generic homepage.
   * Prevents storing URLs like "https://www.instagram.com/" that don't point to actual company accounts.
   */
  private boolean isValidSocialMediaUrl(String platform, String url) {
    if (url == null || url.trim().isEmpty()) {
      return false;
    }

    String cleanUrl = url.toLowerCase().trim();

    // Check for generic social media homepages
    switch (platform.toLowerCase()) {
      case "instagram":
        return !cleanUrl.matches("https?://(www\\.)?instagram\\.com/?$");
      case "facebook":
        return !cleanUrl.matches("https?://(www\\.)?facebook\\.com/?$");
      case "twitter":
        return !cleanUrl.matches("https?://(www\\.)?(twitter\\.com|x\\.com)/?$");
      case "linkedin":
        return !cleanUrl.matches("https?://(www\\.)?linkedin\\.com/?$");
      case "youtube":
        return !cleanUrl.matches("https?://(www\\.)?youtube\\.com/?$");
      default:
        return true; // Allow other platforms by default
    }
  }
}