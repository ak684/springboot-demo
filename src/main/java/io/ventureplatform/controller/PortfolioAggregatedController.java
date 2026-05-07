package io.ventureplatform.controller;

import io.ventureplatform.dto.AggregatedIndicator;
import io.ventureplatform.dto.AggregatedPortfolioData;
import io.ventureplatform.dto.ColumnConfig;
import io.ventureplatform.dto.DataSourceReference;
import io.ventureplatform.entity.Portfolio;
import io.ventureplatform.service.PortfolioAggregatedService;
import io.ventureplatform.constant.AppConstants;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.stream.Collectors;

@RestController
@RequestMapping(value = AppConstants.API_PREFIX + AppConstants.API_VERSION + "/portfolios/{portfolioId}/aggregated")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
@Slf4j
public class PortfolioAggregatedController {

  private final PortfolioAggregatedService portfolioAggregatedService;

  /**
   * Get aggregated portfolio data in flat structure
   */
  @GetMapping("/data")
  @PreAuthorize("isPortfolioMember(#portfolio.organization.id, #portfolio.id)")
  public ResponseEntity<List<AggregatedPortfolioData>> getAggregatedData(
      @PathVariable(name = "portfolioId") Portfolio portfolio,
      @RequestParam(required = false) List<Long> ventureIds,
      @RequestParam(required = false) List<String> columns
  ) {
    log.info("Fetching aggregated data for portfolio: {}", portfolio.getId());

    List<AggregatedPortfolioData> data = portfolioAggregatedService.getAggregatedPortfolioData(
        portfolio.getId(), ventureIds, columns
    );

    return ResponseEntity.ok(data);
  }
    
  /**
   * Get available column configurations
   */
  @GetMapping("/columns")
  @PreAuthorize("isPortfolioMember(#portfolio.organization.id, #portfolio.id)")
  public ResponseEntity<Map<String, List<ColumnConfig>>> getAvailableColumns(
      @PathVariable(name = "portfolioId") Portfolio portfolio
  ) {
    Map<String, List<ColumnConfig>> columns = portfolioAggregatedService.getAvailableColumns(portfolio.getId());
    return ResponseEntity.ok(columns);
  }
    
  /**
   * Get saved aggregated indicators
   */
  @GetMapping("/indicators")
  @PreAuthorize("isPortfolioMember(#portfolio.organization.id, #portfolio.id)")
  public ResponseEntity<List<AggregatedIndicator>> getAggregatedIndicators(
      @PathVariable(name = "portfolioId") Portfolio portfolio
  ) {
    List<AggregatedIndicator> indicators = portfolioAggregatedService.getAggregatedIndicators(portfolio.getId());
    
    // Recalculate prorated indicators in real-time to ensure daily updates
    for (AggregatedIndicator indicator : indicators) {
      if (isProrated(indicator.getTimePeriod())) {
        // Get fresh data and recalculate for prorated periods
        Double freshValue = portfolioAggregatedService.recalculateProratedValue(
            portfolio.getId(), 
            indicator
        );
        if (freshValue != null) {
          indicator.setCalculatedValue(freshValue);
        }
      }
    }
    
    return ResponseEntity.ok(indicators);
  }
  
  /**
   * Get main aggregated indicators (for hover parent selection)
   */
  @GetMapping("/indicators/main")
  @PreAuthorize("isPortfolioMember(#portfolio.organization.id, #portfolio.id)")
  public ResponseEntity<List<Map<String, Object>>> getMainAggregatedIndicators(
      @PathVariable(name = "portfolioId") Portfolio portfolio
  ) {
    List<AggregatedIndicator> mainIndicators = portfolioAggregatedService.getMainAggregatedIndicators(portfolio.getId());
    
    // Convert to simple format for dropdown
    List<Map<String, Object>> options = mainIndicators.stream()
        .map(ind -> {
          Map<String, Object> option = new HashMap<>();
          option.put("value", ind.getId());
          option.put("label", ind.getName() + " (" + ind.getCategory() + ")");
          option.put("category", ind.getCategory());
          return option;
        })
        .collect(Collectors.toList());
    
    return ResponseEntity.ok(options);
  }

  /**
   * Debug endpoint to test parameter passing
   */
  @GetMapping("/debug-params")
  @PreAuthorize("isPortfolioMember(#portfolio.organization.id, #portfolio.id)")
  public ResponseEntity<Map<String, Object>> debugParams(
      @PathVariable(name = "portfolioId") Portfolio portfolio,
      @RequestParam(required = false) List<Long> ventureIds,
      @RequestParam Map<String, String> allParams
  ) {
    Map<String, Object> debug = new HashMap<>();
    debug.put("portfolioId", portfolio.getId());
    debug.put("ventureIds", ventureIds);
    debug.put("ventureIdsClass", ventureIds != null ? ventureIds.getClass().getName() : "null");
    debug.put("ventureIdsSize", ventureIds != null ? ventureIds.size() : "null");
    debug.put("allParams", allParams);
    log.info("🐛 Debug params: {}", debug);
    return ResponseEntity.ok(debug);
  }
  
