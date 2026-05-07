package io.ventureplatform.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import javax.validation.constraints.NotEmpty;
import java.util.List;

@EqualsAndHashCode(callSuper = true)
@Data
@AllArgsConstructor
@NoArgsConstructor
public class NoteResponse extends BaseResponse {
  @NotEmpty
  private String screen;
  private String comment;
  private List<NoteLinkResponse> links;
  private List<NoteFileResponse> files;
  private Boolean same;
}
