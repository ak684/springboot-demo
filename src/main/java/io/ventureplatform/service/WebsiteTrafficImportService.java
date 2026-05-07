package io.ventureplatform.service;

import io.ventureplatform.entity.CompanyExtractionData;
import io.ventureplatform.repository.CompanyExtractionDataRepository;
import io.ventureplatform.util.DomainExtractionUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellType;
import org.apache.poi.ss.usermodel.DateUtil;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.SimpleDateFormat;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class WebsiteTrafficImportService {

  private final CompanyExtractionDataRepository companyExtractionDataRepository;
  private final CompanyDataExtractionMetricsCacheService metricsCacheService;

  /**
   * Import website traffic data from Excel file
   * @param file The Excel file containing traffic data
   * @return Import results summary
   */
  @Transactional
  public Map<String, Object> importTrafficData(MultipartFile file) {
    log.info("Starting website traffic data import from file: {}", file.getOriginalFilename());
    
    Map<String, Object> result = new HashMap<>();
    List<Map<String, Object>> processedCompanies = new ArrayList<>();
    int successCount = 0;
    int failureCount = 0;
    int notFoundCount = 0;
    
    try (InputStream inputStream = file.getInputStream();
         Workbook workbook = new XSSFWorkbook(inputStream)) {
      
      // Process all sheets in the workbook
      int numberOfSheets = workbook.getNumberOfSheets();
      log.info("Excel file contains {} sheet(s)", numberOfSheets);
      
      // Aggregate traffic data from all sheets
      Map<String, Map<String, Long>> trafficDataByCompany = new HashMap<>();
      SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM");
      
      for (int sheetIndex = 0; sheetIndex < numberOfSheets; sheetIndex++) {
        Sheet sheet = workbook.getSheetAt(sheetIndex);
        String sheetName = sheet.getSheetName();
        log.info("Processing sheet {} of {}: '{}'", sheetIndex + 1, numberOfSheets, sheetName);
        
        // Read header row to get company domains
        Row headerRow = sheet.getRow(0);
        if (headerRow == null) {
          log.warn("Sheet '{}' has no header row, skipping", sheetName);
          continue;
        }
        
        List<String> companyDomains = new ArrayList<>();
        for (int i = 1; i < headerRow.getLastCellNum(); i++) {
          Cell cell = headerRow.getCell(i);
          if (cell != null) {
            String domain = getCellValueAsString(cell);
            if (domain != null && !domain.isEmpty()) {
              companyDomains.add(domain);
            }
          }
        }
        
        log.info("Found {} companies in sheet '{}'", companyDomains.size(), sheetName);
        
        // Read all traffic data from this sheet
        for (int rowNum = 1; rowNum <= sheet.getLastRowNum(); rowNum++) {
          Row row = sheet.getRow(rowNum);
          if (row == null) {
            continue;
          }
          
          // Get date from first column
          Cell dateCell = row.getCell(0);
          if (dateCell == null) {
            continue;
          }
          
          String dateStr = null;
          if (dateCell.getCellType() == CellType.NUMERIC && DateUtil.isCellDateFormatted(dateCell)) {
            Date date = dateCell.getDateCellValue();
            dateStr = dateFormat.format(date);
          } else {
            // Parse string date format like "8/1/2023"
            String cellValue = getCellValueAsString(dateCell);
            if (cellValue != null && cellValue.contains("/")) {
              String[] parts = cellValue.split("/");
              if (parts.length == 3) {
                try {
                  int month = Integer.parseInt(parts[0]);
                  int year = Integer.parseInt(parts[2]);
                  dateStr = String.format("%d-%02d", year, month);
                } catch (NumberFormatException e) {
                  log.debug("Could not parse date: {}", cellValue);
                  continue;
                }
              }
            }
          }
          
          if (dateStr == null) {
            continue;
          }
          
          // Read traffic data for each company
          for (int colNum = 1; colNum < companyDomains.size() + 1 && colNum < row.getLastCellNum(); colNum++) {
            String domain = companyDomains.get(colNum - 1);
            Cell trafficCell = row.getCell(colNum);
            
            if (trafficCell != null) {
              Long trafficValue = getCellValueAsLong(trafficCell);
              
              if (trafficValue != null && trafficValue >= 0) {
                // Store or update traffic value (later sheets override earlier ones if same date)
                trafficDataByCompany
                    .computeIfAbsent(domain, k -> new HashMap<>())
                    .put(dateStr, trafficValue);
              }
            }
          }
        }
      }
      
      log.info("Aggregated traffic data for {} unique companies across all sheets", trafficDataByCompany.size());
      
      // Process each company
      for (Map.Entry<String, Map<String, Long>> entry : trafficDataByCompany.entrySet()) {
        String excelDomain = entry.getKey();
        Map<String, Long> trafficData = entry.getValue();
        
        Map<String, Object> companyResult = new HashMap<>();
        companyResult.put("excel_domain", excelDomain);
        companyResult.put("months_with_data", trafficData.size());
        
        try {
          // Find matching company in database
          CompanyExtractionData company = findCompanyByDomain(excelDomain);
          
          if (company != null) {
            companyResult.put("company_name", company.getCompanyName());
            companyResult.put("company_id", company.getId());
            companyResult.put("database_domain", company.getDomain());
            
            // Update traffic data
            updateCompanyTrafficData(company, trafficData);
            
            // Calculate growth metrics
            calculateGrowthMetrics(company);
            
            // Save the updated company
            companyExtractionDataRepository.save(company);
            
            companyResult.put("status", "success");
            companyResult.put("months_updated", trafficData.size());
            successCount++;
            
            log.info("Successfully updated traffic data for company: {} ({})", 
                    company.getCompanyName(), excelDomain);
          } else {
            companyResult.put("status", "not_found");
            companyResult.put("message", "Company not found in database");
            notFoundCount++;
            log.warn("Company not found for domain: {}", excelDomain);
          }
          
        } catch (Exception e) {
          companyResult.put("status", "error");
          companyResult.put("error", e.getMessage());
          failureCount++;
          log.error("Error processing company {}: {}", excelDomain, e.getMessage());
        }
        
        processedCompanies.add(companyResult);
      }
      
      // Invalidate cache after import
      metricsCacheService.invalidateCache();
      log.info("Invalidated metrics cache after traffic data import");
      
    } catch (Exception e) {
      log.error("Error importing traffic data", e);
      result.put("error", "Failed to import traffic data: " + e.getMessage());
      return result;
    }
    
    result.put("total_companies", processedCompanies.size());
    result.put("success_count", successCount);
    result.put("failure_count", failureCount);
    result.put("not_found_count", notFoundCount);
    result.put("processed_companies", processedCompanies);
    result.put("message", String.format("Import complete: %d succeeded, %d failed, %d not found", 
                                       successCount, failureCount, notFoundCount));
    
    log.info("Traffic data import completed - Success: {}, Failed: {}, Not Found: {}", 
            successCount, failureCount, notFoundCount);
    
    return result;
  }
  
  /**
   * Get cell value as String
   */
  private String getCellValueAsString(Cell cell) {
    if (cell == null) {
      return null;
    }
    
    switch (cell.getCellType()) {
      case STRING:
        return cell.getStringCellValue();
      case NUMERIC:
        if (DateUtil.isCellDateFormatted(cell)) {
          SimpleDateFormat dateFormat = new SimpleDateFormat("M/d/yyyy");
          return dateFormat.format(cell.getDateCellValue());
        } else {
          return String.valueOf((long) cell.getNumericCellValue());
        }
      case BOOLEAN:
        return String.valueOf(cell.getBooleanCellValue());
      case FORMULA:
        return cell.getCellFormula();
      default:
        return null;
    }
  }
  
  /**
   * Get cell value as Long
   */
  private Long getCellValueAsLong(Cell cell) {
    if (cell == null) {
      return null;
    }
    
    switch (cell.getCellType()) {
      case NUMERIC:
        return (long) cell.getNumericCellValue();
      case STRING:
        String value = cell.getStringCellValue();
        if (value == null || value.trim().isEmpty() || 
            value.equalsIgnoreCase("n/a") || value.equalsIgnoreCase("na")) {
          return null;
        }
        try {
          return Long.parseLong(value.trim());
        } catch (NumberFormatException e) {
          return null;
        }
      default:
        return null;
    }
  }
  
  /**
   * Find company by domain with fuzzy matching
   */
  private CompanyExtractionData findCompanyByDomain(String excelDomain) {
    // Extract root domain for matching
    String rootDomain = DomainExtractionUtil.extractRootDomain("https://" + excelDomain);
    if (rootDomain == null) {
      rootDomain = excelDomain;
    }
    
    // Try exact domain match first
    CompanyExtractionData company = companyExtractionDataRepository.findByDomain(rootDomain).orElse(null);
    
    if (company != null) {
      return company;
    }
    
    // Try to find by partial domain match
    List<CompanyExtractionData> allCompanies = companyExtractionDataRepository.findAll();
    
    // Clean up the excel domain for matching
    String cleanExcelDomain = excelDomain.toLowerCase()
        .replace("https://", "")
        .replace("http://", "")
        .replace("www.", "");
    
    for (CompanyExtractionData c : allCompanies) {
      // Check domain field
      if (c.getDomain() != null) {
        String cleanDbDomain = c.getDomain().toLowerCase()
            .replace("https://", "")
            .replace("http://", "")
            .replace("www.", "");
        
        if (cleanDbDomain.equals(cleanExcelDomain) || 
            cleanDbDomain.contains(cleanExcelDomain) || 
            cleanExcelDomain.contains(cleanDbDomain)) {
          return c;
        }
      }
      
      // Check company URL field
      if (c.getCompanyUrl() != null) {
        String cleanCompanyUrl = c.getCompanyUrl().toLowerCase()
            .replace("https://", "")
            .replace("http://", "")
            .replace("www.", "");
        
        if (cleanCompanyUrl.contains(cleanExcelDomain) || 
            cleanExcelDomain.contains(cleanCompanyUrl)) {
          return c;
        }
      }
    }
    
    return null;
  }
  
  /**
   * Update company entity with traffic data
   */
  private void updateCompanyTrafficData(CompanyExtractionData company, Map<String, Long> trafficData) {
    String latestMonth = null;
    
    for (Map.Entry<String, Long> entry : trafficData.entrySet()) {
      String dateStr = entry.getKey();
      Long traffic = entry.getValue();
      
      // Parse year and month
      String[] parts = dateStr.split("-");
      if (parts.length != 2) {
        continue;
      }
      
      int year = Integer.parseInt(parts[0]);
      int month = Integer.parseInt(parts[1]);
      
      // Update the appropriate field based on year and month
      setTrafficForMonth(company, year, month, traffic);
      
      // Track latest month
      if (latestMonth == null || dateStr.compareTo(latestMonth) > 0) {
        latestMonth = dateStr;
      }
    }
    
    // Update metadata
    company.setLatestTrafficMonth(latestMonth);
    company.setTrafficDataUpdatedAt(new Date());
  }
  
  /**
   * Set traffic value for a specific year and month
   */
  private void setTrafficForMonth(CompanyExtractionData company, int year, int month, Long traffic) {
    if (year == 2023) {
      switch (month) {
        case 8: 
          company.setTrafficAug2023(traffic);
          break;
        case 9:
          company.setTrafficSep2023(traffic);
          break;
        case 10:
          company.setTrafficOct2023(traffic);
          break;
        case 11:
          company.setTrafficNov2023(traffic);
          break;
        case 12:
          company.setTrafficDec2023(traffic);
          break;
        default:
          break;
      }
    } else if (year == 2024) {
      switch (month) {
        case 1:
          company.setTrafficJan2024(traffic);
          break;
        case 2:
          company.setTrafficFeb2024(traffic);
          break;
        case 3:
          company.setTrafficMar2024(traffic);
          break;
        case 4:
          company.setTrafficApr2024(traffic);
          break;
        case 5:
          company.setTrafficMay2024(traffic);
          break;
        case 6:
          company.setTrafficJun2024(traffic);
          break;
        case 7:
          company.setTrafficJul2024(traffic);
          break;
        case 8:
          company.setTrafficAug2024(traffic);
          break;
        case 9:
          company.setTrafficSep2024(traffic);
          break;
        case 10:
          company.setTrafficOct2024(traffic);
          break;
        case 11:
          company.setTrafficNov2024(traffic);
          break;
        case 12:
          company.setTrafficDec2024(traffic);
          break;
        default:
          break;
      }
    } else if (year == 2025) {
      switch (month) {
        case 1:
          company.setTrafficJan2025(traffic);
          break;
        case 2:
          company.setTrafficFeb2025(traffic);
          break;
        case 3:
          company.setTrafficMar2025(traffic);
          break;
        case 4:
          company.setTrafficApr2025(traffic);
          break;
        case 5:
          company.setTrafficMay2025(traffic);
          break;
        case 6:
          company.setTrafficJun2025(traffic);
          break;
        case 7:
          company.setTrafficJul2025(traffic);
          break;
        case 8:
          company.setTrafficAug2025(traffic);
          break;
        case 9:
          company.setTrafficSep2025(traffic);
          break;
        case 10:
          company.setTrafficOct2025(traffic);
          break;
        case 11:
          company.setTrafficNov2025(traffic);
          break;
        case 12:
          company.setTrafficDec2025(traffic);
          break;
        default:
          break;
      }
    }
  }

  /**
   * Get traffic value for a specific year and month.
   */
  private Long getTrafficForMonth(CompanyExtractionData company, int year, int month) {
    if (year == 2023) {
      switch (month) {
        case 8: 
          return company.getTrafficAug2023();
        case 9:
          return company.getTrafficSep2023();
        case 10:
          return company.getTrafficOct2023();
        case 11:
          return company.getTrafficNov2023();
        case 12:
          return company.getTrafficDec2023();
        default:
          return null;
      }
    } else if (year == 2024) {
      switch (month) {
        case 1:
          return company.getTrafficJan2024();
        case 2:
          return company.getTrafficFeb2024();
        case 3:
          return company.getTrafficMar2024();
        case 4:
          return company.getTrafficApr2024();
        case 5:
          return company.getTrafficMay2024();
        case 6:
          return company.getTrafficJun2024();
        case 7:
          return company.getTrafficJul2024();
        case 8:
          return company.getTrafficAug2024();
        case 9:
          return company.getTrafficSep2024();
        case 10:
          return company.getTrafficOct2024();
        case 11:
          return company.getTrafficNov2024();
        case 12:
          return company.getTrafficDec2024();
        default:
          return null;
      }
    } else if (year == 2025) {
      switch (month) {
        case 1:
          return company.getTrafficJan2025();
        case 2:
          return company.getTrafficFeb2025();
        case 3:
          return company.getTrafficMar2025();
        case 4:
          return company.getTrafficApr2025();
        case 5:
          return company.getTrafficMay2025();
        case 6:
          return company.getTrafficJun2025();
        case 7:
          return company.getTrafficJul2025();
        case 8:
          return company.getTrafficAug2025();
        case 9:
          return company.getTrafficSep2025();
        case 10:
          return company.getTrafficOct2025();
        case 11:
          return company.getTrafficNov2025();
        case 12:
          return company.getTrafficDec2025();
        default:
          return null;
      }
    }
    return null;
  }

  /**
   * Calculate growth metrics for the company.
   */
  private void calculateGrowthMetrics(CompanyExtractionData company) {
    // Get current date to determine if we should skip the current month
    LocalDate now = LocalDate.now();
    int todayYear = now.getYear();
    int todayMonth = now.getMonthValue();

    // Start with the most recent month we have data for (Dec 2025)
    int currentYear = 2025;
    int currentMonth = 12;
    
    // If we're in the current month (Dec 2025), use the previous month instead
    // since the current month's data is incomplete
    if (currentYear == todayYear && currentMonth == todayMonth) {
      log.debug("Skipping current incomplete month {}/{}, using previous month", currentMonth, currentYear);
      currentMonth--;
      if (currentMonth == 0) {
        currentMonth = 12;
        currentYear--;
      }
    }
    
    // Now find the latest month with actual data
    Long currentTraffic = getTrafficForMonth(company, currentYear, currentMonth);
    
    // If still no data, work backwards to find latest month with data
    while (currentTraffic == null && (currentYear > 2023 || (currentYear == 2023 && currentMonth >= 8))) {
      currentMonth--;
      if (currentMonth == 0) {
        currentMonth = 12;
        currentYear--;
      }
      currentTraffic = getTrafficForMonth(company, currentYear, currentMonth);
    }
    
    // If we still have no current traffic data, we can't calculate growth
    if (currentTraffic == null) {
      log.debug("No traffic data found for company {}", company.getCompanyName());
      return;
    }
    
    log.debug("Reference traffic for {}: {} visitors in {}/{}", 
             company.getCompanyName(), currentTraffic, currentMonth, currentYear);
    
    // Calculate 1-month growth
    Long oneMonthAgo = getTrafficNMonthsAgo(company, currentYear, currentMonth, 1);
    if (oneMonthAgo != null) {
      BigDecimal growth = calculateGrowthPercentage(oneMonthAgo, currentTraffic);
      company.setOneMonthGrowth(growth);
      company.setMonthlyGrowthTrend(growth);
    }
    
    // Calculate 3-month growth
    Long threeMonthsAgo = getTrafficNMonthsAgo(company, currentYear, currentMonth, 3);
    if (threeMonthsAgo != null) {
      BigDecimal growth = calculateGrowthPercentage(threeMonthsAgo, currentTraffic);
      company.setThreeMonthGrowthTrend(growth);
    }
    
    // Calculate 6-month growth
    Long sixMonthsAgo = getTrafficNMonthsAgo(company, currentYear, currentMonth, 6);
    if (sixMonthsAgo != null) {
      BigDecimal growth = calculateGrowthPercentage(sixMonthsAgo, currentTraffic);
      company.setSixMonthGrowthTrend(growth);
    }
    
    // Calculate 1-year growth
    Long oneYearAgo = getTrafficNMonthsAgo(company, currentYear, currentMonth, 12);
    if (oneYearAgo != null) {
      BigDecimal growth = calculateGrowthPercentage(oneYearAgo, currentTraffic);
      company.setOneYearGrowth(growth);
    }
    
    // Calculate 2-year growth
    Long twoYearsAgo = getTrafficNMonthsAgo(company, currentYear, currentMonth, 24);
    if (twoYearsAgo != null) {
      BigDecimal growth = calculateGrowthPercentage(twoYearsAgo, currentTraffic);
      company.setTwoYearGrowth(growth);
    }
    
    log.info("Calculated growth metrics for {}: 1M: {}%, 3M: {}%, 6M: {}%, 1Y: {}%, 2Y: {}%", 
             company.getCompanyName(), 
             company.getOneMonthGrowth(), 
             company.getThreeMonthGrowthTrend(), 
             company.getSixMonthGrowthTrend(),
             company.getOneYearGrowth(),
             company.getTwoYearGrowth());
  }
  
  /**
   * Get traffic from N months ago
   */
  private Long getTrafficNMonthsAgo(CompanyExtractionData company, int currentYear, int currentMonth, int monthsAgo) {
    int targetMonth = currentMonth - monthsAgo;
    int targetYear = currentYear;
    
    while (targetMonth <= 0) {
      targetMonth += 12;
      targetYear--;
    }
    
    // Don't go before Aug 2023
    if (targetYear < 2023 || (targetYear == 2023 && targetMonth < 8)) {
      return null;
    }
    
    return getTrafficForMonth(company, targetYear, targetMonth);
  }
  
  /**
   * Recalculate growth metrics for all companies with traffic data
   * This is useful when the growth calculation logic changes
   */
  @Transactional
  public Map<String, Object> recalculateAllGrowthMetrics() {
    log.info("Starting recalculation of growth metrics for all companies");
    
    List<CompanyExtractionData> allCompanies = companyExtractionDataRepository.findAll();
    int successCount = 0;
    int processedCount = 0;
    
    for (CompanyExtractionData company : allCompanies) {
      // Check if company has any traffic data
      boolean hasTrafficData = hasAnyTrafficData(company);
      
      if (hasTrafficData) {
        processedCount++;
        try {
          // Recalculate growth metrics
          calculateGrowthMetrics(company);
          companyExtractionDataRepository.save(company);
          successCount++;
          log.debug("Recalculated growth metrics for: {}", company.getCompanyName());
        } catch (Exception e) {
          log.error("Failed to recalculate growth for company: {}", company.getCompanyName(), e);
        }
      }
    }
    
    log.info("Growth metrics recalculation completed - Processed: {}, Success: {}", processedCount, successCount);
    
    Map<String, Object> result = new HashMap<>();
    result.put("total_companies", allCompanies.size());
    result.put("processed_count", processedCount);
    result.put("success_count", successCount);
    result.put("message", String.format("Recalculated growth metrics for %d companies", successCount));
    
    return result;
  }
  
  /**
   * Check if company has any traffic data
   */
  private boolean hasAnyTrafficData(CompanyExtractionData company) {
    return company.getTrafficAug2023() != null || company.getTrafficSep2023() != null ||
           company.getTrafficOct2023() != null || company.getTrafficNov2023() != null ||
           company.getTrafficDec2023() != null || company.getTrafficJan2024() != null ||
           company.getTrafficFeb2024() != null || company.getTrafficMar2024() != null ||
           company.getTrafficApr2024() != null || company.getTrafficMay2024() != null ||
           company.getTrafficJun2024() != null || company.getTrafficJul2024() != null ||
           company.getTrafficAug2024() != null || company.getTrafficSep2024() != null ||
           company.getTrafficOct2024() != null || company.getTrafficNov2024() != null ||
           company.getTrafficDec2024() != null || company.getTrafficJan2025() != null ||
           company.getTrafficFeb2025() != null || company.getTrafficMar2025() != null ||
           company.getTrafficApr2025() != null || company.getTrafficMay2025() != null ||
           company.getTrafficJun2025() != null || company.getTrafficJul2025() != null ||
           company.getTrafficAug2025() != null;
  }
  
  /**
   * Calculate growth percentage using Ingo's formula:
   * Growth (%) = ((Recent Month - Earlier Month) / Earlier Month) × 100
   */
  private BigDecimal calculateGrowthPercentage(Long oldValue, Long newValue) {
    // Handle null values
    if (oldValue == null || newValue == null) {
      return null;
    }
    
    // Handle division by zero - if old value is 0, we can't calculate percentage growth
    if (oldValue == 0) {
      // If both are 0, growth is 0%
      if (newValue == 0) {
        return BigDecimal.ZERO;
      }
      // If old is 0 but new is positive, it's infinite growth - return null to show N/A
      return null;
    }
    
    // Calculate growth percentage: ((new - old) / old) * 100
    BigDecimal growth = BigDecimal.valueOf(newValue - oldValue)
        .multiply(BigDecimal.valueOf(100))
        .divide(BigDecimal.valueOf(oldValue), 2, RoundingMode.HALF_UP);
    
    return growth;
  }
}
