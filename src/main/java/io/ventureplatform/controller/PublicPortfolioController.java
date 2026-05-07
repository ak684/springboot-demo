package io.ventureplatform.controller;

import io.ventureplatform.service.PortfolioAggregatedService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.servlet.http.HttpServletRequest;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/public")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PublicPortfolioController {

  private final PortfolioAggregatedService portfolioAggregatedService;

  @GetMapping("/portfolios/{portfolioId}/indicators")
  public ResponseEntity<?> getAggregatedIndicators(
      @PathVariable Long portfolioId,
      HttpServletRequest request) {

    // Get portfolio ID from API key (set by filter)
    Long apiPortfolioId = (Long) request.getAttribute("api_portfolio_id");


    // Validate portfolio ID matches API key
    if (apiPortfolioId == null || !portfolioId.equals(apiPortfolioId)) {
      return ResponseEntity.status(403)
          .body(Map.of("error", "Access denied to this portfolio"));
    }

    try {
      // Get aggregated indicators using the service method
      List<io.ventureplatform.dto.AggregatedIndicator> indicators = 
          portfolioAggregatedService.getAggregatedIndicators(portfolioId);
      
      // Convert to public format (same logic as in PortfolioAggregatedController)
      List<Map<String, Object>> publicIndicators = convertToPublicFormat(indicators, portfolioId);

      return ResponseEntity.ok(publicIndicators);
    } catch (Exception e) {
      // Log the error for debugging
      e.printStackTrace();
      
      // Return empty array on error (portfolio might not exist or have no indicators)
      return ResponseEntity.ok(List.of());
    }
  }

  private List<Map<String, Object>> convertToPublicFormat(List<io.ventureplatform.dto.AggregatedIndicator> indicators) {
    return convertToPublicFormat(indicators, null);
  }
  
  private List<Map<String, Object>> convertToPublicFormat(List<io.ventureplatform.dto.AggregatedIndicator> indicators, Long portfolioId) {
    // Group indicators by main/hover relationship
    List<io.ventureplatform.dto.AggregatedIndicator> mainIndicators = new ArrayList<>();
    Map<Long, Map<Integer, io.ventureplatform.dto.AggregatedIndicator>> hoverMap = new HashMap<>();

    // Separate main and hover indicators
    for (io.ventureplatform.dto.AggregatedIndicator indicator : indicators) {
      Boolean isMain = indicator.getIsMain();
      if (isMain == null || isMain) {
        mainIndicators.add(indicator);
      } else {
        Long parentId = indicator.getParentIndicatorId();
        Integer hoverSlot = indicator.getHoverSlot();
        if (parentId != null && hoverSlot != null) {
          hoverMap.computeIfAbsent(parentId, k -> new HashMap<>())
              .put(hoverSlot, indicator);
        }
      }
    }

    // Sort main indicators by display order
    mainIndicators.sort((a, b) -> {
      Integer orderA = a.getDisplayOrder() != null ? a.getDisplayOrder() : Integer.MAX_VALUE;
      Integer orderB = b.getDisplayOrder() != null ? b.getDisplayOrder() : Integer.MAX_VALUE;
      return orderA.compareTo(orderB);
    });

    // Build flat rows
    List<Map<String, Object>> rows = new ArrayList<>();

    for (io.ventureplatform.dto.AggregatedIndicator main : mainIndicators) {
      Map<String, Object> row = new HashMap<>();

      // Stable identifier
      row.put("indicator_id", main.getId());
      row.put("category", main.getCategory());

      // Main indicator data
      row.put("indicator_name_en", main.getName());
      row.put("indicator_name_sk", main.getNameSlovak());
      row.put("indicator_value", main.getCalculatedValue());
      row.put("time_period", main.getTimePeriod());
      row.put("time_period_en", main.getTimePeriodEnglish());
      row.put("time_period_sk", main.getTimePeriodSlovak());
      row.put("unit", main.getUnit());
      row.put("unit_sk", main.getUnitSlovak());

      // Number formatting fields
      row.put("decimal_places", main.getDecimalPlaces());
      row.put("number_format", main.getNumberFormat());

      // Add calculation metadata
      row.put("calculation_type", isProrated(main.getTimePeriod()) ? "prorated" : "full");
      row.put("calculated_date", LocalDate.now().toString());
      
      // Add continuous counter data if enabled and applicable
      if (portfolioId != null && Boolean.TRUE.equals(main.getContinuousCounter()) && isProrated(main.getTimePeriod())) {
        Map<String, Object> continuousCounter = portfolioAggregatedService.buildContinuousCounterData(
            portfolioId,
            main
        );
        // Only add if we got valid data back
        if (!continuousCounter.isEmpty()) {
          row.put("continuous_counter", continuousCounter);
        }
      }

      // Hover indicators
      Map<Integer, io.ventureplatform.dto.AggregatedIndicator> hovers = hoverMap.get(main.getId());
      if (hovers != null) {
        for (int slot = 1; slot <= 3; slot++) {
          io.ventureplatform.dto.AggregatedIndicator hover = hovers.get(slot);
          if (hover != null) {
            row.put("hover" + slot + "_name", hover.getName());
            row.put("hover" + slot + "_name_sk", hover.getNameSlovak());
            row.put("hover" + slot + "_value", hover.getCalculatedValue());
            row.put("hover" + slot + "_time_period", hover.getTimePeriod());
            row.put("hover" + slot + "_time_period_en", hover.getTimePeriodEnglish());
            row.put("hover" + slot + "_time_period_sk", hover.getTimePeriodSlovak());
            row.put("hover" + slot + "_unit", hover.getUnit());
            row.put("hover" + slot + "_unit_sk", hover.getUnitSlovak());
            row.put("hover" + slot + "_decimal_places", hover.getDecimalPlaces());
            row.put("hover" + slot + "_number_format", hover.getNumberFormat());
          } else {
            row.put("hover" + slot + "_name", null);
            row.put("hover" + slot + "_name_sk", null);
            row.put("hover" + slot + "_value", null);
            row.put("hover" + slot + "_time_period", null);
            row.put("hover" + slot + "_time_period_en", null);
            row.put("hover" + slot + "_time_period_sk", null);
            row.put("hover" + slot + "_unit", null);
            row.put("hover" + slot + "_unit_sk", null);
            row.put("hover" + slot + "_decimal_places", null);
            row.put("hover" + slot + "_number_format", null);
          }
        }
      } else {
        // No hovers
        for (int slot = 1; slot <= 3; slot++) {
          row.put("hover" + slot + "_name", null);
          row.put("hover" + slot + "_name_sk", null);
          row.put("hover" + slot + "_value", null);
          row.put("hover" + slot + "_time_period", null);
          row.put("hover" + slot + "_time_period_en", null);
          row.put("hover" + slot + "_time_period_sk", null);
          row.put("hover" + slot + "_unit", null);
          row.put("hover" + slot + "_unit_sk", null);
          row.put("hover" + slot + "_decimal_places", null);
          row.put("hover" + slot + "_number_format", null);
        }
      }

      rows.add(row);
    }

    return rows;
  }

  private boolean isProrated(String timePeriod) {
    return timePeriod != null && (
        timePeriod.equals("ytd") ||
        timePeriod.equals("mtd") ||
        timePeriod.equals("today") ||
        timePeriod.equals("sinceInception")
      );
  }
}
