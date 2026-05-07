package io.ventureplatform.service;

import io.ventureplatform.configuration.BrandingProperties;
import io.ventureplatform.entity.Portfolio;
import io.ventureplatform.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import javax.servlet.http.HttpServletRequest;

@Service
@RequiredArgsConstructor
public class BrandResolver {
  private final BrandingService brandingService;

  public String getKeyForCurrentRequest() {
    RequestAttributes attrs = RequestContextHolder.getRequestAttributes();
    if (attrs instanceof ServletRequestAttributes) {
      HttpServletRequest request = ((ServletRequestAttributes) attrs).getRequest();
      String brandOverride = request.getParameter("brand");
      String host = request.getHeader("Host");
      return brandingService.resolveBrandKey(brandOverride, host);
    }
    return BrandingService.DEFAULT_BRAND;
  }

  public BrandingProperties forCurrentRequest() {
    return brandingService.getBrandingPropertiesForKey(getKeyForCurrentRequest());
  }

  public BrandingProperties forKey(final String brandKey) {
    return brandingService.getBrandingPropertiesForKey(brandKey);
  }

  public BrandingProperties forUser(final User user) {
    if (user == null || user.getHomeBrandKey() == null) {
      return brandingService.getDefaultBrandingProperties();
    }
    return brandingService.getBrandingPropertiesForKey(user.getHomeBrandKey());
  }

  public BrandingProperties forPortfolio(final Portfolio portfolio) {
    if (portfolio == null || portfolio.getBrandKey() == null) {
      return brandingService.getDefaultBrandingProperties();
    }
    return brandingService.getBrandingPropertiesForKey(portfolio.getBrandKey());
  }
}
