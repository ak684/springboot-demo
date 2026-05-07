package io.ventureplatform.service;

import io.ventureplatform.dto.PortfolioAgentConversationDetail;
import io.ventureplatform.dto.PortfolioAgentConversationSummary;
import io.ventureplatform.dto.PortfolioAgentRequest.ChatMessage;
import io.ventureplatform.entity.Portfolio;
import io.ventureplatform.entity.PortfolioAgentConversation;
import io.ventureplatform.entity.PortfolioAgentMessage;
import io.ventureplatform.entity.User;
import io.ventureplatform.entity.enums.PortfolioAgentMessageRole;
import io.ventureplatform.repository.PortfolioAgentConversationRepository;
import io.ventureplatform.repository.PortfolioAgentMessageRepository;
import io.ventureplatform.repository.PortfolioRepository;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Optional;
import javax.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Persistence service for AI agent conversations and their messages.
 * Holds short transactions only; the OpenAI streaming call is invoked
 * outside of any transaction by the streaming pipeline.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PortfolioAgentConversationService {

  /** Default page size for the list endpoint. */
  public static final int DEFAULT_PAGE_SIZE = 50;

  /** Maximum length of an auto-generated conversation title. */
  public static final int MAX_TITLE_LENGTH = 60;

  /** Fallback title when the first message is empty/too short. */
  public static final String FALLBACK_TITLE = "New conversation";

  /** Conversation repository. */
  private final PortfolioAgentConversationRepository conversationRepository;
  /** Message repository. */
  private final PortfolioAgentMessageRepository messageRepository;
  /** Portfolio repository. */
  private final PortfolioRepository portfolioRepository;

  /**
   * Create a new conversation owned by {@code user} for the given portfolio.
   * The user message provided is also persisted in the same transaction so
   * that {@code created_by} is populated correctly by the auditing listener.
   *
   * @param user owner
   * @param portfolioId portfolio id
   * @param firstUserMessage the first user message content
   * @return the persisted conversation (with the user message attached)
   */
  @Transactional
  public PortfolioAgentConversation createConversationWithFirstMessage(
      final User user,
      final Long portfolioId,
      final String firstUserMessage) {
    Portfolio portfolio = portfolioRepository.findById(portfolioId)
        .orElseThrow(() -> new EntityNotFoundException(
            "Portfolio not found: " + portfolioId));

    PortfolioAgentConversation conversation =
        new PortfolioAgentConversation();
    conversation.setUser(user);
    conversation.setPortfolio(portfolio);
    conversation.setTitle(generateTitle(firstUserMessage));
    conversation = conversationRepository.save(conversation);

    PortfolioAgentMessage message = new PortfolioAgentMessage();
    message.setConversation(conversation);
    message.setRole(PortfolioAgentMessageRole.USER);
    message.setContent(firstUserMessage);
    messageRepository.save(message);

    log.info("Created agent conversation {} for user {} portfolio {}",
        conversation.getId(), user.getId(), portfolioId);
    return conversation;
  }

  /**
   * Append a user message to an existing conversation owned by
   * {@code user}. The conversation's {@code last_modified_at} is touched.
   *
   * @param user current user
   * @param conversationId existing conversation id
   * @param portfolioId portfolio id (must match the stored value)
   * @param userMessage user message content
   * @return the loaded conversation
   * @throws EntityNotFoundException if not owned by user or portfolio mismatch
   */
  @Transactional
  public PortfolioAgentConversation appendUserMessage(
      final User user,
      final Long conversationId,
      final Long portfolioId,
      final String userMessage) {
    PortfolioAgentConversation conversation =
        loadOwnedConversationOrThrow(user, conversationId);
    if (!conversation.getPortfolio().getId().equals(portfolioId)) {
      throw new EntityNotFoundException(
          "Conversation portfolio mismatch");
    }

    PortfolioAgentMessage message = new PortfolioAgentMessage();
    message.setConversation(conversation);
    message.setRole(PortfolioAgentMessageRole.USER);
    message.setContent(userMessage);
    messageRepository.save(message);

    conversation.setLastModifiedAt(new Date());
    conversationRepository.save(conversation);
    return conversation;
  }

  /**
   * Persist the assistant response and touch the parent conversation's
   * {@code last_modified_at}. The assistant follow-up suggestions tag
   * (added by PR #521) is stripped before persistence — suggestions are
   * ephemeral UI state and the DB stores the visible content only.
   *
   * @param conversationId conversation id
   * @param assistantContent raw assistant content
   */
  @Transactional
  public void appendAssistantMessage(
      final Long conversationId,
      final String assistantContent) {
    PortfolioAgentConversation conversation =
        conversationRepository.findById(conversationId)
            .orElseThrow(() -> new EntityNotFoundException(
                "Conversation not found: " + conversationId));

    PortfolioAgentMessage message = new PortfolioAgentMessage();
    message.setConversation(conversation);
    message.setRole(PortfolioAgentMessageRole.ASSISTANT);
    message.setContent(stripSuggestionsTag(assistantContent));
    messageRepository.save(message);

    conversation.setLastModifiedAt(new Date());
    conversationRepository.save(conversation);
  }

  /**
   * Strip the {@code <SUGGESTIONS>[...]</SUGGESTIONS>} metadata tag
   * (introduced by PR #521) from the visible assistant content, matching
   * the frontend's {@code parseSuggestionMetadata} contract: only
   * line-start tags are treated as metadata, mid-line literal mentions
   * are preserved.
   *
   * @param content raw assistant content, possibly null
   * @return content with the trailing suggestions block removed
   */
  public static String stripSuggestionsTag(final String content) {
    if (content == null || content.isEmpty()) {
      return content;
    }
    java.util.regex.Pattern lineStart =
        java.util.regex.Pattern.compile(
            "(^|\\n)[ \\t]*<SUGGESTIONS>");
    java.util.regex.Matcher m = lineStart.matcher(content);
    int lastStart = -1;
    while (m.find()) {
      lastStart = m.start();
    }
    if (lastStart < 0) {
      return content;
    }
    String trimmed = content.substring(0, lastStart);
    return trimmed.replaceAll("\\s+$", "");
  }

  /**
   * Load DB history for a conversation as plain ChatMessage records,
   * ordered chronologically.
   *
   * @param conversationId conversation id
   * @return ordered chat messages
   */
  @Transactional(readOnly = true)
  public List<ChatMessage> loadHistory(final Long conversationId) {
    List<PortfolioAgentMessage> messages = messageRepository
        .findByConversationIdOrderByCreatedAtAscIdAsc(conversationId);
    List<ChatMessage> result = new ArrayList<>(messages.size());
    for (PortfolioAgentMessage msg : messages) {
      result.add(new ChatMessage(
          roleToString(msg.getRole()), msg.getContent()));
    }
    return result;
  }

  /**
   * List the user's conversations for a portfolio, newest first.
   *
   * @param user current user
   * @param portfolioId portfolio id
   * @return ordered conversation summaries
   */
  @Transactional(readOnly = true)
  public List<PortfolioAgentConversationSummary> listConversations(
      final User user, final Long portfolioId) {
    List<PortfolioAgentConversation> conversations = conversationRepository
        .findByUserIdAndPortfolioIdOrderByLastModifiedAtDesc(
            user.getId(), portfolioId,
            PageRequest.of(0, DEFAULT_PAGE_SIZE));
    List<PortfolioAgentConversationSummary> summaries =
        new ArrayList<>(conversations.size());
    for (PortfolioAgentConversation c : conversations) {
      summaries.add(toSummary(c));
    }
    return summaries;
  }

  /**
   * Load the full conversation detail including messages.
   * Returns empty if the conversation does not exist or is not owned
   * by the current user (so the controller can map to 404 without
   * leaking existence).
   *
   * @param user current user
   * @param conversationId conversation id
   * @return optional detail
   */
  @Transactional(readOnly = true)
  public Optional<PortfolioAgentConversationDetail> getConversation(
      final User user, final Long conversationId) {
    Optional<PortfolioAgentConversation> opt =
        conversationRepository.findByIdAndUserId(
            conversationId, user.getId());
    if (opt.isEmpty()) {
      return Optional.empty();
    }
    PortfolioAgentConversation conversation = opt.get();
    List<PortfolioAgentMessage> messages = messageRepository
        .findByConversationIdOrderByCreatedAtAscIdAsc(conversationId);
    List<PortfolioAgentConversationDetail.Message> dtoMessages =
        new ArrayList<>(messages.size());
    for (PortfolioAgentMessage m : messages) {
      dtoMessages.add(
          PortfolioAgentConversationDetail.Message.builder()
              .id(m.getId())
              .role(roleToString(m.getRole()))
              .content(m.getContent())
              .createdAt(m.getCreatedAt())
              .build());
    }
    return Optional.of(
        PortfolioAgentConversationDetail.builder()
            .id(conversation.getId())
            .title(conversation.getTitle())
            .portfolioId(conversation.getPortfolio().getId())
            .lastModifiedAt(conversation.getLastModifiedAt())
            .createdAt(conversation.getCreatedAt())
            .messages(dtoMessages)
            .build());
  }

  /**
   * Delete a conversation. Returns false if not owned by the current
   * user (caller maps to 404).
   *
   * @param user current user
   * @param conversationId conversation id
   * @return true if deleted, false if not found / not owned
   */
  @Transactional
  public boolean deleteConversation(
      final User user, final Long conversationId) {
    Optional<PortfolioAgentConversation> opt =
        conversationRepository.findByIdAndUserId(
            conversationId, user.getId());
    if (opt.isEmpty()) {
      return false;
    }
    conversationRepository.delete(opt.get());
    log.info("Deleted agent conversation {} for user {}",
        conversationId, user.getId());
    return true;
  }

  /**
   * Convert an entity to a summary DTO.
   *
   * @param c entity
   * @return summary
   */
  public PortfolioAgentConversationSummary toSummary(
      final PortfolioAgentConversation c) {
    return PortfolioAgentConversationSummary.builder()
        .id(c.getId())
        .title(c.getTitle())
        .portfolioId(c.getPortfolio().getId())
        .lastModifiedAt(c.getLastModifiedAt())
        .createdAt(c.getCreatedAt())
        .build();
  }

  /**
   * Build a conversation title from the first user message.
   * Trims, collapses whitespace, truncates to MAX_TITLE_LENGTH chars.
   *
   * @param message the raw user message
   * @return title
   */
  public static String generateTitle(final String message) {
    if (message == null) {
      return FALLBACK_TITLE;
    }
    String collapsed = message
        .replaceAll("\\s+", " ")
        .trim();
    if (collapsed.isEmpty()) {
      return FALLBACK_TITLE;
    }
    if (collapsed.length() <= MAX_TITLE_LENGTH) {
      return collapsed;
    }
    return collapsed.substring(0, MAX_TITLE_LENGTH).trim();
  }

  private PortfolioAgentConversation loadOwnedConversationOrThrow(
      final User user, final Long conversationId) {
    return conversationRepository
        .findByIdAndUserId(conversationId, user.getId())
        .orElseThrow(() -> new EntityNotFoundException(
            "Conversation not found: " + conversationId));
  }

  private String roleToString(final PortfolioAgentMessageRole role) {
    return role == PortfolioAgentMessageRole.USER
        ? "user" : "assistant";
  }
}
