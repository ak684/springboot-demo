package io.ventureplatform.entity;

import javax.persistence.Column;
import javax.persistence.Entity;
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
 * Persisted AI agent conversation, scoped per user and portfolio.
 */
@Entity
@Table(name = "portfolio_agent_conversations")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Accessors(chain = true)
public class PortfolioAgentConversation extends BaseEntity {

  /**
   * Owner of this conversation.
   */
  @ManyToOne
  @JoinColumn(name = "user_id", nullable = false)
  @EqualsAndHashCode.Exclude
  @ToString.Exclude
  private User user;

  /**
   * Portfolio this conversation refers to.
   */
  @ManyToOne
  @JoinColumn(name = "portfolio_id", nullable = false)
  @EqualsAndHashCode.Exclude
  @ToString.Exclude
  private Portfolio portfolio;

  /**
   * Auto-generated title from the first user message.
   */
  @Column(name = "title", nullable = false)
  private String title;
}
