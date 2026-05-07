package io.ventureplatform.repository;

import io.ventureplatform.entity.CompanyExtractionData;
import io.ventureplatform.entity.CompanyPatent;
import io.ventureplatform.entity.PatentEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Date;
import java.util.List;

@Repository
public interface PatentEventRepository
    extends JpaRepository<PatentEvent, Long> {

  /**
   * Find recent events for companies in the user's database.
   * A user can see patent events for ANY company they have
   * extracted/have access to, regardless of portfolio.
   * Uses portfolio_company_extraction_access table to determine
   * which companies the user can access through their portfolios.
   *
   * @param userId the user ID
   * @param organizationId the organization ID
   * @param since the date threshold
   * @return list of patent events
   */
  @Query("SELECT DISTINCT pe FROM PatentEvent pe "
      + "JOIN pe.companyExtractionData c "
      + "LEFT JOIN FETCH pe.companyPatent cp "
      + "WHERE c.id IN ("
      + "  SELECT pcea.companyExtractionData.id "
      + "  FROM PortfolioCompanyExtractionAccess pcea "
      + "  WHERE pcea.portfolio.id IN ("
      + "    SELECT p.id FROM Portfolio p "
      + "    LEFT JOIN p.members m "
      + "    WHERE m.member.id = :userId "
      + "    OR p.organization.id = :organizationId"
      + "  )"
      + ") "
      + "AND pe.createdAt >= :since "
      + "ORDER BY pe.createdAt DESC")
  List<PatentEvent> findEventsForUserSince(
      @Param("userId") Long userId,
      @Param("organizationId") Long organizationId,
      @Param("since") Date since);

  /**
   * Find events for companies in a specific portfolio.
   *
   * @param portfolioId the portfolio ID
   * @param since the date threshold
   * @return list of patent events
   */
  @Query("SELECT DISTINCT pe FROM PatentEvent pe "
      + "JOIN pe.companyExtractionData c "
      + "LEFT JOIN FETCH pe.companyPatent cp "
      + "WHERE c.id IN ("
      + "  SELECT pcea.companyExtractionData.id "
      + "  FROM PortfolioCompanyExtractionAccess pcea "
      + "  WHERE pcea.portfolio.id = :portfolioId"
      + ") "
      + "AND pe.createdAt >= :since "
      + "ORDER BY pe.createdAt DESC")
  List<PatentEvent> findEventsForPortfolioSince(
      @Param("portfolioId") Long portfolioId,
      @Param("since") Date since);

  /**
   * Find all events for a specific company.
   *
   * @param companyId the company ID
   * @return list of patent events
   */
  List<PatentEvent> findByCompanyExtractionDataIdOrderByCreatedAtDesc(
      Long companyId);

  /**
   * Find recent events across all companies (for super admin).
   *
   * @param since the date threshold
   * @return list of patent events
   */
  List<PatentEvent> findByCreatedAtAfterOrderByCreatedAtDesc(Date since);

  /**
   * Check if event already exists for company, patent, and type.
   *
   * @param companyExtractionData the company
   * @param companyPatent the patent
   * @param eventType the event type
   * @return true if exists
   */
  boolean existsByCompanyExtractionDataAndCompanyPatentAndEventType(
      CompanyExtractionData companyExtractionData,
      CompanyPatent companyPatent,
      String eventType);

  /**
   * Delete all patent events for a specific company.
   *
   * @param companyExtractionDataId the company ID
   */
  void deleteByCompanyExtractionDataId(Long companyExtractionDataId);

}
