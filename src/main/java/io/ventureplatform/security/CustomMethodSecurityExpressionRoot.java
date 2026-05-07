package io.ventureplatform.security;

import io.ventureplatform.service.SecurityService;
import lombok.NonNull;
import org.springframework.security.access.expression.SecurityExpressionRoot;
import org.springframework.security.access.expression.method.MethodSecurityExpressionOperations;
import org.springframework.security.core.Authentication;

public class CustomMethodSecurityExpressionRoot extends SecurityExpressionRoot
  implements MethodSecurityExpressionOperations {

  private final SecurityService securityService;

  private Object filterObject;
  private Object returnObject;

  public CustomMethodSecurityExpressionRoot(Authentication authentication, @NonNull SecurityService securityService) {
    super(authentication);
    this.securityService = securityService;
  }

  public boolean isMember(Long organizationId, Long ventureId) {
    return securityService.isMember(organizationId, ventureId);
  }

  public boolean editAllowed(Long ventureId) {
    return securityService.editAllowed(ventureId);
  }

  public boolean proSubscription(Long ventureId) {
    return securityService.proSubscription(ventureId);
  }

  public boolean isPortfolioMember(Long organizationId, Long portfolioId) {
    return securityService.isPortfolioMember(organizationId, portfolioId);
  }

  public boolean isPortfolioVenture(Long ventureId, Long portfolioId) {
    return securityService.isPortfolioMember(ventureId, portfolioId);
  }

  public boolean isSuperAdmin() {
    return securityService.isSuperAdmin();
  }

  public boolean isSysAdminOrSuperAdmin() {
    return securityService.isSysAdminOrSuperAdmin();
  }

  public boolean canAccessCompany(Long companyId) {
    return securityService.canAccessCompany(companyId);
  }

  public boolean canEditCompanyPublicProfile(Long companyId) {
    return securityService.canEditCompanyPublicProfile(companyId);
  }

  public boolean portfolioExists(Long portfolioId) {
    return securityService.portfolioExists(portfolioId);
  }

  @Override
  public void setFilterObject(Object filterObject) {
    this.filterObject = filterObject;
  }

  @Override
  public Object getFilterObject() {
    return filterObject;
  }

  @Override
  public void setReturnObject(Object returnObject) {
    this.returnObject = returnObject;
  }

  @Override
  public Object getReturnObject() {
    return returnObject;
  }

  @Override
  public Object getThis() {
    return this;
  }
}
