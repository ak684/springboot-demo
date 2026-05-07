package io.ventureplatform.repository;

import io.ventureplatform.entity.Counter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CounterRepository extends JpaRepository<Counter, String> {
  List<Counter> findByIsActiveTrueOrderByCreatedAtDesc();
  
  List<Counter> findByPortfolioIdAndIsActiveTrueOrderByCreatedAtDesc(Long portfolioId);
  
  List<Counter> findByPortfolioIdOrderByCreatedAtDesc(Long portfolioId);
}
