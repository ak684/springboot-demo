package io.ventureplatform.entity;

import io.ventureplatform.entity.enums.PortfolioAgentMessageRole;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.EnumType;
import javax.persistence.Enumerated;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;
import lombok.experimental.Accessors;

/**
 * One persisted message in a portfolio agent conversation.
 */
@Entity
@Table(name = "portfolio_agent_messages")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Accessors(chain = true)
public class PortfolioAgentMessage extends BaseEntity {

  /**
   * Conversation this message belongs to.
   */
  @ManyToOne
  @JoinColumn(name = "conversation_id", nullable = false)
  @EqualsAndHashCode.Exclude
  @ToString.Exclude
  private PortfolioAgentConversation conversation;

  /**
   * Message role: user or assistant.
   */
  @Enumerated(EnumType.STRING)
  @Column(name = "role", nullable = false, length = 16)
  private PortfolioAgentMessageRole role;

  /**
   * Raw message content as produced by the user or model.
   */
  @Column(name = "content", columnDefinition = "TEXT", nullable = false)
  private String content;
}
