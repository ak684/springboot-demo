package io.ventureplatform.facade;

import io.ventureplatform.dto.request.AwardRequest;
import io.ventureplatform.dto.response.AwardResponse;
import io.ventureplatform.entity.Award;
import io.ventureplatform.entity.Venture;
import io.ventureplatform.service.AwardService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AwardFacade extends AbstractDtoFacade<AwardRequest, AwardResponse, Award> {
  private final AwardService awardService;

  public AwardResponse addAward(AwardRequest request, Venture venture) {
    return entityToDto(awardService.addAward(dtoToEntity(request), venture));
  }

  public AwardResponse editAward(AwardRequest request, Award existing) {
    return entityToDto(awardService.editAward(dtoToEntity(request), existing));
  }
}
