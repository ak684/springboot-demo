package io.ventureplatform.repository;

import io.ventureplatform.entity.CompanyExtractionData;
import io.ventureplatform.entity.PortfolioCompanyExtractionAccess;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for managing portfolio-company extraction data access relationships.
 * Simple repository with only the methods we need for Phase 1.
 */
@Repository
public interface PortfolioCompanyExtractionAccessRepository extends JpaRepository<PortfolioCompanyExtractionAccess, Long> {

  /**
   * Check if a portfolio already has access to a company.
   *
   * @param companyExtractionDataId the company extraction data ID
   * @param portfolioId the portfolio ID
   * @return Optional access record
   */
  Optional<PortfolioCompanyExtractionAccess> findByCompanyExtractionDataIdAndPortfolioId(
      Long companyExtractionDataId, Long portfolioId);

  /**
   * Check if access record exists.
   *
   * @param companyExtractionDataId the company extraction data ID
   * @param portfolioId the portfolio ID
   * @return true if exists
   */
  boolean existsByCompanyExtractionDataIdAndPortfolioId(
      Long companyExtractionDataId, Long portfolioId);

  /**
   * Find all companies accessible through the given portfolios.
   *
   * @param portfolioIds List of portfolio IDs
   * @return List of CompanyExtractionData entities accessible through these portfolios
   */
  @Query("SELECT DISTINCT pcea.companyExtractionData FROM PortfolioCompanyExtractionAccess pcea " +
         "WHERE pcea.portfolio.id IN :portfolioIds")
  List<CompanyExtractionData> findCompaniesByPortfolioIds(@Param("portfolioIds") List<Long> portfolioIds);

  List<PortfolioCompanyExtractionAccess> findByCompanyExtractionDataId(
    Long companyExtractionDataId);

  /**
   * Delete all portfolio access records for a specific company.
   *
   * @param companyExtractionDataId the company ID
   */
  void deleteByCompanyExtractionDataId(Long companyExtractionDataId);

  /**
   * Delete a specific portfolio access record for a company and portfolio.
   *
   * @param companyExtractionDataId the company ID
   * @param portfolioId the portfolio ID
   */
  void deleteByCompanyExtractionDataIdAndPortfolioId(
      Long companyExtractionDataId, Long portfolioId);
}