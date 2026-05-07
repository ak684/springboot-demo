package io.ventureplatform.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.ventureplatform.constant.AppConstants;
import io.ventureplatform.dto.response.CounterResponse;
import io.ventureplatform.service.CounterService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import javax.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping(value = AppConstants.API_PREFIX + AppConstants.API_VERSION + "/public/counters")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class PublicCounterController {
  private final CounterService counterService;
  private final ObjectMapper objectMapper;
  private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(10);
  private final Map<String, Map<SseEmitter, ScheduledFuture<?>>> counterEmitters = 
      new ConcurrentHashMap<>();

  @GetMapping("/{counterId}")
  public ResponseEntity<CounterResponse> getCounter(@PathVariable String counterId) {
    try {
      CounterResponse counter = counterService.getCounterById(counterId);
      return ResponseEntity.ok(counter);
    } catch (Exception e) {
      log.error("Error fetching counter {}: {}", counterId, e.getMessage());
      return ResponseEntity.notFound().build();
    }
  }

  @GetMapping(value = "/{counterId}/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
  public SseEmitter streamCounter(@PathVariable String counterId, HttpServletResponse response) {
    // Set SSE-specific headers for better cross-origin compatibility
    response.setHeader("Cache-Control", "no-cache");
    response.setHeader("Connection", "keep-alive");
    response.setHeader("X-Accel-Buffering", "no"); // Disable proxy buffering
    
    SseEmitter emitter = new SseEmitter(3600000L); // 1 hour timeout
    log.info("Setting up SSE stream for counter: {} from origin: {}", counterId, response.getHeader("Origin"));

    try {
      // Verify counter exists and is active
      CounterResponse counter = counterService.getCounterById(counterId);
      if (!counter.getIsActive()) {
        emitter.completeWithError(new RuntimeException("Counter is not active"));
        return emitter;
      }

      // Send initial value immediately
      sendCounterUpdate(emitter, counter);

      // Schedule periodic updates every second
      ScheduledFuture<?> scheduledTask = scheduler.scheduleAtFixedRate(() -> {
        try {
          CounterResponse updatedCounter = counterService.getCounterById(counterId);
          sendCounterUpdate(emitter, updatedCounter);
        } catch (Exception e) {
          log.error("Error sending counter update for counter {}: {}", counterId, e.getMessage());
          emitter.completeWithError(e);
          removeEmitter(counterId, emitter);
        }
      }, 1, 1, TimeUnit.SECONDS);

      // Add emitter to tracking map with its scheduled task
      counterEmitters.computeIfAbsent(counterId, k -> new ConcurrentHashMap<>())
          .put(emitter, scheduledTask);

      // Handle client disconnect
      emitter.onCompletion(() -> removeEmitter(counterId, emitter));
      emitter.onTimeout(() -> removeEmitter(counterId, emitter));
      emitter.onError(throwable -> removeEmitter(counterId, emitter));

    } catch (Exception e) {
      log.error("Error setting up SSE stream for counter {}: {}", counterId, e.getMessage());
      emitter.completeWithError(e);
    }

    return emitter;
  }

  private void sendCounterUpdate(SseEmitter emitter, CounterResponse counter) {
    try {
      Map<String, Object> data = Map.of(
          "id", counter.getId(),
          "name", counter.getName(),
          "currentValue", counter.getCurrentValue(),
          "formattedCurrentValue", counter.getFormattedCurrentValue(),
          "showDecimals", counter.getShowDecimals(),
          "numberFormat", counter.getNumberFormat(),
          "type", counter.getType().toString()
      );

      emitter.send(SseEmitter.event()
          .name("counter-update")
          .data(objectMapper.writeValueAsString(data)));

    } catch (IOException e) {
      log.error("Error sending SSE event: {}", e.getMessage());
      emitter.completeWithError(e);
    }
  }

  private void removeEmitter(String counterId, SseEmitter emitter) {
    Map<SseEmitter, ScheduledFuture<?>> emitters = counterEmitters.get(counterId);
    if (emitters != null) {
      ScheduledFuture<?> task = emitters.remove(emitter);
      if (task != null) {
        task.cancel(false);
      }
      if (emitters.isEmpty()) {
        counterEmitters.remove(counterId);
      }
    }
  }

  // Endpoint to trigger real-time updates when admin modifies counter
  public void notifyCounterUpdate(String counterId) {
    Map<SseEmitter, ScheduledFuture<?>> emitters = counterEmitters.get(counterId);
    if (emitters != null) {
      try {
        CounterResponse counter = counterService.getCounterById(counterId);
        emitters.keySet().forEach(emitter -> sendCounterUpdate(emitter, counter));
      } catch (Exception e) {
        log.error("Error notifying counter update for counter {}: {}", counterId, e.getMessage());
      }
    }
  }
}
