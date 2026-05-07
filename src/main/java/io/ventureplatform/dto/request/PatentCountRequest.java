package io.ventureplatform.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request model for patent counting.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PatentCountRequest {
  private String companyUrl;
  private String companyName; // Optional: if provided, skip OpenAI extraction
  private boolean euOnly = false; // Default to global search
  private boolean grantsOnly = false; // Default to include both grants and applications
  private boolean saveToDatabase = false; // Default to read-only mode
}
