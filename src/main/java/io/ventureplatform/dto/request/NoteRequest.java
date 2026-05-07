package io.ventureplatform.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import javax.validation.constraints.NotEmpty;
import javax.validation.constraints.NotNull;
import java.util.List;

@EqualsAndHashCode(callSuper = true)
@Data
@AllArgsConstructor
@NoArgsConstructor
public class NoteRequest extends BaseRequest {
  private String comment;
  private List<NoteLinkRequest> links;
  private List<NoteFileRequest> files;
  private List<NoteFileRequest> newFiles;
  @NotEmpty
  private String screen;
  @NotNull
  private ImpactRequest impact;
  private ImpactIndicatorRequest indicator;
  private Boolean same;
}
