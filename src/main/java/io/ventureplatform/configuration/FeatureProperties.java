package io.ventureplatform.configuration;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

/**
 * Feature flag configuration properties.
 */
@Component
@ConfigurationProperties(
  prefix = "application.features"
)
@Getter
@Setter
public class FeatureProperties {

  /**
   * Research database feature settings.
   */
  private ResearchDatabase researchDatabase =
    new ResearchDatabase();

  /**
   * Research database feature config.
   */
  @Getter
  @Setter
  public static class ResearchDatabase {
    /**
     * Admin emails allowed to see the page.
     * Empty list means visible to all users.
     */
    private List<String> adminEmails =
      new ArrayList<>();
  }

  /**
   * Check if research database is enabled for user.
   *
   * @param email the user email
   * @return true if enabled
   */
  public boolean isResearchDatabaseEnabled(
    final String email
  ) {
    List<String> allowed =
      researchDatabase.getAdminEmails();
    if (allowed == null || allowed.isEmpty()) {
      return true;
    }
    return email != null
      && allowed.stream()
        .anyMatch(e -> e.equalsIgnoreCase(email));
  }
}
