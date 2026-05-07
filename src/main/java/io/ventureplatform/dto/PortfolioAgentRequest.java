package io.ventureplatform.dto;

import java.util.List;
import javax.validation.Valid;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Pattern;
import javax.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for the portfolio AI agent chat endpoint.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PortfolioAgentRequest {

  /** Maximum number of messages allowed. */
  public static final int MAX_MESSAGES = 50;

  /** Maximum length of a single message. */
  public static final int MAX_MSG_LENGTH = 10000;

  /** Portfolio to query. */
  @NotNull
  private Long portfolioId;

  /**
   * Existing conversation id to resume; null to start a new one.
   */
  private Long conversationId;

  /** Conversation messages. */
  @Valid
  @Size(max = MAX_MESSAGES)
  private List<ChatMessage> messages;

  /** Reasoning effort: low, medium, or high. */
  @Pattern(regexp = "low|medium|high")
  private String effort;

  /** Model override (optional). */
  @Pattern(regexp = "gpt-5\\.2|gpt-4\\.1|gpt-4\\.1-mini"
      + "|o4-mini")
  private String model;

  /**
   * A single message in the conversation.
   */
  @Data
  @NoArgsConstructor
  @AllArgsConstructor
  public static class ChatMessage {

    /** Message role (user/assistant). */
    @NotBlank
    private String role;

    /** Message text content. */
    @NotBlank
    @Size(max = MAX_MSG_LENGTH)
    private String content;
  }
}
