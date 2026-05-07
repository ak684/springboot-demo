package io.ventureplatform.dto.response;

import io.ventureplatform.entity.enums.EvidenceType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@EqualsAndHashCode(callSuper = true)
@Data
@AllArgsConstructor
@NoArgsConstructor
public class NoteFileResponse extends BaseResponse {
  private String name;
  private String key;
  private Long size;
  private EvidenceType evidenceType;
  private String comment;
  private Integer risk;
  private boolean downloadable = false;
}
