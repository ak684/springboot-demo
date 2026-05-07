package io.ventureplatform.util;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.ObjectCodec;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public class EnumDeserializer extends JsonDeserializer<Enum<?>> {
  @Override
  public Enum<?> deserialize(JsonParser jp, DeserializationContext ctxt) {
    try {
      ObjectCodec oc = jp.getCodec();
      JsonNode node = oc.readTree(jp);
      String name = node.get("name").asText();
      String type = "io.ventureplatform.entity.enums." + node.get("type").asText();

      Class<? extends Enum<?>> forClass = (Class<? extends Enum<?>>) Class.forName(type);
      return Enum.valueOf((Class) forClass, name);
    } catch (Exception ex) {
      log.warn(ex.getMessage());
      throw new RuntimeException(ex.getMessage());
    }
  }
}
