package io.ventureplatform.repository;

import io.ventureplatform.entity.Portfolio;
import io.ventureplatform.entity.PortfolioVentureAccess;
import io.ventureplatform.entity.Venture;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface PortfolioVentureAccessRepository extends BaseEntityRepository<PortfolioVentureAccess> {
  PortfolioVentureAccess findByVentureAndPortfolio(Venture venture, Portfolio portfolio);

  List<PortfolioVentureAccess> findAllByVenture(Venture venture);

  List<PortfolioVentureAccess> findAllByIdIn(Collection<Long> ids);
}
