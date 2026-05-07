package io.ventureplatform.util;

import lombok.extern.slf4j.Slf4j;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Utility class for parsing sales values from various string formats.
 * Handles formats like "1.5M", "500K", "2.5B", "1,500,000", etc.
 */
@Slf4j
public class SalesValueParser {

  // Pattern to match number with optional decimal followed by multiplier (K, M, B, T)
  private static final Pattern MULTIPLIER_PATTERN = Pattern.compile(
      "^\\s*([+-]?\\d+(?:[,.]\\d+)*)\\s*([KMBT])?\\s*$",
      Pattern.CASE_INSENSITIVE
  );

  // Pattern to detect ranges (we'll log these but not parse them)
  private static final Pattern RANGE_PATTERN = Pattern.compile(
      "\\d+\\s*[-–—]\\s*\\d+"
  );

  /**
   * Parse a sales value string into a BigDecimal.
   *
   * @param value The string value to parse (e.g., "1.5M", "500K", "2,500,000")
   * @param companyName Optional company name for better logging context
   * @param year Optional year for better logging context
   * @return BigDecimal value or null if unparseable
   */
  public static BigDecimal parse(String value, String companyName, String year) {
    if (value == null || value.trim().isEmpty()) {
      log.debug("Empty sales value for {} ({})", companyName, year);
      return null;
    }

    String trimmedValue = value.trim();

    // Check for explicit N/A or similar
    if (isNotAvailable(trimmedValue)) {
      log.debug("Sales value is N/A for {} ({}): '{}'", companyName, year, trimmedValue);
      return null;
    }

    // Check if it's a range (log warning but don't parse)
    if (RANGE_PATTERN.matcher(trimmedValue).find()) {
      log.warn("Sales value is a range for {} ({}), cannot parse: '{}'",
               companyName != null ? companyName : "unknown company",
               year != null ? year : "unknown year",
               trimmedValue);
      return null;
    }

    try {
      // Remove common prefixes/suffixes
      String cleanedValue = trimmedValue
          .replaceAll("(?i)\\s*(EUR|USD|GBP|€|\\$|£)\\s*", "") // Remove currency symbols
          .replaceAll("(?i)\\s*(million|billion|thousand)s?\\s*", "") // Remove word multipliers
          .replaceAll("\\s+", ""); // Remove all spaces

      // Handle word multipliers before numeric parsing
      BigDecimal wordMultiplier = BigDecimal.ONE;
      if (trimmedValue.toLowerCase().contains("thousand")) {
        wordMultiplier = new BigDecimal("1000");
        cleanedValue = cleanedValue.replaceAll("(?i)thousand", "K");
      } else if (trimmedValue.toLowerCase().contains("million")) {
        wordMultiplier = new BigDecimal("1000000");
        cleanedValue = cleanedValue.replaceAll("(?i)million", "M");
      } else if (trimmedValue.toLowerCase().contains("billion")) {
        wordMultiplier = new BigDecimal("1000000000");
        cleanedValue = cleanedValue.replaceAll("(?i)billion", "B");
      }

      // Try to match the pattern
      Matcher matcher = MULTIPLIER_PATTERN.matcher(cleanedValue);

      if (matcher.matches()) {
        // Extract the numeric part
        String numberPart = matcher.group(1);
        String multiplierPart = matcher.group(2);

        // Handle both comma and period as decimal separator
        // Assume comma is thousands separator if there are 3 digits after it
        if (numberPart.contains(",") && numberPart.contains(".")) {
          // Both separators present - comma likely thousands separator
          numberPart = numberPart.replace(",", "");
        } else if (numberPart.contains(",")) {
          // Only comma present - check if it's decimal or thousands
          String afterComma = numberPart.substring(numberPart.lastIndexOf(",") + 1);
          if (afterComma.length() == 3) {
            // Likely thousands separator
            numberPart = numberPart.replace(",", "");
          } else {
            // Likely decimal separator (European format)
            numberPart = numberPart.replace(",", ".");
          }
        }

        BigDecimal numericValue = new BigDecimal(numberPart);

        // Apply letter multiplier if present
        if (multiplierPart != null && !multiplierPart.isEmpty()) {
          BigDecimal multiplier = getMultiplier(multiplierPart);
          numericValue = numericValue.multiply(multiplier);
        }

        // Apply word multiplier if it was detected
        numericValue = numericValue.multiply(wordMultiplier);

        // Round to 2 decimal places
        numericValue = numericValue.setScale(2, RoundingMode.HALF_UP);

        log.debug("Successfully parsed sales value for {} ({}): '{}' -> {}",
                 companyName, year, trimmedValue, numericValue);

        return numericValue;

      } else {
        // Try simple number parse as last resort
        String simpleNumber = cleanedValue.replaceAll("[^0-9.-]", "");
        if (!simpleNumber.isEmpty()) {
          BigDecimal result = new BigDecimal(simpleNumber).multiply(wordMultiplier);
          log.debug("Parsed using simple number extraction for {} ({}): '{}' -> {}",
                   companyName, year, trimmedValue, result);
          return result.setScale(2, RoundingMode.HALF_UP);
        }
      }

    } catch (Exception e) {
      log.error("Failed to parse sales value for {} ({}): '{}' - Error: {}",
               companyName != null ? companyName : "unknown company",
               year != null ? year : "unknown year",
               trimmedValue,
               e.getMessage());
    }

    log.warn("Could not parse sales value for {} ({}): '{}' - Saving as NULL",
             companyName != null ? companyName : "unknown company",
             year != null ? year : "unknown year",
             trimmedValue);

    return null;
  }

