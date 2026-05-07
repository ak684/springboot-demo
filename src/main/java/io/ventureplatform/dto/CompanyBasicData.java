package io.ventureplatform.dto;

import lombok.Builder;
import lombok.Data;

/**
 * Data Transfer Object for basic company data extracted in Phase 0.
 * Contains the fundamental company information that serves as the foundation for all subsequent phases.
 */
@Data
@Builder
public class CompanyBasicData {

  /**
   * The raw JSON response from OpenAI containing all basic company data.
   * This is used by subsequent phases and for final response construction.
   */
  private String rawJsonResponse;

  /**
   * The cleaned JSON response (markdown code blocks removed, etc.).
   * Ready for JSON parsing and processing.
   */
  private String cleanedJsonResponse;

  /**
   * Company name extracted from the response.
   * Used for logging and identification purposes.
   */
  private String companyName;

  /**
   * Company URL that was processed.
   * Used for reference and logging.
   */
  private String companyUrl;

  /**
   * Indicates whether the extraction was successful.
   * Used for error handling and fallback logic.
   */
  private boolean successful;

  /**
   * Error message if extraction failed.
   * Used for debugging and error reporting.
   */
  private String errorMessage;

  /**
   * Timestamp when the extraction was performed.
   * Used for logging and performance tracking.
   */
  private long extractionTimestamp;

  /**
   * Duration of the extraction in milliseconds.
   * Used for performance monitoring.
   */
  private long extractionDurationMs;
}
