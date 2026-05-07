package io.ventureplatform.service.extraction.pipeline;

import com.fasterxml.jackson.databind.JsonNode;

/**
 * Interface for company data extraction phases.
 * Each phase represents a specific step in the extraction pipeline (phases 0-9).
 */
public interface ExtractionPhase {

  /**
   * Execute this phase of the extraction pipeline.
   *
   * @param companyData The current company data from previous phases
   * @param companyUrl The company URL being processed
   * @return Updated JsonNode with this phase's data added
   */
  JsonNode execute(JsonNode companyData, String companyUrl);

  /**
   * Get the name of this phase for logging purposes.
   *
   * @return Phase name
   */
  String getPhaseName();

  /**
   * Get the phase number for ordering.
   *
   * @return Phase number (0-6)
   */
  int getPhaseNumber();

  /**
   * Default error handling method that can be overridden.
   *
   * @param e The exception that occurred
   * @param companyData The original company data
   * @return The original data (fallback)
   */
  default JsonNode handleError(Exception exception, JsonNode companyData) {
    // Log error but don't fail the pipeline
    return companyData;
  }
}
