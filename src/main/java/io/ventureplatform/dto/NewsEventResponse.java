package io.ventureplatform.dto;

import io.ventureplatform.entity.enums.NewsSourceType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

/**
 * DTO for news event responses.
 * Contains only the fields needed by the frontend to avoid
 * sending the entire CompanyExtractionData entity.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NewsEventResponse {

  /**
   * Event ID.
   */
  private Long id;

  /**
   * Company information (only id and name).
   */
  private CompanyInfo companyExtractionData;

  /**
   * The headline/title of the news article.
   */
  private String title;

  /**
   * The news source (e.g., TechCrunch, Reuters).
   */
  private String source;

  /**
   * The URL to the original news article.
   */
  private String sourceUrl;

  /**
   * When the article was published.
   */
  private Date publishedDate;

  /**
   * Optional summary/snippet of the article.
   */
  private String summary;

  /**
   * The type of source (Google News, RSS, API, etc.).
   */
  private NewsSourceType sourceType;

  /**
   * When the event was created (scraped).
   */
  private Date createdAt;

  /**
   * Company information - minimal fields only.
   */
  @Data
  @NoArgsConstructor
  @AllArgsConstructor
  @Builder
  public static class CompanyInfo {
    /**
     * Company ID.
     */
    private Long id;

    /**
     * Company name.
     */
    private String companyName;
  }
}
