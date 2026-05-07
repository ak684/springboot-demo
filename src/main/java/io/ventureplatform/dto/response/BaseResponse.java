package io.ventureplatform.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BaseResponse {
  private Long id;
  private Date createdAt;
  private Date lastModifiedAt;
  @JsonInclude(JsonInclude.Include.NON_EMPTY)
  private Map<String, Object> aux = new HashMap<>();
}
