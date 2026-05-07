package io.ventureplatform.repository;

import io.ventureplatform.entity.CompanyPatent;
import io.ventureplatform.entity.CompanyExtractionData;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for managing CompanyPatent entities.
 */
@Repository
public interface CompanyPatentRepository
    extends JpaRepository<CompanyPatent, Long> {

  /**
   * Find all patents for a specific company.
   */
  List<CompanyPatent> findByCompanyExtractionDataOrderByScrapedAtDesc(
      CompanyExtractionData company);

  /**
   * Find all patents for a specific company by ID.
   */
  List<CompanyPatent> findByCompanyExtractionDataIdOrderByScrapedAtDesc(
      Long companyId);

  /**
   * Find all patents for a company by ID (unordered).
   */
  List<CompanyPatent> findByCompanyExtractionDataId(Long companyId);

  /**
   * Check if a specific patent exists for a company.
   */
  boolean existsByCompanyExtractionDataAndPatentNumber(
      CompanyExtractionData company, String patentNumber);

  /**
   * Find a specific patent by company and patent number.
   */
  Optional<CompanyPatent> findByCompanyExtractionDataAndPatentNumber(
      CompanyExtractionData company, String patentNumber);

  /**
   * Count total patents for a company.
   */
  long countByCompanyExtractionData(CompanyExtractionData company);

  /**
   * Count granted patents for a company.
   */
  long countByCompanyExtractionDataAndIsGranted(
      CompanyExtractionData company, boolean isGranted);

  /**
   * Delete all patents for a specific company.
   */
  void deleteByCompanyExtractionData(CompanyExtractionData company);

  /**
   * Get the most recent scrape date for a company's patents.
   */
  @Query("SELECT MAX(cp.scrapedAt) FROM CompanyPatent cp "
      + "WHERE cp.companyExtractionData = :company")
  Optional<java.util.Date> findMostRecentScrapeDateForCompany(
      @Param("company") CompanyExtractionData company);

  /**
   * Find patents needing detail extraction.
   */
  @Query("SELECT cp.id FROM CompanyPatent cp "
      + "WHERE cp.detailsScrapedAt IS NULL "
      + "ORDER BY cp.id")
  List<Long> findPatentsNeedingDetails(Pageable pageable);

  /**
   * Find patents needing detail extraction for a specific company.
   */
  @Query("SELECT cp.id FROM CompanyPatent cp "
      + "WHERE cp.companyExtractionData.id = :companyId "
      + "AND cp.detailsScrapedAt IS NULL "
      + "ORDER BY cp.id")
  List<Long> findPatentIdsNeedingDetailsForCompany(@Param("companyId") Long companyId, 
                                                   Pageable pageable);

  /**
   * Find patents that need detail updates:
   * 1. Patents with no details (detailsScrapedAt is null)
   * 2. Patents with details older than 3 months
   * Ordered by detailsScrapedAt ASC (nulls first, then oldest)
   */
  @Query("SELECT cp.id FROM CompanyPatent cp "
      + "WHERE cp.detailsScrapedAt IS NULL "
      + "OR cp.detailsScrapedAt < :threeMonthsAgo "
      + "ORDER BY cp.detailsScrapedAt ASC NULLS FIRST")
  List<Long> findPatentsNeedingDetailUpdates(
      @Param("threeMonthsAgo") java.util.Date threeMonthsAgo,
      Pageable pageable);

  /**
   * Find distinct company IDs that have patents.
   * This queries actual patent records, not the total_patents count field.
   */
  @Query("SELECT DISTINCT cp.companyExtractionData.id FROM CompanyPatent cp "
      + "ORDER BY cp.companyExtractionData.id")
  List<Long> findDistinctCompanyIdsWithPatents();

}
