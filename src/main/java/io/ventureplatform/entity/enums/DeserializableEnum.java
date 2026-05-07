package io.ventureplatform.entity.enums;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import io.ventureplatform.util.EnumDeserializer;

@JsonDeserialize(using = EnumDeserializer.class)
public interface DeserializableEnum {
  String getName();

  String getType();
}
