package io.ventureplatform.dto.request;

import io.ventureplatform.entity.enums.EvidenceType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import javax.validation.constraints.NotEmpty;
import javax.validation.constraints.NotNull;

@EqualsAndHashCode(callSuper = true)
@Data
@AllArgsConstructor
@NoArgsConstructor
public class NoteFileRequest extends BaseRequest {
  @NotEmpty
  private String name;
  @NotEmpty
  private String key;
  @NotNull
  private Long size;
  private EvidenceType evidenceType;
  private String comment;
  private Integer risk;
}
