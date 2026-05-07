package io.ventureplatform.facade;

import io.ventureplatform.dto.request.PortfolioMemberAccessRequest;
import io.ventureplatform.dto.response.PortfolioMemberAccessResponse;
import io.ventureplatform.entity.PortfolioMemberAccess;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class PortfolioMemberAccessFacade extends
  AbstractDtoFacade<PortfolioMemberAccessRequest, PortfolioMemberAccessResponse, PortfolioMemberAccess> {
}
