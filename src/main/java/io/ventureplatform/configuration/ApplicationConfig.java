package io.ventureplatform.configuration;

import io.ventureplatform.util.CurrentUserMethodArgumentResolver;
import lombok.RequiredArgsConstructor;
import org.apache.catalina.Context;
import org.apache.catalina.connector.Connector;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.impl.conn.PoolingHttpClientConnectionManager;
import org.apache.tomcat.util.descriptor.web.SecurityCollection;
import org.apache.tomcat.util.descriptor.web.SecurityConstraint;
import org.modelmapper.ModelMapper;
import org.modelmapper.convention.MatchingStrategies;
import org.modelmapper.jackson.JsonNodeValueReader;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.web.embedded.tomcat.TomcatServletWebServerFactory;
import org.springframework.boot.web.servlet.server.ServletWebServerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.task.SimpleAsyncTaskExecutor;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.http.CacheControl;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.List;
import java.util.Objects;
import java.util.concurrent.Executor;
import java.util.concurrent.TimeUnit;

import static io.ventureplatform.constant.AppConstants.PROFILE_LOCAL;
import static org.modelmapper.config.Configuration.AccessLevel.PACKAGE_PRIVATE;

@Configuration
@EnableJpaAuditing
@EnableAsync
@EnableScheduling
@RequiredArgsConstructor
public class ApplicationConfig {
  @Value("${spring.profiles.active}")
  private String profile;

  private final CurrentUserMethodArgumentResolver currentUserMethodArgumentResolver;

  @Bean
  public WebMvcConfigurer webMvcConfigurer() {
    return new WebMvcConfigurer() {
      @Override
      public void addResourceHandlers(ResourceHandlerRegistry registry) {
        Objects.requireNonNull(registry);

        registry.addResourceHandler("/static/**")
          .addResourceLocations("classpath:/static/static/")
          .setCacheControl(CacheControl.maxAge(30, TimeUnit.DAYS).cachePublic().mustRevalidate());
      }

      @Override
      public void addArgumentResolvers(List<HandlerMethodArgumentResolver> argumentResolvers) {
        argumentResolvers.add(currentUserMethodArgumentResolver);
      }
    };
  }

  @Bean
  @ConditionalOnProperty(value = "server.ssl.enabled", havingValue = "true")
  public ServletWebServerFactory servletContainer() {
    TomcatServletWebServerFactory tomcat = new TomcatServletWebServerFactory() {
      @Override
      protected void postProcessContext(Context context) {
        SecurityConstraint securityConstraint = new SecurityConstraint();
        securityConstraint.setUserConstraint("CONFIDENTIAL");
        SecurityCollection collection = new SecurityCollection();
        collection.addPattern("/*");
        securityConstraint.addCollection(collection);
        context.addConstraint(securityConstraint);
      }
    };

    if (!PROFILE_LOCAL.equals(profile)) {
      tomcat.addAdditionalTomcatConnectors(getHttpConnector());
    }

    return tomcat;
  }

  private Connector getHttpConnector() {
    Connector connector = new Connector(TomcatServletWebServerFactory.DEFAULT_PROTOCOL);
    connector.setScheme("http");
    connector.setPort(80);
    connector.setSecure(false);
    connector.setRedirectPort(443);
    return connector;
  }

  @Bean
  public Executor taskExecutor() {
    return new SimpleAsyncTaskExecutor();
  }

  /**
   * Bounded executor for public-profile auto-translation
   * (issue #518). Uses a small fixed pool + bounded queue so a
   * bulk-save scenario can't fan out to N parallel OpenAI calls.
   * Rejected tasks are logged by the caller — translation is
   * fire-and-forget, the user's save still succeeds.
   *
   * @return a small ThreadPoolTaskExecutor sized for OpenAI calls
   */
  @Bean(name = "publicProfileTranslationExecutor")
  public Executor publicProfileTranslationExecutor() {
    ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
    executor.setCorePoolSize(2);
    executor.setMaxPoolSize(4);
    executor.setQueueCapacity(64);
    executor.setThreadNamePrefix("ppt-translate-");
    executor.setRejectedExecutionHandler(
        (runnable, exec) -> {
          // Log only — do not block or throw. The user's save
          // already succeeded; a dropped translation can be
          // recovered via the manual "Translate from " button.
          org.slf4j.LoggerFactory
              .getLogger(ApplicationConfig.class)
              .warn("publicProfileTranslationExecutor rejected"
                  + " task; queue full, dropping translation");
        });
    executor.initialize();
    return executor;
  }

  @Bean
  public ModelMapper modelMapper() {
    ModelMapper mapper = new ModelMapper();
    mapper.getConfiguration()
      .setMatchingStrategy(MatchingStrategies.STRICT)
      .setFieldMatchingEnabled(true)
      .setSkipNullEnabled(true)
      .setFieldAccessLevel(PACKAGE_PRIVATE)
      .addValueReader(new JsonNodeValueReader());
    return mapper;
  }

  @Bean
  public RestTemplate restTemplate() {
    PoolingHttpClientConnectionManager connectionManager =
        new PoolingHttpClientConnectionManager();
    connectionManager.setMaxTotal(50);
    connectionManager.setDefaultMaxPerRoute(25);

    CloseableHttpClient httpClient = HttpClients.custom()
        .setConnectionManager(connectionManager)
        .build();

    HttpComponentsClientHttpRequestFactory factory =
        new HttpComponentsClientHttpRequestFactory(httpClient);
    factory.setConnectTimeout(30000);
    factory.setReadTimeout(600000);

    return new RestTemplate(factory);
  }
}
