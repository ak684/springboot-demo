package io.ventureplatform.configuration;

import io.ventureplatform.constant.AppConstants;
import io.ventureplatform.exception.ExceptionHandlerFilter;
import io.ventureplatform.security.ApiKeyAuthenticationFilter;
import io.ventureplatform.security.CustomUserDetailsService;
import io.ventureplatform.security.JwtTokenFilter;
import io.ventureplatform.security.JwtTokenProvider;
import io.ventureplatform.security.RestAuthenticationEntryPoint;
import io.ventureplatform.security.SysAdminKeyAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.header.HeaderWriterFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {
  @Value("${server.ssl.enabled}")
  private Boolean sslEnabled;

  private final RestAuthenticationEntryPoint authenticationEntryPoint;
  private final JwtTokenProvider jwtTokenProvider;
  private final CustomUserDetailsService userDetailsService;
  private ExceptionHandlerFilter exceptionHandlerFilter;
  private ApiKeyAuthenticationFilter apiKeyAuthenticationFilter;
  private SysAdminKeyAuthenticationFilter sysAdminKeyAuthenticationFilter;

  @Bean
  public AuthenticationManager authenticationManager(HttpSecurity http, PasswordEncoder passwordEncoder)
    throws Exception {
    return http.getSharedObject(AuthenticationManagerBuilder.class)
      .userDetailsService(userDetailsService)
      .passwordEncoder(passwordEncoder)
      .and()
      .build();
  }

  @Bean
  public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
  }

  @Autowired
  public void setExceptionHandlerFilter(ExceptionHandlerFilter exceptionHandlerFilter) {
    this.exceptionHandlerFilter = exceptionHandlerFilter;
  }
  
  @Autowired
  public void setApiKeyAuthenticationFilter(
      ApiKeyAuthenticationFilter apiKeyAuthenticationFilter) {
    this.apiKeyAuthenticationFilter = apiKeyAuthenticationFilter;
  }

  @Autowired
  public void setSysAdminKeyAuthenticationFilter(
      SysAdminKeyAuthenticationFilter sysAdminKeyAuthenticationFilter) {
    this.sysAdminKeyAuthenticationFilter = sysAdminKeyAuthenticationFilter;
  }

  @Bean
  public JwtTokenFilter tokenAuthenticationFilter() {
    return new JwtTokenFilter(jwtTokenProvider, userDetailsService);
  }

  @Bean
  public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http
      .csrf().disable()
      .headers()
      .frameOptions().sameOrigin()
      .and()
      .sessionManagement()
      .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
      .and()
      .exceptionHandling()
      .authenticationEntryPoint(authenticationEntryPoint)
      .and()
      .formLogin().disable()
      .httpBasic().disable()
      .authorizeHttpRequests()
      .antMatchers("/", "/favicon.ico", "/static/**").permitAll()
      .antMatchers(HttpMethod.POST, AppConstants.API_PREFIX + AppConstants.API_VERSION + "/auth/**").permitAll()
      .antMatchers(HttpMethod.POST, AppConstants.API_PREFIX + AppConstants.API_VERSION + "/stripe/webhook").permitAll()
      .antMatchers(HttpMethod.POST, AppConstants.API_PREFIX + AppConstants.API_VERSION + "/ai-toc/**").permitAll()
      .antMatchers(AppConstants.API_PREFIX + AppConstants.API_VERSION + "/public/counters/**").permitAll()
      .antMatchers(AppConstants.API_PREFIX + AppConstants.API_VERSION + "/public/**").permitAll()
      .antMatchers("/api-docs").permitAll()
      .antMatchers(AppConstants.API_PREFIX + AppConstants.API_VERSION + "/sysadmin/**").permitAll()
      .antMatchers(HttpMethod.GET, "/**").permitAll()
      .anyRequest().authenticated()
      .and()
      .addFilterBefore(exceptionHandlerFilter, HeaderWriterFilter.class)
      .addFilterBefore(sysAdminKeyAuthenticationFilter,
          UsernamePasswordAuthenticationFilter.class)
      .addFilterBefore(tokenAuthenticationFilter(),
          UsernamePasswordAuthenticationFilter.class)
      .addFilterAfter(apiKeyAuthenticationFilter, ExceptionHandlerFilter.class);

    if (sslEnabled) {
      http.requiresChannel().anyRequest().requiresSecure();
    }

    return http.build();
  }

  @Bean
  public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration configuration = new CorsConfiguration();
    configuration.setAllowedOriginPatterns(Arrays.asList("*"));
    // SSE requires GET and OPTIONS at minimum, but browsers may also send HEAD and POST for preflight
    configuration.setAllowedMethods(Arrays.asList("GET", "HEAD", "POST", "OPTIONS"));
    configuration.setAllowedHeaders(Arrays.asList("*"));
    // SSE-specific headers
    configuration.setExposedHeaders(Arrays.asList(
        "Cache-Control", 
        "Content-Type", 
        "Content-Length", 
        "Date", 
        "Etag", 
        "Last-Modified",
        "X-Accel-Buffering"  // Prevents proxy buffering of SSE
    ));
    configuration.setAllowCredentials(false);
    configuration.setMaxAge(3600L); // Cache preflight for 1 hour

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/api/v1/public/**", configuration);
    return source;
  }
}
