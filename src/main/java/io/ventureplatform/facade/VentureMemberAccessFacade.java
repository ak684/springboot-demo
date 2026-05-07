package io.ventureplatform.facade;

import io.ventureplatform.dto.request.VentureMemberAccessRequest;
import io.ventureplatform.dto.response.VentureMemberAccessResponse;
import io.ventureplatform.entity.VentureMemberAccess;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class VentureMemberAccessFacade extends
  AbstractDtoFacade<VentureMemberAccessRequest, VentureMemberAccessResponse, VentureMemberAccess> {
}
