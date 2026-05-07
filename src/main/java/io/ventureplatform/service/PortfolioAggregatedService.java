package io.ventureplatform.service;

import io.ventureplatform.dto.AggregatedIndicator;
import io.ventureplatform.dto.AggregatedPortfolioData;
import io.ventureplatform.dto.ColumnConfig;
import io.ventureplatform.dto.ComponentValue;
import io.ventureplatform.dto.DataSourceReference;
import io.ventureplatform.dto.DataSourceReference.DataSourceType;
import io.ventureplatform.entity.Impact;
import io.ventureplatform.entity.ImpactIndicator;
import io.ventureplatform.entity.IndicatorQuantificationData;
import io.ventureplatform.entity.Portfolio;
import io.ventureplatform.entity.PortfolioVentureAccess;
import io.ventureplatform.entity.QuantificationData;
import io.ventureplatform.entity.Venture;
import io.ventureplatform.entity.enums.ImpactQuantificationType;
import io.ventureplatform.repository.PortfolioRepository;
import io.ventureplatform.repository.AggregatedIndicatorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.jdbc.core.JdbcTemplate;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import java.util.Set;
import java.util.TreeSet;
import java.util.HashSet;
import java.util.Collections;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PortfolioAggregatedService {

  private final PortfolioRepository portfolioRepository;
  private final AggregatedIndicatorRepository aggregatedIndicatorRepository;
  private final ObjectMapper objectMapper;
  private final JdbcTemplate jdbcTemplate;

  /**
   * Get flattened aggregated data for a portfolio
   */
  public List<AggregatedPortfolioData> getAggregatedPortfolioData(
      Long portfolioId, List<Long> ventureIds, List<String> columns) {
    Portfolio portfolio = portfolioRepository.findById(portfolioId)
        .orElseThrow(() -> new RuntimeException("Portfolio not found"));

    List<AggregatedPortfolioData> result = new ArrayList<>();

    // Get ventures for this portfolio
    Set<PortfolioVentureAccess> ventureAccess = portfolio.getVentures();

    // Process each venture
    for (PortfolioVentureAccess access : ventureAccess) {
      Venture venture = access.getVenture();

      // Skip if venture is filtered out by ventureIds
      if (ventureIds != null && !ventureIds.isEmpty() && !ventureIds.contains(venture.getId())) {
        continue;
      }

      // Skip if venture is hidden
      if (Boolean.TRUE.equals(access.getHidden())) {
        continue;
      }

      List<Impact> impacts = venture.getImpacts();

      // Process each impact chain
      for (Impact impact : impacts) {
        // Skip draft impacts
        if (Boolean.TRUE.equals(impact.getDraft())) {
          continue;
        }

        List<ImpactIndicator> indicators = impact.getIndicators();

        // Process each indicator
        for (ImpactIndicator indicator : indicators) {
          // Check quantification data availability
          int preCount = indicator.getPre() != null ? indicator.getPre().size() : 0;
          int postCount = indicator.getPost() != null ? indicator.getPost().size() : 0;
          int preActualCount = indicator.getPreActual() != null ? indicator.getPreActual().size() : 0;
          int postActualCount = indicator.getPostActual() != null ? indicator.getPostActual().size() : 0;

          // Skip indicators with no quantification data
          if (preCount == 0 && postCount == 0 && preActualCount == 0 && postActualCount == 0) {
            continue;
          }

          final AggregatedPortfolioData data = new AggregatedPortfolioData()
              // Venture data
              .setVentureId(venture.getId())
              .setVentureName(venture.getName())
              .setVentureDescription(venture.getDescription())
              .setVentureLogo(venture.getLogo())
              .setIndustries(venture.getIndustries())
              .setCountry(venture.getCountry())
              .setWebsite(venture.getWebsite())
              .setActive(venture.getActive())

              // Impact data
              .setImpactId(impact.getId())
              .setImpactName(impact.getName())
              .setStatusQuo(impact.getStatusQuo())
              .setInnovation(impact.getInnovation())
              .setStakeholders(impact.getStakeholders())
              .setChange(impact.getChange())
              .setPositive(impact.getPositive())

              // Indicator data
              .setIndicatorId(indicator.getId())
              .setIndicatorName(indicator.getName())
              .setIndicatorDescription("") // ImpactIndicator doesn't have description field
              .setUnit(indicator.getUnit())
              .setOwner("") // ImpactIndicator doesn't have owner field
              .setSortOrder(impact.getSortOrder());

          // Add quantification data
          Map<Integer, Double> forecastValues = new HashMap<>();
          Map<Integer, Double> actualValues = new HashMap<>();
          Map<Integer, Double> forecastPreValues = new HashMap<>();
          Map<Integer, Double> actualPreValues = new HashMap<>();

          // Process forecast data - store both PRE and POST values
          for (IndicatorQuantificationData quantData : indicator.getPre()) {
            forecastPreValues.put(quantData.getYear(), quantData.getValue());
          }
          for (IndicatorQuantificationData quantData : indicator.getPost()) {
            forecastValues.put(quantData.getYear(), quantData.getValue());
          }

          // Process actual data - store both PRE and POST values
          for (QuantificationData actualData : indicator.getPreActual()) {
            Double preTotal = calculateYearTotal(actualData, impact.getImpactCalculationTotal());
            if (preTotal != null) {
              actualPreValues.put(actualData.getYear(), preTotal);
            }
          }
          for (QuantificationData actualData : indicator.getPostActual()) {
            Double postTotal = calculateYearTotal(actualData, impact.getImpactCalculationTotal());
            if (postTotal != null) {  // Allow zero and negative values
              actualValues.put(actualData.getYear(), postTotal);
            }
          }

          data.setForecastValues(forecastValues);
          data.setActualValues(actualValues);
          data.setForecastPreValues(forecastPreValues);
          data.setActualPreValues(actualPreValues);

          // Calculate total score if available - simplified for now
          if (indicator.getScores() != null && !indicator.getScores().isEmpty()) {
            data.setTotalScore(5.0); // Placeholder score
          }

          // Set last updated
          data.setLastUpdated(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));

          result.add(data);
        }
      }
    }

    return result;
  }

  /**
   * Calculate year total from QuantificationData monthly fields
   * 
   * Uses the impact_calculation_total field to determine if values are annual totals
   * stored monthly (true) or actual monthly values that should be summed (false).
   */
  private Double calculateYearTotal(QuantificationData data, boolean impactCalculationTotal) {
    if (data == null) {
      return 0.0;
    }

    Double[] monthlyValues = {
      data.getJan(), data.getFeb(), data.getMar(), data.getApr(),
      data.getMay(), data.getJun(), data.getJul(), data.getAug(),
      data.getSep(), data.getOct(), data.getNov(), data.getDec()
    };
    
    if (impactCalculationTotal) {
      // It's an annual total stored monthly - just return the first non-null month's value
      for (Double value : monthlyValues) {
        if (value != null) {
          return value;
        }
      }
      return 0.0;
    } else {
      // Sum all months for actual monthly data
      double total = 0.0;
      for (Double value : monthlyValues) {
        if (value != null) {
          total += value;
        }
      }
      return total;
    }
  }

  /**
   * Get available column configurations
   */
  public Map<String, List<ColumnConfig>> getAvailableColumns() {
    return getAvailableColumns(null);
  }

  /**
   * Get available column configurations based on portfolio data
   */
  public Map<String, List<ColumnConfig>> getAvailableColumns(Long portfolioId) {
    final Map<String, List<ColumnConfig>> columns = new HashMap<>();

    // Organization columns
    List<ColumnConfig> organizationColumns = Arrays.asList(
        new ColumnConfig("ventureName", "Venture Name", "organization", "text",
            true, true, 200, "Name of the venture"),
        new ColumnConfig("ventureDescription", "Description", "organization", "text",
            false, true, 300, "Venture description"),
        new ColumnConfig("ventureLogo", "Logo", "organization", "image",
            false, true, 80, "Venture logo"),
        new ColumnConfig("industries", "Industries", "organization", "text",
            false, true, 150, "Industry sectors"),
        new ColumnConfig("country", "Country", "organization", "text",
            false, true, 120, "Country of operation"),
        new ColumnConfig("website", "Website", "organization", "url",
            false, true, 150, "Company website"),
        new ColumnConfig("active", "Active", "organization", "boolean",
            false, true, 80, "Whether venture is active")
    );
    columns.put("organization", organizationColumns);

    // Impact Chain columns
    List<ColumnConfig> impactColumns = Arrays.asList(
        new ColumnConfig("impactName", "Impact Chain", "impactChain", "text",
            true, true, 200, "Name of the impact chain"),
        new ColumnConfig("statusQuo", "Status Quo", "impactChain", "text",
            false, true, 250, "Current state description"),
        new ColumnConfig("innovation", "Innovation", "impactChain", "text",
            false, true, 250, "Innovation description"),
        new ColumnConfig("stakeholders", "Stakeholders", "impactChain", "text",
            false, true, 200, "Key stakeholders"),
        new ColumnConfig("change", "Change", "impactChain", "text",
            false, true, 250, "Expected change"),
        new ColumnConfig("positive", "Positive Impact", "impactChain", "boolean",
            false, true, 120, "Whether impact is positive")
    );
    columns.put("impactChain", impactColumns);

    // Indicator columns
    List<ColumnConfig> indicatorColumns = Arrays.asList(
        new ColumnConfig("indicatorName", "Indicator", "indicator", "text",
            true, true, 200, "Name of the indicator"),
        new ColumnConfig("indicatorDescription", "Description", "indicator", "text",
            false, true, 300, "Indicator description"),
        new ColumnConfig("unit", "Unit", "indicator", "text",
            true, true, 100, "Unit of measurement"),
        new ColumnConfig("owner", "Owner", "indicator", "text",
            false, true, 150, "Indicator owner"),
        new ColumnConfig("totalScore", "Score", "indicator", "number",
            false, true, 100, "Total indicator score"),
        new ColumnConfig("lastUpdated", "Last Updated", "indicator", "datetime",
            false, true, 150, "Last update timestamp")
    );
    columns.put("indicator", indicatorColumns);

    // Values columns - dynamically add year-specific columns based on available data
    List<ColumnConfig> valuesColumns = new ArrayList<>();
    Set<Integer> availableYears = new TreeSet<>();

    // If portfolioId is provided, get actual years from data
    if (portfolioId != null) {
      List<AggregatedPortfolioData> data = getAggregatedPortfolioData(portfolioId, null, null);
      for (AggregatedPortfolioData item : data) {
        availableYears.addAll(item.getActualValues().keySet());
        availableYears.addAll(item.getForecastValues().keySet());
      }
    }

    // If no data or no portfolioId, use default years
    if (availableYears.isEmpty()) {
      int currentYear = LocalDateTime.now().getYear();
      // Add last 3 years and next 2 years as defaults
      for (int i = -3; i <= 2; i++) {
        availableYears.add(currentYear + i);
      }
    }

    // Add columns for each year - group actual and forecast together by year
    for (Integer year : availableYears) {
      valuesColumns.add(new ColumnConfig("actual" + year, year + " Actual", "values", "number",
          true, true, 120, "Actual value for " + year));
      valuesColumns.add(new ColumnConfig("forecast" + year, year + " Forecast", "values", "number",
          true, true, 120, "Forecast value for " + year));
    }

    columns.put("values", valuesColumns);

    return columns;
  }

  /**
   * Get unique indicator names available for aggregation from selected ventures
   */
  public List<String> getAvailableIndicatorNames(Long portfolioId, List<Long> ventureIds) {
    Portfolio portfolio = portfolioRepository.findById(portfolioId)
        .orElseThrow(() -> new RuntimeException("Portfolio not found"));

    Set<String> indicatorNames = new HashSet<>();
    Set<PortfolioVentureAccess> ventureAccess = portfolio.getVentures();

    // Process each venture
    for (PortfolioVentureAccess access : ventureAccess) {
      Venture venture = access.getVenture();

      // Skip if venture is filtered out by ventureIds
      if (ventureIds != null && !ventureIds.isEmpty() && !ventureIds.contains(venture.getId())) {
        continue;
      }

      // Skip if venture is hidden
      if (Boolean.TRUE.equals(access.getHidden())) {
        continue;
      }

      List<Impact> impacts = venture.getImpacts();

      // Process each impact chain
      for (Impact impact : impacts) {
        // Skip draft impacts
        if (Boolean.TRUE.equals(impact.getDraft())) {
          continue;
        }

        List<ImpactIndicator> indicators = impact.getIndicators();

        // Process each indicator
        for (ImpactIndicator indicator : indicators) {
          // Check if indicator has any quantification data
          int preCount = indicator.getPre() != null ? indicator.getPre().size() : 0;
          int postCount = indicator.getPost() != null ? indicator.getPost().size() : 0;
          int preActualCount = indicator.getPreActual() != null ? indicator.getPreActual().size() : 0;
          int postActualCount = indicator.getPostActual() != null ? indicator.getPostActual().size() : 0;

          if (preCount > 0 || postCount > 0 || preActualCount > 0 || postActualCount > 0) {
            indicatorNames.add(indicator.getName());
          }
        }
      }
    }

    List<String> result = new ArrayList<>(indicatorNames);
    Collections.sort(result); // Sort alphabetically for better UX

    return result;
  }

  /**
   * Calculate aggregated values for multiple time periods based on configuration
   * @deprecated Use calculateAggregatedValuesNew instead
   */
  @Deprecated
  public void calculateAggregatedValues(AggregatedIndicator config, List<AggregatedPortfolioData> data) {
    // Calculate values for each time period
    List<String> periodsToCalculate = Arrays.asList(config.getTimePeriod());
    if (periodsToCalculate == null || periodsToCalculate.isEmpty()) {
      // Fallback to single timePeriod for backward compatibility
      if (config.getTimePeriod() != null) {
        periodsToCalculate = Arrays.asList(config.getTimePeriod());
      } else {
        periodsToCalculate = Arrays.asList("current");
      }
    }

    Map<String, Double> calculatedValues = new HashMap<>();
    Double primaryValue = null;

    for (String timePeriod : periodsToCalculate) {
      Double value = calculateSingleTimePeriodValue(config, data, timePeriod);
      calculatedValues.put(timePeriod, value);

      // Use first calculated value as primary value
      if (primaryValue == null) {
        primaryValue = value;
      }
    }

    config.setCalculatedValues(calculatedValues);
    config.setCalculatedValue(primaryValue);
  }

  /**
   * Calculate aggregated value for a single time period
   */
  private Double calculateSingleTimePeriodValue(AggregatedIndicator config, List<AggregatedPortfolioData> data, String timePeriod) {
    // Filter data based on config with null safety
    List<AggregatedPortfolioData> filteredData = data.stream()
        .filter(d -> config.getVentureIds() == null || config.getVentureIds().isEmpty()
            || config.getVentureIds().contains(d.getVentureId()))
        // TODO: Update to use dataSources instead of indicatorNames
        // .filter(d -> config.getIndicatorNames() == null || config.getIndicatorNames().isEmpty()
        //     || config.getIndicatorNames().contains(d.getIndicatorName()))
        .collect(Collectors.toList());

    if (filteredData.isEmpty()) {
      return 0.0;
    }

    // Get values based on data type and selected years for this specific time period
    List<Double> values = new ArrayList<>();
    List<Integer> yearsToUse = convertTimePeriodToYears(timePeriod);

    for (AggregatedPortfolioData item : filteredData) {
      for (Integer year : yearsToUse) {
        Double value = null;

        // TODO: Update to use new data source approach
        // For now, use simplified logic - try actual first, then forecast
        Double postValue = item.getActualValues().get(year);

        if (postValue == null) {
          postValue = item.getForecastValues().get(year);
        }

        value = postValue;

        // Only add non-null values
        if (value != null) {
          values.add(value);
        }
      }
    }

    if (values.isEmpty()) {
      return 0.0;
    }

    // Apply aggregation
    Double result;
    switch (config.getAggregationType()) {
      case SUM:
        result = values.stream().mapToDouble(Double::doubleValue).sum();
        break;
      case AVERAGE:
        result = values.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
        break;
      default:
        result = 0.0;
        break;
    }

    return result;
  }

  /**
   * Convert time period string to list of years
   */
  private List<Integer> convertTimePeriodToYears(String timePeriod) {
    int currentYear = LocalDateTime.now().getYear();

    switch (timePeriod) {
      // New time periods
      case "ytd":
      case "mtd":
      case "today":
        // These all use current year as base for calculation
        return Arrays.asList(currentYear);
        
      case "currentYearFull":
        return Arrays.asList(currentYear);
        
      case "lastYearFull":
        return Arrays.asList(currentYear - 1);
        
      case "last5Years":
        return Arrays.asList(currentYear - 4, currentYear - 3, currentYear - 2, currentYear - 1, currentYear);
        
      case "sinceInception":
        // Use last 10 years as approximation for "since inception"
        List<Integer> inceptionYears = new ArrayList<>();
        for (int i = 9; i >= 0; i--) {
          inceptionYears.add(currentYear - i);
        }
        return inceptionYears;
        
        
      default:
        // Try to parse as a specific year
        try {
          int year = Integer.parseInt(timePeriod);
          return Arrays.asList(year);
        } catch (NumberFormatException e) {
          return Arrays.asList(currentYear);
        }
    }
  }

  /**
   * Get available data sources for aggregation
   */
  public Map<String, List<DataSourceReference>> getAvailableDataSources(Long portfolioId, List<Long> ventureIds) {
    Map<String, List<DataSourceReference>> result = new HashMap<>();
    List<DataSourceReference> products = new ArrayList<>();
    List<DataSourceReference> stakeholders = new ArrayList<>();
    List<DataSourceReference> indicators = new ArrayList<>();

    Portfolio portfolio = portfolioRepository.findById(portfolioId)
        .orElseThrow(() -> new RuntimeException("Portfolio not found"));

    for (PortfolioVentureAccess access : portfolio.getVentures()) {
      Venture venture = access.getVenture();

      // Apply filters
      if (ventureIds != null && !ventureIds.isEmpty() && !ventureIds.contains(venture.getId())) {
        continue;
      }
      if (Boolean.TRUE.equals(access.getHidden())) {
        continue;
      }

      for (Impact impact : venture.getImpacts()) {
        if (Boolean.TRUE.equals(impact.getDraft())) {
          continue;
        }

        // 1. PRODUCTS - Use outputUnits field
        String productName = impact.getOutputUnits() != null && !impact.getOutputUnits().isEmpty()
            ? impact.getOutputUnits()
            : "Products/Services/Activities - " + impact.getName();

        products.add(new DataSourceReference()
            .setType(DataSourceType.PRODUCT)
            .setVentureId(venture.getId())
            .setImpactId(impact.getId())
            .setImpactName(impact.getName())
            .setSourceName(productName)
        );

        // 2. STAKEHOLDERS - Use "Number of stakeholders - " + stakeholders field
        if (impact.getStakeholders() != null && !impact.getStakeholders().isEmpty()) {
          stakeholders.add(new DataSourceReference()
              .setType(DataSourceType.STAKEHOLDER)
              .setVentureId(venture.getId())
              .setImpactId(impact.getId())
              .setImpactName(impact.getName())
              .setSourceName("Number of stakeholders - " + impact.getStakeholders())
          );
        }

        // 3. INDICATORS - Use indicator name field
        for (ImpactIndicator indicator : impact.getIndicators()) {
          if (hasQuantificationData(indicator)) {
            indicators.add(new DataSourceReference()
                .setType(DataSourceType.INDICATOR)
                .setVentureId(venture.getId())
                .setImpactId(impact.getId())
                .setImpactName(impact.getName())
                .setIndicatorId(indicator.getId())
                .setSourceName(indicator.getName())
                .setQuantificationType(indicator.getQuantificationType())
            );
          }
        }
      }
    }

    result.put("products", products);
    result.put("stakeholders", stakeholders);
    result.put("indicators", indicators);

    return result;
  }

  /**
   * Calculate outcome for any data source
   */
  private ComponentValue calculateOutcomeForSource(
      DataSourceReference source,
      List<Integer> years,
      Map<Long, Impact> impactCache
  ) {
    Impact impact = impactCache.get(source.getImpactId());
    Double totalValue = 0.0;

    switch (source.getType()) {
      case PRODUCT:
        // Sum all products data for specified years (FORECAST ONLY)
        for (QuantificationData data : impact.getProductsData()) {
          if (years.contains(data.getYear())) {
            totalValue += calculateYearTotal(data, impact.getImpactCalculationTotal());
          }
        }
        break;

      case STAKEHOLDER:
        // Sum all stakeholders data for specified years (FORECAST ONLY)
        for (QuantificationData data : impact.getStakeholdersData()) {
          if (years.contains(data.getYear())) {
            totalValue += calculateYearTotal(data, impact.getImpactCalculationTotal());
          }
        }
        break;

      case INDICATOR:
        // Calculate net outcome for indicator
        ImpactIndicator indicator = impact.getIndicators().stream()
            .filter(ind -> ind.getId().equals(source.getIndicatorId()))
            .findFirst()
            .orElseThrow();
        totalValue = calculateIndicatorNetOutcome(impact, indicator, years);
        break;

      case COMPANY_EXTRACTOR:
        // Calculate metrics from company extraction data
        Long portfolioId = source.getVentureId(); // Using ventureId to store portfolioId for this case
        totalValue = calculateCompanyExtractorMetric(portfolioId, source.getSourceName());
        break;

      default:
        // Handle unexpected data source types
        throw new IllegalArgumentException("Unsupported data source type: " + source.getType());
    }

    return new ComponentValue(
        source.getSourceName(),
        totalValue,
        source.getVentureId(),
        source.getImpactId(),
        source.getType().toString()
    );
  }

  /**
   * Calculate metrics from company extraction data
   */
  private Double calculateCompanyExtractorMetric(Long portfolioId, String metric) {
    try {
      switch (metric) {
        case "total_companies":
          return jdbcTemplate.queryForObject(
              "SELECT COUNT(DISTINCT ced.id) FROM company_extraction_data ced " +
              "JOIN portfolio_company_extraction_access pcea ON ced.id = pcea.company_extraction_data_id " +
              "WHERE pcea.portfolio_id = ?",
              Double.class, portfolioId);
        
        case "total_employees":
          // Sum all employee numbers, handling various formats
          return jdbcTemplate.queryForObject(
              "SELECT COALESCE(SUM(CAST(NULLIF(REGEXP_REPLACE(ced.number_of_employees, '[^0-9]', '', 'g'), '') AS numeric)), 0) " +
              "FROM company_extraction_data ced " +
              "JOIN portfolio_company_extraction_access pcea ON ced.id = pcea.company_extraction_data_id " +
              "WHERE pcea.portfolio_id = ? AND ced.number_of_employees IS NOT NULL",
              Double.class, portfolioId);
        
        case "total_patents":
          return jdbcTemplate.queryForObject(
              "SELECT COALESCE(SUM(ced.total_patents), 0) " +
              "FROM company_extraction_data ced " +
              "JOIN portfolio_company_extraction_access pcea ON ced.id = pcea.company_extraction_data_id " +
              "WHERE pcea.portfolio_id = ? AND ced.total_patents IS NOT NULL",
              Double.class, portfolioId);
        
        case "total_sales_ytd":
          // Get sales for current year
          int currentYear = LocalDate.now().getYear();
          String columnName = "annual_sales_" + currentYear;
          return jdbcTemplate.queryForObject(
              "SELECT COALESCE(SUM(CAST(NULLIF(REGEXP_REPLACE(ced." + columnName + ", '[^0-9.]', '', 'g'), '') AS numeric)), 0) " +
              "FROM company_extraction_data ced " +
              "JOIN portfolio_company_extraction_access pcea ON ced.id = pcea.company_extraction_data_id " +
              "WHERE pcea.portfolio_id = ? AND ced." + columnName + " IS NOT NULL",
              Double.class, portfolioId);
        
        case "social_media_followers_total":
          // Sum all followers across all platforms from JSON
          return jdbcTemplate.queryForObject(
              "SELECT COALESCE(SUM(" +
              "  COALESCE(CAST(ced.social_media_follower_counts->>'twitter' AS numeric), 0) + " +
              "  COALESCE(CAST(ced.social_media_follower_counts->>'facebook' AS numeric), 0) + " +
              "  COALESCE(CAST(ced.social_media_follower_counts->>'linkedin' AS numeric), 0) + " +
              "  COALESCE(CAST(ced.social_media_follower_counts->>'instagram' AS numeric), 0) + " +
              "  COALESCE(CAST(ced.social_media_follower_counts->>'youtube' AS numeric), 0) + " +
              "  COALESCE(CAST(ced.social_media_follower_counts->>'tiktok' AS numeric), 0) + " +
              "  COALESCE(CAST(ced.social_media_follower_counts->>'bluesky' AS numeric), 0)" +
              "), 0) FROM company_extraction_data ced " +
              "JOIN portfolio_company_extraction_access pcea ON ced.id = pcea.company_extraction_data_id " +
              "WHERE pcea.portfolio_id = ?",
              Double.class, portfolioId);
              
        default:
          return 0.0;
      }
    } catch (Exception e) {
      // Log error and return 0 as fallback
      e.printStackTrace();
      return 0.0;
    }
  }

  /**
   * Port JavaScript Net Outcome Calculation
   */
  private Double calculateIndicatorNetOutcome(Impact impact, ImpactIndicator indicator, List<Integer> years) {
    // Determine base data source based on quantificationType
    List<QuantificationData> baseData = indicator.getQuantificationType() == ImpactQuantificationType.PER_STAKEHOLDER
        && !"Global community".equals(impact.getStakeholders())
        ? impact.getStakeholdersData()
        : impact.getProductsData();

    Double totalNetOutcome = 0.0;

    for (Integer year : years) {
      // Find data for this year
      QuantificationData yearData = baseData.stream()
          .filter(d -> d.getYear().equals(year))
          .findFirst()
          .orElse(null);

      if (yearData == null) {
        continue;
      }

      // Get PRE and POST values for this year
      Double preValue = indicator.getPre().stream()
          .filter(d -> d.getYear().equals(year))
          .map(IndicatorQuantificationData::getValue)
          .findFirst()
          .orElse(0.0);

      Double postValue = indicator.getPost().stream()
          .filter(d -> d.getYear().equals(year))
          .map(IndicatorQuantificationData::getValue)
          .findFirst()
          .orElse(0.0);

      // Calculate base outcome
      Double yearTotal = calculateYearTotal(yearData, impact.getImpactCalculationTotal());
      Double yearOutcome = yearTotal * Math.abs(postValue - preValue);

      // Apply counterfactuals
      Double deadweight = indicator.getDeadweight() != null ? indicator.getDeadweight() : 0.0;
      Double displacement = indicator.getDisplacement() != null ? indicator.getDisplacement() : 0.0;
      Double attribution = indicator.getAttribution() != null ? indicator.getAttribution() : 0.0;
      Double counterfactuals = deadweight + displacement + attribution;

      Double netOutcome = yearOutcome * (100 - counterfactuals) / 100;

      // TODO: Add duration and dropoff calculations if needed

      totalNetOutcome += netOutcome;
    }

    return totalNetOutcome;
  }

  /**
   * New calculation method using data sources
   */
  public void calculateAggregatedValuesNew(AggregatedIndicator config, List<AggregatedPortfolioData> data) {
    // Build impact cache for performance
    Map<Long, Impact> impactCache = buildImpactCache(config.getVentureIds());

    Map<String, Double> calculatedValues = new HashMap<>();
    Map<String, List<ComponentValue>> componentBreakdowns = new HashMap<>();

    // Handle empty time period
    if (config.getTimePeriod() == null || config.getTimePeriod().isEmpty()) {
      config.setTimePeriod("ytd"); // Default to YTD instead of current
    }

    // Process single time period
    String timePeriod = config.getTimePeriod();
    List<Integer> years = convertTimePeriodToYears(timePeriod);
    List<ComponentValue> components = new ArrayList<>();

    // Calculate value for each data source
    if (config.getDataSources() != null) {
      for (DataSourceReference source : config.getDataSources()) {
        ComponentValue component = calculateOutcomeForSource(source, years, impactCache);
        components.add(component);
      }
    }

    // Aggregate based on type
    Double totalValue = 0.0;
    if (config.getAggregationType() == AggregatedIndicator.AggregationType.SUM) {
      totalValue = components.stream()
          .mapToDouble(ComponentValue::getValue)
          .sum();
    } else if (config.getAggregationType() == AggregatedIndicator.AggregationType.AVERAGE) {
      totalValue = components.stream()
          .mapToDouble(ComponentValue::getValue)
          .average()
          .orElse(0.0);
    }

    // Apply proration for YTD/MTD/Today
    if ("ytd".equals(timePeriod) || "mtd".equals(timePeriod) || "today".equals(timePeriod)) {
      totalValue = applyProration(totalValue, timePeriod);
    }

    calculatedValues.put(timePeriod, totalValue);
    componentBreakdowns.put(timePeriod, components);

    config.setCalculatedValues(calculatedValues);
    config.setComponentBreakdowns(componentBreakdowns);
    config.setCalculatedValue(calculatedValues.get(config.getTimePeriod())); // Primary value
  }

  /**
   * Apply time-based proration for YTD/MTD/Today calculations
   */
  private Double applyProration(Double annualValue, String timePeriod) {
    if (annualValue == null || annualValue == 0) {
      return 0.0;
    }
    
    LocalDate now = LocalDate.now();
    
    switch (timePeriod) {
      case "ytd":
        // Year to Date: prorated by days elapsed in year
        int dayOfYear = now.getDayOfYear();
        int daysInYear = now.lengthOfYear();
        return (annualValue / daysInYear) * dayOfYear;
        
      case "mtd":
        // Month to Date: prorated by days elapsed in month
        int dayOfMonth = now.getDayOfMonth();
        int daysInMonth = now.lengthOfMonth();
        Double monthlyPortion = annualValue / 12.0;
        return (monthlyPortion / daysInMonth) * dayOfMonth;
        
      case "today":
        // Today: daily rate
        return annualValue / now.lengthOfYear();
        
      default:
        return annualValue;
    }
  }

  /**
   * Build impact cache for performance
   */
  private Map<Long, Impact> buildImpactCache(List<Long> ventureIds) {
    Map<Long, Impact> impactCache = new HashMap<>();

    // Get all portfolios (this is not ideal, but works for now)
    // In production, you'd want a more efficient query
    List<Portfolio> portfolios = portfolioRepository.findAll();
    
    for (Portfolio portfolio : portfolios) {
      for (PortfolioVentureAccess access : portfolio.getVentures()) {
        Venture venture = access.getVenture();
        
        // Filter by venture IDs if provided
        if (ventureIds != null && !ventureIds.isEmpty() && !ventureIds.contains(venture.getId())) {
          continue;
        }
        
        // Add all impacts to cache
        for (Impact impact : venture.getImpacts()) {
          impactCache.put(impact.getId(), impact);
        }
      }
    }

    return impactCache;
  }

  /**
   * Check if indicator has any quantification data
   */
  private boolean hasQuantificationData(ImpactIndicator indicator) {
    int preCount = indicator.getPre() != null ? indicator.getPre().size() : 0;
    int postCount = indicator.getPost() != null ? indicator.getPost().size() : 0;
    int preActualCount = indicator.getPreActual() != null ? indicator.getPreActual().size() : 0;
    int postActualCount = indicator.getPostActual() != null ? indicator.getPostActual().size() : 0;

    return preCount > 0 || postCount > 0 || preActualCount > 0 || postActualCount > 0;
  }

  /**
   * Save an aggregated indicator to the database
   */
  public io.ventureplatform.entity.AggregatedIndicator saveAggregatedIndicator(
      Long portfolioId, AggregatedIndicator dto) {
    
    // Convert DTO to entity
    io.ventureplatform.entity.AggregatedIndicator entity = new io.ventureplatform.entity.AggregatedIndicator();
    
    // Basic fields
    entity.setName(dto.getName());
    entity.setNameSlovak(dto.getNameSlovak());
    entity.setCategory(dto.getCategory());
    entity.setUnit(dto.getUnit());
    entity.setUnitSlovak(dto.getUnitSlovak());
    entity.setDescription(dto.getDescription());
    entity.setPortfolioId(portfolioId);
    entity.setAggregationType(dto.getAggregationType());
    entity.setCalculatedValue(dto.getCalculatedValue());
    
    // Time period - single selection
    if (dto.getTimePeriod() != null) {
      entity.setTimePeriod(dto.getTimePeriod());
    }

    // Time period labels
    entity.setTimePeriodEnglish(dto.getTimePeriodEnglish());
    entity.setTimePeriodSlovak(dto.getTimePeriodSlovak());
    
    // Slovak translations
    entity.setNameSlovak(dto.getNameSlovak());
    entity.setTimePeriodSlovak(dto.getTimePeriodSlovak());
    
    // Selected year - single year
    if (dto.getSelectedYears() != null && !dto.getSelectedYears().isEmpty()) {
      entity.setSelectedYear(dto.getSelectedYears().get(0));
    }
    
    // JSON fields
    try {
      if (dto.getDataSources() != null) {
        entity.setDataSourcesJson(objectMapper.writeValueAsString(dto.getDataSources()));
      }
      if (dto.getVentureIds() != null) {
        entity.setVentureIdsJson(objectMapper.writeValueAsString(dto.getVentureIds()));
      }
      if (dto.getComponentBreakdowns() != null && !dto.getComponentBreakdowns().isEmpty()) {
        // Get components for the primary time period
        String primaryPeriod = entity.getTimePeriod();
        if (primaryPeriod != null && dto.getComponentBreakdowns().containsKey(primaryPeriod)) {
          entity.setComponentBreakdownJson(
              objectMapper.writeValueAsString(dto.getComponentBreakdowns().get(primaryPeriod)));
        }
      }
    } catch (JsonProcessingException e) {
      throw new RuntimeException("Failed to serialize JSON", e);
    }
    
    // Set display order
    Integer maxOrder = aggregatedIndicatorRepository.findMaxDisplayOrder(portfolioId);
    entity.setDisplayOrder(maxOrder + 1);
    
    // Handle parent-child relationship based on indicatorType
    String indicatorType = dto.getIndicatorType();
    if ("hover".equals(indicatorType)) {
      entity.setIsMain(false);
      
      // Set parent indicator
      Long parentId = dto.getParentIndicatorId();
      if (parentId != null) {
        io.ventureplatform.entity.AggregatedIndicator parent = 
            aggregatedIndicatorRepository.findById(parentId)
                .orElseThrow(() -> new RuntimeException("Parent indicator not found"));
        entity.setParentIndicator(parent);
      }
      
      // Set hover slot
      Integer hoverSlot = dto.getHoverSlot();
      entity.setHoverSlot(hoverSlot != null ? hoverSlot : 1);
    } else {
      // Default to main indicator
      entity.setIsMain(true);
    }
    
    // Set number formatting options
    entity.setDecimalPlaces(dto.getDecimalPlaces() != null ? dto.getDecimalPlaces() : 0);
    entity.setNumberFormat(dto.getNumberFormat() != null ? dto.getNumberFormat() : "EU");
    
    // Set continuous counter flag
    entity.setContinuousCounter(dto.getContinuousCounter() != null ? dto.getContinuousCounter() : false);
    
    return aggregatedIndicatorRepository.save(entity);
  }

  /**
   * Get all aggregated indicators for a portfolio
   */
  public List<AggregatedIndicator> getAggregatedIndicators(Long portfolioId) {
    List<io.ventureplatform.entity.AggregatedIndicator> entities = 
        aggregatedIndicatorRepository.findByPortfolioIdOrderByDisplayOrder(portfolioId);
    
    return entities.stream()
        .map(this::convertEntityToDto)
        .collect(Collectors.toList());
  }
  
  /**
   * Get only main aggregated indicators for a portfolio
   */
  public List<AggregatedIndicator> getMainAggregatedIndicators(Long portfolioId) {
    List<io.ventureplatform.entity.AggregatedIndicator> entities = 
        aggregatedIndicatorRepository.findByPortfolioIdAndIsMainTrueOrderByDisplayOrder(portfolioId);
    
    return entities.stream()
        .map(this::convertEntityToDto)
        .collect(Collectors.toList());
  }

  /**
   * Get single aggregated indicator by ID
   */
  public AggregatedIndicator getAggregatedIndicatorById(Long portfolioId, Long indicatorId) {
    io.ventureplatform.entity.AggregatedIndicator entity = 
        aggregatedIndicatorRepository.findByPortfolioIdAndId(portfolioId, indicatorId)
            .orElseThrow(() -> new RuntimeException("Aggregated indicator not found"));
    
    return convertEntityToDto(entity);
  }
  
  /**
   * Update an aggregated indicator
   */
  public AggregatedIndicator updateAggregatedIndicator(Long portfolioId, Long indicatorId, AggregatedIndicator dto) {
    io.ventureplatform.entity.AggregatedIndicator entity =
        aggregatedIndicatorRepository.findByPortfolioIdAndId(portfolioId, indicatorId)
            .orElseThrow(() -> new RuntimeException("Aggregated indicator not found"));

    // Update basic fields
    entity.setName(dto.getName());
    entity.setNameSlovak(dto.getNameSlovak());
    entity.setCategory(dto.getCategory());
    entity.setUnit(dto.getUnit());
    entity.setUnitSlovak(dto.getUnitSlovak());
    entity.setDescription(dto.getDescription());
    entity.setAggregationType(dto.getAggregationType());
    entity.setCalculatedValue(dto.getCalculatedValue());
    entity.setTimePeriodEnglish(dto.getTimePeriodEnglish());
    entity.setTimePeriodSlovak(dto.getTimePeriodSlovak());

    // Update time period
    if (dto.getTimePeriod() != null) {
      entity.setTimePeriod(dto.getTimePeriod());
    }

    // Update selected year
    if (dto.getSelectedYears() != null && !dto.getSelectedYears().isEmpty()) {
      entity.setSelectedYear(dto.getSelectedYears().get(0));
    }

    // Handle indicator type and hover slot changes
    String indicatorType = dto.getIndicatorType();
    if (indicatorType != null) {
      if ("hover".equals(indicatorType)) {
        entity.setIsMain(false);

        // Set parent indicator
        Long parentId = dto.getParentIndicatorId();
        if (parentId != null) {
          io.ventureplatform.entity.AggregatedIndicator parent =
              aggregatedIndicatorRepository.findById(parentId)
                  .orElseThrow(() -> new RuntimeException("Parent indicator not found"));
          entity.setParentIndicator(parent);
        }

        // Set hover slot
        Integer hoverSlot = dto.getHoverSlot();
        entity.setHoverSlot(hoverSlot != null ? hoverSlot : 1);
      } else {
        // Converting to main indicator
        entity.setIsMain(true);
        entity.setParentIndicator(null);
        entity.setHoverSlot(null);
      }
    }
    
    // Update JSON fields
    try {
      if (dto.getDataSources() != null) {
        entity.setDataSourcesJson(objectMapper.writeValueAsString(dto.getDataSources()));
      }
      if (dto.getVentureIds() != null) {
        entity.setVentureIdsJson(objectMapper.writeValueAsString(dto.getVentureIds()));
      }
      if (dto.getComponentBreakdowns() != null && !dto.getComponentBreakdowns().isEmpty()) {
        String primaryPeriod = entity.getTimePeriod();
        if (primaryPeriod != null && dto.getComponentBreakdowns().containsKey(primaryPeriod)) {
          entity.setComponentBreakdownJson(
              objectMapper.writeValueAsString(dto.getComponentBreakdowns().get(primaryPeriod)));
        }
      }
    } catch (JsonProcessingException e) {
      throw new RuntimeException("Failed to serialize JSON", e);
    }
    
    // Update number formatting options
    entity.setDecimalPlaces(dto.getDecimalPlaces() != null ? dto.getDecimalPlaces() : 0);
    entity.setNumberFormat(dto.getNumberFormat() != null ? dto.getNumberFormat() : "EU");
    
    // Update continuous counter flag
    entity.setContinuousCounter(dto.getContinuousCounter() != null ? dto.getContinuousCounter() : false);
    
    // Save and return
    io.ventureplatform.entity.AggregatedIndicator saved = aggregatedIndicatorRepository.save(entity);
    return convertEntityToDto(saved);
  }
  
  /**
   * Delete an aggregated indicator
   */
  public void deleteAggregatedIndicator(Long portfolioId, Long indicatorId) {
    io.ventureplatform.entity.AggregatedIndicator entity =
        aggregatedIndicatorRepository.findByPortfolioIdAndId(portfolioId, indicatorId)
            .orElseThrow(() -> new RuntimeException("Aggregated indicator not found"));

    // If this is a main indicator, delete all its hover indicators first
    if (Boolean.TRUE.equals(entity.getIsMain())) {
      List<io.ventureplatform.entity.AggregatedIndicator> hoverIndicators =
          aggregatedIndicatorRepository.findByParentIndicatorIdOrderByHoverSlot(indicatorId);
      aggregatedIndicatorRepository.deleteAll(hoverIndicators);
    }

    // Delete the indicator
    aggregatedIndicatorRepository.delete(entity);
  }

  /**
   * Update display order for main indicators (for reordering functionality)
   */
  public void updateDisplayOrder(Long portfolioId, List<Map<String, Object>> orderUpdates) {
    for (Map<String, Object> update : orderUpdates) {
      Long indicatorId = ((Number) update.get("id")).longValue();
      Integer displayOrder = ((Number) update.get("displayOrder")).intValue();

      io.ventureplatform.entity.AggregatedIndicator entity =
          aggregatedIndicatorRepository.findByPortfolioIdAndId(portfolioId, indicatorId)
              .orElseThrow(() -> new RuntimeException("Aggregated indicator not found"));

      entity.setDisplayOrder(displayOrder);
      aggregatedIndicatorRepository.save(entity);
    }
  }

  /**
   * Recalculate aggregated indicators that use data from a specific venture
   */
  public int recalculateIndicatorsForVenture(Long portfolioId, Long ventureId) {
    // Get all aggregated indicators for this portfolio
    List<io.ventureplatform.entity.AggregatedIndicator> entities = 
        aggregatedIndicatorRepository.findByPortfolioIdOrderByDisplayOrder(portfolioId);
    
    int updatedCount = 0;
    
    for (io.ventureplatform.entity.AggregatedIndicator entity : entities) {
      // Check if this indicator uses the updated venture
      List<Long> ventureIds = parseVentureIds(entity.getVentureIdsJson());
      
      if (ventureIds != null && ventureIds.contains(ventureId)) {
        // Convert to DTO
        AggregatedIndicator dto = convertEntityToDto(entity);
        
        // Get fresh data
        List<AggregatedPortfolioData> data = getAggregatedPortfolioData(
            portfolioId, 
            dto.getVentureIds(), 
            null
        );
        
        // Recalculate
        calculateAggregatedValuesNew(dto, data);
        
        // Update only the calculated value
        entity.setCalculatedValue(dto.getCalculatedValue());
        aggregatedIndicatorRepository.save(entity);
        
        updatedCount++;
      }
    }
    
    return updatedCount;
  }
  
  /**
   * Recalculate aggregated indicators for all portfolios that contain a specific venture
   */
  public int recalculateIndicatorsForAllPortfoliosContainingVenture(Long ventureId) {
    // Find all portfolios that contain this venture
    List<Portfolio> portfolios = portfolioRepository.findAll();
    int totalUpdated = 0;
    
    for (Portfolio portfolio : portfolios) {
      // Check if this portfolio contains the venture
      boolean containsVenture = portfolio.getVentures().stream()
          .anyMatch(pva -> pva.getVenture().getId().equals(ventureId) && 
                          !Boolean.TRUE.equals(pva.getHidden()));
      
      if (containsVenture) {
        // Recalculate indicators for this portfolio
        totalUpdated += recalculateIndicatorsForVenture(portfolio.getId(), ventureId);
      }
    }
    
    return totalUpdated;
  }
  
  /**
   * Helper method to parse venture IDs from JSON
   */
  private List<Long> parseVentureIds(String ventureIdsJson) {
    if (ventureIdsJson == null || ventureIdsJson.isEmpty()) {
      return new ArrayList<>();
    }
    try {
      return objectMapper.readValue(ventureIdsJson, 
          new TypeReference<List<Long>>() {});
    } catch (Exception e) {
      return new ArrayList<>();
    }
  }
  
  /**
   * Recalculate prorated value in real-time for daily updates
   * This ensures YTD, MTD, and "today" values are always current
   */
  public Double recalculateProratedValue(Long portfolioId, AggregatedIndicator indicator) {
    try {
      // Get fresh portfolio data
      List<AggregatedPortfolioData> data = getAggregatedPortfolioData(
          portfolioId, 
          indicator.getVentureIds(), 
          null
      );
      
      // Create a copy to avoid modifying the original
      AggregatedIndicator tempIndicator = new AggregatedIndicator();
      tempIndicator.setTimePeriod(indicator.getTimePeriod());
      tempIndicator.setDataSources(indicator.getDataSources());
      tempIndicator.setVentureIds(indicator.getVentureIds());
      tempIndicator.setAggregationType(indicator.getAggregationType());
      
      // Recalculate using existing logic
      calculateAggregatedValuesNew(tempIndicator, data);
      
      return tempIndicator.getCalculatedValue();
    } catch (Exception e) {
      // Log error and return stored value as fallback
      e.printStackTrace();
      return indicator.getCalculatedValue();
    }
  }
  
  /**
   * Build continuous counter data for public API
   */
  public Map<String, Object> buildContinuousCounterData(Long portfolioId, AggregatedIndicator indicator) {
    Map<String, Object> data = new HashMap<>();
    
    try {
      LocalDate now = LocalDate.now();
      Double totalExpectedValue;
      Double currentValue = indicator.getCalculatedValue();
      int totalDays;
      int elapsedDays;
      
      if ("sinceInception".equals(indicator.getTimePeriod())) {
        // For sinceInception, calculate based on average yearly growth
        // Get all years of data to calculate total and average yearly value
        List<AggregatedPortfolioData> portfolioData = getAggregatedPortfolioData(
            portfolioId, 
            indicator.getVentureIds(), 
            null
        );
        
        // Calculate total across all years
        AggregatedIndicator totalIndicator = new AggregatedIndicator();
        totalIndicator.setTimePeriod("sinceInception");
        totalIndicator.setDataSources(indicator.getDataSources());
        totalIndicator.setVentureIds(indicator.getVentureIds());
        totalIndicator.setAggregationType(indicator.getAggregationType());
        
        calculateAggregatedValuesNew(totalIndicator, portfolioData);
        Double totalValue = totalIndicator.getCalculatedValue();
        
        if (totalValue == null || totalValue == 0) {
          return new HashMap<>();
        }
        
        // Assume inception was 10 years ago (as per existing logic)
        int yearsOfOperation = 10;
        LocalDate inceptionDate = now.minusYears(yearsOfOperation);
        
        // Calculate average yearly value
        Double avgYearlyValue = totalValue / yearsOfOperation;
        
        // Project expected value by end of current year
        totalExpectedValue = totalValue + (avgYearlyValue * ((double) now.getDayOfYear() / now.lengthOfYear()));
        
        // Calculate days since inception
        totalDays = (int) ChronoUnit.DAYS.between(inceptionDate, now.withMonth(12).withDayOfMonth(31));
        elapsedDays = (int) ChronoUnit.DAYS.between(inceptionDate, now);
        
        // Use total value as the annual total equivalent
        data.put("annual_total", avgYearlyValue);
        data.put("total_expected", totalExpectedValue);
        data.put("inception_date", inceptionDate.toString());
        
      } else {
        // Original logic for YTD, MTD, today
        List<AggregatedPortfolioData> portfolioData = getAggregatedPortfolioData(
            portfolioId, 
            indicator.getVentureIds(), 
            null
        );
        
        // Calculate annual total (without proration)
        AggregatedIndicator tempIndicator = new AggregatedIndicator();
        tempIndicator.setTimePeriod("currentYearFull");
        tempIndicator.setDataSources(indicator.getDataSources());
        tempIndicator.setVentureIds(indicator.getVentureIds());
        tempIndicator.setAggregationType(indicator.getAggregationType());
        
        calculateAggregatedValuesNew(tempIndicator, portfolioData);
        totalExpectedValue = tempIndicator.getCalculatedValue();
        
        if (totalExpectedValue == null || totalExpectedValue == 0) {
          return new HashMap<>();
        }
        
        data.put("annual_total", totalExpectedValue);
        totalDays = now.lengthOfYear();
        elapsedDays = now.getDayOfYear() - 1; // Days completed till yesterday
      }
      
      // Calculate rates based on remaining days
      int remainingDays = totalDays - elapsedDays;
      Double remainingValue = totalExpectedValue - currentValue;
      
      if (remainingDays > 0 && remainingValue > 0) {
        data.put("daily_rate", remainingValue / remainingDays);
        data.put("hourly_rate", remainingValue / remainingDays / 24);
        data.put("rate_per_second", remainingValue / remainingDays / 24 / 3600);
      } else {
        // If no remaining days or value is already exceeded, use average rates
        data.put("daily_rate", totalExpectedValue / totalDays);
        data.put("hourly_rate", totalExpectedValue / totalDays / 24);
        data.put("rate_per_second", totalExpectedValue / totalDays / 24 / 3600);
      }
      
      // Calculate value at midnight (start of today)
      LocalDate yesterday = now.minusDays(1);
      Double baseValueMidnight;
      
      if ("sinceInception".equals(indicator.getTimePeriod())) {
        // For inception, base value is slightly less than current
        Double dailyRate = (Double) data.get("daily_rate");
        LocalDateTime nowTime = LocalDateTime.now();
        baseValueMidnight = currentValue - (dailyRate * ((double) nowTime.getHour() / 24));
      } else {
        int daysElapsedTillYesterday = yesterday.getDayOfYear();
        baseValueMidnight = (totalExpectedValue / now.lengthOfYear()) * daysElapsedTillYesterday;
      }
      
      data.put("base_value_midnight", baseValueMidnight);
      data.put("last_updated", LocalDateTime.now().toString());
      
    } catch (Exception e) {
      // Log error and return empty map so the field is omitted
      e.printStackTrace();
      return new HashMap<>();
    }
    
    return data;
  }
  
  /**
   * Convert entity to DTO
   */
  private AggregatedIndicator convertEntityToDto(io.ventureplatform.entity.AggregatedIndicator entity) {
    AggregatedIndicator dto = new AggregatedIndicator();
    
    // Basic fields
    dto.setId(entity.getId());
    dto.setName(entity.getName());
    dto.setNameSlovak(entity.getNameSlovak());
    dto.setDescription(entity.getDescription());
    dto.setCategory(entity.getCategory());
    dto.setUnit(entity.getUnit());
    dto.setUnitSlovak(entity.getUnitSlovak());
    dto.setAggregationType(entity.getAggregationType());
    dto.setCalculatedValue(entity.getCalculatedValue());
    dto.setCreatedAt(entity.getCreatedAt() != null ? entity.getCreatedAt().toString() : null);
    dto.setCreatedBy(entity.getCreatedBy() != null ? entity.getCreatedBy().toString() : null);
    dto.setTimePeriodEnglish(entity.getTimePeriodEnglish());
    dto.setTimePeriodSlovak(entity.getTimePeriodSlovak());
    
    // Time period
    if (entity.getTimePeriod() != null) {
      dto.setTimePeriod(entity.getTimePeriod());
    }
    
    // Selected year
    if (entity.getSelectedYear() != null) {
      dto.setSelectedYears(Arrays.asList(entity.getSelectedYear()));
    }
    
    // JSON fields
    try {
      if (entity.getDataSourcesJson() != null) {
        List<DataSourceReference> dataSources = objectMapper.readValue(
            entity.getDataSourcesJson(), 
            new TypeReference<List<DataSourceReference>>() {}
        );
        dto.setDataSources(dataSources);
      }
      if (entity.getVentureIdsJson() != null) {
        List<Long> ventureIds = objectMapper.readValue(
            entity.getVentureIdsJson(),
            new TypeReference<List<Long>>() {}
        );
        dto.setVentureIds(ventureIds);
      }
      if (entity.getComponentBreakdownJson() != null && entity.getTimePeriod() != null) {
        List<ComponentValue> components = objectMapper.readValue(
            entity.getComponentBreakdownJson(),
            new TypeReference<List<ComponentValue>>() {}
        );
        dto.getComponentBreakdowns().put(entity.getTimePeriod(), components);
      }
    } catch (JsonProcessingException e) {
      throw new RuntimeException("Failed to deserialize JSON", e);
    }
    
    // Add calculated value to calculatedValues map
    if (entity.getTimePeriod() != null && entity.getCalculatedValue() != null) {
      dto.getCalculatedValues().put(entity.getTimePeriod(), entity.getCalculatedValue());
    }
    
    // Add parent-child relationship info
    dto.setIsMain(entity.getIsMain());
    dto.setHoverSlot(entity.getHoverSlot());
    dto.setParentIndicatorId(entity.getParentIndicator() != null ?
        entity.getParentIndicator().getId() : null);

    // Add display order for internal sorting
    dto.setDisplayOrder(entity.getDisplayOrder());
    
    // Add number formatting options
    dto.setDecimalPlaces(entity.getDecimalPlaces());
    dto.setNumberFormat(entity.getNumberFormat());
    
    // Add continuous counter flag
    dto.setContinuousCounter(entity.getContinuousCounter());

    // Slovak translations are already handled above

    return dto;
  }
}