package io.ventureplatform.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Model class for detailed patent information.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PatentDetail {
  private String patentNumber; // e.g., "US20190375329A1"
  private String title; // e.g., "Systems and methods for automated signaling..."
  private String inventor; // e.g., "Carlos Ellis Whitt"
  private String assignee; // e.g., "Lyft, Inc."
  private String publicationDate; // e.g., "2019-12-12"
  private String filedDate; // e.g., "2018-12-28"
  private String priorityDate; // e.g., "2018-06-06"
  private String grantDate; // e.g., "2019-08-07"
  private String expirationDate; // e.g., "2039-08-07"
  private String abstractText; // Truncated description
  private String pdfUrl; // Direct PDF link
  private String patentUrl; // Google Patents page URL
  private boolean isGranted; // true if granted, false if application
  private String jurisdictions; // JSON array of jurisdiction objects
  private Integer citedByCount; // Number of patents citing this one
  private Integer citationsCount; // Number of patents this one cites
  private String patentStatus; // e.g., "Active", "Expired", "Pending"
  private String primaryCpcCode; // Primary classification code
  private String patentFamilyId; // AI-assigned family ID for grouping related patents
}
