package io.ventureplatform.configuration;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.util.ArrayList;
import java.util.List;

@Configuration
@ConfigurationProperties(prefix = "spring.security.superadmin")
@Getter
@Setter
public class SuperAdminConfiguration {
  /**
   * List of superadmin email addresses.
   */
  private List<String> emails = new ArrayList<>();
  /**
   * Email address for admin notifications.
   */
  private String notificationEmail;

  /**
   * Check if the given email is a superadmin.
   *
   * @param email the email to check
   * @return true if email is superadmin
   */
  public final boolean isSuperAdmin(final String email) {
    return email != null && emails.contains(email.toLowerCase());
  }
}
