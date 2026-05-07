package io.ventureplatform.service.extraction.prompt;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.springframework.util.StreamUtils;

@Component
@Slf4j
public class PromptLoader {

  private final Map<String, String> cache = new ConcurrentHashMap<>();

  public String loadPrompt(final String resourcePath) {
    if (cache.containsKey(resourcePath)) {
      return cache.get(resourcePath);
    }

    ClassPathResource resource = new ClassPathResource(resourcePath);
    try (InputStream inputStream = resource.getInputStream()) {
      String content = StreamUtils.copyToString(inputStream, StandardCharsets.UTF_8);
      cache.put(resourcePath, content);
      log.debug("Loaded prompt resource {}", resourcePath);
      return content;
    } catch (IOException e) {
      throw new IllegalStateException("Failed to load prompt resource " + resourcePath, e);
    }
  }
}
