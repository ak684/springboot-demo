package io.ventureplatform.facade;

import io.ventureplatform.dto.request.ImpactIndicatorRequest;
import io.ventureplatform.dto.response.ImpactIndicatorResponse;
import io.ventureplatform.entity.ImpactIndicator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ImpactIndicatorFacade
  extends AbstractDtoFacade<ImpactIndicatorRequest, ImpactIndicatorResponse, ImpactIndicator> {
}
