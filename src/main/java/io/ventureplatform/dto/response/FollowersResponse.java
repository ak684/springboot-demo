package io.ventureplatform.dto.response;

import io.ventureplatform.entity.enums.FollowerType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.Accessors;

@EqualsAndHashCode(callSuper = true)
@Data
@AllArgsConstructor
@NoArgsConstructor
@Accessors(chain = true)
public class FollowersResponse extends BaseResponse {
  private Long value;
  private Long change;
  private FollowerType type;
}
