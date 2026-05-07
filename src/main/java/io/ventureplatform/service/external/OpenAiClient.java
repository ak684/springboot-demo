package io.ventureplatform.service.external;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Consumer;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

/**
 * Client for making OpenAI API calls supporting multiple models.
 * Supports o3 (with web search), GPT-5, and gpt-4o-mini.
 * Routes requests to appropriate API (Responses API or Chat Completions API).
 */
@Service
@Slf4j
public class OpenAiClient {

  private static final String RESPONSES_ENDPOINT =
      "https://api.openai.com/v1/responses";
  private static final String CHAT_COMPLETIONS_ENDPOINT =
      "https://api.openai.com/v1/chat/completions";
  private static final String FILES_ENDPOINT =
      "https://api.openai.com/v1/files";
  private static final int DEFAULT_MAX_RETRIES = 2;
  private static final String DEFAULT_REASONING_EFFORT = "low";
  private static final String DEFAULT_RESPONSES_MODEL = "o3";

  @Value("${openai.key}")
  private String apiKey;

  private final ObjectMapper objectMapper;
  private final RestTemplate restTemplate;

  public OpenAiClient(ObjectMapper objectMapper, RestTemplate restTemplate) {
    this.objectMapper = objectMapper;
    this.restTemplate = restTemplate;
  }

  /**
   * Make an OpenAI o3 API call with web search enabled and retry logic.
   * This is the primary method that should be used for most o3 calls.
   *
   * @param prompt The prompt to send to the AI
   * @return The cleaned AI response text
   */
  public String makeO3CallWithWebSearch(final String prompt) {
    return makeO3CallWithWebSearch(null, prompt, null, true);
  }

  /**
   * Make an OpenAI o3 API call with web search enabled using explicit system and user prompts.
   *
   * @param systemPrompt The system level instructions (optional)
   * @param userPrompt The user content prompt
   * @param maxOutputTokens Maximum tokens expected from the model
   * @param cleanJson Whether to run the response through the JSON cleaner
   * @return The processed AI response text
   */
  public String makeO3CallWithWebSearch(final String systemPrompt,
                                        final String userPrompt,
                                        final Integer maxOutputTokens,
                                        final boolean cleanJson) {
    return makeO3CallInternal(systemPrompt,
        userPrompt,
        true,
        DEFAULT_MAX_RETRIES,
        DEFAULT_REASONING_EFFORT,
        maxOutputTokens,
        cleanJson);
  }

  /**
   * Make an OpenAI o3 API call with web search enabled, expecting plain text output.
   * Does not perform JSON cleaning.
   */
  public String makeO3TextWithWebSearch(final String prompt) {
    return makeO3CallInternal(null,
        prompt,
        true,
        DEFAULT_MAX_RETRIES,
        DEFAULT_REASONING_EFFORT,
        null,
        false);
  }

  /**
   * Make an OpenAI o3 API call with web search and custom reasoning effort.
   *
   * @param prompt The prompt to send to the AI
   * @param reasoningEffort Reasoning effort level ("low", "medium", "high")
   * @return The cleaned AI response text
   */
  public String makeO3CallWithWebSearch(final String prompt,
                                        final String reasoningEffort) {
    return makeO3CallInternal(null,
        prompt,
        true,
        DEFAULT_MAX_RETRIES,
        reasoningEffort,
        null,
        true);
  }

  /**
   * Make an OpenAI o3 API call without web search.
   *
   * @param prompt The prompt to send to the AI
   * @return The cleaned AI response text
   */
  public String makeO3CallNoWebSearch(final String prompt) {
    return makeO3CallInternal(null,
        prompt,
        false,
        DEFAULT_MAX_RETRIES,
        DEFAULT_REASONING_EFFORT,
        null,
        true);
  }

  /**
   * Make an OpenAI o3 API call with custom retry count.
   *
   * @param prompt The prompt to send to the AI
   * @param enableWebSearch Whether to enable web search tool
   * @param maxRetries Maximum number of retry attempts
   * @return The cleaned AI response text
   */
  public String makeO3CallWithRetries(final String prompt,
                                      final boolean enableWebSearch,
                                      final int maxRetries) {
    return makeO3CallInternal(null,
        prompt,
        enableWebSearch,
        maxRetries,
        DEFAULT_REASONING_EFFORT,
        null,
        true);
  }

