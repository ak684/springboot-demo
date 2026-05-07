package io.ventureplatform.controller;

import io.ventureplatform.constant.AppConstants;
import io.ventureplatform.dto.response.BrandingResponse;
import io.ventureplatform.service.BrandingService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import javax.servlet.http.HttpServletRequest;

@RestController
@RequestMapping(AppConstants.API_PREFIX + AppConstants.API_VERSION + "/public/branding")
@RequiredArgsConstructor
public class PublicBrandingController {
  private final BrandingService brandingService;

  @GetMapping
  public BrandingResponse getBranding(
    @RequestParam(name = "brand", required = false) final String brand,
    final HttpServletRequest request
  ) {
    return brandingService.resolveBrandingResponse(brand, request.getHeader("Host"));
  }
}
