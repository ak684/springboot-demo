package io.ventureplatform.controller;

import io.ventureplatform.constant.AppConstants;
import io.ventureplatform.dto.PortfolioAgentConversationDetail;
import io.ventureplatform.dto.PortfolioAgentConversationSummary;
import io.ventureplatform.entity.User;
import io.ventureplatform.service.PortfolioAgentConversationService;
import io.ventureplatform.service.SecurityService;
import io.ventureplatform.util.CurrentUser;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller for persisted AI agent conversations.
 * Listing, loading and deleting saved chats.
 *
 * <p>Creation is intentionally NOT exposed as an HTTP endpoint;
 * conversations are created by the streaming endpoint in
 * {@link PortfolioAiAgentController} on the first message of a
 * new chat so that the user message and conversation row land
 * atomically in one transaction.</p>
 */
@RestController
@RequestMapping(AppConstants.API_PREFIX
    + AppConstants.API_VERSION
    + "/portfolio-agent/conversations")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
@Slf4j
public class PortfolioAgentConversationController {

  /** Conversation persistence service. */
  private final PortfolioAgentConversationService conversationService;
  /** Security service for portfolio-access checks. */
  private final SecurityService securityService;

  /**
   * List the current user's conversations for a portfolio,
   * newest first.
   *
   * @param portfolioId portfolio id
   * @param user authenticated user
   * @return ordered conversation summaries
   */
  @GetMapping
  @PreAuthorize("isSuperAdmin() "
      + "or isPortfolioMember(null, #portfolioId)")
  public ResponseEntity<List<PortfolioAgentConversationSummary>>
      listConversations(
          @RequestParam("portfolioId") final Long portfolioId,
          @CurrentUser final User user) {
    if (user == null) {
      return ResponseEntity.status(401).build();
    }
    if (!securityService.portfolioExists(portfolioId)) {
      return ResponseEntity.notFound().build();
    }
    List<PortfolioAgentConversationSummary> result =
        conversationService.listConversations(user, portfolioId);
    return ResponseEntity.ok(result);
  }

  /**
   * Get a conversation and its messages.
   * Returns 404 if not owned by the current user (do not leak that
   * another user's conversation exists).
   *
   * @param id conversation id
   * @param user authenticated user
   * @return the conversation detail or 404
   */
  @GetMapping("/{id}")
  public ResponseEntity<PortfolioAgentConversationDetail>
      getConversation(
          @PathVariable("id") final Long id,
          @CurrentUser final User user) {
    if (user == null) {
      return ResponseEntity.status(401).build();
    }
    Optional<PortfolioAgentConversationDetail> detail =
        conversationService.getConversation(user, id);
    if (detail.isEmpty()) {
      return ResponseEntity.notFound().build();
    }
    return ResponseEntity.ok(detail.get());
  }

  /**
   * Delete a conversation. Cascades to messages.
   * Returns 404 if not owned by the current user.
   *
   * @param id conversation id
   * @param user authenticated user
   * @return 204 on success, 404 otherwise
   */
  @DeleteMapping("/{id}")
  public ResponseEntity<Void> deleteConversation(
      @PathVariable("id") final Long id,
      @CurrentUser final User user) {
    if (user == null) {
      return ResponseEntity.status(401).build();
    }
    boolean deleted =
        conversationService.deleteConversation(user, id);
    if (!deleted) {
      return ResponseEntity.notFound().build();
    }
    return ResponseEntity.noContent().build();
  }
}