  /**
   * Main o3 API call method with full control over all parameters.
   * Handles network failures, JSON parsing errors, and API errors with retry logic.
   *
   * @param prompt The prompt to send to the AI
   * @param enableWebSearch Whether to enable web search tool
   * @param maxRetries Maximum number of retry attempts (total attempts = maxRetries + 1)
   * @param reasoningEffort Reasoning effort level ("low", "medium", "high")
   * @return The cleaned AI response text
   */
  public String makeO3Call(final String prompt,
                           final boolean enableWebSearch,
                           final int maxRetries,
                           final String reasoningEffort) {
    return makeO3CallInternal(null,
        prompt,
        enableWebSearch,
        maxRetries,
        reasoningEffort,
        null,
        true);
  }

  /**
   * Make a chat completion API call with proper message roles.
   * Uses o3 Responses API by default (no web search).
   *
   * @param messages List of messages with role and content
   * @return The AI response text
   */
  public String makeChatCompletion(final List<Map<String, String>> messages) {
    return makeChatCompletionInternal(messages, DEFAULT_RESPONSES_MODEL, DEFAULT_MAX_RETRIES,
        true);
  }

  /**
   * Make a chat completion API call with specified model.
   *
   * @param messages List of messages with role and content
   * @param model Model hint; "gpt-4o-mini" uses chat completions, others use o3
   * @return The AI response text
   */
  public String makeChatCompletion(final List<Map<String, String>> messages,
                                   final String model) {
    return makeChatCompletionInternal(messages, model, DEFAULT_MAX_RETRIES, true);
  }


  /**
   * Make a chat completion call that returns free-form text (no JSON validation).
   *
   * @param messages List of messages with role and content
   * @return Raw assistant content
   */
  public String makeChatCompletionText(final List<Map<String, String>> messages) {
    return makeChatCompletionInternal(messages, DEFAULT_RESPONSES_MODEL,
        DEFAULT_MAX_RETRIES, false);
  }

  /**
   * Make a chat completion call with explicit model that returns free-form text.
   *
   * @param messages List of messages with role and content
   * @param model Model hint; "gpt-4o-mini" uses chat completions, others use o3
   * @return Raw assistant content
   */
  public String makeChatCompletionText(
      final List<Map<String, String>> messages,
      final String model) {
    return makeChatCompletionInternal(
        messages, model, DEFAULT_MAX_RETRIES, false);
  }

  /**
   * Make a chat completion call with web search and reasoning.
   *
   * @param messages List of messages with role/content
   * @param model Model to use (e.g. "gpt-5.2")
   * @param enableWebSearch Enable web search tool
   * @param reasoningEffort Reasoning effort
   * @return Raw assistant content
   */
  public String makeChatCompletionTextAdvanced(
      final List<Map<String, String>> messages,
      final String model,
      final boolean enableWebSearch,
      final String reasoningEffort) {
    return callResponsesApi(messages, model,
        DEFAULT_MAX_RETRIES, false,
        reasoningEffort, enableWebSearch,
        false, null);
  }

  /**
   * Make a chat completion call with web search,
   * code interpreter, and reasoning.
   *
   * @param messages List of messages with role/content
   * @param model Model to use (e.g. "gpt-5.2")
   * @param enableWebSearch Enable web search tool
   * @param enableCodeInterpreter Enable code interpreter
   * @param reasoningEffort Reasoning effort
   * @return Raw assistant content
   */
  public String makeChatCompletionTextAdvanced(
      final List<Map<String, String>> messages,
      final String model,
      final boolean enableWebSearch,
      final boolean enableCodeInterpreter,
      final String reasoningEffort) {
    return callResponsesApi(messages, model,
        DEFAULT_MAX_RETRIES, false,
        reasoningEffort, enableWebSearch,
        enableCodeInterpreter, null);
  }

  /**
   * Make a chat completion call with web search,
   * code interpreter with file access, and reasoning.
   *
   * @param messages List of messages with role/content
   * @param model Model to use
   * @param enableWebSearch Enable web search tool
   * @param enableCodeInterpreter Enable code interpreter
   * @param reasoningEffort Reasoning effort
   * @param codeInterpreterFileIds File IDs to attach
   *     to the code interpreter container
   * @return Raw assistant content
   */
  public String makeChatCompletionTextAdvanced(
      final List<Map<String, String>> messages,
      final String model,
      final boolean enableWebSearch,
      final boolean enableCodeInterpreter,
      final String reasoningEffort,
      final List<String> codeInterpreterFileIds) {
    return callResponsesApi(messages, model,
        DEFAULT_MAX_RETRIES, false,
        reasoningEffort, enableWebSearch,
        enableCodeInterpreter,
        codeInterpreterFileIds);
  }

