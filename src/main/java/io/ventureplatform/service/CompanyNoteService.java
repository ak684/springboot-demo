package io.ventureplatform.service;

import io.ventureplatform.entity.CompanyExtractionData;
import io.ventureplatform.entity.CompanyNote;
import io.ventureplatform.entity.Portfolio;
import io.ventureplatform.repository.CompanyExtractionDataRepository;
import io.ventureplatform.repository.CompanyNoteRepository;
import io.ventureplatform.repository.PortfolioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

/**
 * Service for managing portfolio-scoped company notes.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CompanyNoteService {
  /**
   * Repository for company notes.
   */
  private final CompanyNoteRepository companyNoteRepository;
  /**
   * Repository for company extraction data.
   */
  private final CompanyExtractionDataRepository companyExtractionDataRepository;
  /**
   * Repository for portfolios.
   */
  private final PortfolioRepository portfolioRepository;
  /**
   * Service for security checks.
   */
  private final SecurityService securityService;

  /**
   * Get a note for a specific company and portfolio.
   *
   * @param companyId the company extraction data ID
   * @param portfolioId the portfolio ID
   * @return the note content or null if not found
   */
  public String getNote(final Long companyId, final Long portfolioId) {
    if (!securityService.isSuperAdmin()
        && !securityService.isPortfolioMember(null, portfolioId)) {
      throw new AccessDeniedException(
          "You don't have access to this portfolio");
    }

    return companyNoteRepository
        .findByCompanyExtractionDataIdAndPortfolioId(companyId, portfolioId)
        .map(CompanyNote::getContent)
        .orElse(null);
  }

  /**
   * Save or update a note for a company within a portfolio.
   *
   * @param companyId the company extraction data ID
   * @param portfolioId the portfolio ID
   * @param content the note content
   * @return the saved note
   */
  @Transactional
  public CompanyNote saveNote(
      final Long companyId,
      final Long portfolioId,
      final String content) {
    if (!securityService.isSuperAdmin()
        && !securityService.isPortfolioMember(null, portfolioId)) {
      throw new AccessDeniedException(
          "You don't have access to this portfolio");
    }

    CompanyExtractionData company = companyExtractionDataRepository
        .findById(companyId)
        .orElseThrow(() -> new IllegalArgumentException(
            "Company not found: " + companyId));

    Portfolio portfolio = portfolioRepository
        .findById(portfolioId)
        .orElseThrow(() -> new IllegalArgumentException(
            "Portfolio not found: " + portfolioId));

    Optional<CompanyNote> existingNote = companyNoteRepository
        .findByCompanyExtractionDataIdAndPortfolioId(companyId, portfolioId);

    CompanyNote note;
    if (existingNote.isPresent()) {
      note = existingNote.get();
      note.setContent(content);
    } else {
      note = new CompanyNote()
          .setCompanyExtractionData(company)
          .setPortfolio(portfolio)
          .setContent(content);
    }

    log.info("Saving note for company {} in portfolio {}", companyId,
        portfolioId);
    return companyNoteRepository.save(note);
  }

  /**
   * Delete a note for a company within a portfolio.
   *
   * @param companyId the company extraction data ID
   * @param portfolioId the portfolio ID
   */
  @Transactional
  public void deleteNote(final Long companyId, final Long portfolioId) {
    if (!securityService.isSuperAdmin()
        && !securityService.isPortfolioMember(null, portfolioId)) {
      throw new AccessDeniedException(
          "You don't have access to this portfolio");
    }

    companyNoteRepository
        .deleteByCompanyExtractionDataIdAndPortfolioId(companyId, portfolioId);
    log.info("Deleted note for company {} in portfolio {}", companyId,
        portfolioId);
  }
}
