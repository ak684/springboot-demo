package io.ventureplatform.service;

import io.ventureplatform.dto.request.TeamMemberRequest;
import io.ventureplatform.entity.Portfolio;
import io.ventureplatform.entity.Venture;
import io.ventureplatform.entity.TeamMember;
import io.ventureplatform.repository.TeamMemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TeamMemberService extends AbstractBaseEntityService<TeamMember> {
  private final TeamMemberRepository teamMemberRepository;

  public TeamMember addTeamMember(TeamMember teamMember, Venture venture) {
    teamMember.setVenture(venture);
    teamMember.setSortOrder(venture.getTeam().size());
    return teamMemberRepository.save(teamMember);
  }

  public TeamMember addTeamMemberPortfolio(TeamMember teamMember, Portfolio portfolio) {
    teamMember.setPortfolio(portfolio);
    teamMember.setSortOrder(portfolio.getTeam().size());
    return teamMemberRepository.save(teamMember);
  }

  public TeamMember editTeamMember(TeamMember update, TeamMember existing) {
    BeanUtils.copyProperties(update, existing, "id", "venture");
    return teamMemberRepository.save(existing);
  }

  public void updateTeamMembersOrderAndType(List<TeamMemberRequest> request) {
    List<Long> ids = request.stream().map(TeamMemberRequest::getId).toList();
    List<TeamMember> members = teamMemberRepository.findAllById(ids);
    for (int i = 0; i < request.size(); i++) {
      int finalI = i;
      TeamMember member = members.stream()
        .filter(m -> m.getId().equals(request.get(finalI).getId()))
        .findFirst().get();
      member.setSortOrder(i);
      member.setType(request.get(i).getType());
    }

    teamMemberRepository.saveAll(members);
  }
}
