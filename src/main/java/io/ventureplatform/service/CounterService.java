package io.ventureplatform.service;

import io.ventureplatform.configuration.BrandingProperties;
import io.ventureplatform.dto.request.CounterRequest;
import io.ventureplatform.dto.response.CounterResponse;
import io.ventureplatform.entity.Counter;
import io.ventureplatform.exception.custom.ResourceNotFoundException;
import io.ventureplatform.repository.CounterRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

import static io.ventureplatform.constant.AppConstants.PROFILE_LOCAL;

@Service
@RequiredArgsConstructor
@Slf4j
public class CounterService {
  private final CounterRepository counterRepository;
  private final Environment environment;
  private final BrandingProperties brandingProperties;
  @Value("${application.backend.url}")
  private String backendBaseUrl;

  public BigDecimal calculateCurrentValue(Counter counter) {
    switch (counter.getType()) {
      case TARGET_BASED:
        return calculateTargetBasedValue(counter);

      case RATE_BASED:
        LocalDateTime createdAt = counter.getCreatedAt().toInstant()
            .atZone(ZoneId.systemDefault()).toLocalDateTime();
        long elapsedSeconds = Duration.between(createdAt, LocalDateTime.now()).getSeconds();
        BigDecimal increment = BigDecimal.valueOf(elapsedSeconds)
            .multiply(BigDecimal.valueOf(counter.getRatePerSecond()))
            .setScale(2, RoundingMode.HALF_UP);
        return counter.getStartValue().add(increment);

      case MANUAL:
        return counter.getStartValue(); // Admin updates this manually

      default:
        throw new IllegalStateException("Unknown counter type: " + counter.getType());
    }
  }

  private BigDecimal calculateTargetBasedValue(Counter counter) {
    LocalDateTime now = LocalDateTime.now();

    // If target date has passed, return target value (stop incrementing)
    if (now.isAfter(counter.getTargetDate())) {
      return counter.getTargetValue();
    }

    // Calculate rate and current value
    LocalDateTime createdAt = counter.getCreatedAt().toInstant()
        .atZone(ZoneId.systemDefault()).toLocalDateTime();
    BigDecimal totalIncrease = counter.getTargetValue().subtract(counter.getStartValue());
    long totalSeconds = Duration.between(createdAt, counter.getTargetDate()).getSeconds();
    long elapsedSeconds = Duration.between(createdAt, now).getSeconds();

    if (totalSeconds <= 0) {
      return counter.getTargetValue();
    }

    BigDecimal ratePerSecond = totalIncrease.divide(BigDecimal.valueOf(totalSeconds), 10, RoundingMode.HALF_UP);
    BigDecimal currentValue = counter.getStartValue()
        .add(ratePerSecond.multiply(BigDecimal.valueOf(elapsedSeconds)))
        .setScale(2, RoundingMode.HALF_UP);

    // Don't exceed target value
    return currentValue.min(counter.getTargetValue());
  }

  public String formatNumber(BigDecimal value, Counter counter) {
    if (value == null) {
      return "0";
    }

    // Determine if we should show decimals
    BigDecimal displayValue = value;
    if (!Boolean.TRUE.equals(counter.getShowDecimals())) {
      displayValue = value.setScale(0, RoundingMode.HALF_UP);
    }

    // Format based on numberFormat setting
    DecimalFormat formatter;
    if ("EU".equals(counter.getNumberFormat())) {
      // European format: 1.234,56
      DecimalFormatSymbols symbols = new DecimalFormatSymbols(Locale.GERMAN);
      formatter = new DecimalFormat("#,##0.00", symbols);
    } else if ("US".equals(counter.getNumberFormat())) {
      // US format: 1,234.56
      DecimalFormatSymbols symbols = new DecimalFormatSymbols(Locale.US);
      formatter = new DecimalFormat("#,##0.00", symbols);
    } else {
      // Default US format when null (browser will handle locale if needed)
      DecimalFormatSymbols symbols = new DecimalFormatSymbols(Locale.US);
      formatter = new DecimalFormat("#,##0.00", symbols);
    }

    if (!Boolean.TRUE.equals(counter.getShowDecimals())) {
      formatter.setMaximumFractionDigits(0);
      formatter.setMinimumFractionDigits(0);
    }

    return formatter.format(displayValue);
  }

