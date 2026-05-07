package io.ventureplatform.controller;

import io.ventureplatform.constant.AppConstants;
import io.ventureplatform.dto.request.CounterRequest;
import io.ventureplatform.dto.response.CounterResponse;
import io.ventureplatform.service.CounterService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestParam;

import javax.validation.Valid;
import java.util.List;

@RestController
@RequestMapping(value = AppConstants.API_PREFIX + AppConstants.API_VERSION + "/counters")
@RequiredArgsConstructor
public class CounterController {
  private final CounterService counterService;

  @PostMapping
  @PreAuthorize("isSuperAdmin() or (#portfolioId != null and isPortfolioMember(null, #portfolioId))")
  public ResponseEntity<CounterResponse> createCounter(
      @Valid @RequestBody CounterRequest request,
      @RequestParam(required = false) Long portfolioId) {
    if (portfolioId != null) {
      return ResponseEntity.ok(counterService.createCounter(request, portfolioId));
    }
    return ResponseEntity.ok(counterService.createCounter(request));
  }

  @GetMapping
  @PreAuthorize("isSuperAdmin() or (#portfolioId != null and isPortfolioMember(null, #portfolioId))")
  public ResponseEntity<List<CounterResponse>> getAllCounters(
      @RequestParam(required = false) Long portfolioId) {
    return ResponseEntity.ok(counterService.getAllActiveCounters(portfolioId));
  }

  @GetMapping("/{id}")
  @PreAuthorize("isSuperAdmin()")
  public ResponseEntity<CounterResponse> getCounter(@PathVariable String id) {
    return ResponseEntity.ok(counterService.getCounterById(id));
  }

  @PutMapping("/{id}")
  @PreAuthorize("isSuperAdmin()")
  public ResponseEntity<CounterResponse> updateCounter(@PathVariable String id, 
      @Valid @RequestBody CounterRequest request) {
    return ResponseEntity.ok(counterService.updateCounter(id, request));
  }

  @DeleteMapping("/{id}")
  @PreAuthorize("isSuperAdmin()")
  public ResponseEntity<Void> deleteCounter(@PathVariable String id) {
    counterService.deleteCounter(id);
    return ResponseEntity.ok().build();
  }
}
