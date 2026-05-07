package io.ventureplatform.configuration;

import lombok.RequiredArgsConstructor;
import org.springframework.core.Ordered;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.net.URI;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class CanonicalDomainRedirectFilter extends OncePerRequestFilter implements Ordered {
  private static final String WWW_PREFIX = "www.";

  private final BrandingProperties brandingProperties;

  @Override
  public int getOrder() {
    return Ordered.HIGHEST_PRECEDENCE;
  }

  @Override
  protected void doFilterInternal(
      final HttpServletRequest request,
      final HttpServletResponse response,
      final FilterChain filterChain
  ) throws ServletException, IOException {
    String hostHeader = request.getHeader("Host");
    if (!StringUtils.hasText(hostHeader)) {
      filterChain.doFilter(request, response);
      return;
    }

    String hostname = extractHostname(hostHeader);
    if (!hostname.startsWith(WWW_PREFIX)) {
      filterChain.doFilter(request, response);
      return;
    }

    Map<String, RedirectTarget> canonicalHosts = resolveCanonicalHosts();
    String bareHost = hostname.substring(WWW_PREFIX.length());
    RedirectTarget target = canonicalHosts.get(bareHost);
    if (target == null) {
      filterChain.doFilter(request, response);
      return;
    }

    String scheme = resolveScheme(request, target.scheme);
    String redirectHost = buildRedirectHost(target);
    String redirectUrl = buildRedirectUrl(request, scheme, redirectHost);

    response.setStatus(HttpServletResponse.SC_MOVED_PERMANENTLY);
    response.setHeader("Location", redirectUrl);
    return;
  }

  private Map<String, RedirectTarget> resolveCanonicalHosts() {
    Map<String, RedirectTarget> hosts = new LinkedHashMap<>();
    String appUrl = brandingProperties.normalizeUrl(brandingProperties.getAppBaseUrl());
    redirectTarget(appUrl).ifPresent(target -> hosts.put(target.host, target));
    String mapUrl = brandingProperties.normalizeUrl(brandingProperties.getMapBaseUrl());
    redirectTarget(mapUrl).ifPresent(target -> hosts.putIfAbsent(target.host, target));
    return hosts;
  }

  private String extractHostname(final String hostHeader) {
    String value = hostHeader.trim().toLowerCase(Locale.ROOT);
    int portSeparator = value.indexOf(':');
    if (portSeparator >= 0) {
      return value.substring(0, portSeparator);
    }
    return value;
  }

  private String resolveScheme(final HttpServletRequest request, final String preferredScheme) {
    if (StringUtils.hasText(preferredScheme)) {
      return preferredScheme;
    }
    String forwardedProto = request.getHeader("X-Forwarded-Proto");
    if (StringUtils.hasText(forwardedProto)) {
      return forwardedProto;
    }
    return request.getScheme();
  }

  private String buildRedirectHost(final RedirectTarget target) {
    if (target.port < 0 || target.port == defaultPort(target.scheme)) {
      return target.host;
    }
    return target.host + ":" + target.port;
  }

  private String buildRedirectUrl(
      final HttpServletRequest request,
      final String scheme,
      final String host
  ) {
    StringBuilder location = new StringBuilder();
    location
      .append(scheme)
      .append("://")
      .append(host)
      .append(request.getRequestURI());
    String query = request.getQueryString();
    if (StringUtils.hasText(query)) {
      location.append('?').append(query);
    }
    return location.toString();
  }

  private java.util.Optional<RedirectTarget> redirectTarget(final String baseUrl) {
    try {
      URI uri = URI.create(baseUrl);
      String host = uri.getHost();
      if (!StringUtils.hasText(host)) {
        return java.util.Optional.empty();
      }
      int port = uri.getPort();
      String scheme = uri.getScheme();
      return java.util.Optional.of(new RedirectTarget(host.toLowerCase(Locale.ROOT), scheme, port));
    } catch (IllegalArgumentException ex) {
      throw new IllegalStateException("Invalid canonical URL: " + baseUrl, ex);
    }
  }

  private int defaultPort(final String scheme) {
    if ("https".equalsIgnoreCase(scheme)) {
      return 443;
    }
    if ("http".equalsIgnoreCase(scheme)) {
      return 80;
    }
    return -1;
  }

  private static final class RedirectTarget {
    private final String host;
    private final String scheme;
    private final int port;

    private RedirectTarget(final String host, final String scheme, final int port) {
      this.host = host;
      this.scheme = scheme;
      this.port = port;
    }
  }
}
