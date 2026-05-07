package io.ventureplatform.repository;

import io.ventureplatform.entity.NewsEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Date;
import java.util.List;
import java.util.Optional;

@Repository
public interface NewsEventRepository extends JpaRepository<NewsEvent, Long> {

  /**
   * Find news events by company, ordered by published date descending.
   *
   * @param companyExtractionDataId the company ID
   * @return list of news events
   */
  List<NewsEvent> findByCompanyExtractionDataIdOrderByPublishedDateDesc(
      Long companyExtractionDataId);

  /**
   * Find news events created after a specific date.
   * Only includes companies where track_news is true.
   *
   * <p>NOTE: Currently filters by createdAt (when we scraped the article).
   * Alternative: filter by publishedDate (when article was published) for
   * showing recent articles regardless of when they were scraped.</p>
   *
   * @param since the date threshold
   * @return list of news events
   */
  @Query("SELECT ne FROM NewsEvent ne "
      + "JOIN ne.companyExtractionData c "
      + "WHERE c.trackNews = true "
      + "AND ne.createdAt >= :since "
      + "ORDER BY ne.publishedDate DESC")
  List<NewsEvent> findByCreatedAtAfterOrderByPublishedDateDesc(@Param("since") Date since);

  /**
   * Find news events by company and date range.
   *
   * @param companyId the company ID
   * @param since the date threshold
   * @return list of news events
   */
  @Query("SELECT ne FROM NewsEvent ne "
      + "WHERE ne.companyExtractionData.id = :companyId "
      + "AND ne.publishedDate >= :since "
      + "ORDER BY ne.publishedDate DESC")
  List<NewsEvent> findByCompanyIdAndDateAfter(
      @Param("companyId") Long companyId,
      @Param("since") Date since);

  /**
   * Find news event by company and title for deduplication.
   *
   * @param companyExtractionDataId the company ID
   * @param title the article title
   * @return optional news event
   */
  Optional<NewsEvent> findByCompanyExtractionDataIdAndTitle(
      Long companyExtractionDataId,
      String title);

  /**
   * Find news events for companies the user has access to.
   * Filters by portfolio membership using portfolio access table.
   * Only includes companies where track_news is true.
   *
   * @param userId the user ID
   * @param organizationId the organization ID
   * @param since the date threshold
   * @return list of news events
   */
  @Query("SELECT DISTINCT ne FROM NewsEvent ne "
      + "JOIN ne.companyExtractionData c "
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
      + "AND c.trackNews = true "
      + "AND ne.createdAt >= :since "
      + "ORDER BY ne.publishedDate DESC")
  List<NewsEvent> findEventsForUserSince(@Param("userId") Long userId,
      @Param("organizationId") Long organizationId,
      @Param("since") Date since);

  /**
   * Find news events for companies in a specific portfolio.
   * Only includes companies where track_news is true.
   *
   * @param portfolioId the portfolio ID
   * @param since the date threshold
   * @return list of news events
   */
  @Query("SELECT DISTINCT ne FROM NewsEvent ne "
      + "JOIN ne.companyExtractionData c "
      + "WHERE c.id IN ("
      + "  SELECT pcea.companyExtractionData.id "
      + "  FROM PortfolioCompanyExtractionAccess pcea "
      + "  WHERE pcea.portfolio.id = :portfolioId"
      + ") "
      + "AND c.trackNews = true "
      + "AND ne.createdAt >= :since "
      + "ORDER BY ne.publishedDate DESC")
  List<NewsEvent> findEventsForPortfolioSince(
      @Param("portfolioId") Long portfolioId,
      @Param("since") Date since);

  /**
   * Delete all news events for a specific company.
   *
   * @param companyExtractionDataId the company ID
   */
  void deleteByCompanyExtractionDataId(Long companyExtractionDataId);

}
