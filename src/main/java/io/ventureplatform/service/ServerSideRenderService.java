package io.ventureplatform.service;

import io.ventureplatform.configuration.BrandingProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.ui.ModelMap;

import javax.servlet.http.HttpServletRequest;

@Service
@RequiredArgsConstructor
@Slf4j
public class ServerSideRenderService {
  private final BrandingProperties brandingProperties;

  private String getRequestUrl(HttpServletRequest request) {
    String scheme = request.getScheme();
    String serverName = request.getServerName();
    int serverPort = request.getServerPort();
    String requestUri = request.getRequestURI();
    StringBuilder url = new StringBuilder();
    url.append(scheme).append("://").append(serverName);
    if ((scheme.equals("http") && serverPort != 80) || (scheme.equals("https") && serverPort != 443)) {
      url.append(":").append(serverPort);
    }

    url.append(requestUri);
    return url.toString();
  }

  public void getHtmlWithTags(HttpServletRequest request, ModelMap model) {
    try {
      model.addAttribute("title", "Venture impact platform");
      model.addAttribute("description", brandingProperties.getMetaDescription());
      model.addAttribute("url", getRequestUrl(request));
      String shareImage = request.getRequestURI().contains("ai-toc")
        ? brandingProperties.getShareImages().getAiTocImageUrl()
        : brandingProperties.getShareImages().getDefaultImageUrl();
      model.addAttribute("shareImage", shareImage);
    } catch (Exception e) {
      log.error(e.getMessage(), e);
    }
  }
}
