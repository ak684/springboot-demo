package io.ventureplatform.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.ventureplatform.dto.response.BrandingResponse;
import io.ventureplatform.service.BrandingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import javax.servlet.http.HttpServletRequest;

@RestController
@RequiredArgsConstructor
@Slf4j
public class BrandingAssetController {
  private static final MediaType JAVASCRIPT_MEDIA_TYPE = MediaType.valueOf("application/javascript");

  private final BrandingService brandingService;
  private final ObjectMapper objectMapper;

  @GetMapping(value = "/branding.js", produces = "application/javascript")
  public ResponseEntity<String> getBrandingScript(
    @RequestParam(name = "brand", required = false) final String brand,
    final HttpServletRequest request
  ) {
    try {
      BrandingResponse response = brandingService.resolveBrandingResponse(brand, request.getHeader("Host"));
      String payload = objectMapper.writeValueAsString(response);
      String script = "window.__BRANDING__ = " + payload + ";";
      return ResponseEntity.ok()
        .contentType(JAVASCRIPT_MEDIA_TYPE)
        .body(script);
    } catch (JsonProcessingException ex) {
      log.error("Failed to serialize branding configuration", ex);
      return ResponseEntity.internalServerError().body("console.error('Failed to load branding configuration');");
    }
  }
}
