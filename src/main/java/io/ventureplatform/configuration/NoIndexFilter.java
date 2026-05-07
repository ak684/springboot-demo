package io.ventureplatform.configuration;

import org.springframework.context.annotation.Profile;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import javax.servlet.Filter;
import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

import static io.ventureplatform.constant.AppConstants.PROFILE_EMBEDDED_POSTGRES;

/**
 * Adds X-Robots-Tag header to prevent search engine indexing.
 * Only active for embedded-postgres profile (PR previews).
 */
@Component
@Profile(PROFILE_EMBEDDED_POSTGRES)
@Order(Ordered.HIGHEST_PRECEDENCE)
public class NoIndexFilter implements Filter {

  @Override
  public void doFilter(
      final ServletRequest request,
      final ServletResponse response,
      final FilterChain chain) throws IOException, ServletException {
    if (response instanceof HttpServletResponse) {
      ((HttpServletResponse) response).setHeader("X-Robots-Tag", "noindex, nofollow");
    }
    chain.doFilter(request, response);
  }
}
