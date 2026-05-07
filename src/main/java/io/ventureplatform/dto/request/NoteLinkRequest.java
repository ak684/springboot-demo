package io.ventureplatform.dto.request;

import io.ventureplatform.entity.enums.EvidenceType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import javax.validation.constraints.NotEmpty;

@EqualsAndHashCode(callSuper = true)
@Data
@AllArgsConstructor
@NoArgsConstructor
public class NoteLinkRequest extends BaseRequest {
  @NotEmpty
  private String text;
  @NotEmpty
  private String link;
  private EvidenceType evidenceType;
  private String comment;
  private Integer risk;
}
