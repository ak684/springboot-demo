package io.ventureplatform.configuration;

import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import javax.servlet.Filter;
import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

/**
 * Adds X-Robots-Tag header to prevent search engine indexing
 * for company overview public pages.
 *
 * <p>These pages display AI-generated, unverified content and
 * should not appear in search results.</p>
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class CompanyOverviewNoIndexFilter implements Filter {

  @Override
  public void doFilter(
      final ServletRequest request,
      final ServletResponse response,
      final FilterChain chain) throws IOException, ServletException {
    if (request instanceof HttpServletRequest
        && response instanceof HttpServletResponse) {
      HttpServletRequest httpRequest = (HttpServletRequest) request;
      String path = httpRequest.getRequestURI();

      if (path != null && path.startsWith("/company-overview")) {
        ((HttpServletResponse) response)
            .setHeader("X-Robots-Tag", "noindex, nofollow");
      }
    }
    chain.doFilter(request, response);
  }
}
