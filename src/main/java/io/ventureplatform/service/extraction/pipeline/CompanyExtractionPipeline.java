package io.ventureplatform.service.extraction.pipeline;

import com.fasterxml.jackson.databind.JsonNode;
import io.ventureplatform.service.extraction.phases.WebScrapingService;
import io.ventureplatform.service.extraction.phases.BasicExtractionService;
import io.ventureplatform.service.extraction.phases.ClusterAssignmentService;
import io.ventureplatform.service.extraction.phases.EvidenceCollectionService;
import io.ventureplatform.service.extraction.phases.EsgMaterialityService;
import io.ventureplatform.service.extraction.phases.TheoryOfChangeService;
import io.ventureplatform.service.extraction.phases.CarbonEmissionsService;
import io.ventureplatform.service.extraction.phases.CoreProductsServicesExtractionService;
import io.ventureplatform.service.extraction.phases.EsgRiskScoreService;
import io.ventureplatform.service.extraction.phases.EsgForesightScoreService;
import io.ventureplatform.service.extraction.phases.SustainabilityBusinessModelOrientationService;
import io.ventureplatform.service.extraction.phases.GrowthLikelihoodService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.concurrent.CompletableFuture;
import java.util.function.Function;

/**
 * Orchestrates the execution of all company data extraction phases in order.
 * Provides error handling and timing for each phase while maintaining pipeline flow.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CompanyExtractionPipeline {

  private final WebScrapingService webScrapingService;
  private final BasicExtractionService basicExtractionService;
  private final ClusterAssignmentService clusterAssignmentService;
  private final EvidenceCollectionService evidenceCollectionService;
  private final EsgMaterialityService esgMaterialityService;
  private final TheoryOfChangeService theoryOfChangeService;
  private final CarbonEmissionsService carbonEmissionsService;
  private final CoreProductsServicesExtractionService coreProductsServicesExtractionService;
  private final EsgRiskScoreService esgRiskScoreService;
  private final SustainabilityBusinessModelOrientationService sustainabilityBusinessModelOrientationService;
  private final EsgForesightScoreService esgForesightScoreService;
  private final GrowthLikelihoodService growthLikelihoodService;

  /**
   * Execute the complete extraction pipeline for phases 0-12.
   *
   * @param initialData The initial company data (can be null for phase 0)
   * @param companyUrl The company URL being processed
   * @return JsonNode with all phases completed
   */
  public JsonNode executePipeline(JsonNode initialData, String companyUrl) {
    return executePipelineWithCallback(initialData, companyUrl, null);
  }

  /**
   * Execute the complete extraction pipeline for phases 0-12 with an optional callback after Phase 1.
   * This allows for parallel processing to start after basic data extraction is complete.
   *
   * @param initialData The initial company data (can be null for phase 0)
   * @param companyUrl The company URL being processed
   * @param afterPhase1Callback Optional callback to execute after Phase 1 completes, receives Phase 1 result
   * @return JsonNode with all phases completed
   */
  public JsonNode executePipelineWithCallback(JsonNode initialData, String companyUrl,
                                              Function<JsonNode, CompletableFuture<Void>> afterPhase1Callback) {
    final long pipelineStartTime = System.currentTimeMillis();
    log.info("Starting extraction pipeline for company: {}", companyUrl);

    JsonNode currentData = initialData;
    int successfulPhases = 0;
    CompletableFuture<Void> callbackFuture = null;

    // Phase 0: Raw Data Extraction
    try {
      final long phaseStartTime = System.currentTimeMillis();
      log.debug("Executing {} (Phase {}) for: {}",
               webScrapingService.getPhaseName(), webScrapingService.getPhaseNumber(), companyUrl);

      JsonNode phaseResult = webScrapingService.execute(currentData, companyUrl);
      currentData = phaseResult;
      successfulPhases++;

      long phaseDuration = System.currentTimeMillis() - phaseStartTime;
      log.info("Completed {} in {}ms", webScrapingService.getPhaseName(), phaseDuration);

    } catch (Exception exception) {
      log.error("Error executing {} for {}: {}",
               webScrapingService.getPhaseName(), companyUrl, exception.getMessage());
    }

    // Phase 1: Basic Extraction
    try {
      final long phaseStartTime = System.currentTimeMillis();
      log.debug("Executing {} (Phase {}) for: {}",
               basicExtractionService.getPhaseName(), basicExtractionService.getPhaseNumber(), companyUrl);

      JsonNode phaseResult = basicExtractionService.execute(currentData, companyUrl);
      currentData = phaseResult;
      successfulPhases++;

      long phaseDuration = System.currentTimeMillis() - phaseStartTime;
      log.info("Completed {} in {}ms", basicExtractionService.getPhaseName(), phaseDuration);

      // Execute callback after Phase 1 if provided
      if (afterPhase1Callback != null) {
        try {
          log.info("=== STARTING PARALLEL PROCESSING AFTER PHASE 1 ===");
          callbackFuture = afterPhase1Callback.apply(currentData);
          log.info("Parallel processing initiated, continuing with remaining phases");
        } catch (Exception e) {
          log.error("Error executing afterPhase1Callback: {}", e.getMessage());
        }
      }

    } catch (Exception exception) {
      log.error("Error executing {} for {}: {}",
               basicExtractionService.getPhaseName(), companyUrl, exception.getMessage());
    }

    // Phase 2: Core Products/Services Extraction (moved up from Phase 8)
    try {
      final long phaseStartTime = System.currentTimeMillis();
      log.debug("Executing {} (Phase {}) for: {}",
               coreProductsServicesExtractionService.getPhaseName(), 
               coreProductsServicesExtractionService.getPhaseNumber(), companyUrl);

      JsonNode phaseResult = coreProductsServicesExtractionService.execute(currentData, companyUrl);
      currentData = phaseResult;
      successfulPhases++;

      long phaseDuration = System.currentTimeMillis() - phaseStartTime;
      log.info("Completed {} in {}ms", coreProductsServicesExtractionService.getPhaseName(), phaseDuration);

    } catch (Exception exception) {
      log.error("Error executing {} for {}: {}",
               coreProductsServicesExtractionService.getPhaseName(), companyUrl, exception.getMessage());
    }

    // Phase 4: Evidence Collection
    try {
      final long phaseStartTime = System.currentTimeMillis();
      log.debug("Executing {} (Phase {}) for: {}",
               evidenceCollectionService.getPhaseName(), evidenceCollectionService.getPhaseNumber(), companyUrl);

      JsonNode phaseResult = evidenceCollectionService.execute(currentData, companyUrl);
      currentData = phaseResult;
      successfulPhases++;

      long phaseDuration = System.currentTimeMillis() - phaseStartTime;
      log.info("Completed {} in {}ms", evidenceCollectionService.getPhaseName(), phaseDuration);

    } catch (Exception exception) {
      log.error("Error executing {} for {}: {}",
               evidenceCollectionService.getPhaseName(), companyUrl, exception.getMessage());
    }

    // Phase 5: Cluster Assignment (moved from Phase 3)
    try {
      final long phaseStartTime = System.currentTimeMillis();
      log.debug("Executing {} (Phase {}) for: {}",
               clusterAssignmentService.getPhaseName(), clusterAssignmentService.getPhaseNumber(), companyUrl);

      JsonNode phaseResult = clusterAssignmentService.execute(currentData, companyUrl);
      currentData = phaseResult;
      successfulPhases++;

      long phaseDuration = System.currentTimeMillis() - phaseStartTime;
      log.info("Completed {} in {}ms", clusterAssignmentService.getPhaseName(), phaseDuration);

    } catch (Exception exception) {
      log.error("Error executing {} for {}: {}",
               clusterAssignmentService.getPhaseName(), companyUrl, exception.getMessage());
    }

    // Phase 6: ESG Materiality (moved from Phase 5)
    try {
      final long phaseStartTime = System.currentTimeMillis();
      log.debug("Executing {} (Phase {}) for: {}",
               esgMaterialityService.getPhaseName(), esgMaterialityService.getPhaseNumber(), companyUrl);

      JsonNode phaseResult = esgMaterialityService.execute(currentData, companyUrl);
      currentData = phaseResult;
      successfulPhases++;

      long phaseDuration = System.currentTimeMillis() - phaseStartTime;
      log.info("Completed {} in {}ms", esgMaterialityService.getPhaseName(), phaseDuration);

    } catch (Exception exception) {
      log.error("Error executing {} for {}: {}",
               esgMaterialityService.getPhaseName(), companyUrl, exception.getMessage());
    }

    // Phase 7: Sustainability Business Model Orientation (moved up from Phase 10)
    try {
      final long phaseStartTime = System.currentTimeMillis();
      log.debug("Executing {} (Phase {}) for: {}",
               sustainabilityBusinessModelOrientationService.getPhaseName(), 
               sustainabilityBusinessModelOrientationService.getPhaseNumber(), companyUrl);

      JsonNode phaseResult = sustainabilityBusinessModelOrientationService.execute(currentData, companyUrl);
      currentData = phaseResult;
      successfulPhases++;

      long phaseDuration = System.currentTimeMillis() - phaseStartTime;
      log.info("Completed {} in {}ms", sustainabilityBusinessModelOrientationService.getPhaseName(), phaseDuration);

    } catch (Exception exception) {
      log.error("Error executing {} for {}: {}",
               sustainabilityBusinessModelOrientationService.getPhaseName(), companyUrl, exception.getMessage());
    }

    // Wait for callback completion if it was started
    if (callbackFuture != null) {
      try {
        log.debug("Waiting for parallel processing to complete");
        callbackFuture.join(); // Wait for parallel processing to complete
        log.debug("Parallel processing completed successfully");
      } catch (Exception e) {
        log.error("Error waiting for parallel processing completion: {}", e.getMessage());
      }
    }

    // Phase 8: Carbon Emissions Calculation (moved from Phase 7)
    try {
      final long phaseStartTime = System.currentTimeMillis();
      log.debug("Executing {} (Phase {}) for: {}",
               carbonEmissionsService.getPhaseName(), carbonEmissionsService.getPhaseNumber(), companyUrl);

      JsonNode phaseResult = carbonEmissionsService.execute(currentData, companyUrl);
      currentData = phaseResult;
      successfulPhases++;

      long phaseDuration = System.currentTimeMillis() - phaseStartTime;
      log.info("Completed {} in {}ms", carbonEmissionsService.getPhaseName(), phaseDuration);

    } catch (Exception exception) {
      log.error("Error executing {} for {}: {}",
               carbonEmissionsService.getPhaseName(), companyUrl, exception.getMessage());
    }

    // Phase 9: Theory of Change (moved down from Phase 6 - now has all context)
    try {
      final long phaseStartTime = System.currentTimeMillis();
      log.debug("Executing {} (Phase {}) for: {}",
               theoryOfChangeService.getPhaseName(), theoryOfChangeService.getPhaseNumber(), companyUrl);

      JsonNode phaseResult = theoryOfChangeService.execute(currentData, companyUrl);
      currentData = phaseResult;
      successfulPhases++;

      long phaseDuration = System.currentTimeMillis() - phaseStartTime;
      log.info("Completed {} in {}ms", theoryOfChangeService.getPhaseName(), phaseDuration);

    } catch (Exception exception) {
      log.error("Error executing {} for {}: {}",
               theoryOfChangeService.getPhaseName(), companyUrl, exception.getMessage());
    }

    // Phase 10: ESG Risk Score Calculation (moved from Phase 9)
    try {
      final long phaseStartTime = System.currentTimeMillis();
      log.debug("Executing {} (Phase {}) for: {}",
               esgRiskScoreService.getPhaseName(), esgRiskScoreService.getPhaseNumber(), companyUrl);

      JsonNode phaseResult = esgRiskScoreService.execute(currentData, companyUrl);
      currentData = phaseResult;
      successfulPhases++;

      long phaseDuration = System.currentTimeMillis() - phaseStartTime;
      log.info("Completed {} in {}ms", esgRiskScoreService.getPhaseName(), phaseDuration);

    } catch (Exception exception) {
      log.error("Error executing {} for {}: {}",
               esgRiskScoreService.getPhaseName(), companyUrl, exception.getMessage());
    }

    // Phase 11: ESG Foresight Score Calculation (8-year projection)
    try {
      final long phaseStartTime = System.currentTimeMillis();
      log.debug("Executing {} (Phase {}) for: {}",
               esgForesightScoreService.getPhaseName(),
               esgForesightScoreService.getPhaseNumber(), companyUrl);

      JsonNode phaseResult = esgForesightScoreService.execute(currentData, companyUrl);
      currentData = phaseResult;
      successfulPhases++;

      long phaseDuration = System.currentTimeMillis() - phaseStartTime;
      log.info("Completed {} in {}ms",
               esgForesightScoreService.getPhaseName(), phaseDuration);

    } catch (Exception exception) {
      log.error("Error executing {} for {}: {}",
               esgForesightScoreService.getPhaseName(),
               companyUrl, exception.getMessage());
    }

    // Phase 12: Growth Likelihood
    try {
      final long phaseStartTime = System.currentTimeMillis();
      log.debug("Executing {} (Phase {}) for: {}",
               growthLikelihoodService.getPhaseName(),
               growthLikelihoodService.getPhaseNumber(), companyUrl);

      JsonNode phaseResult = growthLikelihoodService.execute(currentData, companyUrl);
      currentData = phaseResult;
      successfulPhases++;

      long phaseDuration = System.currentTimeMillis() - phaseStartTime;
      log.info("Completed {} in {}ms",
               growthLikelihoodService.getPhaseName(), phaseDuration);

    } catch (Exception exception) {
      log.error("Error executing {} for {}: {}",
               growthLikelihoodService.getPhaseName(),
               companyUrl, exception.getMessage());
    }

    long totalDuration = System.currentTimeMillis() - pipelineStartTime;
    log.info("Pipeline completed for {} in {}ms. Successful phases: {}/13",
             companyUrl, totalDuration, successfulPhases);

    return currentData;
  }

  /**
   * Check if all required phases are available.
   *
   * @return true if all phases are properly injected and available
   */
  public boolean isReady() {
    return webScrapingService != null
           && basicExtractionService != null
           && clusterAssignmentService != null
           && evidenceCollectionService != null
           && esgMaterialityService != null
           && theoryOfChangeService != null
           && carbonEmissionsService != null
           && coreProductsServicesExtractionService != null
           && esgRiskScoreService != null
           && sustainabilityBusinessModelOrientationService != null
           && esgForesightScoreService != null
           && growthLikelihoodService != null;
  }
}
