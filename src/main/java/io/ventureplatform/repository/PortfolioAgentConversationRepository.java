package io.ventureplatform.repository;

import io.ventureplatform.entity.PortfolioAgentConversation;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository for persisted portfolio agent conversations.
 */
@Repository
public interface PortfolioAgentConversationRepository
    extends JpaRepository<PortfolioAgentConversation, Long> {

  /**
   * List a user's conversations for a given portfolio, newest first.
   *
   * @param userId owner's user id
   * @param portfolioId portfolio id
   * @param pageable pagination
   * @return ordered conversations
   */
  List<PortfolioAgentConversation>
      findByUserIdAndPortfolioIdOrderByLastModifiedAtDesc(
          Long userId, Long portfolioId, Pageable pageable);

  /**
   * Look up a conversation by id and owner.
   *
   * @param id conversation id
   * @param userId owner's user id
   * @return the conversation if it belongs to that user
   */
  Optional<PortfolioAgentConversation> findByIdAndUserId(
      Long id, Long userId);
}
