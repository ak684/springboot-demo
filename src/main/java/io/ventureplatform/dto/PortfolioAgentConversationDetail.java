package io.ventureplatform.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.Date;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Full saved conversation including messages, returned by the
 * conversation detail endpoint.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PortfolioAgentConversationDetail {

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

  /** Conversation messages, oldest first. */
  private List<Message> messages;

  /**
   * One persisted message.
   */
  @Data
  @NoArgsConstructor
  @AllArgsConstructor
  @Builder
  public static class Message {

    /** Message id. */
    private Long id;

    /** Role: "user" or "assistant". */
    private String role;

    /** Raw markdown-ish content. */
    private String content;

    /** Created timestamp. */
    private Date createdAt;
  }
}
