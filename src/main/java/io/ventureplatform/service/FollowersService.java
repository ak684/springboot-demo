package io.ventureplatform.service;

import io.ventureplatform.entity.Followers;
import io.ventureplatform.entity.Venture;
import io.ventureplatform.repository.FollowersRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Date;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FollowersService extends AbstractBaseEntityService<Followers> {
  private final FollowersRepository followersRepository;

  public List<Followers> getTotalFollowers(Venture venture, Integer days) {
    List<Followers> followers = followersRepository.getLatestFollowers(venture.getId());

    followers.forEach(item -> {
      int daysToSubtract = days > 0 ? days : Short.MAX_VALUE;
      LocalDate daysAgo = LocalDate.now().minusDays(daysToSubtract);
      Date date = Date.from(daysAgo.atStartOfDay(ZoneId.systemDefault()).toInstant());
      item.setChange(
        followersRepository.getValueChangeForVentureAndType(venture.getId(), item.getType().toString(), date)
      );
    });

    return followers;
  }
}
