package io.ventureplatform.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PatentEventResponse {

  /**
   * Event ID.
   */
  private Long id;

  /**
   * Company extraction data.
   */
  private CompanyInfo companyExtractionData;

  /**
   * Company patent information.
   */
  private PatentInfo companyPatent;

  /**
   * Event type.
   */
  private String eventType;

  /**
   * Old value before change.
   */
  private String oldValue;

  /**
   * New value after change.
   */
  private String newValue;

  /**
   * Event creation timestamp.
   */
  private Date createdAt;

  /**
   * Human-readable description.
   */
  private String description;

  /**
   * Company information.
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

  /**
   * Patent information.
   */
  @Data
  @NoArgsConstructor
  @AllArgsConstructor
  @Builder
  public static class PatentInfo {
    /**
     * Patent ID.
     */
    private Long id;

    /**
     * Patent number.
     */
    private String patentNumber;

    /**
     * Patent title/name.
     */
    private String title;

    /**
     * Patent jurisdictions/geography.
     */
    private String patentJurisdictions;

    /**
     * Patent status.
     */
    private String patentStatus;
  }
}
