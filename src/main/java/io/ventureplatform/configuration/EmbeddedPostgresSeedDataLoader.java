package io.ventureplatform.configuration;

import io.ventureplatform.service.CompanyPolarChartService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.annotation.Profile;
import org.springframework.context.event.EventListener;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.Statement;

import static io.ventureplatform.constant.AppConstants.PROFILE_EMBEDDED_POSTGRES;

/**
 * Loads seed data into embedded PostgreSQL after Liquibase migrations.
 */
@Component
@Profile(PROFILE_EMBEDDED_POSTGRES)
@RequiredArgsConstructor
@Slf4j
public class EmbeddedPostgresSeedDataLoader {

  private final DataSource dataSource;
  private final CompanyPolarChartService companyPolarChartService;

  /**
   * Load seed data after application is ready.
   * Liquibase migrations run during context initialization,
   * so by ApplicationReadyEvent the schema is ready.
   */
  @EventListener(ApplicationReadyEvent.class)
  public void loadSeedData() {
    ClassPathResource seedDataResource = new ClassPathResource("db/seed-data.sql");
    if (!seedDataResource.exists()) {
      log.info("No seed-data.sql found, skipping seed data loading");
      return;
    }

    log.info("Loading seed data from db/seed-data.sql...");
    try {
      ResourceDatabasePopulator populator = new ResourceDatabasePopulator();
      populator.addScript(seedDataResource);
      populator.setContinueOnError(false);
      populator.execute(dataSource);
      log.info("Seed data loaded successfully");

      // Backfill highest_abc_classification from theory_of_change JSONB
      log.info("Backfilling highest_abc_classification from theory_of_change data...");
      backfillAbcClassification();
      log.info("ABC classification backfill complete");

      log.info("Refreshing polar chart cache with seed data...");
      companyPolarChartService.refreshCache();
      log.info("Polar chart cache refreshed");
    } catch (Exception e) {
      log.error("Failed to load seed data: {}", e.getMessage(), e);
    }
  }

  /**
   * Backfill highest_abc_classification column from theory_of_change JSONB data.
   * Priority: C > B > A (C is highest classification).
   */
  private void backfillAbcClassification() {
    String sql = """
        UPDATE company_extraction_data
        SET highest_abc_classification = (
          SELECT
            CASE
              WHEN EXISTS (
                SELECT 1 FROM jsonb_array_elements(raw_extraction_data->'theory_of_change') AS toc
                WHERE UPPER(toc->'abc_classification'->>'classification') = 'C'
              ) THEN 'C'
              WHEN EXISTS (
                SELECT 1 FROM jsonb_array_elements(raw_extraction_data->'theory_of_change') AS toc
                WHERE UPPER(toc->'abc_classification'->>'classification') = 'B'
              ) THEN 'B'
              WHEN EXISTS (
                SELECT 1 FROM jsonb_array_elements(raw_extraction_data->'theory_of_change') AS toc
                WHERE UPPER(toc->'abc_classification'->>'classification') = 'A'
              ) THEN 'A'
              ELSE NULL
            END
        )
        WHERE raw_extraction_data IS NOT NULL
          AND raw_extraction_data->'theory_of_change' IS NOT NULL
          AND jsonb_array_length(raw_extraction_data->'theory_of_change') > 0
        """;

    try (Connection conn = dataSource.getConnection();
         Statement stmt = conn.createStatement()) {
      int updated = stmt.executeUpdate(sql);
      log.info("Updated {} companies with highest_abc_classification", updated);
    } catch (Exception e) {
      log.error("Failed to backfill ABC classification: {}", e.getMessage(), e);
    }
  }
}
