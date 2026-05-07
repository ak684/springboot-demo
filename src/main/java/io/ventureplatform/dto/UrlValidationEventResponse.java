package io.ventureplatform.dto;

import lombok.Data;

import java.util.Date;

/**
 * Response DTO for URL validation events.
 */
@Data
public class UrlValidationEventResponse {
  private Long id;
  private String eventType;
  private String oldUrl;
  private String newUrl;
  private Integer statusCode;
  private String errorMessage;
  private String approvalStatus;
  private Date createdAt;
  private Date reviewedAt;
  private CompanyInfo companyExtractionData;
  private ReviewerInfo reviewedBy;

  @Data
  public static class CompanyInfo {
    private Long id;
    private String companyName;
    private String companyUrl;
  }

  @Data
  public static class ReviewerInfo {
    private Long id;
    private String firstName;
    private String lastName;
    private String email;
  }
}
