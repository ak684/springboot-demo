package io.ventureplatform.facade;

import io.ventureplatform.dto.request.ImpactIndicatorRequest;
import io.ventureplatform.dto.request.ImpactRequest;
import io.ventureplatform.dto.request.ImpactScoreRequest;
import io.ventureplatform.dto.request.UpdateImpactFieldRequest;
import io.ventureplatform.dto.response.ImpactResponse;
import io.ventureplatform.entity.Impact;
import io.ventureplatform.entity.ImpactIndicator;
import io.ventureplatform.entity.Venture;
import io.ventureplatform.service.ImpactService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ImpactFacade extends AbstractDtoFacade<ImpactRequest, ImpactResponse, Impact> {
  private final ImpactService impactService;
  private final ImpactIndicatorFacade indicatorFacade;
  private final ImpactScoreFacade impactScoreFacade;

  public ImpactResponse createImpact(Venture venture, ImpactRequest request) {
    return entityToDto(impactService.createImpact(venture, dtoToEntity(request)));
  }

  public ImpactResponse updateField(Impact impact, UpdateImpactFieldRequest request) {
    return entityToDto(impactService.updateField(impact, request));
  }

  public ImpactResponse toggleImpactDraft(Impact impact, Boolean draft) {
    return entityToDto(impactService.toggleImpactDraft(impact, draft));
  }

  public ImpactResponse editImpact(Impact impact, ImpactRequest request) {
    return entityToDto(impactService.editImpact(impact, dtoToEntity(request)));
  }

  public ImpactResponse quantifyImpact(Impact impact, ImpactRequest request) {
    return entityToDto(impactService.quantifyImpact(impact, dtoToEntity(request)));
  }

  public ImpactResponse addIndicator(Impact impact, ImpactIndicatorRequest request) {
    return entityToDto(impactService.addIndicator(impact, indicatorFacade.dtoToEntity(request)));
  }

  public ImpactResponse scoreImpact(Impact impact, ImpactScoreRequest request) {
    return entityToDto(impactService.scoreImpact(impact, impactScoreFacade.dtoToEntity(request), request));
  }

  public ImpactResponse editIndicator(ImpactIndicator indicator, ImpactIndicatorRequest request) {
    return entityToDto(impactService.editIndicator(indicator, request));
  }

  public ImpactResponse deleteIndicator(ImpactIndicator indicator) {
    return entityToDto(impactService.deleteIndicator(indicator));
  }
}
