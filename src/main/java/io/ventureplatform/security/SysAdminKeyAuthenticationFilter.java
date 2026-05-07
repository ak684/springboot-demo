package io.ventureplatform.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Collections;

/**
 * Filter that authenticates requests with a valid X-Sys-Admin-Key header.
 * This allows AI agents to access protected endpoints without JWT.
 */
@Component
public class SysAdminKeyAuthenticationFilter extends OncePerRequestFilter {

  private static final String SYS_ADMIN_KEY_HEADER = "X-Sys-Admin-Key";
  private static final String SYS_ADMIN_PRINCIPAL = "sysadmin@system";

  @Value("${sysadmin.api-key:}")
  private String sysAdminApiKey;

  @Override
  protected void doFilterInternal(
      final HttpServletRequest request,
      final HttpServletResponse response,
      final FilterChain filterChain) throws ServletException, IOException {

    String providedKey = request.getHeader(SYS_ADMIN_KEY_HEADER);

    if (StringUtils.hasLength(providedKey)
        && StringUtils.hasLength(sysAdminApiKey)
        && sysAdminApiKey.equals(providedKey)) {

      UsernamePasswordAuthenticationToken authentication =
          new UsernamePasswordAuthenticationToken(
              SYS_ADMIN_PRINCIPAL,
              null,
              Collections.singletonList(
                  new SimpleGrantedAuthority("ROLE_SYSADMIN")));

      SecurityContextHolder.getContext().setAuthentication(authentication);
    }

    filterChain.doFilter(request, response);
  }
}
