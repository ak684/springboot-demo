package io.ventureplatform.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.ventureplatform.constant.AppConstants;
import io.ventureplatform.dto.PortfolioAgentRequest;
import io.ventureplatform.dto.PortfolioAgentRequest.ChatMessage;
import io.ventureplatform.dto.PortfolioAgentResponse;
import io.ventureplatform.entity.PortfolioAgentConversation;
import io.ventureplatform.entity.User;
import io.ventureplatform.service.PortfolioAgentConversationService;
import io.ventureplatform.service.PortfolioAiAgentService;
import io.ventureplatform.service.PortfolioAiAgentService.StreamCallbacks;
import io.ventureplatform.service.SecurityService;
import io.ventureplatform.util.CurrentUser;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import javax.persistence.EntityNotFoundException;
import javax.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

/**
 * REST controller for the portfolio AI agent.
 * Provides sync and streaming chat endpoints
 * where users can ask questions about their
 * portfolio companies.
 */
@RestController
@RequestMapping(AppConstants.API_PREFIX
    + AppConstants.API_VERSION
    + "/portfolio-agent")
@RequiredArgsConstructor
@Slf4j
public class PortfolioAiAgentController {

  /** SSE emitter timeout: 10 minutes. */
  private static final long SSE_TIMEOUT =
      600_000L;

  /** AI agent service. */
  private final PortfolioAiAgentService agentService;
  /** Conversation persistence service. */
  private final PortfolioAgentConversationService conversationService;
  /** Security service. */
  private final SecurityService securityService;
  /** JSON mapper. */
  private final ObjectMapper objectMapper;

  /**
   * Pre-load and cache the portfolio data file
   * so the first chat message is faster.
   *
   * @param request contains portfolioId
   * @param user the authenticated user
   * @return company count
   */
  @PostMapping("/warm-up")
  @PreAuthorize("isSysAdminOrSuperAdmin() "
      + "or isPortfolioMember(null, "
      + "#request.portfolioId)")
  public ResponseEntity<Map<String, Object>> warmUp(
      @Valid @RequestBody
      final PortfolioAgentRequest request,
      @CurrentUser final User user) {
    Long portfolioId = request.getPortfolioId();

    if (!securityService.portfolioExists(
        portfolioId)) {
      return ResponseEntity.notFound().build();
    }

    try {
      log.info("Agent warm-up - portfolio: {}",
          portfolioId);
      int count =
          agentService.warmUp(portfolioId);
      Map<String, Object> result = new HashMap<>();
      result.put("companyCount", count);
      return ResponseEntity.ok(result);
    } catch (Exception e) {
      log.error("Warm-up error: {}",
          e.getMessage(), e);
      return ResponseEntity.ok(Map.of(
          "companyCount", 0));
    }
  }

  /**
   * Chat with the AI agent (synchronous).
   *
   * @param request the conversation and portfolio ID
   * @param user the authenticated user
   * @return the AI agent response
   */
  @PostMapping("/ask")
  @PreAuthorize("isSysAdminOrSuperAdmin() "
      + "or isPortfolioMember(null, "
      + "#request.portfolioId)")
  public ResponseEntity<PortfolioAgentResponse> ask(
      @Valid @RequestBody
      final PortfolioAgentRequest request,
      @CurrentUser final User user) {
    Long portfolioId = request.getPortfolioId();

    if (!securityService.portfolioExists(
        portfolioId)) {
      return ResponseEntity.notFound().build();
    }

    try {
      log.info("Agent ask - portfolio: {}, "
          + "turns: {}",
          portfolioId,
          request.getMessages().size());

      Long userId = user != null
          ? user.getId() : null;

      PortfolioAgentResponse response =
          agentService.askQuestion(
              portfolioId,
              request.getMessages(),
              userId,
              request.getEffort(),
              request.getModel());

      log.info("Agent ask done - portfolio: {}, "
          + "companies: {}, len: {}",
          portfolioId,
          response.getCompanyCount(),
          response.getAnswer() != null
              ? response.getAnswer().length()
              : 0);

      return ResponseEntity.ok(response);
    } catch (IllegalStateException e) {
      log.warn("Agent ask rejected: {}",
          e.getMessage());
      final int tooManyRequests = 429;
      return ResponseEntity.status(tooManyRequests)
          .body(
          PortfolioAgentResponse.builder()
              .error(e.getMessage())
              .build());
    } catch (Exception e) {
      log.error("Agent ask error for portfolio "
          + "{}: {}",
          portfolioId, e.getMessage(), e);
      return ResponseEntity
          .internalServerError()
          .body(PortfolioAgentResponse.builder()
              .error(errorMessage(e))
              .build());
    }
  }

