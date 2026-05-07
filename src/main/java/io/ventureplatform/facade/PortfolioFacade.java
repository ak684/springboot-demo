package io.ventureplatform.facade;

import io.ventureplatform.dto.request.PortfolioRequest;
import io.ventureplatform.dto.response.PortfolioResponse;
import io.ventureplatform.entity.Portfolio;
import io.ventureplatform.entity.User;
import io.ventureplatform.service.PortfolioService;
import io.ventureplatform.util.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class PortfolioFacade extends AbstractDtoFacade<PortfolioRequest, PortfolioResponse, Portfolio> {
  private final PortfolioService portfolioService;

  public PortfolioResponse createPortfolio(User user, PortfolioRequest request) {
    return entityToDto(portfolioService.createPortfolio(user, dtoToEntity(request)));
  }

  public List<PortfolioResponse> findMyPortfolios(@CurrentUser User user) {
    return entitiesToDtoList(portfolioService.findMyPortfolios(user));
  }

  public PortfolioResponse editPortfolio(Portfolio portfolio, PortfolioRequest request) {
    return entityToDto(portfolioService.editPortfolio(portfolio, request));
  }

  public PortfolioResponse getPublicPortfolio(Portfolio portfolio) {
    return entityToDto(portfolioService.getPublicPortfolio(portfolio));
  }
}