  /**
   * Stream a response from the Responses API.
   * Sends text deltas and tool status updates
   * to the provided callbacks as they arrive.
   *
   * @param messages conversation messages
   * @param model model ID
   * @param reasoningEffort reasoning effort level
   * @param enableWebSearch enable web search tool
   * @param enableCodeInterpreter enable code tool
   * @param codeInterpreterFileIds file IDs for code
   * @param onDelta text delta callback
   * @param onStatus tool status callback (nullable)
   * @param onError error callback
   */
  @SuppressWarnings({"checkstyle:ParameterNumber"})
  public void streamResponsesApi(
      final List<Map<String, String>> messages,
      final String model,
      final String reasoningEffort,
      final boolean enableWebSearch,
      final boolean enableCodeInterpreter,
      final List<String> codeInterpreterFileIds,
      final Consumer<String> onDelta,
      final Consumer<String> onStatus,
      final Consumer<Exception> onError) {
    HttpURLConnection conn = null;
    try {
      Map<String, Object> body =
          buildResponsesBody(messages, model,
              reasoningEffort, enableWebSearch,
              enableCodeInterpreter,
              codeInterpreterFileIds);
      body.put("stream", true);

      String json =
          objectMapper.writeValueAsString(body);

      conn = (HttpURLConnection)
          new URL(RESPONSES_ENDPOINT)
              .openConnection();
      conn.setRequestMethod("POST");
      conn.setRequestProperty("Content-Type",
          "application/json");
      conn.setRequestProperty("Authorization",
          "Bearer " + apiKey);
      conn.setRequestProperty("Accept",
          "text/event-stream");
      conn.setDoOutput(true);
      conn.setReadTimeout(600000);
      conn.setConnectTimeout(30000);

      try (OutputStream os =
          conn.getOutputStream()) {
        os.write(
            json.getBytes(StandardCharsets.UTF_8));
      }

      int code = conn.getResponseCode();
      if (code != 200) {
        String errBody = readStream(
            conn.getErrorStream());
        throw new RuntimeException(
            "OpenAI stream error " + code
                + ": " + errBody);
      }

      try (BufferedReader reader =
          new BufferedReader(
              new InputStreamReader(
                  conn.getInputStream(),
                  StandardCharsets.UTF_8))) {
        String line;
        while ((line = reader.readLine()) != null) {
          if (!line.startsWith("data: ")) {
            continue;
          }
          String data = line.substring(6).trim();
          if ("[DONE]".equals(data)) {
            break;
          }
          try {
            JsonNode evt =
                objectMapper.readTree(data);
            String type = evt.has("type")
                ? evt.get("type").asText() : "";
            if ("response.output_text.delta"
                .equals(type)) {
              String delta =
                  evt.get("delta").asText();
              onDelta.accept(delta);
            } else if (onStatus != null) {
              String status =
                  mapToolStatus(type);
              if (status != null) {
                onStatus.accept(status);
              }
            }
          } catch (Exception parseErr) {
            log.debug(
                "Skipping unparseable SSE: {}",
                data);
          }
        }
      }
    } catch (Exception e) {
      log.error("Stream responses error: {}",
          e.getMessage());
      onError.accept(e);
    } finally {
      if (conn != null) {
        conn.disconnect();
      }
    }
  }

  private String mapToolStatus(final String type) {
    switch (type) {
      case "response.web_search_call.in_progress":
      case "response.web_search_call.searching":
        return "Searching the web...";
      case "response.code_interpreter_call"
          + ".in_progress":
      case "response.code_interpreter_call_code.delta":
        return "Writing queries...";
      case "response.code_interpreter_call"
          + ".interpreting":
        return "Running analysis...";
      case "response.code_interpreter_call.completed":
        return "Reviewing analysis...";
      case "response.web_search_call.completed":
        return "Reviewing search results...";
      default:
        return null;
    }
  }

  private String readStream(
      final java.io.InputStream is) {
    if (is == null) {
      return "";
    }
    try (BufferedReader r = new BufferedReader(
        new InputStreamReader(is,
            StandardCharsets.UTF_8))) {
      StringBuilder sb = new StringBuilder();
      String l;
      while ((l = r.readLine()) != null) {
        sb.append(l);
      }
      return sb.toString();
    } catch (Exception e) {
      return "error reading stream";
    }
  }

