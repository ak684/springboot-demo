package io.ventureplatform.facade;

import io.ventureplatform.dto.request.TeamMemberRequest;
import io.ventureplatform.dto.response.TeamMemberResponse;
import io.ventureplatform.entity.Portfolio;
import io.ventureplatform.entity.Venture;
import io.ventureplatform.entity.TeamMember;
import io.ventureplatform.service.TeamMemberService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class TeamMemberFacade extends AbstractDtoFacade<TeamMemberRequest, TeamMemberResponse, TeamMember> {
  private final TeamMemberService teamMemberService;

  public TeamMemberResponse addTeamMember(TeamMemberRequest request, Venture venture) {
    return entityToDto(teamMemberService.addTeamMember(dtoToEntity(request), venture));
  }

  public TeamMemberResponse addTeamMemberPortfolio(TeamMemberRequest request, Portfolio portfolio) {
    return entityToDto(teamMemberService.addTeamMemberPortfolio(dtoToEntity(request), portfolio));
  }

  public TeamMemberResponse editTeamMember(TeamMemberRequest request, TeamMember existing) {
    return entityToDto(teamMemberService.editTeamMember(dtoToEntity(request), existing));
  }
}
