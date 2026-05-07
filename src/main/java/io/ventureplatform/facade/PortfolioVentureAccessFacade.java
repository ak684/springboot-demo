package io.ventureplatform.facade;

import io.ventureplatform.dto.request.PortfolioVentureAccessRequest;
import io.ventureplatform.dto.response.PortfolioVentureAccessResponse;
import io.ventureplatform.entity.Portfolio;
import io.ventureplatform.entity.PortfolioVentureAccess;
import io.ventureplatform.service.PortfolioVentureAccessService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class PortfolioVentureAccessFacade extends
  AbstractDtoFacade<PortfolioVentureAccessRequest, PortfolioVentureAccessResponse, PortfolioVentureAccess> {
  private final PortfolioVentureAccessService portfolioVentureAccessService;

  public List<PortfolioVentureAccessResponse> getPortfolioVentures(Portfolio portfolio) {
    return entitiesToDtoList(portfolio.getVentures());
  }

  public List<PortfolioVentureAccessResponse> getPublicPortfolioVenturesAll(Portfolio portfolio) {
    return entitiesToDtoList(portfolio.getVentures());
  }

  public void batchHidePublicVentures(List<PortfolioVentureAccessRequest> ventures) {
    portfolioVentureAccessService.batchHidePublicVentures(dtosToEntityList(ventures));
  }
}
