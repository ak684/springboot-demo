package io.ventureplatform.configuration;

import org.springframework.context.annotation.Configuration;

import java.security.Security;

@Configuration
public class SecurityManager {
  static {
    Security.setProperty("networkaddress.cache.ttl", "60");
  }
}
