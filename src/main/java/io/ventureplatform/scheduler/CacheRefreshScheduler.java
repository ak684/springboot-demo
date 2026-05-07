package io.ventureplatform.scheduler;

import io.ventureplatform.service.CompanyPolarChartService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Scheduler for refreshing polar chart metrics cache.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class CacheRefreshScheduler {

  /** Polar chart service with cached metrics. */
  private final CompanyPolarChartService polarChartService;

  /**
   * Refresh polar chart cache daily at noon.
   */
  @Scheduled(cron = "0 0 12 * * *")
  public void refreshPolarChartCache() {
    log.info("Running scheduled polar chart cache refresh");
    polarChartService.refreshCache();
  }
}
