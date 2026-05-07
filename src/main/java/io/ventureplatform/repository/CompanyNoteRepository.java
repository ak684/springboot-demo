package io.ventureplatform.repository;

import io.ventureplatform.entity.CompanyNote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository for managing portfolio-scoped company notes.
 */
@Repository
public interface CompanyNoteRepository
    extends JpaRepository<CompanyNote, Long> {

  /**
   * Find a note for a specific company and portfolio.
   *
   * @param companyExtractionDataId the company extraction data ID
   * @param portfolioId the portfolio ID
   * @return Optional containing the note if found
   */
  Optional<CompanyNote> findByCompanyExtractionDataIdAndPortfolioId(
      Long companyExtractionDataId, Long portfolioId);

  /**
   * Delete all notes for a specific company.
   *
   * @param companyExtractionDataId the company ID
   */
  void deleteByCompanyExtractionDataId(Long companyExtractionDataId);

  /**
   * Delete a note for a specific company and portfolio.
   *
   * @param companyExtractionDataId the company ID
   * @param portfolioId the portfolio ID
   */
  void deleteByCompanyExtractionDataIdAndPortfolioId(
      Long companyExtractionDataId, Long portfolioId);
}
