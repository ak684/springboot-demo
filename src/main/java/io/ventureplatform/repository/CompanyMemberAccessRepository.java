package io.ventureplatform.repository;

import io.ventureplatform.entity.CompanyMemberAccess;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Repository;

@Repository
public interface CompanyMemberAccessRepository extends BaseEntityRepository<CompanyMemberAccess> {
  List<CompanyMemberAccess> findByMemberId(Long memberId);

  Optional<CompanyMemberAccess> findByMemberIdAndCompanyId(Long memberId, Long companyId);

  boolean existsByMemberIdAndCompanyId(Long memberId, Long companyId);
}
