package io.ventureplatform.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.Date;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Lightweight summary of a saved AI agent conversation.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PortfolioAgentConversationSummary {

  /** Conversation id. */
  private Long id;

  /** Auto-generated title. */
  private String title;

  /** Portfolio id. */
  private Long portfolioId;

  /** Last activity timestamp. */
  private Date lastModifiedAt;

  /** Created timestamp. */
  private Date createdAt;
}
