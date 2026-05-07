package io.ventureplatform.util;

import io.ventureplatform.entity.CompanyExtractionData;
import io.ventureplatform.repository.CompanyExtractionDataRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

/**
 * One-time verification that all data has been migrated to use headquarter_address.
 * Enable with -Dspring.profiles.active=verify-migration
 */
@Component
@Profile("verify-migration")
@RequiredArgsConstructor
@Slf4j
public class DataMigrationVerifier implements CommandLineRunner {

  private final CompanyExtractionDataRepository repository;

  @Override
  public void run(String... args) {
    log.info("Starting migration verification...");
    
    List<CompanyExtractionData> allCompanies = repository.findAll();
    int totalCompanies = allCompanies.size();
    int companiesWithOldField = 0;
    
    for (CompanyExtractionData company : allCompanies) {
      Map<String, Object> rawData = company.getRawExtractionData();
      if (rawData != null && rawData.containsKey("headquarters_location")) {
        companiesWithOldField++;
        log.warn("Company {} still has 'headquarters_location' in raw data", company.getId());
      }
    }
    
    if (companiesWithOldField == 0) {
      log.info("✅ Migration verified! All {} companies are using 'headquarter_address'", totalCompanies);
    } else {
      log.error("❌ Migration incomplete! {} out of {} companies still have 'headquarters_location'", 
                companiesWithOldField, totalCompanies);
    }
  }
}
