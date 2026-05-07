package io.ventureplatform.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import io.ventureplatform.entity.enums.NewsSourceType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.Accessors;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.EnumType;
import javax.persistence.Enumerated;
import javax.persistence.FetchType;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.Table;
import javax.persistence.Index;
import java.util.Date;

@Entity
@Table(name = "news_events",
    indexes = {
      @Index(name = "idx_news_events_company_id",
          columnList = "company_extraction_data_id"),
      @Index(name = "idx_news_events_published_date",
          columnList = "published_date")
    }
)
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Accessors(chain = true)
public class NewsEvent extends BaseEntity {

  /**
   * Maximum length for article title.
   */
  private static final int TITLE_MAX_LENGTH = 500;

  /**
   * Maximum length for source name.
   */
  private static final int SOURCE_MAX_LENGTH = 255;

  /**
   * Maximum length for source URL.
   */
  private static final int URL_MAX_LENGTH = 1000;

  /**
   * Maximum length for source type enum value.
   */
  private static final int SOURCE_TYPE_MAX_LENGTH = 50;

  /**
   * The company this news event belongs to.
   */
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "company_extraction_data_id", nullable = false)
  @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
  private CompanyExtractionData companyExtractionData;

  /**
   * The headline/title of the news article.
   */
  @Column(name = "title", length = TITLE_MAX_LENGTH)
  private String title;

  /**
   * The news source (e.g., TechCrunch, Reuters).
   */
  @Column(name = "source", length = SOURCE_MAX_LENGTH)
  private String source;

  /**
   * The URL to the original news article.
   */
  @Column(name = "source_url", length = URL_MAX_LENGTH)
  private String sourceUrl;

  /**
   * When the article was published.
   */
  @Column(name = "published_date")
  private Date publishedDate;

  /**
   * Optional summary/snippet of the article.
   */
  @Column(name = "summary", columnDefinition = "TEXT")
  private String summary;

  /**
   * The type of source (Google News, RSS, API, etc.).
   */
  @Enumerated(EnumType.STRING)
  @Column(name = "source_type", length = SOURCE_TYPE_MAX_LENGTH)
  private NewsSourceType sourceType;

}
