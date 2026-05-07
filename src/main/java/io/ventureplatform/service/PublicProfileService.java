package io.ventureplatform.service;

import io.ventureplatform.dto.request.GetPitchAccessRequest;
import io.ventureplatform.entity.User;
import io.ventureplatform.entity.Venture;
import io.ventureplatform.repository.VentureRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PublicProfileService {
  private final EmailService emailService;
  private final BrandResolver brandResolver;

  public void requestPitchAccess(GetPitchAccessRequest request, Venture venture) {
    User owner = venture.getOrganization().getUsers().get(0);
    emailService.sendRequestPitchAccessEmail(request, venture, owner, brandResolver.forCurrentRequest());
  }
}