  @SuppressWarnings({"checkstyle:ParameterNumber"})
  private Map<String, Object> buildResponsesBody(
      final List<Map<String, String>> messages,
      final String model,
      final String reasoningEffort,
      final boolean enableWebSearch,
      final boolean enableCodeInterpreter,
      final List<String> codeInterpreterFileIds) {
    List<Map<String, Object>> inputMessages =
        new ArrayList<>();
    for (Map<String, String> message : messages) {
      Map<String, Object> formatted =
          new HashMap<>();
      String role = message.get("role");
      formatted.put("role", role);
      String cType = "assistant".equals(role)
          ? "output_text" : "input_text";
      formatted.put("content",
          List.of(Map.of("type", cType,
              "text", message.get("content"))));
      inputMessages.add(formatted);
    }

    Map<String, Object> requestBody =
        new HashMap<>();
    requestBody.put("model", model);
    if (reasoningEffort != null) {
      Map<String, Object> rp = new HashMap<>();
      rp.put("effort", reasoningEffort);
      requestBody.put("reasoning", rp);
    }
    List<Map<String, Object>> tools =
        new ArrayList<>();
    if (enableWebSearch) {
      Map<String, Object> ws = new HashMap<>();
      ws.put("type", "web_search");
      tools.add(ws);
    }
    if (enableCodeInterpreter) {
      Map<String, Object> ci = new HashMap<>();
      ci.put("type", "code_interpreter");
      Map<String, Object> container =
          new HashMap<>();
      container.put("type", "auto");
      if (codeInterpreterFileIds != null
          && !codeInterpreterFileIds.isEmpty()) {
        container.put("file_ids",
            codeInterpreterFileIds);
      }
      ci.put("container", container);
      tools.add(ci);
    }
    if (!tools.isEmpty()) {
      requestBody.put("tools", tools);
    }
    requestBody.put("input", inputMessages);
    return requestBody;
  }

  /**
   * Upload a file to OpenAI Files API.
   *
   * @param data the file content as bytes
   * @param filename the filename (e.g. "data.csv")
   * @return the OpenAI file ID
   */
  public String uploadFile(final byte[] data,
                           final String filename) {
    HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.MULTIPART_FORM_DATA);
    headers.setBearerAuth(apiKey);

    MultiValueMap<String, Object> body =
        new LinkedMultiValueMap<>();
    body.add("purpose", "user_data");
    body.add("file", new ByteArrayResource(data) {
      @Override
      public String getFilename() {
        return filename;
      }
    });

    HttpEntity<MultiValueMap<String, Object>> entity =
        new HttpEntity<>(body, headers);

