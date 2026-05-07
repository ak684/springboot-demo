package io.ventureplatform.repository;

import io.ventureplatform.entity.AggregatedIndicator;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AggregatedIndicatorRepository extends JpaRepository<AggregatedIndicator, Long> {

  List<AggregatedIndicator> findByPortfolioIdOrderByDisplayOrder(Long portfolioId);

  List<AggregatedIndicator> findByPortfolioIdAndIsMainTrueOrderByDisplayOrder(Long portfolioId);

  List<AggregatedIndicator> findByParentIndicatorIdOrderByHoverSlot(Long parentIndicatorId);

  @Query("SELECT COALESCE(MAX(a.displayOrder), 0) FROM AggregatedIndicator a WHERE a.portfolioId = :portfolioId")
  Integer findMaxDisplayOrder(@Param("portfolioId") Long portfolioId);

  Optional<AggregatedIndicator> findByPortfolioIdAndId(Long portfolioId, Long id);
}
