package io.ventureplatform.facade;

import io.ventureplatform.dto.request.BaseRequest;
import io.ventureplatform.dto.response.FollowersResponse;
import io.ventureplatform.entity.Followers;
import io.ventureplatform.entity.Venture;
import io.ventureplatform.service.FollowersService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class FollowersFacade extends AbstractDtoFacade<BaseRequest, FollowersResponse, Followers> {
  private final FollowersService followersService;

  public List<FollowersResponse> getTotalFollowers(Venture venture, Integer days) {
    return entitiesToDtoList(followersService.getTotalFollowers(venture, days));
  }
}