  /**
   * Get available indicator names for selected ventures
   */
  @GetMapping("/available-indicators")
  @PreAuthorize("isPortfolioMember(#portfolio.organization.id, #portfolio.id)")
  public ResponseEntity<List<String>> getAvailableIndicators(
      @PathVariable(name = "portfolioId") Portfolio portfolio,
      @RequestParam(required = false) List<Long> ventureIds
  ) {
    log.info("🎯 INDICATOR REQUEST: Portfolio={}, VentureFilter={}", 
        portfolio.getId(), 
        ventureIds != null ? ventureIds : "ALL");
    
    List<String> availableIndicators = portfolioAggregatedService.getAvailableIndicatorNames(
        portfolio.getId(), ventureIds
    );
    
    log.info("✅ INDICATOR RESPONSE: Found {} indicators for {} ventures", 
        availableIndicators.size(),
        ventureIds != null ? ventureIds.size() : "ALL");
    
    return ResponseEntity.ok(availableIndicators);
  }

  /**
   * Get available data sources for selected ventures
   */
  @GetMapping("/available-data-sources")
  @PreAuthorize("isPortfolioMember(#portfolio.organization.id, #portfolio.id)")
  public ResponseEntity<Map<String, List<DataSourceReference>>> getAvailableDataSources(
      @PathVariable(name = "portfolioId") Portfolio portfolio,
      @RequestParam(required = false) List<Long> ventureIds
  ) {
    log.info("🎯 DATA SOURCES REQUEST: Portfolio={}, VentureFilter={}",
        portfolio.getId(),
        ventureIds != null ? ventureIds : "ALL");

    Map<String, List<DataSourceReference>> availableDataSources = portfolioAggregatedService.getAvailableDataSources(
        portfolio.getId(), ventureIds
    );

    log.info("✅ DATA SOURCES RESPONSE: Found {} products, {} stakeholders, {} indicators",
        availableDataSources.get("products").size(),
        availableDataSources.get("stakeholders").size(),
        availableDataSources.get("indicators").size());

    return ResponseEntity.ok(availableDataSources);
  }

  /**
   * Create new aggregated indicator
   */
  @PostMapping("/indicators")
  @PreAuthorize("isPortfolioMember(#portfolio.organization.id, #portfolio.id)")
  public ResponseEntity<Map<String, Object>> createAggregatedIndicator(
      @PathVariable(name = "portfolioId") Portfolio portfolio,
      @RequestBody AggregatedIndicator indicator
  ) {
    log.info("🚀 Creating aggregated indicator for portfolio: {}", portfolio.getId());
    log.info("📝 Indicator name: '{}'", indicator.getName());
    log.info("🎯 Venture IDs from frontend: {}", indicator.getVentureIds());
    log.info("📊 Data sources from frontend: {}", indicator.getDataSources());
    log.info("⏰ Time period from frontend: {}", indicator.getTimePeriod());
    log.info("🔧 Aggregation type from frontend: {}", indicator.getAggregationType());
    log.info("📅 Selected years from frontend: {}", indicator.getSelectedYears());

    // Get current data to calculate value - using the new calculation method
    List<AggregatedPortfolioData> data = portfolioAggregatedService.getAggregatedPortfolioData(
        portfolio.getId(), indicator.getVentureIds(), null
    );
    
    log.info("📊 Retrieved {} portfolio data rows for calculation", data.size());
    
    // Use the new calculation method that supports data sources
    portfolioAggregatedService.calculateAggregatedValuesNew(indicator, data);

    // Save to database
    io.ventureplatform.entity.AggregatedIndicator savedEntity = 
        portfolioAggregatedService.saveAggregatedIndicator(portfolio.getId(), indicator);
    
    // Update the indicator with the saved ID and other fields
    indicator.setId(savedEntity.getId());
    indicator.setCreatedAt(savedEntity.getCreatedAt() != null ? savedEntity.getCreatedAt().toString() : null);
    
    // Set parent-child relationship flags in response
    Map<String, Object> indicatorMetadata = new HashMap<>();
    indicatorMetadata.put("isMain", savedEntity.getIsMain());
    indicatorMetadata.put("hoverSlot", savedEntity.getHoverSlot());
    indicatorMetadata.put("parentIndicatorId", savedEntity.getParentIndicator() != null ? 
        savedEntity.getParentIndicator().getId() : null);

    log.info("✅ Successfully created aggregated indicator '{}'", indicator.getName());
    log.info("🎯 Primary calculated value: {}", indicator.getCalculatedValue());
    log.info("📊 All calculated values: {}", indicator.getCalculatedValues());
    log.info("📊 Component breakdowns: {}", indicator.getComponentBreakdowns());

    // Build response with component breakdown
    Map<String, Object> response = new HashMap<>();
    response.put("id", indicator.getId());
    response.put("name", indicator.getName());
    response.put("aggregationType", indicator.getAggregationType());
    response.put("timePeriods", buildTimePeriodResponse(indicator));
    response.put("metadata", indicatorMetadata);
    
    return ResponseEntity.ok(response);
  }
  