  /**
   * Get numeric multiplier for letter abbreviations.
   */
  private static BigDecimal getMultiplier(String multiplierLetter) {
    switch (multiplierLetter.toUpperCase()) {
      case "K":
        return new BigDecimal("1000");
      case "M":
        return new BigDecimal("1000000");
      case "B":
        return new BigDecimal("1000000000");
      case "T":
        return new BigDecimal("1000000000000");
      default:
        log.warn("Unknown multiplier: {}", multiplierLetter);
        return BigDecimal.ONE;
    }
  }

  /**
   * Check if a value represents "not available".
   */
  private static boolean isNotAvailable(String value) {
    if (value == null) {
      return true;
    }

    String lower = value.trim().toLowerCase();
    return lower.equals("n/a") ||
           lower.equals("na") ||
           lower.equals("n.a.") ||
           lower.equals("not available") ||
           lower.equals("unavailable") ||
           lower.equals("unknown") ||
           lower.equals("-");
  }

  /**
   * Format a BigDecimal value back to a human-readable string.
   * Used for display purposes in the frontend.
   */
  public static String formatForDisplay(BigDecimal value) {
    if (value == null) {
      return "N/A";
    }

    // Determine the best multiplier to use
    BigDecimal absValue = value.abs();

    if (absValue.compareTo(new BigDecimal("1000000000")) >= 0) {
      // Billions
      BigDecimal billions = value.divide(new BigDecimal("1000000000"), 2, RoundingMode.HALF_UP);
      return removeTrailingZeros(billions) + "B";
    } else if (absValue.compareTo(new BigDecimal("1000000")) >= 0) {
      // Millions
      BigDecimal millions = value.divide(new BigDecimal("1000000"), 2, RoundingMode.HALF_UP);
      return removeTrailingZeros(millions) + "M";
    } else if (absValue.compareTo(new BigDecimal("1000")) >= 0) {
      // Thousands
      BigDecimal thousands = value.divide(new BigDecimal("1000"), 2, RoundingMode.HALF_UP);
      return removeTrailingZeros(thousands) + "K";
    } else {
      // No multiplier needed
      return removeTrailingZeros(value);
    }
  }

  /**
   * Remove trailing zeros from decimal representation.
   */
  private static String removeTrailingZeros(BigDecimal value) {
    String str = value.stripTrailingZeros().toPlainString();
    // If it's a whole number, remove the decimal point
    if (str.contains(".") && str.endsWith("0")) {
      str = str.replaceAll("\\.0+$", "");
    }
    return str;
  }
}
