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
public class NoteLinkResponse extends BaseResponse {
  private String text;
  private String link;
  private EvidenceType evidenceType;
  private String comment;
  private Integer risk;
}