    try {
      ResponseEntity<String> response =
          restTemplate.exchange(FILES_ENDPOINT,
              HttpMethod.POST, entity, String.class);

      if (response.getStatusCode().is2xxSuccessful()
          && response.getBody() != null) {
        Map<String, Object> parsed =
            objectMapper.readValue(
                response.getBody(), Map.class);
        String fileId = (String) parsed.get("id");
        log.info("Uploaded file '{}' to OpenAI: {}",
            filename, fileId);
        return fileId;
      }
      throw new RuntimeException(
          "File upload failed: " + response.getStatusCode());
    } catch (Exception e) {
      log.error("Failed to upload file '{}': {}",
          filename, e.getMessage());
      throw new RuntimeException(
          "OpenAI file upload failed: "
          + e.getMessage(), e);
    }
  }

  /**
   * Delete a file from OpenAI Files API.
   *
   * @param fileId the file ID to delete
   */
  public void deleteFile(final String fileId) {
    try {
      HttpHeaders headers = new HttpHeaders();
      headers.setBearerAuth(apiKey);
      HttpEntity<Void> entity =
          new HttpEntity<>(headers);
      restTemplate.exchange(
          FILES_ENDPOINT + "/" + fileId,
          HttpMethod.DELETE, entity, String.class);
      log.info("Deleted OpenAI file: {}", fileId);
    } catch (Exception e) {
      log.warn("Failed to delete OpenAI file {}: {}",
          fileId, e.getMessage());
    }
  }



  private String makeO3CallInternal(final String systemPrompt,
                                    final String prompt,
                                    final boolean enableWebSearch,
                                    final int maxRetries,
                                    final String reasoningEffort,
                                    final Integer maxOutputTokens,
                                    final boolean cleanJson) {
    Exception lastException = null;

    for (int attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        log.debug("OpenAI o3 API attempt {} of {}", attempt + 1, maxRetries + 1);

        HttpHeaders headers = new HttpHeaders();
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        // Prepare the request body for Responses API
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", "o3");

        // Set reasoning effort
        Map<String, Object> reasoningParams = new HashMap<>();
        reasoningParams.put("effort", reasoningEffort);
        requestBody.put("reasoning", reasoningParams);

        if (maxOutputTokens != null && maxOutputTokens > 0) {
          requestBody.put("max_output_tokens", maxOutputTokens);
        }

        // Construct the input with explicit system/user roles and retry instructions
        String userContent = prompt;
        if (attempt > 0) {
          userContent = "CRITICAL: You must respond with valid JSON only. "
              + "Do not include any markdown formatting, code blocks, or additional text. "
              + "Return only a well-formed JSON object or array. This is retry attempt "
              + attempt + ".\n\n" + prompt;
        }

        List<Map<String, Object>> inputMessages = new ArrayList<>();

        if (systemPrompt != null && !systemPrompt.isBlank()) {
          Map<String, Object> systemMessage = new HashMap<>();
          systemMessage.put("role", "system");
          systemMessage.put("content", List.of(Map.of("type", "input_text", "text", systemPrompt)));
          inputMessages.add(systemMessage);
        }

        Map<String, Object> userMessage = new HashMap<>();
        userMessage.put("role", "user");
        userMessage.put("content", List.of(Map.of("type", "input_text", "text", userContent)));
        inputMessages.add(userMessage);

        requestBody.put("input", inputMessages);

        // Enable web search tool if requested
        if (enableWebSearch) {
          List<Map<String, String>> tools = new ArrayList<>();
          Map<String, String> webSearchTool = new HashMap<>();
          webSearchTool.put("type", "web_search");
          tools.add(webSearchTool);
          requestBody.put("tools", tools);
        }

        HttpEntity<String> entity = new HttpEntity<>(
            objectMapper.writeValueAsString(requestBody), headers);

        ResponseEntity<String> response = restTemplate.exchange(
            RESPONSES_ENDPOINT, HttpMethod.POST, entity, String.class);

        if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
          Map<String, Object> responseBody =
              objectMapper.readValue(response.getBody(), Map.class);

          // Responses API returns 'output' which can be a string or array of message objects
          Object outputObj = responseBody.get("output");
          String extractedText = extractTextFromOutput(outputObj);

          if (extractedText != null) {
            // Only clean JSON if requested
            String output = cleanJson ? cleanJsonResponse(extractedText) : extractedText;

            // Check if cleaning resulted in an error (malformed JSON) - only for JSON responses
            if (cleanJson && output.contains("\"error\"")
                && output.contains("Could not parse model response")) {
              if (attempt < maxRetries) {
                log.warn("JSON parsing failed on attempt {}, retrying...", attempt + 1);
                lastException = new RuntimeException("JSON parsing failed: " + extractedText);
                Thread.sleep(1000 * (attempt + 1)); // Progressive delay: 1s, 2s
                continue;
              }
            }

            // Success!
            if (attempt > 0) {
              log.info("OpenAI o3 API call succeeded on retry attempt {}", attempt + 1);
            }
            return output;
          }
        }

        throw new RuntimeException("Failed to get valid response from OpenAI o3 API (attempt "
            + (attempt + 1) + ")");

      } catch (Exception e) {
        lastException = e;
        log.warn("OpenAI o3 API call failed on attempt {}: {}", attempt + 1, e.getMessage());

        if (attempt < maxRetries) {
          try {
            Thread.sleep(1000 * (attempt + 1)); // Progressive delay: 1s, 2s
          } catch (InterruptedException ie) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Interrupted during retry delay", ie);
          }
        }
      }
    }

    // All attempts failed
    log.error("OpenAI o3 API call failed after {} attempts", maxRetries + 1);
    throw new RuntimeException("OpenAI o3 API call failed after " + (maxRetries + 1)
        + " attempts. Last error: "
        + (lastException != null ? lastException.getMessage() : "Unknown error"));
  }

  /**
   * Internal method for chat completion API calls with retry logic.
   */
  private String makeChatCompletionInternal(
      final List<Map<String, String>> messages,
      final String model,
      final int maxRetries,
      final boolean requireJson) {
    if ("gpt-4o-mini".equals(model)) {
      return callChatApi(messages, maxRetries, requireJson);
    }
    if (model != null && model.startsWith("gpt-5")) {
      return callResponsesApi(messages, model,
          maxRetries, requireJson, null, false,
          false, null);
    }
    return callResponsesApi(messages,
        DEFAULT_RESPONSES_MODEL, maxRetries,
        requireJson, DEFAULT_REASONING_EFFORT,
        false, false, null);
  }

  private String callResponsesApi(
      final List<Map<String, String>> messages,
      final String model,
      final int maxRetries,
      final boolean requireJson,
      final String reasoningEffort,
      final boolean enableWebSearch,
      final boolean enableCodeInterpreter,
      final List<String> codeInterpreterFileIds) {
    Exception lastException = null;

    for (int attempt = 0;
        attempt <= maxRetries; attempt++) {
      try {
        log.debug(
            "OpenAI {} responses attempt {} of {}",
            model, attempt + 1, maxRetries + 1);

        HttpHeaders headers = new HttpHeaders();
        headers.setAccept(
            List.of(MediaType.APPLICATION_JSON));
        headers.setContentType(
            MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        List<Map<String, String>> messagesToSend =
            messages;
        if (requireJson && attempt > 0) {
          messagesToSend = new ArrayList<>(messages);
          int lastIdx = messagesToSend.size() - 1;
          Map<String, String> lastMsg =
              messagesToSend.get(lastIdx);
          if ("user".equals(lastMsg.get("role"))) {
            Map<String, String> enhanced =
                new HashMap<>(lastMsg);
            enhanced.put("content",
                "CRITICAL: Respond with valid JSON "
                + "only. No markdown or code blocks. "
                + "Retry attempt " + attempt
                + ".\n\n" + lastMsg.get("content"));
            messagesToSend.set(lastIdx, enhanced);
          }
        }

        List<Map<String, Object>> inputMessages =
            new ArrayList<>();
        for (Map<String, String> message
            : messagesToSend) {
          Map<String, Object> formatted =
              new HashMap<>();
          String role = message.get("role");
          formatted.put("role", role);
          String cType = "assistant".equals(role)
              ? "output_text" : "input_text";
          formatted.put("content",
              List.of(Map.of("type", cType,
                  "text", message.get("content"))));
          inputMessages.add(formatted);
        }

        Map<String, Object> requestBody =
            new HashMap<>();
        requestBody.put("model", model);
        if (reasoningEffort != null) {
          Map<String, Object> reasoningParams =
              new HashMap<>();
          reasoningParams.put("effort",
              reasoningEffort);
          requestBody.put("reasoning",
              reasoningParams);
        }
        List<Map<String, Object>> tools =
            new ArrayList<>();
        if (enableWebSearch) {
          Map<String, Object> webSearchTool =
              new HashMap<>();
          webSearchTool.put("type", "web_search");
          tools.add(webSearchTool);
        }
        if (enableCodeInterpreter) {
          Map<String, Object> ciTool =
              new HashMap<>();
          ciTool.put("type", "code_interpreter");
          Map<String, Object> container =
              new HashMap<>();
          container.put("type", "auto");
          if (codeInterpreterFileIds != null
              && !codeInterpreterFileIds.isEmpty()) {
            container.put("file_ids",
                codeInterpreterFileIds);
          }
          ciTool.put("container", container);
          tools.add(ciTool);
        }
        if (!tools.isEmpty()) {
          requestBody.put("tools", tools);
        }
        requestBody.put("input", inputMessages);

        HttpEntity<String> entity = new HttpEntity<>(
            objectMapper.writeValueAsString(requestBody),
            headers);

        ResponseEntity<String> response =
            restTemplate.exchange(RESPONSES_ENDPOINT,
                HttpMethod.POST, entity, String.class);

        if (response.getStatusCode().is2xxSuccessful()
            && response.getBody() != null) {
          Map<String, Object> responseBody =
              objectMapper.readValue(
                  response.getBody(), Map.class);

          Object outputObj = responseBody.get("output");
          String content =
              extractTextFromOutput(outputObj);
          if (content == null) {
            throw new RuntimeException("No output content returned");
          }

          if (!requireJson) {
            String cleaned = content;
            if (cleaned.contains("```")) {
              cleaned = cleaned.replaceAll("```json\\s*", "")
                  .replaceAll("```\\s*", "").trim();
            }
            if (attempt > 0) {
              log.info("OpenAI {} responses (text) succeeded on retry {}", model, attempt + 1);
            }
            return cleaned;
          }

          try {
            objectMapper.readTree(content);
            if (attempt > 0) {
              log.info("OpenAI {} responses succeeded on retry {}", model, attempt + 1);
            }
            return content;
          } catch (Exception parseException) {
            String cleaned = content;
            if (content.contains("```")) {
              cleaned = content.replaceAll("```json\\s*", "")
                  .replaceAll("```\\s*", "").trim();
              try {
                objectMapper.readTree(cleaned);
                if (attempt > 0) {
                  log.info("OpenAI {} responses succeeded on retry {}", model, attempt + 1);
                }
                return cleaned;
              } catch (Exception ignored) {
                // continue
              }
            }

            if (attempt < maxRetries) {
              log.warn("JSON parsing failed on {} responses attempt {}, retrying...", model,
                  attempt + 1);
              lastException = parseException;
              Thread.sleep(1000 * (attempt + 1));
              continue;
            } else {
              throw new RuntimeException(
                  "Failed to get valid JSON after " + (maxRetries + 1)
                  + " attempts. Last response: " + content, parseException);
            }
          }
        }

        throw new RuntimeException("Failed to get valid response from OpenAI responses API (attempt "
            + (attempt + 1) + ")");

      } catch (Exception e) {
        lastException = e;
        log.warn("OpenAI {} responses failed on attempt {}: {}", model,
            attempt + 1, e.getMessage());

        if (attempt < maxRetries) {
          try {
            Thread.sleep(1000 * (attempt + 1));
          } catch (InterruptedException ie) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Interrupted during retry delay", ie);
          }
        }
      }
    }

    log.error("OpenAI {} responses failed after {} attempts", model, maxRetries + 1);
    throw new RuntimeException("OpenAI " + model + " responses failed after " + (maxRetries + 1)
        + " attempts. Last error: "
        + (lastException != null ? lastException.getMessage() : "Unknown error"));
  }

  private String callChatApi(final List<Map<String, String>> messages,
                             final int maxRetries,
                             final boolean requireJson) {
    Exception lastException = null;

    for (int attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        log.debug("OpenAI chat completion (mini) attempt {} of {}", attempt + 1, maxRetries + 1);

        HttpHeaders headers = new HttpHeaders();
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        // Enhance messages with JSON instructions on retry attempts when JSON is required
        List<Map<String, String>> messagesToSend = messages;
        if (requireJson && attempt > 0) {
          messagesToSend = new ArrayList<>(messages);
          // Enhance the last user message with JSON instructions
          int lastIndex = messagesToSend.size() - 1;
          Map<String, String> lastMessage = messagesToSend.get(lastIndex);
          if ("user".equals(lastMessage.get("role"))) {
            Map<String, String> enhancedMessage = new HashMap<>(lastMessage);
            enhancedMessage.put("content",
                "CRITICAL: You must respond with valid JSON only. "
                + "Do not include any markdown formatting, code blocks, or additional text. "
                + "Return only a well-formed JSON object or array. This is retry attempt "
                + attempt + ".\n\n" + lastMessage.get("content"));
            messagesToSend.set(lastIndex, enhancedMessage);
          }
        }

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", "gpt-4o-mini");
        requestBody.put("messages", messagesToSend);

        HttpEntity<String> entity = new HttpEntity<>(
            objectMapper.writeValueAsString(requestBody), headers);

        ResponseEntity<String> response = restTemplate.exchange(
            CHAT_COMPLETIONS_ENDPOINT, HttpMethod.POST, entity, String.class);

        if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
          @SuppressWarnings("unchecked")
          Map<String, Object> responseBody =
              objectMapper.readValue(response.getBody(), Map.class);

          @SuppressWarnings("unchecked")
          List<Map<String, Object>> choices =
              (List<Map<String, Object>>) responseBody.get("choices");

          if (choices != null && !choices.isEmpty()) {
            @SuppressWarnings("unchecked")
            Map<String, String> message =
                (Map<String, String>) choices.get(0).get("message");
            String content = message.get("content");
            if (content == null) {
              continue;
            }

            if (!requireJson) {
              String cleaned = content;
              if (cleaned.contains("```")) {
                cleaned = cleaned.replaceAll("```json\\s*", "")
                    .replaceAll("```\\s*", "").trim();
              }
              if (attempt > 0) {
                log.info("OpenAI chat completion (text) succeeded on retry attempt {}", attempt + 1);
              }
              return cleaned;
            }

            // Validate JSON by attempting to parse (handles markdown-wrapped JSON too)
            try {
              // Try parsing the raw content first
              objectMapper.readTree(content);
              // Valid JSON - return as-is
              if (attempt > 0) {
                log.info("OpenAI chat completion succeeded on retry attempt {}", attempt + 1);
              }
              return content;
            } catch (Exception parseException) {
              // Try cleaning markdown wrappers and parsing again
              String cleaned = content;
              if (content.contains("```")) {
                cleaned = content.replaceAll("```json\\s*", "")
                    .replaceAll("```\\s*", "").trim();
                try {
                  objectMapper.readTree(cleaned);
                  // Valid after cleaning - return cleaned version
                  if (attempt > 0) {
                    log.info("OpenAI chat completion succeeded on retry attempt {}",
                        attempt + 1);
                  }
                  return cleaned;
                } catch (Exception cleanedException) {
                  // Still invalid after cleaning
                }
              }

              // JSON validation failed
              if (attempt < maxRetries) {
                log.warn("JSON parsing failed on chat completion attempt {}, retrying...",
                    attempt + 1);
                lastException = parseException;
                Thread.sleep(1000 * (attempt + 1)); // Progressive delay: 1s, 2s
                continue;
              } else {
                // Final attempt failed - throw exception to match old behavior
                throw new RuntimeException(
                    "Failed to get valid JSON after " + (maxRetries + 1)
                    + " attempts. Last response: " + content, parseException);
              }
            }
          }
        }

        throw new RuntimeException("Failed to get valid response from OpenAI chat API (attempt "
            + (attempt + 1) + ")");

      } catch (Exception e) {
        lastException = e;
        log.warn("OpenAI chat completion failed on attempt {}: {}",
            attempt + 1, e.getMessage());

        if (attempt < maxRetries) {
          try {
            Thread.sleep(1000 * (attempt + 1)); // Progressive delay: 1s, 2s
          } catch (InterruptedException ie) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Interrupted during retry delay", ie);
          }
        }
      }
    }

    log.error("OpenAI chat completion failed after {} attempts", maxRetries + 1);
    throw new RuntimeException("OpenAI chat completion failed after " + (maxRetries + 1)
        + " attempts. Last error: "
        + (lastException != null ? lastException.getMessage() : "Unknown error"));
  }

  /**
   * Extract text content from the o3 API response output object.
   * Handles both string and complex message object formats.
   */
  private String extractTextFromOutput(final Object outputObj) {
    if (outputObj instanceof String) {
      // Simple case: direct string output
      return (String) outputObj;
    } else if (outputObj instanceof List) {
      // Complex case: array of message objects
      List<?> outputList = (List<?>) outputObj;

      // Look for assistant messages with text content
      for (Object item : outputList) {
        if (item instanceof Map) {
          Map<?, ?> message = (Map<?, ?>) item;

          // Check if this is an assistant message
          if ("assistant".equals(message.get("role"))
              || "message".equals(message.get("type"))) {
            // Extract content which might be a string or array
            Object contentObj = message.get("content");

            if (contentObj instanceof String) {
              return (String) contentObj;
            } else if (contentObj instanceof List) {
              // Content can be an array of content objects
              List<?> contentList = (List<?>) contentObj;
              for (Object contentItem : contentList) {
                if (contentItem instanceof Map) {
                  Map<?, ?> contentMap = (Map<?, ?>) contentItem;
                  // Look for text content
                  if ("output_text".equals(contentMap.get("type"))
                      || contentMap.containsKey("text")) {
                    Object textObj = contentMap.get("text");
                    if (textObj instanceof String) {
                      return (String) textObj;
                    }
                  }
                }
              }
            }
          }
        }
      }

      // Fallback: if no assistant message found, try to get any text from first item
      if (!outputList.isEmpty()) {
        Object firstItem = outputList.get(0);
        if (firstItem instanceof String) {
          return (String) firstItem;
        }
      }
    }

    return null;
  }

  /**
   * Attempts to clean and extract valid JSON from a response string.
   * Handles cases where the model wraps JSON in markdown code blocks.
   *
   * @param response The raw response from the model
   * @return Cleaned JSON string
   */
  public String cleanJsonResponse(final String response) {
    if (response == null || response.trim().isEmpty()) {
      return "{}";
    }

    // If the response is already valid JSON (object or array), return it as is
    try {
      // Try parsing as generic JSON (could be object or array)
      objectMapper.readTree(response);
      return response;
    } catch (Exception ignored) {
      // Not valid JSON, continue with cleaning
    }

    // Try to extract JSON from markdown code blocks
    String cleaned = response;

    // Remove markdown code block markers
    if (cleaned.contains("```json") || cleaned.contains("```")) {
      // Extract content between code block markers
      int startIndex = cleaned.indexOf("```");
      if (startIndex != -1) {
        startIndex = cleaned.indexOf("\n", startIndex);
        if (startIndex != -1) {
          int endIndex = cleaned.indexOf("```", startIndex);
          if (endIndex != -1) {
            cleaned = cleaned.substring(startIndex, endIndex).trim();
          }
        }
      }

      // If we couldn't extract properly, try a simpler approach
      if (cleaned.contains("```")) {
        cleaned = cleaned.replaceAll("```json", "").replaceAll("```", "").trim();
      }
    }

    // Try to parse the cleaned response (as generic JSON)
    try {
      objectMapper.readTree(cleaned);
      return cleaned;
    } catch (Exception e) {
      // If we still can't parse it, return the original response with a warning
      log.warn("Could not parse OpenAI response as JSON: {}", e.getMessage());
      try {
        return "{\"error\": \"Could not parse model response as JSON\", \"raw_response\": "
            + objectMapper.writeValueAsString(response) + "}";
      } catch (Exception ex) {
        return "{\"error\": \"Could not parse model response as JSON\", "
            + "\"raw_response\": \"Error parsing response\"}";
      }
    }
  }

  /**
   * Parse a JSON node from a cleaned response string.
   * Helper method for common use case of parsing response to JsonNode.
   *
   * @param cleanedResponse The cleaned JSON response string
   * @return JsonNode representation of the response
   */
  public JsonNode parseJsonResponse(final String cleanedResponse) {
    try {
      return objectMapper.readTree(cleanedResponse);
    } catch (Exception e) {
      log.error("Failed to parse JSON response", e);
      throw new RuntimeException("Failed to parse JSON response: " + e.getMessage(), e);
    }
  }
}
