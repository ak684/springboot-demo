package io.ventureplatform.configuration;

import io.ventureplatform.security.UserPrincipal;
import org.springframework.data.domain.AuditorAware;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
class SpringSecurityAuditorAware implements AuditorAware<Long> {

  @Override
  public Optional<Long> getCurrentAuditor() {
    SecurityContext context = SecurityContextHolder.getContext();

    if (context != null) {
      Authentication authentication = context.getAuthentication();
      if (authentication != null) {
        if (authentication.isAuthenticated() && !String.class.isAssignableFrom(authentication.getPrincipal().getClass())) {
          return Optional.of(((UserPrincipal) authentication.getPrincipal()).getId());
        }
      }
    }

    return Optional.of(-1L);
  }
}
