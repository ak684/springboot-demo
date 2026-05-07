package io.ventureplatform.service.extraction.pipeline;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.ventureplatform.service.external.OpenAiClient;
import lombok.extern.slf4j.Slf4j;

/**
 * Base implementation for extraction phases providing common functionality.
 */
@Slf4j
public abstract class BaseExtractionPhase implements ExtractionPhase {

  protected final ObjectMapper objectMapper;
  protected final OpenAiClient openAiClient;

  public BaseExtractionPhase(ObjectMapper objectMapper, OpenAiClient openAiClient) {
    this.objectMapper = objectMapper;
    this.openAiClient = openAiClient;
  }

  @Override
  public JsonNode execute(JsonNode companyData, String companyUrl) {
    long startTime = System.currentTimeMillis();

    try {
      log.info("Starting {} for company: {}", getPhaseName(), companyUrl);

      JsonNode result = executePhase(companyData, companyUrl);

      long duration = System.currentTimeMillis() - startTime;
      log.info("{} completed successfully in {}ms", getPhaseName(), duration);

      return result;

    } catch (Exception e) {
      long duration = System.currentTimeMillis() - startTime;
      log.error("{} failed after {}ms: {}", getPhaseName(), duration, e.getMessage());

      return handleError(e, companyData);
    }
  }

  /**
   * Phase-specific implementation to be provided by subclasses.
   */
  protected abstract JsonNode executePhase(JsonNode companyData, String companyUrl);

  /**
   * Make an OpenAI o3 API call with web search enabled.
   * Delegates to OpenAiClient for consistent retry logic and error handling.
   *
   * @param prompt The prompt to send to the AI
   * @return The cleaned AI response text
   */
  protected String makeOpenAiCallWithO3WebSearch(final String prompt) {
    return openAiClient.makeO3CallWithWebSearch(prompt);
  }

  /**
   * Make an OpenAI o3 API call with web search enabled and explicit system prompt.
   *
   * @param systemPrompt The system level instructions (optional)
   * @param prompt The user content prompt
   * @param maxOutputTokens Maximum output tokens (nullable)
   * @return The cleaned AI response text
   */
  protected String makeOpenAiCallWithO3WebSearch(final String systemPrompt,
                                                 final String prompt,
                                                 final Integer maxOutputTokens) {
    return openAiClient.makeO3CallWithWebSearch(
        systemPrompt,
        prompt,
        maxOutputTokens,
        true
    );
  }

  /**
   * Attempts to clean and extract valid JSON from a response string.
   * Delegates to OpenAiClient for consistent JSON cleaning logic.
   *
   * @param response The raw response from the model
   * @return Cleaned JSON string
   */
  protected String cleanJsonResponse(final String response) {
    return openAiClient.cleanJsonResponse(response);
  }

  @Override
  public JsonNode handleError(Exception exception, JsonNode companyData) {
    log.error("Error in {}: {}", getPhaseName(), exception.getMessage());
    return companyData; // Return original data, don't fail the pipeline
  }
}