  /**
   * Chat with the AI agent (streaming via SSE).
   * Returns tokens as they arrive from OpenAI.
   *
   * <p>When an authenticated user is present and the request is
   * persistable, the conversation history becomes canonical:
   * messages are loaded from DB (not the client) and only the
   * new user message is appended. The user message is persisted
   * synchronously in the request thread BEFORE the streaming
   * thread is spawned so {@code created_by} is recorded
   * correctly. Sysadmin API-key calls remain non-persistent.</p>
   *
   * @param request the conversation and portfolio ID
   * @param user the authenticated user
   * @return SseEmitter streaming text deltas
   */
  @PostMapping("/ask-stream")
  @PreAuthorize("isSysAdminOrSuperAdmin() "
      + "or isPortfolioMember(null, "
      + "#request.portfolioId)")
  public SseEmitter askStream(
      @Valid @RequestBody
      final PortfolioAgentRequest request,
      @CurrentUser final User user) {

    SseEmitter emitter =
        new SseEmitter(SSE_TIMEOUT);
    Long portfolioId = request.getPortfolioId();

    if (!securityService.portfolioExists(
        portfolioId)) {
      sendSseError(emitter,
          "Portfolio not found.");
      return emitter;
    }

    log.info("Agent stream - portfolio: {}, "
        + "turns: {}, conversationId: {}",
        portfolioId,
        request.getMessages() != null
            ? request.getMessages().size() : 0,
        request.getConversationId());

    if (request.getMessages() == null
        || request.getMessages().isEmpty()) {
      sendSseError(emitter,
          "Messages must not be empty.");
      return emitter;
    }

    ChatMessage lastClient = request.getMessages()
        .get(request.getMessages().size() - 1);
    if (!"user".equals(lastClient.getRole())) {
      sendSseError(emitter,
          "Last message must have role 'user'.");
      return emitter;
    }

    final boolean persist = user != null;
    final List<ChatMessage> effectiveConversation;
    final Long persistedConversationId;
    if (persist) {
      try {
        PreparedConversation prepared = prepareConversation(
            request, user, lastClient.getContent());
        effectiveConversation = prepared.history;
        persistedConversationId = prepared.conversationId;
        sendSseConversation(emitter,
            prepared.conversationId, prepared.title);
      } catch (EntityNotFoundException nf) {
        sendSseError(emitter,
            "Conversation not found.");
        return emitter;
      } catch (Exception e) {
        log.error("Persist user message failed: {}",
            e.getMessage(), e);
        sendSseError(emitter,
            "Could not save your message. "
                + "Please try again.");
        return emitter;
      }
    } else {
      effectiveConversation = request.getMessages();
      persistedConversationId = null;
    }

    Long userId = user != null
        ? user.getId() : null;

    new Thread(() -> {
      final StringBuilder assistantContent =
          new StringBuilder();
      final boolean[] errored = {false};
      try {
        StreamCallbacks cb = new StreamCallbacks(
            delta -> {
              assistantContent.append(delta);
              sendSse(emitter, "delta", delta);
            },
            status -> sendSse(emitter,
                "status", status),
            result -> {
              if (persistedConversationId != null
                  && !errored[0]
                  && assistantContent.length() > 0) {
                try {
                  conversationService
                      .appendAssistantMessage(
                          persistedConversationId,
                          assistantContent.toString());
                } catch (Exception persistErr) {
                  log.error("Persist assistant "
                      + "message failed: {}",
                      persistErr.getMessage(),
                      persistErr);
                }
              }
              sendSseDone(emitter,
                  result.getCompanyCount(),
                  result.getModel());
              emitter.complete();
            },
            error -> {
              errored[0] = true;
              sendSseError(emitter, error);
            });
        agentService.askQuestionStreaming(
            portfolioId,
            effectiveConversation,
            userId,
            request.getEffort(),
            request.getModel(),
            cb);
      } catch (Exception e) {
        errored[0] = true;
        log.error("Stream error: {}",
            e.getMessage(), e);
        sendSseError(emitter, errorMessage(e));
      }
    }).start();

    return emitter;
  }

