package io.ventureplatform.util;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.databind.SerializerProvider;
import com.fasterxml.jackson.databind.ser.std.StdSerializer;

import java.io.IOException;

public class BaseEnumSerializer extends StdSerializer<Enum> {
  public BaseEnumSerializer() {
    super(Enum.class);
  }

  @Override
  public void serialize(Enum in, JsonGenerator generator, SerializerProvider provider) throws IOException {
    generator.writeString(in.name());
  }
}
