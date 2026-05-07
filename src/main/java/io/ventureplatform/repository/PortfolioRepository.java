package io.ventureplatform.repository;

import io.ventureplatform.entity.Organization;
import io.ventureplatform.entity.Portfolio;
import io.ventureplatform.entity.User;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PortfolioRepository extends BaseEntityRepository<Portfolio> {
  Portfolio findByInvitationCode(String code);

  @Query("SELECT p FROM Portfolio p WHERE "
    + "(LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')) OR "
    + "LOWER(p.website) LIKE LOWER(CONCAT('%', :search, '%'))) AND "
    + "p.publicSettings.shared = TRUE")
  List<Portfolio> searchPortfolios(String search);
}