  @Transactional
  public CounterResponse createCounter(CounterRequest request) {
    Counter counter = new Counter();
    BeanUtils.copyProperties(request, counter);
    counter = counterRepository.save(counter);
    return buildCounterResponse(counter);
  }
  
  @Transactional
  public CounterResponse createCounter(CounterRequest request, Long portfolioId) {
    Counter counter = new Counter();
    BeanUtils.copyProperties(request, counter);
    counter.setPortfolioId(portfolioId);
    counter = counterRepository.save(counter);
    return buildCounterResponse(counter);
  }

  public List<CounterResponse> getAllActiveCounters() {
    return counterRepository.findByIsActiveTrueOrderByCreatedAtDesc()
        .stream()
        .map(this::buildCounterResponse)
        .collect(Collectors.toList());
  }
  
  public List<CounterResponse> getAllActiveCounters(Long portfolioId) {
    if (portfolioId == null) {
      return getAllActiveCounters();
    }
    return counterRepository.findByPortfolioIdAndIsActiveTrueOrderByCreatedAtDesc(portfolioId)
        .stream()
        .map(this::buildCounterResponse)
        .collect(Collectors.toList());
  }

  public CounterResponse getCounterById(String id) {
    Counter counter = counterRepository.findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("Counter not found with id: " + id));
    return buildCounterResponse(counter);
  }

  @Transactional
  public CounterResponse updateCounter(String id, CounterRequest request) {
    Counter counter = counterRepository.findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("Counter not found with id: " + id));

    BeanUtils.copyProperties(request, counter, "id", "createdAt");
    counter = counterRepository.save(counter);
    return buildCounterResponse(counter);
  }

  @Transactional
  public void deleteCounter(String id) {
    Counter counter = counterRepository.findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("Counter not found with id: " + id));
    counter.setIsActive(false);
    counterRepository.save(counter);
  }

  public String generateEmbedCode(String counterId) {
    boolean isProduction = isProduction();
    String baseUrl = resolveBaseUrl(isProduction);

    return String.format(
        "<div id=\"impact-counter-%s\"></div>\n"
        + "<script src=\"%s/counter-widget.js\"></script>\n"
        + "<script>ImpactCounter.init('%s', 'impact-counter-%s');</script>",
        counterId, baseUrl, counterId, counterId
    );
  }

  private String resolveBaseUrl(boolean isProduction) {
    String configured = isProduction
      ? brandingProperties.getAppBaseUrl()
      : backendBaseUrl;
    return brandingProperties.normalizeUrl(configured);
  }

  private boolean isProduction() {
    // Check Spring active profiles
    String[] activeProfiles = environment.getActiveProfiles();
    return Arrays.asList(activeProfiles).contains("prod")
           || Arrays.asList(activeProfiles).contains("production")
           || !Arrays.asList(activeProfiles).contains(PROFILE_LOCAL);
  }

  private CounterResponse buildCounterResponse(Counter counter) {
    BigDecimal currentValue = calculateCurrentValue(counter);
    return CounterResponse.builder()
        .id(counter.getId())
        .name(counter.getName())
        .type(counter.getType())
        .startValue(counter.getStartValue())
        .targetValue(counter.getTargetValue())
        .targetDate(counter.getTargetDate())
        .ratePerSecond(counter.getRatePerSecond())
        .showDecimals(counter.getShowDecimals())
        .numberFormat(counter.getNumberFormat())
        .isActive(counter.getIsActive())
        .currentValue(currentValue)
        .formattedCurrentValue(formatNumber(currentValue, counter))
        .embedCode(generateEmbedCode(counter.getId()))
        .createdAt(counter.getCreatedAt())
        .lastModifiedAt(counter.getLastModifiedAt())
        .build();
  }
}
