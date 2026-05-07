package io.ventureplatform.service;

import io.ventureplatform.entity.PortfolioVentureAccess;
import io.ventureplatform.repository.PortfolioVentureAccessRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PortfolioVentureAccessService extends AbstractBaseEntityService<PortfolioVentureAccess> {
  private final PortfolioVentureAccessRepository portfolioVentureAccessRepository;

  public void batchHidePublicVentures(List<PortfolioVentureAccess> portfolioVentureAccesses) {
    Map<Long, PortfolioVentureAccess> map = portfolioVentureAccesses.stream()
      .collect(Collectors.toMap(PortfolioVentureAccess::getId, Function.identity()));

    List<PortfolioVentureAccess> existing = portfolioVentureAccessRepository.findAllByIdIn(map.keySet());

    existing.forEach(access -> access.setPublicHidden(map.get(access.getId()).getPublicHidden()));

    portfolioVentureAccessRepository.saveAll(existing);
  }
}
