package io.ventureplatform.service;

import io.ventureplatform.entity.User;
import io.ventureplatform.entity.UserVentureDraft;
import io.ventureplatform.entity.UserVentureDraftId;
import io.ventureplatform.entity.Venture;
import io.ventureplatform.repository.UserVentureDraftRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserVentureDraftService {
  private final UserVentureDraftRepository userVentureDraftRepository;

  @Transactional
  public void toggleMarkVentureDraft(User user, Venture venture) {
    UserVentureDraftId id = new UserVentureDraftId(user.getId(), venture.getId());

    if (userVentureDraftRepository.existsById(id)) {
      userVentureDraftRepository.deleteByUserAndVenture(user, venture);
    } else {
      UserVentureDraft entity = new UserVentureDraft()
        .setUser(user)
        .setVenture(venture)
        .setId(id);
      userVentureDraftRepository.save(entity);
    }
  }
}
