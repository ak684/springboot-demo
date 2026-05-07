package io.ventureplatform.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import javax.validation.constraints.Email;

@EqualsAndHashCode(callSuper = true)
@Data
@AllArgsConstructor
@NoArgsConstructor
public class AiTocFeedbackRequest extends BaseRequest {
  private Integer rating;
  private String comment;
  private boolean contact;
  private String name;
  @Email
  private String email;
}
