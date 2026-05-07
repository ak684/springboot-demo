package io.ventureplatform.facade;

import io.ventureplatform.dto.request.UpdateOrderRequest;
import io.ventureplatform.dto.request.VentureRequest;
import io.ventureplatform.dto.response.VentureResponse;
import io.ventureplatform.entity.Portfolio;
import io.ventureplatform.entity.PortfolioVentureAccess;
import io.ventureplatform.entity.User;
import io.ventureplatform.entity.Venture;
import io.ventureplatform.service.VentureService;
import io.ventureplatform.util.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class VentureFacade extends AbstractDtoFacade<VentureRequest, VentureResponse, Venture> {
  private final VentureService ventureService;

  public List<VentureResponse> findMyVentures(@CurrentUser User user) {
    return entitiesToDtoList(ventureService.findMyVentures(user));
  }

  public VentureResponse updateImpactOrder(Venture venture, UpdateOrderRequest request) {
    return entityToDto(ventureService.updateImpactOrder(venture, request));
  }

  public VentureResponse editVenture(Venture venture, VentureRequest request) {
    return entityToDto(ventureService.editVenture(venture, request));
  }

  public VentureResponse getPitchVenture(String uuid, boolean userAuthenticated) {
    return entityToDto(ventureService.getPitchVenture(uuid, userAuthenticated));
  }

  public List<VentureResponse> getPublicVentures(Integer days) {
    return entitiesToDtoList(ventureService.getPublicVentures(days));
  }

  public VentureResponse getPublicVenture(Venture venture) {
    return entityToDto(ventureService.getPublicVenture(venture,7));
  }

  public List<VentureResponse> getPublicPortfolioVentures(Portfolio portfolio, Integer days) {
    return entitiesToDtoList(portfolio.getVentures().stream()
      .filter(v -> v.getPublicHidden() == null || Boolean.FALSE.equals(v.getPublicHidden()))
      .map(PortfolioVentureAccess::getVenture)
      .map(v -> ventureService.getPublicVenture(v, days))
      .toList());
  }

  public VentureResponse createVenture(User user, VentureRequest request) {
    return entityToDto(ventureService.createVenture(user, dtoToEntity(request)));
  }

  public VentureResponse activateVenture(User user, Venture venture) {
    return entityToDto(ventureService.activateVenture(user, venture));
  }
}
