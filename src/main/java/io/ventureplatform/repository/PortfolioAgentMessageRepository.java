package io.ventureplatform.repository;

import io.ventureplatform.entity.PortfolioAgentMessage;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository for persisted portfolio agent messages.
 */
@Repository
public interface PortfolioAgentMessageRepository
    extends JpaRepository<PortfolioAgentMessage, Long> {

  /**
   * Load all messages for a conversation in chronological order.
   *
   * @param conversationId conversation id
   * @return ordered messages
   */
  List<PortfolioAgentMessage>
      findByConversationIdOrderByCreatedAtAscIdAsc(
          Long conversationId);
}
