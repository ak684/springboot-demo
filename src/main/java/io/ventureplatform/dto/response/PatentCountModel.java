package io.ventureplatform.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Model class for patent count response.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PatentCountModel {
  private String companyName;
  private Integer patentCount; // Total count (granted + applications)
  private Integer grantedPatentCount; // Count of granted patents only
  private Integer applicationCount; // Count of applications only
  private String searchUrl;
  private String companyUrl;
  private String error;
  private List<String> patentNumbers; // All patent numbers
  private List<String> grantedPatentNumbers; // Granted patent numbers only
  private List<String> applicationNumbers; // Application numbers only
  private List<PatentDetail> patentDetails; // Detailed patent information
}
