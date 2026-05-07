package io.ventureplatform.repository;

import io.ventureplatform.entity.CompanyExtractionData;
import io.ventureplatform.projection.CompanyExtractionDataLiteProjection;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for CompanyExtractionData entities.
 * Provides data access operations for extracted company data.
 */
@Repository
public interface CompanyExtractionDataRepository
    extends JpaRepository<CompanyExtractionData, Long> {

  /**
   * Find extraction data by company URL.
   *
   * @param companyUrl the company URL
   * @return Optional containing the extraction data if found
   */
  Optional<CompanyExtractionData> findByCompanyUrl(String companyUrl);

  /**
   * Find extraction data by domain.
   *
   * @param domain the company domain
   * @return Optional containing the extraction data if found
   */
  Optional<CompanyExtractionData> findByDomain(String domain);

  /**
   * Find all extraction data created by a specific user.
   *
   * @param createdBy the user ID who created the extraction
   * @return List of extraction data
   */
  List<CompanyExtractionData> findByCreatedByOrderByCreatedAtDesc(Long createdBy);

  /**
   * Find extraction data by exact company name.
   *
   * @param companyName the company name
   * @return List of matching extraction data
   */
  List<CompanyExtractionData> findByCompanyName(String companyName);

  /**
   * Find extraction data by company name (case-insensitive).
   *
   * @param companyName the company name
   * @return List of matching extraction data
   */
  @Query("SELECT c FROM CompanyExtractionData c WHERE LOWER(c.companyName) LIKE LOWER(CONCAT('%', :companyName, '%'))")
  List<CompanyExtractionData> findByCompanyNameContainingIgnoreCase(@Param("companyName") String companyName);

  /**
   * Search companies by multiple fields (name, URL, domain) with case-insensitive matching.
   *
   * @param searchTerm the search term to match against multiple fields
   * @return List of matching extraction data ordered by last modified date descending
   */
  @Query("SELECT c FROM CompanyExtractionData c WHERE " +
         "LOWER(c.companyName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
         "LOWER(c.companyUrl) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
         "LOWER(c.domain) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
         "ORDER BY c.lastModifiedAt DESC")
  List<CompanyExtractionData> searchCompaniesByMultipleFields(@Param("searchTerm") String searchTerm);

  /**
   * Check if extraction data exists for a given URL.
   *
   * @param companyUrl the company URL
   * @return true if exists, false otherwise
   */
  boolean existsByCompanyUrl(String companyUrl);

  /**
   * Check if extraction data exists for a given domain.
   *
   * @param domain the company domain
   * @return true if exists, false otherwise
   */
  boolean existsByDomain(String domain);
  
  /**
   * Find all extraction data ordered by last modified date descending.
   *
   * @return List of all extraction data, newest first
   */
  List<CompanyExtractionData> findAllByOrderByLastModifiedAtDesc();
  
  /**
   * Find companies missing contact data (phone or email).
   *
   * @param pageable pagination information
   * @return Page of companies missing contact data
   */
  @Query("SELECT c FROM CompanyExtractionData c WHERE " +
         "(c.phoneNumber IS NULL OR c.phoneNumber = '' OR " +
         "c.contactEmail IS NULL OR c.contactEmail = '') " +
         "ORDER BY c.lastModifiedAt DESC")
  Page<CompanyExtractionData> findCompaniesMissingContactData(Pageable pageable);
  
  /**
   * Find companies that have headquarter address but no coordinates.
   *
   * @return List of companies needing geocoding
   */
  List<CompanyExtractionData> findByHeadquarterAddressNotNullAndLatitudeIsNull();
  
  /**
   * Find companies missing carbon emissions data.
   * Companies that have been extracted but don't have carbon emissions calculated.
   *
   * @return List of companies needing carbon emissions calculation
   */
  @Query("SELECT c FROM CompanyExtractionData c WHERE " +
         "c.totalCarbonEmissions IS NULL AND " +
         "c.rawExtractionData IS NOT NULL " +
         "ORDER BY c.lastModifiedAt DESC")
  List<CompanyExtractionData> findCompaniesMissingCarbonEmissions();
  
  /**
   * Find companies missing carbon emissions data with pagination.
   *
   * @param pageable pagination information
   * @return Page of companies needing carbon emissions calculation
   */
  @Query("SELECT c FROM CompanyExtractionData c WHERE " +
         "c.totalCarbonEmissions IS NULL AND " +
         "c.rawExtractionData IS NOT NULL " +
         "ORDER BY c.lastModifiedAt DESC")
  Page<CompanyExtractionData> findCompaniesMissingCarbonEmissions(Pageable pageable);

  /**
   * Find companies missing stakeholder geography summary.
   * Only includes companies that have ToC data (raw_extraction_data is not null).
   *
   * @param pageable pagination information
   * @return Page of companies needing geography summary generation
   */
  @Query("SELECT c FROM CompanyExtractionData c WHERE " +
         "c.stakeholderGeographySummary IS NULL AND " +
         "c.rawExtractionData IS NOT NULL " +
         "ORDER BY c.lastModifiedAt DESC")
  Page<CompanyExtractionData> findCompaniesMissingGeographySummary(Pageable pageable);

  /**
   * Find companies missing public impact summary data.
   * Only includes companies that have raw extraction data.
   *
   * @param pageable pagination information
   * @return Page of companies needing summary generation
   */
  @Query("SELECT c FROM CompanyExtractionData c WHERE "
         + "c.publicImpactSummary IS NULL AND "
         + "c.rawExtractionData IS NOT NULL "
         + "ORDER BY c.lastModifiedAt DESC")
  Page<CompanyExtractionData> findCompaniesMissingPublicImpactSummary(
      Pageable pageable);

  /**
   * Find all companies accessible to a portfolio through the junction table.
   *
   * @param portfolioId the portfolio ID
   * @return List of extraction data accessible to the portfolio
   */
  @Query("SELECT DISTINCT c FROM CompanyExtractionData c " +
         "JOIN PortfolioCompanyExtractionAccess a ON c.id = a.companyExtractionData.id " +
         "WHERE a.portfolio.id = :portfolioId " +
         "ORDER BY c.lastModifiedAt DESC")
  List<CompanyExtractionData> findAllAccessibleByPortfolioId(@Param("portfolioId") Long portfolioId);
  
  /**
   * Find all companies accessible to a portfolio with pagination.
   *
   * @param portfolioId the portfolio ID
   * @param pageable pagination information
   * @return Page of extraction data accessible to the portfolio
   */
  @Query("SELECT DISTINCT c FROM CompanyExtractionData c " +
         "JOIN PortfolioCompanyExtractionAccess a ON c.id = a.companyExtractionData.id " +
         "WHERE a.portfolio.id = :portfolioId")
  Page<CompanyExtractionData> findAllAccessibleByPortfolioId(@Param("portfolioId") Long portfolioId, Pageable pageable);
  
  /**
   * Count all companies accessible to a portfolio.
   *
   * @param portfolioId the portfolio ID
   * @return Count of companies accessible to the portfolio
   */
  @Query("SELECT COUNT(DISTINCT c) FROM CompanyExtractionData c " +
         "JOIN PortfolioCompanyExtractionAccess a ON c.id = a.companyExtractionData.id " +
         "WHERE a.portfolio.id = :portfolioId")
  Long countAllAccessibleByPortfolioId(@Param("portfolioId") Long portfolioId);

  /**
   * Find IDs of companies accessible to a portfolio.
   *
   * @param portfolioId the portfolio ID
   * @return List of company IDs accessible to the portfolio
   */
  @Query("SELECT DISTINCT c.id FROM CompanyExtractionData c "
         + "JOIN PortfolioCompanyExtractionAccess a ON c.id = a.companyExtractionData.id "
         + "WHERE a.portfolio.id = :portfolioId")
  List<Long> findIdsAccessibleByPortfolioId(@Param("portfolioId") Long portfolioId);

  /**
   * Find all companies with locations accessible to a portfolio.
   *
   * @param portfolioId the portfolio ID
   * @return List of companies with coordinates accessible to the portfolio
   */
  @Query("SELECT DISTINCT c FROM CompanyExtractionData c " +
         "JOIN PortfolioCompanyExtractionAccess a ON c.id = a.companyExtractionData.id " +
         "WHERE a.portfolio.id = :portfolioId " +
         "AND c.latitude IS NOT NULL AND c.longitude IS NOT NULL")
  List<CompanyExtractionData> findAllAccessibleWithLocationsByPortfolioId(@Param("portfolioId") Long portfolioId);
  
  /**
   * Search all accessible companies by multiple fields within a portfolio.
   *
   * @param searchTerm the search term
   * @param portfolioId the portfolio ID
   * @param pageable pagination information
   * @return Page of matching companies accessible to the portfolio
   */
  @Query("SELECT DISTINCT c FROM CompanyExtractionData c " +
         "JOIN PortfolioCompanyExtractionAccess a ON c.id = a.companyExtractionData.id " +
         "WHERE a.portfolio.id = :portfolioId AND (" +
         "LOWER(c.companyName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
         "LOWER(c.companyUrl) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
         "LOWER(c.domain) LIKE LOWER(CONCAT('%', :searchTerm, '%')))")
  Page<CompanyExtractionData> searchAllAccessibleByPortfolioId(@Param("searchTerm") String searchTerm,
                                                                @Param("portfolioId") Long portfolioId,
                                                                Pageable pageable);
  
  /**
   * Find companies that need patent updates.
   * Prioritizes companies that have never been checked (null lastPatentCheckAt)
   * or haven't been checked in at least 3 months.
   *
   * @param threeMonthsAgo date 3 months ago
   * @param pageable pagination information with limit
   * @return List of companies needing patent checks
   */
  @Query("SELECT c FROM CompanyExtractionData c " +
         "WHERE c.companyUrl IS NOT NULL " +
         "AND c.companyName IS NOT NULL " +
         "AND (c.lastPatentCheckAt IS NULL OR c.lastPatentCheckAt < :threeMonthsAgo) " +
         "ORDER BY c.lastPatentCheckAt ASC NULLS FIRST")
  List<CompanyExtractionData> findCompaniesForPatentUpdate(@Param("threeMonthsAgo") java.util.Date threeMonthsAgo,
                                                            Pageable pageable);

  /**
   * Check if a company is accessible to a portfolio through junction table.
   *
   * @param companyId the company extraction data ID
   * @param portfolioId the portfolio ID
   * @return true if the company is accessible to the portfolio, false otherwise
   */
  @Query("SELECT COUNT(a) > 0 FROM PortfolioCompanyExtractionAccess a " +
         "WHERE a.companyExtractionData.id = :companyId " +
         "AND a.portfolio.id = :portfolioId")
  boolean existsByCompanyIdAndPortfolioAccess(@Param("companyId") Long companyId,
                                               @Param("portfolioId") Long portfolioId);

  /**
   * Find all companies within geographic bounds.
   * Handles date-line crossing when minLng > maxLng.
   *
   * @param minLat minimum latitude
   * @param maxLat maximum latitude
   * @param minLng minimum longitude
   * @param maxLng maximum longitude
   * @return List of companies within bounds
   */
  @Query("SELECT c FROM CompanyExtractionData c " +
         "WHERE c.latitude IS NOT NULL AND c.longitude IS NOT NULL " +
         "AND c.latitude >= :minLat AND c.latitude <= :maxLat " +
         "AND ((:minLng <= :maxLng AND c.longitude >= :minLng AND c.longitude <= :maxLng) " +
         "OR (:minLng > :maxLng AND (c.longitude >= :minLng OR c.longitude <= :maxLng)))")
  List<CompanyExtractionData> findAllInBounds(@Param("minLat") Double minLat,
                                               @Param("maxLat") Double maxLat,
                                               @Param("minLng") Double minLng,
                                               @Param("maxLng") Double maxLng);

  /**
   * Find all companies accessible to a portfolio within geographic bounds.
   * Handles date-line crossing when minLng > maxLng.
   *
   * @param portfolioId the portfolio ID
   * @param minLat minimum latitude
   * @param maxLat maximum latitude
   * @param minLng minimum longitude
   * @param maxLng maximum longitude
   * @return List of companies within bounds accessible to the portfolio
   */
  @Query("SELECT DISTINCT c FROM CompanyExtractionData c " +
         "JOIN PortfolioCompanyExtractionAccess a ON c.id = a.companyExtractionData.id " +
         "WHERE a.portfolio.id = :portfolioId " +
         "AND c.latitude IS NOT NULL AND c.longitude IS NOT NULL " +
         "AND c.latitude >= :minLat AND c.latitude <= :maxLat " +
         "AND ((:minLng <= :maxLng AND c.longitude >= :minLng AND c.longitude <= :maxLng) " +
         "OR (:minLng > :maxLng AND (c.longitude >= :minLng OR c.longitude <= :maxLng)))")
  List<CompanyExtractionData> findAllAccessibleByPortfolioIdAndBounds(@Param("portfolioId") Long portfolioId,
                                                                       @Param("minLat") Double minLat,
                                                                       @Param("maxLat") Double maxLat,
                                                                       @Param("minLng") Double minLng,
                                                                       @Param("maxLng") Double maxLng);

  /**
   * Find all companies accessible to multiple portfolios within geographic bounds.
   * Handles date-line crossing when minLng > maxLng.
   *
   * @param portfolioIds list of portfolio IDs
   * @param minLat minimum latitude
   * @param maxLat maximum latitude
   * @param minLng minimum longitude
   * @param maxLng maximum longitude
   * @return List of companies within bounds accessible to the portfolios
   */
  @Query("SELECT DISTINCT c FROM CompanyExtractionData c " +
         "JOIN PortfolioCompanyExtractionAccess a ON c.id = a.companyExtractionData.id " +
         "WHERE a.portfolio.id IN :portfolioIds " +
         "AND c.latitude IS NOT NULL AND c.longitude IS NOT NULL " +
         "AND c.latitude >= :minLat AND c.latitude <= :maxLat " +
         "AND ((:minLng <= :maxLng AND c.longitude >= :minLng AND c.longitude <= :maxLng) " +
         "OR (:minLng > :maxLng AND (c.longitude >= :minLng OR c.longitude <= :maxLng)))")
  List<CompanyExtractionData> findAllAccessibleByPortfolioIdsAndBounds(@Param("portfolioIds") List<Long> portfolioIds,
                                                                        @Param("minLat") Double minLat,
                                                                        @Param("maxLat") Double maxLat,
                                                                        @Param("minLng") Double minLng,
                                                                        @Param("maxLng") Double maxLng);

  /**
   * Find companies with news tracking enabled.
   *
   * @param trackNews the track news flag
   * @return List of companies with news tracking enabled
   */
  List<CompanyExtractionData> findByTrackNews(Boolean trackNews);

  /**
   * Count companies with news tracking enabled.
   *
   * @param trackNews the track news flag
   * @return count of companies with the flag
   */
  long countByTrackNews(Boolean trackNews);

  /**
   * Find company IDs in the weekday news scraping bucket.
   *
   * @param bucket bucket value (0-4 corresponds to Mon-Fri)
   * @param pageable pagination info
   * @return Page of company IDs for the bucket
   */
  @Query(
      value = "SELECT c.id FROM CompanyExtractionData c "
        + "WHERE c.trackNews = true AND MOD(c.id, 5) = :bucket ORDER BY c.id",
      countQuery = "SELECT COUNT(c.id) FROM CompanyExtractionData c "
        + "WHERE c.trackNews = true AND MOD(c.id, 5) = :bucket"
  )
  Page<Long> findTrackedCompanyIdsByBucket(@Param("bucket") int bucket,
                                           Pageable pageable);

  // ========== LITE PROJECTION METHODS ==========
  // These methods exclude large JSONB fields (rawExtractionData, etc.) for better performance

  /**
   * Find all companies using lite projection (excludes heavy JSONB fields).
   * Significantly improves performance by not fetching rawExtractionData (~100KB per row).
   *
   * @param pageable pagination information
   * @return Page of lite projections
   */
  Page<CompanyExtractionDataLiteProjection> findAllProjectedBy(Pageable pageable);

  /**
   * Find all companies accessible to a portfolio using lite projection.
   *
   * @param portfolioId the portfolio ID
   * @param pageable pagination information
   * @return Page of lite projections accessible to the portfolio
   */
  @Query("SELECT DISTINCT c FROM CompanyExtractionData c " +
         "JOIN PortfolioCompanyExtractionAccess a ON c.id = a.companyExtractionData.id " +
         "WHERE a.portfolio.id = :portfolioId")
  Page<CompanyExtractionDataLiteProjection> findAllAccessibleByPortfolioIdProjected(
      @Param("portfolioId") Long portfolioId, Pageable pageable);

  /**
   * Search all accessible companies by multiple fields within a portfolio using lite projection.
   *
   * @param searchTerm the search term
   * @param portfolioId the portfolio ID
   * @param pageable pagination information
   * @return Page of matching lite projections accessible to the portfolio
   */
  @Query("SELECT DISTINCT c FROM CompanyExtractionData c " +
         "JOIN PortfolioCompanyExtractionAccess a ON c.id = a.companyExtractionData.id " +
         "WHERE a.portfolio.id = :portfolioId AND (" +
         "LOWER(c.companyName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
         "LOWER(c.companyUrl) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
         "LOWER(c.domain) LIKE LOWER(CONCAT('%', :searchTerm, '%')))")
  Page<CompanyExtractionDataLiteProjection> searchAllAccessibleByPortfolioIdProjected(
      @Param("searchTerm") String searchTerm,
      @Param("portfolioId") Long portfolioId,
      Pageable pageable);

  /**
   * Search companies by name using lite projection.
   *
   * @param companyName the company name to search
   * @param pageable pagination information
   * @return Page of matching lite projections
   */
  @Query("SELECT c FROM CompanyExtractionData c WHERE " +
         "LOWER(c.companyName) LIKE LOWER(CONCAT('%', :companyName, '%'))")
  Page<CompanyExtractionDataLiteProjection> findByCompanyNameContainingIgnoreCaseProjected(
      @Param("companyName") String companyName, Pageable pageable);

}
