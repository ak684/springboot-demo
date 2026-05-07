package io.ventureplatform.configuration;

import io.sentry.Sentry;
import org.springframework.beans.BeansException;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationContextAware;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.core.env.Environment;

@Configuration
@Profile("prod")
public class SentryConfig implements ApplicationContextAware {
  @Override
  public void setApplicationContext(ApplicationContext context) throws BeansException {
    Environment environment = context.getEnvironment();
    Sentry.init(options -> {
      options.setDsn("https://939fcfbe17cb42478adb33b84c26aa56@o4504872033189888.ingest.sentry.io/4504872065302528");
      options.setEnvironment(environment.getProperty("spring.profiles.active"));
    });
  }
}
