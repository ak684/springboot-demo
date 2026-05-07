package io.ventureplatform.security;

import io.ventureplatform.service.SecurityService;
import lombok.RequiredArgsConstructor;
import org.aopalliance.intercept.MethodInvocation;
import org.springframework.security.access.expression.method.DefaultMethodSecurityExpressionHandler;
import org.springframework.security.access.expression.method.MethodSecurityExpressionOperations;
import org.springframework.security.authentication.AuthenticationTrustResolver;
import org.springframework.security.authentication.AuthenticationTrustResolverImpl;
import org.springframework.security.core.Authentication;

@RequiredArgsConstructor
public class CustomMethodSecurityExpressionHandler
  extends DefaultMethodSecurityExpressionHandler {
  private final SecurityService securityService;

  private final AuthenticationTrustResolver trustResolver = new AuthenticationTrustResolverImpl();

  @Override
  protected MethodSecurityExpressionOperations createSecurityExpressionRoot(
    Authentication authentication, MethodInvocation invocation) {
    CustomMethodSecurityExpressionRoot root =
      new CustomMethodSecurityExpressionRoot(authentication, securityService);
    root.setPermissionEvaluator(getPermissionEvaluator());
    root.setTrustResolver(this.trustResolver);
    root.setRoleHierarchy(getRoleHierarchy());
    return root;
  }
}
