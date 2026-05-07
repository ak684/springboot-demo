package io.ventureplatform.dto.response;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.Accessors;

@Data
@EqualsAndHashCode(callSuper = true)
@Accessors(chain = true)
public class SubscriptionDetails extends BaseResponse {
  private boolean renew;
  private Long subscriptionEnd;
  private String last4;
  private String cardType;
  private String subscriptionId;
  private String product;
  private String interval;
  private String venture;
  private String discount;
}