  private PreparedConversation prepareConversation(
      final PortfolioAgentRequest request,
      final User user,
      final String userMessageContent) {
    PortfolioAgentConversation conversation;
    boolean isNew = false;
    if (request.getConversationId() == null) {
      conversation = conversationService
          .createConversationWithFirstMessage(
              user, request.getPortfolioId(),
              userMessageContent);
      isNew = true;
    } else {
      conversation = conversationService
          .appendUserMessage(user,
              request.getConversationId(),
              request.getPortfolioId(),
              userMessageContent);
    }

    List<ChatMessage> history;
    if (isNew) {
      history = new ArrayList<>();
      history.add(new ChatMessage("user",
          userMessageContent));
    } else {
      history = conversationService
          .loadHistory(conversation.getId());
    }

    return new PreparedConversation(
        conversation.getId(),
        conversation.getTitle(),
        history);
  }

  private void sendSse(
      final SseEmitter emitter,
      final String type,
      final String text) {
    try {
      Map<String, String> data = new HashMap<>();
      data.put("type", type);
      data.put("text", text);
      emitter.send(SseEmitter.event()
          .data(objectMapper
              .writeValueAsString(data)));
    } catch (Exception e) {
      log.debug("SSE send failed: {}",
          e.getMessage());
    }
  }

  private void sendSseConversation(
      final SseEmitter emitter,
      final Long conversationId,
      final String title) {
    try {
      Map<String, Object> data = new HashMap<>();
      data.put("type", "conversation");
      data.put("conversationId", conversationId);
      data.put("title", title);
      emitter.send(SseEmitter.event()
          .data(objectMapper
              .writeValueAsString(data)));
    } catch (Exception e) {
      log.debug("SSE conversation send failed: {}",
          e.getMessage());
    }
  }

  private void sendSseDone(
      final SseEmitter emitter,
      final int companyCount,
      final String model) {
    try {
      Map<String, Object> data = new HashMap<>();
      data.put("type", "done");
      data.put("companyCount", companyCount);
      data.put("model", model);
      emitter.send(SseEmitter.event()
          .data(objectMapper
              .writeValueAsString(data)));
    } catch (Exception e) {
      log.debug("SSE done failed: {}",
          e.getMessage());
    }
  }

  private void sendSseError(
      final SseEmitter emitter,
      final String message) {
    try {
      Map<String, String> data = new HashMap<>();
      data.put("type", "error");
      data.put("message", message);
      emitter.send(SseEmitter.event()
          .data(objectMapper
              .writeValueAsString(data)));
      emitter.complete();
    } catch (Exception e) {
      log.debug("SSE error send failed: {}",
          e.getMessage());
      try {
        emitter.completeWithError(e);
      } catch (Exception ignored) {
        // emitter already completed
      }
    }
  }

  private String errorMessage(final Exception e) {
    String msg = e.getMessage();
    if (msg != null && (msg.contains("timed out")
        || msg.contains("SocketTimeout")
        || msg.contains("Read timed out"))) {
      return "The analysis took too long. "
          + "Please try a simpler question.";
    }
    return "An error occurred while analyzing "
        + "your portfolio. Please try again.";
  }

  /**
   * Carrier for the per-request conversation context: the resolved
   * conversation id, its title (for the first SSE event) and the
   * canonical message history loaded from the DB.
   */
  private static final class PreparedConversation {
    /** Conversation id. */
    private final Long conversationId;
    /** Conversation title. */
    private final String title;
    /** Canonical history including the new user message. */
    private final List<ChatMessage> history;

    private PreparedConversation(
        final Long convId,
        final String t,
        final List<ChatMessage> h) {
      this.conversationId = convId;
      this.title = t;
      this.history = h;
    }
  }
}