  /**
   * Get single aggregated indicator
   */
  @GetMapping("/indicators/{indicatorId}")
  @PreAuthorize("isPortfolioMember(#portfolio.organization.id, #portfolio.id)")
  public ResponseEntity<AggregatedIndicator> getAggregatedIndicator(
      @PathVariable(name = "portfolioId") Portfolio portfolio,
      @PathVariable Long indicatorId
  ) {
    AggregatedIndicator indicator = portfolioAggregatedService.getAggregatedIndicatorById(portfolio.getId(), indicatorId);
    return ResponseEntity.ok(indicator);
  }
  
  /**
   * Update aggregated indicator
   */
  @PutMapping("/indicators/{indicatorId}")
  @PreAuthorize("isPortfolioMember(#portfolio.organization.id, #portfolio.id)")
  public ResponseEntity<AggregatedIndicator> updateAggregatedIndicator(
      @PathVariable(name = "portfolioId") Portfolio portfolio,
      @PathVariable Long indicatorId,
      @RequestBody AggregatedIndicator indicator
  ) {
    // Get current data to recalculate value
    List<AggregatedPortfolioData> data = portfolioAggregatedService.getAggregatedPortfolioData(
        portfolio.getId(), indicator.getVentureIds(), null
    );

    // Recalculate values
    portfolioAggregatedService.calculateAggregatedValuesNew(indicator, data);

    // Update in database
    AggregatedIndicator updated = portfolioAggregatedService.updateAggregatedIndicator(portfolio.getId(), indicatorId, indicator);

    return ResponseEntity.ok(updated);
  }
  
  /**
   * Delete aggregated indicator
   */
  @DeleteMapping("/indicators/{indicatorId}")
  @PreAuthorize("isPortfolioMember(#portfolio.organization.id, #portfolio.id)")
  public ResponseEntity<Void> deleteAggregatedIndicator(
      @PathVariable(name = "portfolioId") Portfolio portfolio,
      @PathVariable Long indicatorId
  ) {
    portfolioAggregatedService.deleteAggregatedIndicator(portfolio.getId(), indicatorId);
    return ResponseEntity.ok().build();
  }

  /**
   * Reorder main indicators (for future drag-and-drop functionality)
   */
  @PutMapping("/indicators/reorder")
  @PreAuthorize("isPortfolioMember(#portfolio.organization.id, #portfolio.id)")
  public ResponseEntity<Void> reorderIndicators(
      @PathVariable(name = "portfolioId") Portfolio portfolio,
      @RequestBody List<Map<String, Object>> orderUpdates
  ) {
    // orderUpdates: [{"id": 123, "displayOrder": 1}, {"id": 456, "displayOrder": 2}]
    portfolioAggregatedService.updateDisplayOrder(portfolio.getId(), orderUpdates);
    return ResponseEntity.ok().build();
  }

  /**
   * Build time period response with component breakdown
   */
  private Map<String, Map<String, Object>> buildTimePeriodResponse(AggregatedIndicator indicator) {
    Map<String, Map<String, Object>> timePeriodData = new HashMap<>();

    // Handle single time period
    String period = indicator.getTimePeriod();
    if (period != null) {
      Map<String, Object> periodData = new HashMap<>();
      periodData.put("total", indicator.getCalculatedValues().get(period));
      periodData.put("aggregationType", indicator.getAggregationType());
      periodData.put("components", indicator.getComponentBreakdowns().get(period));
      timePeriodData.put(period, periodData);
    }

    return timePeriodData;
  }
  
  /**
   * Helper method to determine if a time period is prorated
   */
  private boolean isProrated(String timePeriod) {
    return Arrays.asList("ytd", "mtd", "today", "sinceInception").contains(timePeriod);
  }
  
  /**
   * Recalculate aggregated indicators when venture data changes
   */
  @PostMapping("/indicators/recalculate/venture/{ventureId}")
  @PreAuthorize("isPortfolioMember(#portfolio.organization.id, #portfolio.id)")
  public ResponseEntity<Map<String, Object>> recalculateForVenture(
      @PathVariable(name = "portfolioId") Portfolio portfolio,
      @PathVariable Long ventureId
  ) {
    log.info("Recalculating aggregated indicators for portfolio {} after venture {} update", 
        portfolio.getId(), ventureId);
    
    int updatedCount = portfolioAggregatedService.recalculateIndicatorsForVenture(
        portfolio.getId(), 
        ventureId
    );
    
    log.info("Updated {} aggregated indicators", updatedCount);
    
    return ResponseEntity.ok(Map.of(
        "updated", updatedCount,
        "ventureId", ventureId
    ));
  }
  
}
